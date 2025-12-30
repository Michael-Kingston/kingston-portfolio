import { AssetData, PortfolioAllocation } from '../types/investment';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AllocationPieChartProps {
    assets: AssetData[];
    allocations: PortfolioAllocation;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

export function AllocationPieChart({ assets, allocations }: AllocationPieChartProps) {
    const data = assets
        .filter(asset => (allocations[asset.ticker] || 0) > 0)
        .map(asset => ({
            name: asset.name,
            value: allocations[asset.ticker] || 0
        }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                No allocations
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number | undefined) => [`${value?.toFixed(0) || '0'}%`, 'Allocation']}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
