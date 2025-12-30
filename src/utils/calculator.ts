import { AssetData, PortfolioAllocation, CalculationResult } from '../types/investment';

export function calculateAccumulation(
    assets: AssetData[],
    allocations: PortfolioAllocation,
    initialInvestment: number,
    startDate: string,
    endDate: string = new Date().toISOString().split('T')[0] // Default to today
): CalculationResult[] {
    // 1. Pre-process assets: Filter by date range and sort
    const processedAssets = assets.map(asset => {
        const isYield = asset.type === 'yield' || ['^IRX', '^FVX', '^TNX'].includes(asset.ticker);
        return {
            ...asset,
            type: isYield ? 'yield' : 'price' as 'yield' | 'price',
            data: asset.data
                .filter(([date]) => date >= startDate && date <= endDate)
                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        };
    });

    if (processedAssets.length === 0) return [];

    // 2. Identify all unique dates across all filtered assets to build the timeline
    const allDates = new Set<string>();
    processedAssets.forEach(asset => {
        asset.data.forEach(([date]) => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort();

    if (sortedDates.length === 0) return [];

    // 3. Initialize Loop Variables
    const results: CalculationResult[] = [];

    // We assume the portfolio starts with 'initialInvestment' in CASH on the very first day.
    // Or simpler: The value on Day 0 is 'initialInvestment'. 
    // We calculate growth Day-over-Day.

    // Tracking current value
    let currentPortfolioValue = initialInvestment;

    const previousPrices: Record<string, number> = {};

    // For the first day, we just record the initial value.
    // We can't calculate a return until the *second* day because return = (P_today - P_prev) / P_prev
    // So logic:
    // Day 0: Value = Initial.
    // Day N: Value = Value_(N-1) * (1 + PortfolioReturn_N)

    // Pre-fill previousPrices with Day 0 data if available
    const startDay = sortedDates[0];
    results.push({
        date: startDay,
        value: currentPortfolioValue,
        assets: {} // We'll compute breakdown below
    });

    processedAssets.forEach(asset => {
        const dayData = asset.data.find(d => d[0] === startDay);
        if (dayData) {
            previousPrices[asset.ticker] = dayData[1];
        }
    });

    // Breakdown for Day 0 (based on what's available TODAY)
    const day0AvailableTickers = processedAssets
        .filter(a => previousPrices[a.ticker] !== undefined)
        .map(a => a.ticker);

    // Normalize target allocations for Day 0
    let day0TotalTarget = 0;
    day0AvailableTickers.forEach(t => day0TotalTarget += (allocations[t] || 0));

    const day0Breakdown: Record<string, number> = {};
    if (day0TotalTarget > 0) {
        day0AvailableTickers.forEach(t => {
            const raw = allocations[t] || 0;
            const normalizedWeight = raw / day0TotalTarget;
            day0Breakdown[t] = currentPortfolioValue * normalizedWeight;
        });
    }
    results[0].assets = day0Breakdown;


    // 4. Iterate from Day 1 to End
    for (let i = 1; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const prevDate = sortedDates[i - 1];

        // Time difference for Yield calculations
        const timeDiff = new Date(date).getTime() - new Date(prevDate).getTime();
        const daysPassed = Math.max(0, timeDiff / (1000 * 3600 * 24));

        // Determine "Available Assets" for this day (must have a price/rate Last Known or Today)
        // Actually, to assume daily rebalancing, we need a Price TODAY.
        // If price is missing today, we can assume it held flat (0% return) or use Last Known.
        // Let's use Last Known logic for robustness.

        const currentPrices: Record<string, number> = {};

        processedAssets.forEach(asset => {
            const dayData = asset.data.find(d => d[0] === date);
            if (dayData) {
                currentPrices[asset.ticker] = dayData[1];
            } else {
                // No data for this specific day? Use previous (0 return effectively for price assets)
                currentPrices[asset.ticker] = previousPrices[asset.ticker];
            }
        });

        // Which assets are "Tradeable" (exist and have a price)?
        // We only allocate to assets that HAVE a price (and had a price previously to calc return).
        // If an asset is new today (IPO), we can start allocating to it, but it contributes 0 return THIS specific day.

        const validAssetsForAllocation = processedAssets.filter(a =>
            currentPrices[a.ticker] !== undefined // Exists today
        );

        // Normalize Allocations
        let totalTargetAllocation = 0;
        validAssetsForAllocation.forEach(a => {
            totalTargetAllocation += (allocations[a.ticker] || 0);
        });

        let dayPortfolioReturn = 0; // Weighted sum of asset returns

        if (totalTargetAllocation > 0) {
            validAssetsForAllocation.forEach(asset => {
                const ticker = asset.ticker;
                const rawAlloc = allocations[ticker] || 0;
                const normalizedWeight = rawAlloc / totalTargetAllocation;

                const currPrice = currentPrices[ticker];
                const prevPrice = previousPrices[ticker];

                let assetReturn = 0;

                // Only calculate return if we had a previous price
                if (prevPrice !== undefined && currPrice !== undefined) {
                    if (asset.type === 'price') {
                        // Price Return: (Curr - Prev) / Prev
                        if (prevPrice > 0) {
                            assetReturn = (currPrice - prevPrice) / prevPrice;
                        }
                    } else {
                        // Yield Return: Interest accrued
                        // Value = Principal * (1 + rate*time)
                        // Return = Value/Principal - 1 = rate * time
                        // We use the Previous Rate for the period
                        const safeRate = Math.max(0, prevPrice);
                        const dailyRate = (safeRate / 100) / 365;
                        assetReturn = dailyRate * daysPassed;
                    }
                }

                // If asset just started existing today (prevPrice undefined), Asset Return is 0 this step.
                // But we Will allocate to it for the next step.

                dayPortfolioReturn += (assetReturn * normalizedWeight);
            });
        }

        // Apply Portfolio Return
        currentPortfolioValue = currentPortfolioValue * (1 + dayPortfolioReturn);

        // Store Results
        const breakdown: Record<string, number> = {};
        if (totalTargetAllocation > 0) {
            validAssetsForAllocation.forEach(a => {
                const weight = (allocations[a.ticker] || 0) / totalTargetAllocation;
                breakdown[a.ticker] = currentPortfolioValue * weight;
            });
        }

        results.push({
            date,
            value: currentPortfolioValue,
            assets: breakdown
        });

        // Update Previous Prices for next iteration
        Object.assign(previousPrices, currentPrices);
    }

    return results;
}
