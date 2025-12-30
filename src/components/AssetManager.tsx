import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { AssetData, PortfolioAllocation } from '../types/investment';

interface AssetManagerProps {
    availableAssets: AssetData[];
    allocations: PortfolioAllocation;
    onUpdateAllocations: (newAllocations: PortfolioAllocation) => void;
}

export function AssetManager({ availableAssets, allocations, onUpdateAllocations }: AssetManagerProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddAsset = (ticker: string) => {
        onUpdateAllocations({
            ...allocations,
            [ticker]: 0 // Start with 0 allocation
        });
        setIsAddModalOpen(false);
    };

    const handleRemoveAsset = (ticker: string) => {
        const newAllocations = { ...allocations };
        delete newAllocations[ticker];
        onUpdateAllocations(newAllocations);
    };

    const handleAllocationChange = (ticker: string, value: number) => {
        onUpdateAllocations({
            ...allocations,
            [ticker]: value
        });
    };

    // Get assets not yet in portfolio
    const unusedAssets = availableAssets.filter(a => !allocations.hasOwnProperty(a.ticker));

    const totalAllocation = Object.values(allocations).reduce((sum: number, val: number) => sum + val, 0);

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Assets
                </h2>
                <Button size="sm" variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16} className="mr-1" /> Add
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {Object.entries(allocations).map(([ticker, percentage]) => {
                    const asset = availableAssets.find(a => a.ticker === ticker);
                    return (
                        <div key={ticker} className="bg-white/5 rounded-xl p-4 border border-white/5 group hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-white">{asset?.name || ticker}</h3>
                                    <div className="text-xs text-gray-500 uppercase font-mono">{ticker}</div>
                                </div>
                                <button
                                    onClick={() => handleRemoveAsset(ticker)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/5 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Allocation</span>
                                    <span className="font-mono text-indigo-400">{percentage}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={percentage}
                                    onChange={(e) => handleAllocationChange(ticker, parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 hover:[&::-webkit-slider-thumb]:bg-indigo-400 transition-all"
                                />
                            </div>
                        </div>
                    );
                })}

                {Object.keys(allocations).length === 0 && (
                    <div className="text-center py-12 text-gray-500 dashed border border-white/10 rounded-xl">
                        <p>No assets selected</p>
                        <p className="text-sm mt-1">Click Add to start building</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total Allocation</span>
                    <span className={`font-mono font-bold ${totalAllocation > 100 ? 'text-red-400' : totalAllocation === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {totalAllocation}%
                    </span>
                </div>
                {totalAllocation !== 100 && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                        Target 100% for full deployment
                    </p>
                )}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Asset"
            >
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {unusedAssets.map(asset => (
                        <button
                            key={asset.ticker}
                            onClick={() => handleAddAsset(asset.ticker)}
                            className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between group"
                        >
                            <div>
                                <div className="font-medium text-white">{asset.name}</div>
                                <div className="text-xs text-gray-500 font-mono">{asset.ticker}</div>
                            </div>
                            <Plus size={16} className="text-gray-500 group-hover:text-white" />
                        </button>
                    ))}
                    {unusedAssets.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No more assets available.</p>
                    )}
                </div>
            </Modal>
        </Card>
    );
}
