import React, { useEffect, useState } from 'react';
import { scanForCalendarSpreadOpportunities } from '../services/finGptService';
import type { Opportunity } from '../types';
// FIX: Import `XCircleIcon` to resolve reference error.
import { XMarkIcon, LoadingSpinner, RadarIcon, XCircleIcon } from './icons';

interface OpportunityScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (ticker: string) => void;
}

export const OpportunityScanner: React.FC<OpportunityScannerProps> = ({ isOpen, onClose, onSelectCompany }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchOpportunities = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        try {
          const opportunities = await scanForCalendarSpreadOpportunities();
          if (opportunities.length === 0) {
            setError("The AI agent could not find any high-probability opportunities at this time.");
          } else {
            setResults(opportunities);
          }
        } catch (err) {
          setError("An error occurred while scanning. Please try again.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOpportunities();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <RadarIcon className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Market Opportunity Scanner</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LoadingSpinner />
              <p className="mt-3 text-lg font-semibold text-white">Scanning Markets...</p>
              <p className="text-gray-400">Agent is analyzing term structures and upcoming catalysts.</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <XCircleIcon />
              <p className="mt-3 text-lg font-semibold text-red-400">Scan Failed</p>
              <p className="text-gray-400">{error}</p>
            </div>
          )}
          {!isLoading && !error && results.length > 0 && (
            <div className="space-y-4">
              {results.map((opp) => (
                <div key={opp.ticker} className="bg-gray-900/50 border border-gray-700/80 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{opp.name} ({opp.ticker})</h3>
                      <p className="text-xs text-cyan-400 font-semibold">Catalyst Date: {opp.catalystDate}</p>
                    </div>
                    <button
                      onClick={() => onSelectCompany(opp.ticker)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1.5 px-4 rounded-md text-sm transition-colors"
                    >
                      Analyze
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-300 border-l-2 border-gray-600 pl-3">{opp.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};