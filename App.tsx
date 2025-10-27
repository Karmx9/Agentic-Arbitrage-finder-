

import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { AgentWorkspace } from './components/AgentWorkspace';
import { Chatbot } from './components/Chatbot';
import { ControlPanel } from './components/ControlPanel';
import { AlphaCaptureLog } from './components/StrategyVault';
import { SaveStrategyModal } from './components/SaveStrategyModal';
import type { Company, ProposedStrategy, AlphaCaptureEntry, PaperTrade, Notification, Opportunity } from './types';
import { companies } from './services/mockDataService';
import { calculatePositionValue } from './services/portfolioService';
import { AlertManager } from './components/AlertManager';
import { OpportunityScanner } from './components/OpportunityScanner';

export interface AppState {
    isRunning: boolean;
    selectedCompany: Company;
    agentMode: 'dalio' | 'quant';
    initialCapital: number;
    triggerAnalysis: number;
    strategyToLoad: AlphaCaptureEntry | null;
}

export type AppAction =
  | { type: 'SET_COMPANY'; payload: Company }
  | { type: 'SET_AGENT_MODE'; payload: 'dalio' | 'quant' }
  | { type: 'SET_CAPITAL'; payload: number }
  | { type: 'RUN_ANALYSIS' }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'LOAD_STRATEGY'; payload: AlphaCaptureEntry | null };


const initialState: AppState = {
    isRunning: false,
    selectedCompany: companies[0],
    agentMode: 'dalio',
    initialCapital: 100000,
    triggerAnalysis: 0,
    strategyToLoad: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_COMPANY':
            return { ...state, selectedCompany: action.payload, strategyToLoad: null };
        case 'SET_AGENT_MODE':
            return { ...state, agentMode: action.payload, strategyToLoad: null };
        case 'SET_CAPITAL':
            return { ...state, initialCapital: action.payload };
        case 'RUN_ANALYSIS':
            return { ...state, isRunning: true, triggerAnalysis: state.triggerAnalysis + 1, strategyToLoad: null };
        case 'SET_RUNNING':
            return { ...state, isRunning: action.payload };
        case 'LOAD_STRATEGY':
            return { ...state, strategyToLoad: action.payload, selectedCompany: companies.find(c => c.ticker === action.payload?.strategy.ticker) || state.selectedCompany };
        default:
            return state;
    }
}

const GlobalLoadingBar: React.FC<{ isLoading: boolean }> = React.memo(({ isLoading }) => (
    <div className={`fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-cyan-500/20"></div>
        <div className="absolute inset-0 bg-cyan-500 animate-loading-bar"></div>
        <style>{`
            @keyframes loading-bar {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
            }
            .animate-loading-bar {
                animation: loading-bar 1.5s infinite ease-in-out;
            }
        `}</style>
    </div>
));


function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [alphaLog, setAlphaLog] = useState<AlphaCaptureEntry[]>([]);
  const [isLogOpen, setLogOpen] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [strategyToSave, setStrategyToSave] = useState<ProposedStrategy | null>(null);
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load saved data from localStorage
  useEffect(() => {
    try {
        const storedAlphas = localStorage.getItem('alphaCaptureLog');
        if (storedAlphas) setAlphaLog(JSON.parse(storedAlphas));
        const storedTrades = localStorage.getItem('paperTrades');
        if (storedTrades) setPaperTrades(JSON.parse(storedTrades));
    } catch (error) {
        console.error("Failed to load data from local storage:", error);
    }
  }, []);

  const handleCaptureAlpha = useCallback((alpha: Omit<AlphaCaptureEntry, 'id' | 'capturedAt'>) => {
    setAlphaLog(prev => {
        const newAlpha: AlphaCaptureEntry = { ...alpha, id: Date.now().toString(), capturedAt: new Date().toISOString() };
        const updatedAlphas = [newAlpha, ...prev];
        try {
            localStorage.setItem('alphaCaptureLog', JSON.stringify(updatedAlphas));
        } catch (error) { console.error("Failed to save alphas:", error); }
        return updatedAlphas;
    });
    setStrategyToSave(null);
  }, []);
  
  const handleDeleteAlpha = useCallback((alphaId: string) => {
    setAlphaLog(prev => {
        const updatedAlphas = prev.filter(s => s.id !== alphaId);
        try {
            localStorage.setItem('alphaCaptureLog', JSON.stringify(updatedAlphas));
        } catch (error) { console.error("Failed to update alphas:", error); }
        return updatedAlphas;
    });
  }, []);

  const handleLoadAlpha = useCallback((alpha: AlphaCaptureEntry) => {
    dispatch({ type: 'LOAD_STRATEGY', payload: alpha });
    setLogOpen(false);
  }, []);

  const getNumberFromCurrency = (str: string): number => parseFloat(str.replace(/[^0-9.-]+/g,""));
  
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    setNotifications(prev => [...prev, { ...notification, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const handleExecuteTrade = useCallback((strategy: ProposedStrategy, currentPrice: number) => {
      const entryValue = calculatePositionValue(strategy.tradeDetails.legs, currentPrice, 1.5, 30);
      const newTrade: PaperTrade = {
          id: Date.now().toString(),
          executedAt: new Date().toISOString(),
          strategy,
          status: 'OPEN',
          entryPrice: currentPrice,
          entryValue,
          currentValue: entryValue,
          unrealizedPnl: 0,
          targetPnl: getNumberFromCurrency(strategy.tradeDetails.targetProfit) / 100 * Math.abs(entryValue),
          stopPnl: -getNumberFromCurrency(strategy.tradeDetails.stopLoss) / 100 * Math.abs(entryValue),
      };
      setPaperTrades(prev => {
          const updatedTrades = [newTrade, ...prev];
          localStorage.setItem('paperTrades', JSON.stringify(updatedTrades));
          return updatedTrades;
      });
      addNotification({ type: 'info', message: `Executed paper trade for ${strategy.ticker}` });
  }, [addNotification]);

  const handleCloseTrade = useCallback((tradeId: string, closingPrice: number) => {
      setPaperTrades(prev => {
          const updated = prev.map((t): PaperTrade => {
              if (t.id === tradeId) {
                  const closingValue = calculatePositionValue(t.strategy.tradeDetails.legs, closingPrice, 0.4, 10);
                  return { ...t, status: 'CLOSED', unrealizedPnl: closingValue - t.entryValue };
              }
              return t;
          });
          localStorage.setItem('paperTrades', JSON.stringify(updated));
          return updated;
      });
  }, []);
  
  const handlePriceUpdate = useCallback((ticker: string, newPrice: number) => {
      setPaperTrades(prevTrades => {
          let hasChanged = false;
          const notificationsToAdd: Omit<Notification, 'id'>[] = [];
          
          const updatedTrades = prevTrades.map((trade): PaperTrade => {
              if (trade.strategy.ticker === ticker && trade.status === 'OPEN') {
                  const newValue = calculatePositionValue(trade.strategy.tradeDetails.legs, newPrice, 1.0, 15);
                  const newPnl = newValue - trade.entryValue;
                  const pnlString = `${newPnl < 0 ? '-' : ''}$${Math.abs(newPnl).toFixed(2)}`;

                  // Check for triggers
                  if (newPnl >= trade.targetPnl) {
                      notificationsToAdd.push({ type: 'success', message: `${ticker} Take-Profit hit at ${pnlString}` });
                      hasChanged = true;
                      return { ...trade, status: 'CLOSED', unrealizedPnl: newPnl, currentValue: newValue };
                  }
                  if (newPnl <= trade.stopPnl) {
                      notificationsToAdd.push({ type: 'error', message: `${ticker} Stop-Loss triggered at ${pnlString}` });
                      hasChanged = true;
                      return { ...trade, status: 'CLOSED', unrealizedPnl: newPnl, currentValue: newValue };
                  }

                  if (Math.abs(trade.unrealizedPnl - newPnl) > 0.001) {
                      hasChanged = true;
                      return { ...trade, unrealizedPnl: newPnl, currentValue: newValue };
                  }
              }
              return trade;
          });

          if(hasChanged) {
              if (notificationsToAdd.length > 0) {
                 setNotifications(prevNotifs => [
                    ...prevNotifs,
                    ...notificationsToAdd.map(n => ({ ...n, id: `${Date.now()}-${Math.random()}` }))
                 ]);
              }
              localStorage.setItem('paperTrades', JSON.stringify(updatedTrades));
              return updatedTrades;
          }
          return prevTrades;
      });
  }, []);

  const setRunning = useCallback((isRunning: boolean) => {
      dispatch({ type: 'SET_RUNNING', payload: isRunning });
  }, []);
  
  const handleSelectFromScanner = useCallback((ticker: string) => {
    const company = companies.find(c => c.ticker === ticker);
    if (company) {
        dispatch({ type: 'SET_COMPANY', payload: company });
    } else {
        console.warn(`Company with ticker ${ticker} not found in predefined list.`);
        addNotification({ type: 'error', message: `${ticker} is not in the terminal's predefined company list.` });
    }
    setScannerOpen(false);
  }, [addNotification]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 selection:bg-cyan-500/30 flex flex-col">
      <GlobalLoadingBar isLoading={state.isRunning} />
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Agentic Arbitrage Terminal</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
                <div className="lg:col-span-1">
                    <ControlPanel 
                        state={state} 
                        dispatch={dispatch} 
                        onOpenLog={() => setLogOpen(true)}
                        onOpenScanner={() => setScannerOpen(true)}
                        onPriceUpdate={handlePriceUpdate}
                    />
                </div>
                <div className="lg:col-span-3">
                    <AgentWorkspace 
                        appState={state}
                        setRunning={setRunning}
                        onInitiateSave={setStrategyToSave}
                        onExecuteTrade={handleExecuteTrade}
                        paperTrades={paperTrades}
                        onCloseTrade={handleCloseTrade}
                    />
                </div>
            </div>
        </div>
      </main>
      <Chatbot selectedCompany={state.selectedCompany} />
      <AlertManager notifications={notifications} setNotifications={setNotifications} />
      <AlphaCaptureLog 
        isOpen={isLogOpen} 
        onClose={() => setLogOpen(false)}
        alphas={alphaLog}
        onLoad={handleLoadAlpha}
        onDelete={handleDeleteAlpha}
      />
      <SaveStrategyModal
        isOpen={!!strategyToSave}
        onClose={() => setStrategyToSave(null)}
        strategy={strategyToSave}
        onSave={handleCaptureAlpha}
      />
      <OpportunityScanner
        isOpen={isScannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectCompany={handleSelectFromScanner}
      />
    </div>
  );
}

export default App;