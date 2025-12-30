import { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { AssetManager } from './components/AssetManager';
import { AllocationPieChart } from './components/PieChart';
import { Chart } from './components/Chart';
import { Input } from './components/ui/Input';
import { AssetData, PortfolioAllocation } from './types/investment';
import { calculateAccumulation } from './utils/calculator';
import { PRESETS } from './constants/presets';
import { Wallet } from 'lucide-react';

function App() {
  // State
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [allocations, setAllocations] = useState<PortfolioAllocation>({});
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [startDate, setStartDate] = useState<string>('2010-01-01'); // Default start
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default today

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        const summaryRes = await fetch('/data/summary.json');
        const summary = await summaryRes.json();

        const loadedAssets: AssetData[] = [];
        // Summary is an object { TICKER: { file, name } }
        for (const [ticker, item] of Object.entries(summary) as [string, any][]) {
          try {
            const dataRes = await fetch(`/data/${item.file}`);
            const data = await dataRes.json();

            loadedAssets.push({
              ticker: ticker,
              name: item.name,
              data: data,
              type: ticker === '^IRX' ? 'yield' : 'price'
            });
          } catch (e) {
            console.error(`Failed to load ${ticker}`, e);
          }
        }
        setAssets(loadedAssets);
      } catch (e) {
        console.error("Failed to load summary", e);
      }
    }
    fetchData();
  }, []);

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setAllocations(preset.allocations);
    }
  };

  // Calculate Results
  // Filter assets to only those that are selected (even if 0% allocation initially) so we can run calc
  const activeAssets = useMemo(() => {
    // We want assets that match keys in allocations
    const active = assets.filter(a => allocations.hasOwnProperty(a.ticker));
    console.log('Active assets computation:', {
      totalAssets: assets.length,
      allocations,
      activeCount: active.length
    });
    return active;
  }, [assets, allocations]);

  const results = useMemo(() => {
    if (activeAssets.length === 0) {
      console.log('App: No active assets');
      return [];
    }
    const res = calculateAccumulation(activeAssets, allocations, initialInvestment, startDate, endDate);
    console.log('App: Results computed', { length: res.length, first: res[0], last: res[res.length - 1] });
    return res;
  }, [activeAssets, allocations, initialInvestment, startDate, endDate]);

  // Derived Metrics
  const finalValue = results.length > 0 ? results[results.length - 1].value : initialInvestment;
  const totalReturn = ((finalValue - initialInvestment) / initialInvestment) * 100;

  // CAGR Calculation (Years based on actual date diff)
  const cagr = useMemo(() => {
    if (results.length < 2) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const years = (end - start) / (1000 * 3600 * 24 * 365.25);
    if (years <= 0) return 0;
    return (Math.pow(finalValue / initialInvestment, 1 / years) - 1) * 100;
  }, [results, finalValue, initialInvestment, startDate, endDate]);

  // Header Component
  const HeaderControls = (
    <div className="flex items-center gap-8 w-full">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
          <Wallet size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Portfolio<span className="text-indigo-400">Sim</span>
        </h1>
      </div>

      <div className="h-8 w-px bg-white/10" />

      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">Preset</label>
          <select
            className="bg-[#18181b] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            onChange={(e) => handlePresetSelect(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Load Preset...</option>
            {PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <Input
          type="number"
          value={initialInvestment}
          onChange={(e) => setInitialInvestment(Number(e.target.value))}
          label="Initial Investment (£)"
          className="w-40 font-mono"
        />

        <div className="flex items-end gap-2">
          {/* ... inputs ... */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            label="Start Date"
            className="w-40 font-mono"
          />
          <span className="text-gray-500 pb-3">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            label="End Date"
            className="w-40 font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase font-medium">Total Return</div>
          <div className={`text-xl font-bold font-mono ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(2)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase font-medium">Nominal Gain</div>
          <div className={`text-xl font-bold font-mono ${finalValue >= initialInvestment ? 'text-green-400' : 'text-red-400'}`}>
            {finalValue >= initialInvestment ? '+' : '-'}£{Math.abs(finalValue - initialInvestment).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase font-medium">CAGR</div>
          <div className={`text-xl font-bold font-mono ${cagr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {cagr.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/10">
          <div className="text-xs text-gray-400 uppercase font-medium">Final Value</div>
          <div className="text-xl font-bold text-white font-mono">
            £{Math.round(finalValue).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      header={HeaderControls}
      sidebar={
        <AssetManager
          availableAssets={assets}
          allocations={allocations}
          onUpdateAllocations={setAllocations}
        />
      }
      pieChart={
        <AllocationPieChart
          assets={assets}
          allocations={allocations}
        />
      }
      main={
        <Chart
          data={results}
          allocations={allocations}
          initialInvestment={initialInvestment}
        />
      }
    />
  );
}

export default App;
