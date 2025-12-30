export interface AssetData {
    ticker: string;
    name: string;
    type?: 'price' | 'yield'; // 'price' for stocks/ETFs, 'yield' for interest rates (e.g. IRX)
    data: Array<[string, number]>; // [date, price/yield]
}

export interface PortfolioAllocation {
    [ticker: string]: number; // percentage 0-100
}

export interface Portfolio {
    id: string;
    name: string;
    allocations: PortfolioAllocation;
    color: string;
}

export interface CalculationResult {
    date: string;
    value: number;
    assets: Record<string, number>;
}
