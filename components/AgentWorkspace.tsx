
import React, { useCallback, useMemo, useEffect, useReducer, useState } from 'react';
import type { AppState } from '../App';
import { getInitialAnalysis, getDalioStrategy, getQuantStrategies, getOptimizedStrategy } from '../services/finGptService';
import { getMockDataForCompany, runBacktest, companies } from '../services/mockDataService';
import type { AnalysisStep, ProposedStrategy, MockData, FullBacktest, AlphaCaptureEntry, PaperTrade } from '../types';
import { AnalysisCard } from './AnalysisCard';
import { AdvancedChart } from './AdvancedChart';
import { StrategyCard } from './StrategyCard';
import { DocumentChartBarIcon, SaveIcon } from './icons';
import { StrategyComparisonTable } from './StrategyComparisonTable';
import { AlertsLog } from './AlertsLog';
import { TradeBlotter } from './TradeBlotter';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.87.055l4.25 3.5a.75.75 0 010 1.206l-4.25 3.5a.75.75 0 01-1.22-.603V8.84a.75.75 0 01.35-.652z" clipRule="evenodd" />
    </svg>
);


const getInitialSteps = (mode: 'dalio' | 'quant'): AnalysisStep[] => mode === 'dalio' ? [
    { id: 'data_scrape', title: "Live Web Analysis (via Google Search)", content: "", status: 'pending' },
    { id: 'strategy', title: "Volatility Arbitrage Strategy", content: "", status: 'pending' },
] : [
    { id: 'quant_data_ingest', title: "Live Data Ingestion & Signal Processing", content: "", status: 'pending' },
    { id: 'quant_strategies', title: "Multi-Strategy Arbitrage Formulation", content: "", status: 'pending' },
];

interface AgentState {
    analysisSteps: AnalysisStep[];
    proposedStrategies: ProposedStrategy[];
    strategyForBacktest: ProposedStrategy | null;
    mockData: MockData | null;
    backtestResult: FullBacktest | null;
    optimizedStrategy: ProposedStrategy | null;
    optimizedBacktestResult: FullBacktest | null;
}

type AgentAction =
  | { type: 'SET_STEP_STATUS'; payload: { id: string; status: AnalysisStep['status'] } }
  | { type: 'SET_STEP_CONTENT'; payload: { id: string; content: React.ReactNode; status: AnalysisStep['status']; citations?: any[] } }
  | { type: 'SET_STRATEGIES'; payload: { strategies: ProposedStrategy[] } }
  | { type: 'SET_BACKTEST_STRATEGY'; payload: { strategy: ProposedStrategy | null } }
  | { type: 'SET_OPTIMIZED_STRATEGY'; payload: { strategy: ProposedStrategy | null } }
  | { type: 'SET_MOCK_DATA'; payload: { data: MockData } }
  | { type: 'SET_BACKTEST_RESULT'; payload: { result: FullBacktest | null } }
  | { type: 'SET_OPTIMIZED_BACKTEST_RESULT'; payload: { result: FullBacktest | null } }
  | { type: 'RESET'; payload: { mode: 'dalio' | 'quant', loadedStrategy?: AlphaCaptureEntry } };

const createInitialState = (mode: 'dalio' | 'quant', loadedAlpha?: AlphaCaptureEntry): AgentState => {
    if (loadedAlpha) {
        const strategy = loadedAlpha.strategy;
        // FIX: The object passed to getMockDataForCompany was missing the 'sector' property.
        // Look up the full company details to ensure correct data generation.
        const company = companies.find(c => c.ticker === strategy.ticker);
        const companyForMockData = company || {
            name: strategy.ticker,
            ticker: strategy.ticker,
            domain: '',
            pipeline: '',
            marketCap: '',
            sector: 'Technology' // Default to Technology if not found
        };
        const mockData = getMockDataForCompany(companyForMockData);
        return {
            analysisSteps: [
                { id: 'loaded_strategy', title: `Loaded Alpha: ${strategy.strategyName}`, content: <StrategyCard strategy={strategy} />, status: 'complete' }
            ],
            proposedStrategies: [strategy],
            strategyForBacktest: strategy,
            mockData: mockData,
            backtestResult: runBacktest(strategy, mockData.stockPrice),
            optimizedStrategy: null,
            optimizedBacktestResult: null,
        }
    }
    
    return {
        analysisSteps: getInitialSteps(mode),
        proposedStrategies: [],
        strategyForBacktest: null,
        mockData: null,
        backtestResult: null,
        optimizedStrategy: null,
        optimizedBacktestResult: null,
    };
};

function agentReducer(state: AgentState, action: AgentAction): AgentState {
    switch (action.type) {
        case 'SET_STEP_STATUS':
            return { ...state, analysisSteps: state.analysisSteps.map(s => s.id === action.payload.id ? { ...s, status: action.payload.status } : s) };
        case 'SET_STEP_CONTENT':
            return { ...state, analysisSteps: state.analysisSteps.map(s => s.id === action.payload.id ? { ...s, status: action.payload.status, content: action.payload.content, citations: action.payload.citations ?? s.citations } : s) };
        case 'SET_STRATEGIES':
            return { ...state, proposedStrategies: action.payload.strategies, strategyForBacktest: action.payload.strategies[0] || null };
        case 'SET_BACKTEST_STRATEGY':
            return { ...state, strategyForBacktest: action.payload.strategy, backtestResult: null, optimizedStrategy: null, optimizedBacktestResult: null };
        case 'SET_OPTIMIZED_STRATEGY':
             return {
                ...state,
                optimizedStrategy: action.payload.strategy,
                analysisSteps: state.analysisSteps.some(s => s.id === 'optimization')
                    ? state.analysisSteps.map(s => s.id === 'optimization' ? { ...s, content: action.payload.strategy ? <StrategyCard strategy={action.payload.strategy} /> : 'Optimization failed.', status: action.payload.strategy ? 'complete' : 'error' } : s)
                    : [...state.analysisSteps, { id: 'optimization', title: "AI-Powered Strategy Optimization", content: action.payload.strategy ? <StrategyCard strategy={action.payload.strategy} /> : 'Optimization failed.', status: action.payload.strategy ? 'complete' : 'error' }],
            };
        case 'SET_MOCK_DATA':
            return { ...state, mockData: action.payload.data };
        case 'SET_BACKTEST_RESULT':
            return { ...state, backtestResult: action.payload.result };
        case 'SET_OPTIMIZED_BACKTEST_RESULT':
            return { ...state, optimizedBacktestResult: action.payload.result };
        case 'RESET':
            return createInitialState(action.payload.mode, action.payload.loadedStrategy);
        default:
            return state;
    }
}

interface AgentWorkspaceProps {
    appState: AppState;
    setRunning: (isRunning: boolean) => void;
    onInitiateSave: (strategy: ProposedStrategy) => void;
    onExecuteTrade: (strategy: ProposedStrategy, currentPrice: number) => void;
    paperTrades: PaperTrade[];
    onCloseTrade: (tradeId: string, closingPrice: number) => void;
}

const AgentWorkspaceComponent: React.FC<AgentWorkspaceProps> = ({ appState, setRunning, onInitiateSave, onExecuteTrade, paperTrades, onCloseTrade }) => {
    const { selectedCompany, agentMode, initialCapital, triggerAnalysis, isRunning, strategyToLoad } = appState;
    const [state, dispatch] = useReducer(agentReducer, createInitialState(agentMode, strategyToLoad));
    const [activeTab, setActiveTab] = useState<'analysis' | 'blotter'>('analysis');
    
    useEffect(() => {
        dispatch({ type: 'RESET', payload: { mode: agentMode, loadedStrategy: strategyToLoad } });
        setActiveTab('analysis');
    }, [agentMode, strategyToLoad]);

    const handleSelectStrategyForBacktest = useCallback((strategy: ProposedStrategy) => {
        dispatch({ type: 'SET_BACKTEST_STRATEGY', payload: { strategy: strategy } });
    }, []);

    const runAnalysis = useCallback(async () => {
        dispatch({ type: 'RESET', payload: { mode: agentMode } });
        
        const generatedMockData = getMockDataForCompany(selectedCompany);
        dispatch({ type: 'SET_MOCK_DATA', payload: { data: generatedMockData } });

        const analysisStepId = agentMode === 'dalio' ? 'data_scrape' : 'quant_data_ingest';
        dispatch({ type: 'SET_STEP_STATUS', payload: { id: analysisStepId, status: 'running' } });
        
        const { analysisText, citations } = await getInitialAnalysis(selectedCompany, agentMode);
        
        dispatch({ type: 'SET_STEP_CONTENT', payload: { id: analysisStepId, content: analysisText, status: analysisText.startsWith('Error') ? 'error' : 'complete', citations }});
        if (analysisText.startsWith('Error')) { setRunning(false); return; }

        const strategyStepId = agentMode === 'dalio' ? 'strategy' : 'quant_strategies';
        dispatch({ type: 'SET_STEP_STATUS', payload: { id: strategyStepId, status: 'running' } });

        let strategies: ProposedStrategy[] | null = null;
        if (agentMode === 'dalio') {
            const result = await getDalioStrategy(selectedCompany, generatedMockData, initialCapital);
            strategies = result ? [result] : null;
        } else {
            strategies = await getQuantStrategies(selectedCompany, generatedMockData, initialCapital);
        }

        if (strategies && strategies.length > 0) {
            dispatch({ type: 'SET_STRATEGIES', payload: { strategies } });
            
            const content = agentMode === 'dalio' ? <StrategyCard strategy={strategies[0]}/> : (
                <StrategyComparisonTable 
                    strategies={strategies} 
                    onSelect={handleSelectStrategyForBacktest}
                    selectedStrategy={strategies[0]}
                />
            );
            dispatch({ type: 'SET_STEP_CONTENT', payload: { id: strategyStepId, status: 'complete', content }});
            
            const initialBacktestResult = runBacktest(strategies[0], generatedMockData.stockPrice);
            dispatch({ type: 'SET_BACKTEST_RESULT', payload: { result: initialBacktestResult }});

        } else {
            dispatch({ type: 'SET_STEP_CONTENT', payload: { id: strategyStepId, status: 'error', content: 'Failed to generate a valid strategy.' }});
        }
        setRunning(false);
    }, [selectedCompany, agentMode, initialCapital, setRunning, handleSelectStrategyForBacktest]);
    
    useEffect(() => {
        if (triggerAnalysis > 0 && !strategyToLoad) {
            runAnalysis();
        }
    }, [triggerAnalysis, runAnalysis, strategyToLoad]);

    useEffect(() => {
        if (state.strategyForBacktest && state.mockData && !state.backtestResult) {
            const result = runBacktest(state.strategyForBacktest, state.mockData.stockPrice);
            dispatch({ type: 'SET_BACKTEST_RESULT', payload: { result } });
        }
    }, [state.strategyForBacktest, state.mockData, state.backtestResult]);

    const handleOptimize = useCallback(async () => {
        if (!state.strategyForBacktest || !state.backtestResult) return;
        setRunning(true);
        dispatch({ type: 'SET_OPTIMIZED_STRATEGY', payload: { strategy: null } });
        dispatch({ type: 'SET_OPTIMIZED_BACKTEST_RESULT', payload: { result: null } });
        
        const newOptimizedStrategy = await getOptimizedStrategy(state.strategyForBacktest, state.backtestResult, selectedCompany, initialCapital);
        dispatch({ type: 'SET_OPTIMIZED_STRATEGY', payload: { strategy: newOptimizedStrategy } });

        if (newOptimizedStrategy && state.mockData) {
            const optimizedResult = runBacktest(newOptimizedStrategy, state.mockData.stockPrice);
            dispatch({ type: 'SET_OPTIMIZED_BACKTEST_RESULT', payload: { result: optimizedResult } });
        }
        setRunning(false);
    }, [state.strategyForBacktest, state.backtestResult, state.mockData, selectedCompany, initialCapital, setRunning]);


    const memoizedAnalysisCards = useMemo(() => (
      state.analysisSteps.map(step => (
        <AnalysisCard key={step.id} step={step} icon={<DocumentChartBarIcon/>} />
      ))
    ), [state.analysisSteps]);

    const showBacktester = state.backtestResult || (isRunning && state.proposedStrategies.length > 0);
    const hasAnalysis = !(state.analysisSteps.every(s => s.status === 'pending') && !strategyToLoad);

    return (
        <div className="space-y-6">
            {!hasAnalysis && (
                <div className="text-center py-20 bg-gray-800/50 border border-dashed border-gray-700 rounded-lg">
                    <h2 className="text-xl font-bold text-white">Agent is standing by.</h2>
                    <p className="text-gray-400 mt-2">Configure controls and engage agent to begin analysis.</p>
                </div>
            )}
            
            {hasAnalysis && (
                 <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('analysis')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'analysis' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Analysis & Backtesting
                        </button>
                        <button onClick={() => setActiveTab('blotter')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'blotter' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Trade Blotter
                        </button>
                    </nav>
                </div>
            )}

            {activeTab === 'analysis' && hasAnalysis && (
                <div className="space-y-6">
                    {memoizedAnalysisCards}
                    
                    {state.strategyForBacktest && state.proposedStrategies.length > 1 && agentMode === 'quant' && (
                        <div className='mt-[-1.5rem]'>
                            <StrategyCard strategy={state.strategyForBacktest} />
                        </div>
                    )}

                    {state.strategyForBacktest && (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => onInitiateSave(state.strategyForBacktest!)}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-bold py-2 px-4 rounded-md transition-colors duration-200"
                            >
                                <SaveIcon className="h-5 w-5" /> Capture Alpha
                            </button>
                             <button 
                                onClick={() => onExecuteTrade(state.strategyForBacktest!, state.mockData?.stockPrice || 0)}
                                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                            >
                                <PlayIcon className="h-5 w-5" /> Execute Paper Trade
                            </button>
                        </div>
                    )}

                    {showBacktester && state.backtestResult && (
                        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
                            <div className='xl:col-span-2'>
                                <AdvancedChart 
                                    title="Initial Strategy Backtest"
                                    backtestData={state.backtestResult}
                                    isLoading={!state.backtestResult}
                                />
                            </div>
                            <div className='xl:col-span-1'>
                                <AlertsLog alerts={state.backtestResult.results.map(r => r.alert).filter(a => a !== null)} />
                            </div>
                        </div>
                    )}

                    {state.backtestResult && !state.optimizedStrategy && (
                        <button onClick={handleOptimize} disabled={isRunning} className="w-full text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-cyan-300 font-semibold transition-colors">
                            Optimize with AI
                        </button>
                    )}

                    {state.optimizedStrategy && state.optimizedBacktestResult && (
                        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
                             <div className='xl:col-span-2'>
                                 <AdvancedChart 
                                    title="Optimized Strategy Backtest"
                                    backtestData={state.optimizedBacktestResult}
                                    isLoading={!state.optimizedBacktestResult}
                                />
                            </div>
                             <div className='xl:col-span-1'>
                                <AlertsLog alerts={state.optimizedBacktestResult.results.map(r => r.alert).filter(a => a !== null)} />
                            </div>
                        </div>
                    )}
                </div>
            )}
             {activeTab === 'blotter' && (
                <TradeBlotter trades={paperTrades} onClose={onCloseTrade}/>
            )}
        </div>
    )
};

export const AgentWorkspace = React.memo(AgentWorkspaceComponent);