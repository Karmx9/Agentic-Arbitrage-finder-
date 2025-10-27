
import React from 'react';
import type { ProposedStrategy } from '../types';

interface StrategyComparisonTableProps {
  strategies: ProposedStrategy[];
  selectedStrategy: ProposedStrategy;
  onSelect: (strategy: ProposedStrategy) => void;
}

export const StrategyComparisonTable: React.FC<StrategyComparisonTableProps> = ({ strategies, selectedStrategy, onSelect }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-3">Strategy Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Type</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Max Risk</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-3">
              <span className="sr-only">Select</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {strategies.map((strategy) => (
            <tr key={strategy.strategyName} className={`transition-colors ${selectedStrategy.strategyName === strategy.strategyName ? 'bg-cyan-500/10' : 'hover:bg-gray-700/30'}`}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-3">{strategy.strategyName}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                <span className="text-xs bg-gray-700 text-cyan-300 font-semibold px-2 py-1 rounded-full h-fit">{strategy.strategyType}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-mono">{strategy.tradeDetails.maxRisk.split(' ')[0]}</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                <button 
                    onClick={() => onSelect(strategy)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${selectedStrategy.strategyName === strategy.strategyName ? 'bg-cyan-500 text-white' : 'bg-gray-600 hover:bg-cyan-600 text-gray-200'}`}
                >
                  {selectedStrategy.strategyName === strategy.strategyName ? 'Selected' : 'Select'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
