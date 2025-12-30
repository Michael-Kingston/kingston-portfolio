import { PortfolioAllocation } from '../types/investment';

export interface Preset {
    id: string;
    name: string;
    description: string;
    allocations: PortfolioAllocation;
}

export const PRESETS: Preset[] = [
    {
        id: 'conservative',
        name: 'Conservative (Safe)',
        description: '100% Risk-Free Treasury Bills (^IRX). Protects capital with steady yield.',
        allocations: {
            '^IRX': 100
        }
    },
    {
        id: 'balanced',
        name: 'Balanced (60/40)',
        description: '60% S&P 500 (SPY), 40% Treasury Bills (^IRX). A classic mix of growth and stability.',
        allocations: {
            'SPY': 60,
            '^IRX': 40
        }
    },
    {
        id: 'growth',
        name: 'Growth (Aggressive)',
        description: '100% S&P 500 (SPY). Maximize long-term returns with higher volatility.',
        allocations: {
            'SPY': 100
        }
    },
    {
        id: 'tech_heavy',
        name: 'Tech Heavy',
        description: '70% Technology (XLK), 20% Semiconductor (SMH), 10% Crypto (BTC). Bet on the future.',
        allocations: {
            'XLK': 70,
            'SMH': 20,
            'BTC-USD': 10
        }
    },
    {
        id: 'dividend',
        name: 'Dividend & Income',
        description: 'Focused on high-yield corporate bonds and real estate.',
        allocations: {
            'VNQ': 40,
            'LQD': 30,
            'HYG': 20,
            'SPY': 10
        }
    },
    {
        id: 'global',
        name: 'Global Diversified',
        description: 'Exposure to US, International, and Emerging Markets.',
        allocations: {
            'SPY': 50,
            'VEU': 30,
            'EEM': 20
        }
    },
    {
        id: 'crypto_maxi',
        name: 'Crypto & Innovation',
        description: 'High risk, high reward. Bitcoin, Ethereum, and disruptive tech.',
        allocations: {
            'BTC-USD': 40,
            'ETH-USD': 30,
            'ARKK': 30
        }
    },
    {
        id: 'golden_butterfly',
        name: 'Golden Butterfly',
        description: 'A stable portfolio with stocks, bonds, and gold.',
        allocations: {
            'SPY': 20,
            'IWM': 20,
            'TLT': 20,
            'SHV': 20,
            'GLD': 20
        }
    },
    {
        id: 'magnificent_seven',
        name: 'Magnificent Seven (+)',
        description: 'The giant tech leaders: Apple, Microsoft, Google, Amazon, Tesla, Nvidia.',
        allocations: {
            'AAPL': 20,
            'MSFT': 20,
            'GOOGL': 15,
            'AMZN': 15,
            'NVDA': 15,
            'TSLA': 15
        }
    }
];
