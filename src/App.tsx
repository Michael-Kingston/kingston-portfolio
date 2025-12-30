import { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { AssetManager } from './components/AssetManager';
import { AllocationPieChart } from './components/PieChart';
import { Chart } from './components/Chart';
import { Input } from './components/ui/Input';
import { AssetData, Portfolio } from './types/investment';
import { calculateAccumulation } from './utils/calculator';
import { PRESETS } from './constants/presets';
import { Wallet } from 'lucide-react';

function App() {
  // State
  const [assets, setAssets] = useState<AssetData[]>([]);

  // Portfolio State
  const [portfolios, setPortfolios] = useState<Portfolio[]>([
    { id: '1', name: 'Main Portfolio', allocations: {}, color: '#818cf8' }
  ]);
  const [activePortfolioId, setActivePortfolioId] = useState<string>('1');

  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [startDate, setStartDate] = useState<string>('2010-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        const summaryRes = await fetch('/data/summary.json');
        const summary = await summaryRes.json();

        const loadedAssets: AssetData[] = [];
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

        // Generate synthetic Savings Account asset (2.5% AER)
        // We need daily data points for the calculator to work seamlessly (using previous value logic)
        // Generating from 2000 to 2030 to cover likely ranges
        const savingsData: Array<[string, number]> = [];
        let currentDate = new Date('2000-01-01');
        const stopDate = new Date('2030-01-01');
        while (currentDate <= stopDate) {
          savingsData.push([currentDate.toISOString().split('T')[0], 2.5]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        loadedAssets.push({
          ticker: 'SAVINGS',
          name: 'Savings (2.5% AER)',
          type: 'yield',
          data: savingsData
        });

        // 4% Savings
        const savingsData4: Array<[string, number]> = [];
        currentDate = new Date('2000-01-01'); // Reset date
        while (currentDate <= stopDate) {
          savingsData4.push([currentDate.toISOString().split('T')[0], 4.0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        loadedAssets.push({
          ticker: 'SAVINGS_4',
          name: 'Savings (4.0% AER)',
          type: 'yield',
          data: savingsData4
        });

        setAssets(loadedAssets);
        // Load default preset if empty? No, let user choose.
      } catch (e) {
        console.error("Failed to load summary", e);
      }
    }
    fetchData();
  }, []);

  // Portfolio Management
  const handleUpdatePortfolio = (id: string, updates: Partial<Portfolio>) => {
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleAddPortfolio = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    // Pick a random color
    const colors = ['#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPortfolio: Portfolio = {
      id: newId,
      name: `Portfolio ${portfolios.length + 1}`,
      allocations: {},
      color: randomColor
    };
    setPortfolios([...portfolios, newPortfolio]);
    setActivePortfolioId(newId);
  };

  const handleRemovePortfolio = (id: string) => {
    if (portfolios.length <= 1) return;
    const newPortfolios = portfolios.filter(p => p.id !== id);
    setPortfolios(newPortfolios);
    if (activePortfolioId === id) {
      setActivePortfolioId(newPortfolios[0].id);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      handleUpdatePortfolio(activePortfolioId, { allocations: preset.allocations });
    }
  };

  // Calculate Results for ALL portfolios
  const chartSeries = useMemo(() => {
    return portfolios.map(portfolio => {
      // Active assets for THIS portfolio
      const activeAssets = assets.filter(a => portfolio.allocations.hasOwnProperty(a.ticker));

      let data: any[] = [];
      if (activeAssets.length > 0) {
        data = calculateAccumulation(activeAssets, portfolio.allocations, initialInvestment, startDate, endDate);
      }

      return {
        id: portfolio.id,
        name: portfolio.name,
        color: portfolio.color,
        data: data
      };
    });
  }, [portfolios, assets, initialInvestment, startDate, endDate]);

  // Metrics for ACTIVE portfolio (to display in header)
  const activeSeries = chartSeries.find(s => s.id === activePortfolioId);
  const results = activeSeries?.data || [];
  const finalValue = results.length > 0 ? results[results.length - 1].value : initialInvestment;
  const totalReturn = ((finalValue - initialInvestment) / initialInvestment) * 100;

  // CAGR Calculation
  const cagr = useMemo(() => {
    if (results.length < 2) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const years = (end - start) / (1000 * 3600 * 24 * 365.25);
    if (years <= 0) return 0;
    return (Math.pow(finalValue / initialInvestment, 1 / years) - 1) * 100;
  }, [results, finalValue, initialInvestment, startDate, endDate]);

  const activePortfolioData = portfolios.find(p => p.id === activePortfolioId);

  // Header Component
  const HeaderControls = (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 w-full p-2 lg:p-0">
      <div className="flex items-center gap-3 min-w-fit">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
          <Wallet size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
          Kingston<span className="text-indigo-400">Portfolio</span>
        </h1>
      </div>

      <div className="h-px w-full lg:h-8 lg:w-px bg-white/10" />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 flex-1 w-full lg:w-auto">
        <div className="flex flex-col gap-1 w-[140px]">
          <label className="text-xs font-medium text-gray-400">Preset</label>
          <select
            className="bg-[#18181b] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
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
          label="Initial Inv (£)"
          className="w-28 font-mono text-xs"
        />

        <div className="flex items-end gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            label="Start"
            className="w-32 font-mono text-xs"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            label="End"
            className="w-32 font-mono text-xs"
          />
        </div>
      </div>

      {/* Stats - Compact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-4 lg:gap-6 w-full lg:w-auto mt-2 lg:mt-0 bg-white/5 lg:bg-transparent p-3 lg:p-0 rounded-xl">
        <div className="text-left lg:text-right">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Return</div>
          <div className={`text-base lg:text-lg font-bold font-mono ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(1)}%
          </div>
        </div>
        <div className="text-left lg:text-right">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Gain</div>
          <div className={`text-base lg:text-lg font-bold font-mono ${finalValue >= initialInvestment ? 'text-green-400' : 'text-red-400'}`}>
            {finalValue >= initialInvestment ? '+' : '-'}£{Math.abs(finalValue - initialInvestment).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-left lg:text-right">
          <div className="text-[10px] text-gray-400 uppercase font-medium">CAGR</div>
          <div className={`text-base lg:text-lg font-bold font-mono ${cagr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {cagr.toFixed(1)}%
          </div>
        </div>
        <div className="lg:bg-white/5 lg:rounded-xl lg:px-4 lg:py-2 lg:border lg:border-white/10 text-left">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Value</div>
          <div className="text-lg lg:text-xl font-bold text-white font-mono">
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
        activePortfolioData ? (
          <AssetManager
            availableAssets={assets}
            activePortfolioId={activePortfolioId}
            portfolios={portfolios}
            onUpdatePortfolio={handleUpdatePortfolio}
            onAddPortfolio={handleAddPortfolio}
            onRemovePortfolio={handleRemovePortfolio}
            onSetActivePortfolio={setActivePortfolioId}
          />
        ) : null
      }
      pieChart={
        activePortfolioData ? (
          <AllocationPieChart
            assets={assets}
            allocations={activePortfolioData.allocations}
          />
        ) : null
      }
      main={
        <Chart
          series={chartSeries}
          initialInvestment={initialInvestment}
        />
      }
    />
  );
}

export default App;
