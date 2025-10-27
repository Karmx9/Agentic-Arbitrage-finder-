
import React from 'react';
import type { PaperTrade } from '../types';

interface TradeBlotterProps {
  trades: PaperTrade[];
  onClose: (tradeId: string, closingPrice: number) => void;
}

export const TradeBlotter: React.FC<TradeBlotterProps> = ({ trades, onClose }) => {
  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  const renderRow = (trade: PaperTrade) => {
    const pnlColor = trade.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400';
    const statusColor = trade.status === 'OPEN' ? 'text-yellow-400' : 'text-gray-400';
    return (
      <tr key={trade.id} className="hover:bg-gray-700/30">
        <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-white sm:pl-3">
          {trade.strategy.ticker}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-300">{trade.strategy.strategyName}</td>
        <td className={`whitespace-nowrap px-3 py-3 text-sm font-semibold ${statusColor}`}>{trade.status}</td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-300 font-mono">${trade.entryPrice.toFixed(2)}</td>
        <td className={`whitespace-nowrap px-3 py-3 text-sm font-mono font-semibold ${pnlColor}`}>
            {trade.unrealizedPnl >= 0 ? '+' : '-'}${Math.abs(trade.unrealizedPnl).toFixed(2)}
        </td>
         <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-400">
          {new Date(trade.executedAt).toLocaleString()}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 animate-fade-in">
       {trades.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg text-white">Your Trade Blotter is empty.</h3>
              <p className="text-gray-400 mt-2">Execute a paper trade from the analysis tab to monitor its live performance here.</p>
            </div>
          ) : (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">Open Positions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                             <thead className="bg-gray-800/50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-3">Ticker</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Strategy</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Status</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Entry Price</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Unrealized P/L</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Executed At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {openTrades.length > 0 ? openTrades.map(renderRow) : (
                                    <tr><td colSpan={6} className="text-center py-4 text-gray-500">No open positions.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-bold text-white mb-2">Closed Positions</h3>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                             <thead className="bg-gray-800/50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-3">Ticker</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Strategy</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Status</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Entry Price</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Realized P/L</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Executed At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {closedTrades.length > 0 ? closedTrades.map(renderRow) : (
                                     <tr><td colSpan={6} className="text-center py-4 text-gray-500">No closed positions.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}
    </div>
  );
};
