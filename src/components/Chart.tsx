import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { CalculationResult, PortfolioAllocation } from '../types/investment';

interface ChartProps {
    data: CalculationResult[];
    allocations: PortfolioAllocation;
    initialInvestment: number;
}

const CustomTooltip = ({ active, payload, label, allocations, initialInvestment }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload as CalculationResult;
        const totalValue = dataPoint.value;
        const totalGrowth = totalValue - initialInvestment;

        return (
            <div className="bg-[#0a0a0c]/90 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md min-w-[200px]">
                <p className="text-gray-400 text-sm mb-2">
                    {new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="mb-4">
                    <p className="text-gray-400 text-xs uppercase font-medium">Portfolio Value</p>
                    <p className="text-xl font-bold text-white font-mono">£{Math.round(totalValue).toLocaleString()}</p>
                    <p className={`text-sm font-mono ${totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalGrowth >= 0 ? '+' : ''}£{Math.round(totalGrowth).toLocaleString()}
                    </p>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-3">
                    {Object.entries(dataPoint.assets).map(([ticker, value]) => {
                        const initialAssetValue = initialInvestment * ((allocations[ticker] || 0) / 100);
                        const growth = value - initialAssetValue;
                        return (
                            <div key={ticker} className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-300">{ticker}</span>
                                <div className="text-right">
                                    <div className="text-white font-mono">£{Math.round(value).toLocaleString()}</div>
                                    <div className={`font-mono ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {growth >= 0 ? '+' : ''}£{Math.round(growth).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

export function Chart({ data, allocations, initialInvestment }: ChartProps) {
    console.log('Chart render:', { dataLength: data.length });
    if (data.length === 0) {
        console.log('Chart: No data state');
        return (
            <Card className="h-full flex items-center justify-center text-gray-500">
                <p>No data to display. Add assets and set allocations to see performance.</p>
            </Card>
        );
    }

    // Calculate percentage growth for gradients
    const firstValue = data[0]?.value || 1;
    const lastValue = data[data.length - 1]?.value || 1;
    const isPositive = lastValue >= firstValue;

    return (
        <Card className="h-full flex flex-col p-4 w-full">
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? '#818cf8' : '#f87171'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={isPositive ? '#818cf8' : '#f87171'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(date) => {
                                const d = new Date(date);
                                return `${d.getMonth() + 1}/${d.getFullYear().toString().substr(2)}`;
                            }}
                            minTickGap={50}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `£${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip content={<CustomTooltip allocations={allocations} initialInvestment={initialInvestment} />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? '#818cf8' : '#f87171'}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
