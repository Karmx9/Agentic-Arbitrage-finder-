
import React from 'react';
import type { AlphaCaptureEntry } from '../types';
import { StrategyCard } from './StrategyCard';
import { XMarkIcon, TrashIcon, UploadIcon } from './icons';

interface AlphaCaptureLogProps {
  isOpen: boolean;
  onClose: () => void;
  alphas: AlphaCaptureEntry[];
  onLoad: (alpha: AlphaCaptureEntry) => void;
  onDelete: (alphaId: string) => void;
}

const convictionColors = {
    High: 'border-green-400 text-green-300',
    Medium: 'border-yellow-400 text-yellow-300',
    Low: 'border-gray-500 text-gray-400',
};

export const AlphaCaptureLog: React.FC<AlphaCaptureLogProps> = ({ isOpen, onClose, alphas, onLoad, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 animate-fade-in-fast"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
    >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Alpha Capture Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          {alphas.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg text-white">Your Alpha Log is empty.</h3>
              <p className="text-gray-400 mt-2">Engage the agent and capture an alpha to store it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alphas.map(alpha => (
                    <div key={alpha.id} className="bg-gray-900/50 rounded-lg border border-gray-700/80 p-1 flex flex-col">
                        <div className="p-3">
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">
                                    Captured: {new Date(alpha.capturedAt).toLocaleString()}
                                </p>
                                <span className={`text-xs font-bold px-2 py-0.5 border rounded-full ${convictionColors[alpha.conviction]}`}>{alpha.conviction}</span>
                            </div>
                            {alpha.notes && <p className="text-sm mt-2 p-2 bg-gray-800/50 rounded-md text-gray-300 border-l-2 border-cyan-500">"{alpha.notes}"</p>}
                        </div>
                        <div className="flex-1">
                            <StrategyCard strategy={alpha.strategy} />
                        </div>
                        <div className="flex items-center space-x-2 p-2 mt-auto">
                             <button 
                                onClick={() => onLoad(alpha)}
                                className="flex-1 flex items-center justify-center gap-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-3 rounded-md transition-colors"
                            >
                                <UploadIcon className="h-4 w-4" /> Load
                            </button>
                             <button 
                                onClick={() => onDelete(alpha.id)}
                                className="bg-red-600/80 hover:bg-red-700 text-white p-2 rounded-md transition-colors"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
