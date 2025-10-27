

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AppAction, AppState } from '../App';
import { companies } from '../services/mockDataService';
import { VaultIcon, RadarIcon, LoadingSpinner } from './icons';
import type { Company } from '../types';
import { searchCompanies } from '../services/finGptService';

interface ControlPanelProps {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    onOpenLog: () => void;
    onOpenScanner: () => void;
    onPriceUpdate: (ticker: string, price: number) => void;
}

const Logo: React.FC<{ domain: string, name: string }> = ({ domain, name }) => {
    const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}`);
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f2937&color=9ca3af&bold=true`;

    return (
        <img 
            src={src} 
            onError={() => setSrc(fallback)} 
            alt={`${name} logo`} 
            className="h-10 w-10 rounded-md mr-3 bg-gray-700"
        />
    );
};

const LiveDataFeed: React.FC<{ ticker: string, onPriceUpdate: (price: number) => void }> = ({ ticker, onPriceUpdate }) => {
    const [price, setPrice] = useState(100 + Math.random() * 20);
    const initialPriceRef = useRef(price);

    useEffect(() => {
        const newPrice = 100 + Math.random() * 20;
        setPrice(newPrice);
        initialPriceRef.current = newPrice;
        
        const intervalId = setInterval(() => {
            setPrice(prevPrice => {
                const change = prevPrice * (Math.random() - 0.5) * 0.005;
                const newPrice = Math.max(0.01, prevPrice + change);
                onPriceUpdate(newPrice);
                return newPrice;
            });
        }, 2000);
        return () => clearInterval(intervalId);
    }, [ticker, onPriceUpdate]);
    
    const change = price - initialPriceRef.current;
    const percentageChange = (change / initialPriceRef.current) * 100;
    const changeColor = change >= 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div>
            <div className="text-2xl font-bold text-white tracking-wider">
                ${price.toFixed(2)}
            </div>
            <div className={`text-sm font-semibold ${changeColor}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percentageChange.toFixed(2)}%)
            </div>
        </div>
    );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, dispatch, onOpenLog, onOpenScanner, onPriceUpdate }) => {
    const { selectedCompany, agentMode, initialCapital, isRunning } = state;
    
    const handlePriceUpdate = useCallback((price: number) => {
        onPriceUpdate(selectedCompany.ticker, price);
    }, [selectedCompany.ticker, onPriceUpdate]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Omit<Company, 'marketCap'>[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setSearchQuery(`${selectedCompany.name} (${selectedCompany.ticker})`);
    }, [selectedCompany]);

    useEffect(() => {
        const isTyping = searchQuery !== `${selectedCompany.name} (${selectedCompany.ticker})`;
        if (!isTyping) {
            setSearchResults([]);
            return;
        }

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (searchQuery.trim().length > 1) {
            setIsSearching(true);
            setIsSearchOpen(true);
            debounceTimeoutRef.current = window.setTimeout(async () => {
                const results = await searchCompanies(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            }, 500); // 500ms debounce
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchQuery, selectedCompany.name, selectedCompany.ticker]);

    const handleSelectCompany = (company: Omit<Company, 'marketCap'>) => {
        const knownCompany = companies.find(c => c.ticker === company.ticker);
        const companyToSet: Company = knownCompany ? knownCompany : { ...company, marketCap: 'N/A' };
        
        dispatch({ type: 'SET_COMPANY', payload: companyToSet });
        setIsSearchOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
                setSearchQuery(`${selectedCompany.name} (${selectedCompany.ticker})`);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCompany]);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 sticky top-24">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-white">Agent Controls</h2>
                <div className="text-xs font-medium text-gray-400 flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>Live Feed</span>
                </div>
            </div>

            <div className="space-y-5">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                        <Logo domain={selectedCompany.domain} name={selectedCompany.name} />
                        <div>
                             <p className="font-bold text-white">{selectedCompany.name} ({selectedCompany.ticker})</p>
                             <LiveDataFeed ticker={selectedCompany.ticker} onPriceUpdate={handlePriceUpdate} />
                        </div>
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">Agent Persona</label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-gray-900 rounded-lg">
                        <button onClick={() => dispatch({ type: 'SET_AGENT_MODE', payload: 'dalio' })} disabled={isRunning} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${agentMode === 'dalio' ? 'bg-cyan-500 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}>Ray Dalio</button>
                        <button onClick={() => dispatch({ type: 'SET_AGENT_MODE', payload: 'quant' })} disabled={isRunning} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${agentMode === 'quant' ? 'bg-cyan-500 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}>Quant Desk</button>
                    </div>
                </div>

                <div>
                    <label htmlFor="capital" className="block text-sm font-medium text-gray-400 mb-1">Initial Capital</label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                        <input
                            type="text"
                            id="capital"
                            value={initialCapital.toLocaleString()}
                            onChange={(e) => {
                                const value = parseInt(e.target.value.replace(/[$,]/g, ''), 10);
                                dispatch({ type: 'SET_CAPITAL', payload: isNaN(value) ? 0 : value });
                            }}
                            disabled={isRunning}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-7 pr-3 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="company-search" className="block text-sm font-medium text-gray-400 mb-1">Target Company</label>
                    <div className="relative" ref={searchRef}>
                        <input
                            id="company-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            disabled={isRunning}
                            autoComplete="off"
                            placeholder="Search ticker or name..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                        {isSearchOpen && (
                            <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {isSearching ? (
                                    <div className="flex items-center justify-center p-4 text-gray-400 space-x-2">
                                        <LoadingSpinner />
                                        <span>Searching...</span>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <ul className="py-1">
                                        {searchResults.map(c => (
                                            <li
                                                key={c.ticker}
                                                onClick={() => handleSelectCompany(c)}
                                                className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-white cursor-pointer"
                                            >
                                                <img 
                                                    src={`https://logo.clearbit.com/${c.domain}`} 
                                                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1f2937&color=9ca3af&bold=true` }}
                                                    alt={`${c.name} logo`}
                                                    className="h-6 w-6 rounded-md mr-3 bg-gray-700"
                                                />
                                                <div>
                                                    <span className="font-bold text-white">{c.ticker}</span>
                                                    <span className="text-gray-400 ml-2">{c.name}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    searchQuery !== `${selectedCompany.name} (${selectedCompany.ticker})` && <div className="px-4 py-3 text-sm text-gray-500">No results found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                   <span className='font-bold text-gray-400'>R&D:</span> {selectedCompany.pipeline}.<br/>
                   <span className='font-bold text-gray-400'>Mkt Cap:</span> {selectedCompany.marketCap}.
                </p>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => dispatch({ type: 'RUN_ANALYSIS' })}
                        disabled={isRunning}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center text-base shadow-lg hover:shadow-cyan-500/30 disabled:shadow-none"
                    >
                        {isRunning ? 'Agent is Thinking...' : 'Engage Agent'}
                    </button>
                    <button
                        onClick={onOpenScanner}
                        disabled={isRunning}
                        className="p-3 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Scan for opportunities"
                    >
                        <RadarIcon className="h-6 w-6" />
                    </button>
                     <button
                        onClick={onOpenLog}
                        className="p-3 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white rounded-md transition-colors"
                        aria-label="Open Alpha Capture Log"
                    >
                        <VaultIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};