import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from './ui/Card';
import { CalculationResult } from '../types/investment';

interface ChartSeries {
    id: string;
    name: string;
    color: string;
    data: CalculationResult[];
}

interface ChartProps {
    series: ChartSeries[];
    initialInvestment: number;
}

const CustomTooltip = ({ active, payload, label, initialInvestment }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0a0a0c]/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md min-w-[200px]">
                <p className="text-gray-400 text-xs mb-2 font-mono">
                    {new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <div className="space-y-3">
                    {payload.map((entry: any) => {
                        const val = entry.value;
                        const growth = val - initialInvestment;
                        return (
                            <div key={entry.name} className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-gray-300 font-medium text-sm">{entry.name}</span>
                                </div>
                                <div className="pl-4">
                                    <div className="text-lg font-bold text-white font-mono">£{Math.round(val).toLocaleString()}</div>
                                    <div className={`text-xs font-mono ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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

export function Chart({ series, initialInvestment }: ChartProps) {
    // We need to merge data for the chart if we want to show them on the same axis nicely
    // OR we can just pass the first series' date structure if we assume they are aligned (which they are)

    // However, Recharts needs a single array of objects for data if we want shared X-Axis easily
    // We'll map the first series dates to the structure: { date: string, [seriesId]: value, ... }

    if (series.length === 0 || series[0].data.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center text-gray-500">
                <p>No data to display.</p>
            </Card>
        );
    }

    // Merge data
    // optimization: assume all series have same dates returned by calculator
    const startSeries = series[0];
    const mergedData = startSeries.data.map((point, index) => {
        const item: any = { date: point.date };
        series.forEach(s => {
            // Safety check if index exists
            if (s.data[index]) {
                item[s.id] = s.data[index].value;
            }
        });
        return item;
    });

    return (
        <Card className="h-full flex flex-col p-4 w-full">
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            {series.map(s => (
                                <linearGradient key={s.id} id={`color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
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
                        <Tooltip content={<CustomTooltip initialInvestment={initialInvestment} />} />
                        <Legend />

                        {series.map(s => (
                            <Area
                                key={s.id}
                                type="monotone"
                                dataKey={s.id}
                                name={s.name}
                                stroke={s.color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#color-${s.id})`}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
