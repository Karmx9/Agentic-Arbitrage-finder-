
import type { Company, MockData, OptionsChain, ProposedStrategy, BacktestResult, StrategyLeg, OHLCV, FullBacktest, Alert, Option } from '../types';

export const companies: Company[] = [
  // Biotechnology
  { ticker: 'VRTX', name: 'Vertex Pharmaceuticals', domain: 'vrtx.com', pipeline: 'Cystic Fibrosis & Gene Editing', marketCap: '$120B', sector: 'Biotechnology' },
  { ticker: 'BIIB', name: 'Biogen Inc.', domain: 'biogen.com', pipeline: 'Neurological Diseases (Alzheimer\'s, MS)', marketCap: '$33B', sector: 'Biotechnology' },
  { ticker: 'MRNA', name: 'Moderna, Inc.', domain: 'modernatx.com', pipeline: 'mRNA Vaccines & Therapeutics', marketCap: '$60B', sector: 'Biotechnology' },
  { ticker: 'CRSP', name: 'CRISPR Therapeutics', domain: 'crisprtx.com', pipeline: 'Gene-based medicines for serious diseases', marketCap: '$5B', sector: 'Biotechnology' },
  // Technology
  { ticker: 'AAPL', name: 'Apple Inc.', domain: 'apple.com', pipeline: 'Consumer Electronics, Software & Services', marketCap: '$3.2T', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', domain: 'microsoft.com', pipeline: 'Cloud Computing, OS & Business Software', marketCap: '$3.1T', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', domain: 'abc.xyz', pipeline: 'Search, Cloud & Autonomous Driving', marketCap: '$2.2T', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', domain: 'amazon.com', pipeline: 'E-commerce, Cloud & AI', marketCap: '$1.9T', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', domain: 'nvidia.com', pipeline: 'GPUs, AI Accelerators & Data Centers', marketCap: '$2.8T', sector: 'Technology' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', domain: 'tesla.com', pipeline: 'Electric Vehicles, Energy & AI', marketCap: '$580B', sector: 'Technology' },
  { ticker: 'META', name: 'Meta Platforms, Inc.', domain: 'meta.com', pipeline: 'Social Media, VR/AR & AI', marketCap: '$1.2T', sector: 'Technology' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', domain: 'amd.com', pipeline: 'CPUs, GPUs & Server Processors', marketCap: '$260B', sector: 'Technology' },
  { ticker: 'NFLX', name: 'Netflix, Inc.', domain: 'netflix.com', pipeline: 'Streaming Media & Content Production', marketCap: '$265B', sector: 'Technology' },
  { ticker: 'CRM', name: 'Salesforce, Inc.', domain: 'salesforce.com', pipeline: 'Cloud-based CRM & Enterprise Software', marketCap: '$230B', sector: 'Technology' },
  { ticker: 'INTC', name: 'Intel Corporation', domain: 'intel.com', pipeline: 'Semiconductors & Data Center Solutions', marketCap: '$130B', sector: 'Technology' },
  { ticker: 'ORCL', name: 'Oracle Corporation', domain: 'oracle.com', pipeline: 'Database Software, Cloud & ERP', marketCap: '$340B', sector: 'Technology' },
];

function generateOptions(stockPrice: number, volatility: number): OptionsChain {
  const optionsChain: OptionsChain = { calls: [], puts: [] };
  const strikes = [-2, -1, 0, 1, 2].map(offset => Math.round(stockPrice / 5) * 5 + offset * 5);
  
  strikes.forEach(strike => {
    const callIv = volatility + (stockPrice - strike) * 0.5 + Math.random() * 5;
    const putIv = volatility + (strike - stockPrice) * 0.5 + Math.random() * 5;
    
    const callPrice = blackScholes(stockPrice, strike, 30/365, 0.02, callIv/100, 'CALL');
    const putPrice = blackScholes(stockPrice, strike, 30/365, 0.02, putIv/100, 'PUT');
    const spread = callPrice * 0.05;

    optionsChain.calls.push({
      strike,
      type: 'CALL',
      bid: Math.max(0.01, callPrice - spread),
      ask: callPrice + spread,
      iv: Math.max(50, callIv),
      volume: Math.floor(Math.random() * 5000) + 200
    });
    optionsChain.puts.push({
      strike,
      type: 'PUT',
      bid: Math.max(0.01, putPrice - spread),
      ask: putPrice + spread,
      iv: Math.max(50, putIv),
      volume: Math.floor(Math.random() * 5000) + 200
    });
  });
  return optionsChain;
}

export function getMockDataForCompany(company: Company): MockData {
  const stockPrice = 50 + Math.random() * 450;
  
  // Apply sector-specific volatility models
  const volatility = company.sector === 'Biotechnology' 
    ? 150 + Math.random() * 50 // Extremely high IV for biotech catalyst
    : 80 + Math.random() * 40;  // High, but more realistic IV for tech earnings/events
  
  const today = new Date();
  const catalyst = new Date(today.setDate(today.getDate() + 25));
  const catalystDate = catalyst.toISOString().split('T')[0];

  return {
    stockPrice,
    catalystDate,
    optionsChain: generateOptions(stockPrice, volatility),
  };
}

// --- Sophisticated Backtesting Engine ---

// Standard Normal Cumulative Distribution Function
function N(z: number) {
    const b1 =  0.319381530;
    const b2 = -0.356563782;
    const b3 =  1.781477937;
    const b4 = -1.821255978;
    const b5 =  1.330274429;
    const p  =  0.2316419;
    const c2 =  0.39894228;

    if (z >= 0.0) {
        let t = 1.0 / ( 1.0 + p * z );
        return (1.0 - c2 * Math.exp( -z * z / 2.0 ) * t *
        ( t * ( t * ( t * ( t * b5 + b4 ) + b3 ) + b2 ) + b1 ));
    } else {
        let t = 1.0 / ( 1.0 - p * z );
        return ( c2 * Math.exp( -z * z / 2.0 ) * t *
        ( t * ( t * ( t * ( t * b5 + b4 ) + b3 ) + b2 ) + b1 ));
    }
}

// Black-Scholes option pricing model
export function blackScholes(stockPrice: number, strikePrice: number, timeToExpiry: number, riskFreeRate: number, volatility: number, optionType: 'CALL' | 'PUT'): number {
    if (timeToExpiry <= 0) {
        return optionType === 'CALL' ? Math.max(0, stockPrice - strikePrice) : Math.max(0, strikePrice - stockPrice);
    }

    const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate + volatility * volatility / 2) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    if (optionType === 'CALL') {
        return stockPrice * N(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(d2);
    } else { // PUT
        return strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2) - stockPrice * N(-d1);
    }
}

function getNumberFromCurrency(str: string): number {
    return parseFloat(str.replace(/[^0-9.-]+/g,""));
}

export function runBacktest(strategy: ProposedStrategy, initialStockPrice: number): FullBacktest {
    const results: BacktestResult[] = [];
    const days = 30;
    const catalystDay = 20;
    const riskFreeRate = 0.02; // 2% risk-free rate
    const company = companies.find(c => c.ticker === strategy.ticker);
    
    const initialVolatility = company?.sector === 'Biotechnology' ? 1.5 : 0.8; // 150% or 80%
    const postCatalystVolatility = company?.sector === 'Biotechnology' ? 0.4 : 0.3; // 40% or 30%

    const initialPortfolioValue = strategy.tradeDetails.legs.reduce((acc, leg) => {
        const timeToExpiry = (days / 365);
        const price = blackScholes(initialStockPrice, leg.strike, timeToExpiry, riskFreeRate, initialVolatility, leg.type);
        return acc + (leg.action === 'BUY' ? -price : price);
    }, 0);
    
    const costBasis = Math.abs(initialPortfolioValue) > 0.01 ? Math.abs(initialPortfolioValue) : 
        strategy.tradeDetails.legs.reduce((acc, leg) => acc + leg.strike, 0) / strategy.tradeDetails.legs.length * 0.1;

    let currentStockPrice = initialStockPrice;
    let currentMarketPrice = 1000;
    
    const catalystShockMagnitude = company?.sector === 'Biotechnology' ? (0.4 + Math.random() * 0.5) : (0.1 + Math.random() * 0.15);
    const catalystShock = (Math.random() > 0.5 ? 1 : -1) * initialStockPrice * catalystShockMagnitude;

    const targetProfit = getNumberFromCurrency(strategy.tradeDetails.targetProfit);
    const stopLoss = -Math.abs(getNumberFromCurrency(strategy.tradeDetails.stopLoss));
    let targetHit = false;
    let stopHit = false;
    
    const stockReturns: number[] = [];
    const marketReturns: number[] = [];

    for (let day = 1; day <= days; day++) {
        const stockOpen = currentStockPrice;
        const marketOpen = currentMarketPrice;
        
        // Simulate stock price movement
        const stockDailyVolatility = company?.sector === 'Biotechnology' ? 0.1 : 0.05;
        const marketDailyVolatility = 0.03;
        const stockIntraDayMove1 = stockOpen * (Math.random() - 0.5) * stockDailyVolatility;
        const stockIntraDayMove2 = stockOpen * (Math.random() - 0.5) * stockDailyVolatility;
        let stockClose = stockOpen + stockIntraDayMove1 + stockIntraDayMove2;

        if (day === catalystDay) {
            stockClose += catalystShock;
        }
        stockClose = Math.max(1, stockClose);

        currentStockPrice = stockClose;
        currentMarketPrice = marketOpen * (1 + (Math.random() - 0.5) * marketDailyVolatility);
        
        stockReturns.push((stockClose - stockOpen) / stockOpen);
        marketReturns.push((currentMarketPrice - marketOpen) / marketOpen);

        const ohlcv: OHLCV = {
            day,
            open: parseFloat(stockOpen.toFixed(2)),
            high: parseFloat(Math.max(stockOpen, stockClose, stockOpen + stockIntraDayMove1, stockOpen + stockIntraDayMove2).toFixed(2)),
            low: parseFloat(Math.min(stockOpen, stockClose, stockOpen + stockIntraDayMove1, stockOpen + stockIntraDayMove2).toFixed(2)),
            close: parseFloat(stockClose.toFixed(2)),
            volume: Math.round(1_000_000 + Math.random() * 5_000_000 * (day === catalystDay ? 5 : 1)),
        };

        const timeToExpiry = Math.max(0, (days - day) / 365);
        const currentVolatility = day >= catalystDay ? postCatalystVolatility : initialVolatility;

        const currentPortfolioValue = strategy.tradeDetails.legs.reduce((acc, leg) => {
            const price = blackScholes(ohlcv.close, leg.strike, timeToExpiry, riskFreeRate, currentVolatility, leg.type);
            return acc + (leg.action === 'BUY' ? price : -price);
        }, 0);
        
        const profitLoss = (initialPortfolioValue + currentPortfolioValue) / costBasis * 100;
        let alert: Alert | null = null;
        if (!targetHit && profitLoss >= targetProfit) {
            alert = { day, type: 'profit', message: `Take-Profit target of ${targetProfit}% hit.` };
            targetHit = true;
        }
        if (!stopHit && profitLoss <= stopLoss) {
            alert = { day, type: 'loss', message: `Stop-Loss of ${stopLoss}% triggered.` };
            stopHit = true;
        }
        if (day === catalystDay) {
            alert = { day, type: 'info', message: `Catalyst Event Occurred. IV crushed from ${initialVolatility * 100}% to ${postCatalystVolatility * 100}%.`};
        }

        results.push({
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            ohlcv,
            alert,
        });
    }

    // Performance Metrics Calculation
    const returns = results.map(r => r.profitLoss / 100);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(r => Math.pow(r - meanReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (meanReturn * 30 - riskFreeRate) / (stdDev * Math.sqrt(30)) : 0;
    
    const cov = stockReturns.reduce((sum, sr, i) => sum + (sr - (stockReturns.reduce((a,b)=>a+b,0)/stockReturns.length)) * (marketReturns[i] - (marketReturns.reduce((a,b)=>a+b,0)/marketReturns.length)), 0) / stockReturns.length;
    const marketVar = marketReturns.reduce((sum, mr) => sum + Math.pow(mr - (marketReturns.reduce((a,b)=>a+b,0)/marketReturns.length), 2), 0) / marketReturns.length;
    const beta = marketVar > 0 ? cov / marketVar : 1;
    
    const finalReturn = results[results.length - 1].profitLoss / 100;
    const finalMarketReturn = (currentMarketPrice - 1000) / 1000;
    const alpha = finalReturn - (riskFreeRate + beta * (finalMarketReturn - riskFreeRate));

    return {
        results,
        metrics: {
            alpha: parseFloat((alpha * 100).toFixed(2)),
            beta: parseFloat(beta.toFixed(2)),
            sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        }
    };
}