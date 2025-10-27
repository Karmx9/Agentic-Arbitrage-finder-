

import type { ReactNode } from 'react';

export interface Company {
  ticker: string;
  name: string;
  domain: string;
  pipeline: string;
  marketCap: string;
  sector: 'Biotechnology' | 'Technology';
}

export interface Option {
  strike: number;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  iv: number;
  volume: number;
}

export interface OptionsChain {
  calls: Option[];
  puts: Option[];
}

export interface MockData {
  stockPrice: number;
  catalystDate: string;
  optionsChain: OptionsChain;
}

export interface Citation {
    startIndex: number;
    endIndex: number;
    uri: string;
    title: string;
    license: string;
    publicationDate: any;
}

export interface AnalysisStep {
  id: string;
  title: string;
  content: string | ReactNode;
  status: 'pending' | 'running' | 'complete' | 'error';
  citations?: any[];
}

export interface StrategyLeg {
    action: 'BUY' | 'SELL';
    type: 'CALL' | 'PUT';
    strike: number;
    expiry: string;
}

export interface ProposedStrategy {
    strategyName: string;
    strategyType?: string;
    ticker: string;
    analysis: string;
    rationale: {
        keyPoints: string[];
        riskConsiderations: string[];
    };
    greeks: {
        delta: number;
        theta: number;
        vega: number;
    };
    tradeDetails: {
        legs: StrategyLeg[];
        entryPrice: string;
        targetProfit: string;
        stopLoss: string;
        positionSize: string;
        maxRisk: string;
    }
}

export interface OHLCV {
    day: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Alert {
    day: number;
    type: 'profit' | 'loss' | 'info';
    message: string;
}

export interface PerformanceMetrics {
    alpha: number;
    beta: number;
    sharpeRatio: number;
}

export interface BacktestResult {
    profitLoss: number;
    ohlcv: OHLCV;
    alert: Alert | null;
}

export interface FullBacktest {
    results: BacktestResult[];
    metrics: PerformanceMetrics;
}


export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 data URL
}

export interface AlphaCaptureEntry {
    id: string;
    capturedAt: string;
    strategy: ProposedStrategy;
    conviction: 'High' | 'Medium' | 'Low';
    notes: string;
}

export interface PaperTrade {
    id: string;
    executedAt: string;
    strategy: ProposedStrategy;
    status: 'OPEN' | 'CLOSED';
    entryPrice: number;
    entryValue: number;
    currentValue: number;
    unrealizedPnl: number;
    targetPnl: number;
    stopPnl: number;
}

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'error';
    message: string;
}

export interface Opportunity {
  ticker: string;
  name: string;
  rationale: string;
  catalystDate: string;
}