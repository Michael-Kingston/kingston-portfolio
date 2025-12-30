import yfinance as yf
import json
import os
import pandas as pd
from datetime import datetime

assets = {
    "SPY": "S&P 500",
    "QQQ": "Nasdaq 100",
    "IWM": "Russell 2000 (Small Cap)",
    "DIA": "Dow Jones Industrial Average",
    "VEU": "International Markets (ex-US)",
    "EEM": "Emerging Markets",
    "VGK": "European Markets",
    "EWJ": "Japan Markets",
    
    # Sector ETFs
    "XLK": "Technology Select Sector",
    "XLE": "Energy Select Sector",
    "XLF": "Financial Select Sector",
    "XLV": "Health Care Select Sector",
    "VNQ": "Real Estate (REITs)",
    "SMH": "Semiconductors",
    "ARKK": "ARK Innovation",

    # Bonds & Fixed Income
    "BND": "Total Bond Market",
    "TLT": "20+ Year Treasury Bonds",
    "IEF": "7-10 Year Treasury Bonds",
    "SHY": "1-3 Year Treasury Bonds",
    "LQD": "Investment Grade Corporate Bonds",
    "HYG": "High Yield Corporate Bonds",
    "SHV": "Short Treasury (Cash Proxy)",

    # Commodities & Crypto
    "GLD": "Gold",
    "SLV": "Silver",
    "USO": "Oil Fund",
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",

    # Individual Giants
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com Inc.",
    "TSLA": "Tesla, Inc.",
    "NVDA": "NVIDIA Corp",
    "BRK-B": "Berkshire Hathaway",

    # Indices
    "^FTSE": "FTSE 100",
    "^N225": "Nikkei 225",
    
    # Rates
    "^IRX": "Savings (Risk-Free)"
}

start_date = "2000-01-01"
end_date = datetime.now().strftime('%Y-%m-%d')

output_dir = "public/data"
os.makedirs(output_dir, exist_ok=True)

data_summary = {}

for ticker, name in assets.items():
    print(f"Fetching {name} ({ticker})...")
    df = yf.download(ticker, start=start_date, end=end_date)
    if not df.empty:
        # Flatten MultiIndex columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        # Check available columns
        print(f"Columns for {ticker}: {df.columns.tolist()}")
        
        # Robustly find the Close price
        col = 'Adj Close' if 'Adj Close' in df.columns else ('Close' if 'Close' in df.columns else None)
        
        if col:
            prices = df[col].dropna().reset_index()
            # Convert timestamp to ISO format string
            prices['Date'] = prices['Date'].dt.date.astype(str)
            
            # Use flatten() if it's a multi-index or just standard values
            records = prices.values.tolist() # [[date, price], ...]
            filename = f"{ticker.replace('^', '')}.json"
            
            with open(os.path.join(output_dir, filename), 'w') as f:
                json.dump(records, f)
                
            data_summary[ticker] = {
                "name": name,
                "count": len(records),
                "file": filename
            }
        else:
            print(f"No close price found for {ticker}")

with open(os.path.join(output_dir, "summary.json"), 'w') as f:
    json.dump(data_summary, f)

print("Data fetch complete.")
