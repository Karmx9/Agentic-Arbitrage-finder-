
import React, { useState } from 'react';
import type { ProposedStrategy, AlphaCaptureEntry } from '../types';
import { XMarkIcon, SaveIcon } from './icons';

interface SaveStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: ProposedStrategy | null;
  onSave: (alpha: Omit<AlphaCaptureEntry, 'id' | 'capturedAt'>) => void;
}

type Conviction = 'High' | 'Medium' | 'Low';

const convictionLevels: Conviction[] = ['High', 'Medium', 'Low'];
const convictionConfig = {
    High: 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30',
    Low: 'bg-gray-500/20 text-gray-300 border-gray-500/50 hover:bg-gray-500/30',
};


export const SaveStrategyModal: React.FC<SaveStrategyModalProps> = ({ isOpen, onClose, strategy, onSave }) => {
  const [conviction, setConviction] = useState<Conviction>('Medium');
  const [notes, setNotes] = useState('');

  if (!isOpen || !strategy) return null;

  const handleSave = () => {
    onSave({ strategy, conviction, notes });
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
    >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Capture Alpha</h2>
            <p className="text-sm text-gray-400">Log "{strategy.strategyName}" to your records.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Conviction Level</label>
                <div className="flex space-x-2">
                    {convictionLevels.map(level => (
                        <button 
                            key={level}
                            onClick={() => setConviction(level)}
                            className={`flex-1 p-2 text-sm font-bold rounded-md border transition-all ${conviction === level ? convictionConfig[level] + ' ring-2 ring-cyan-400' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-400 mb-1">Analyst Notes</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="e.g., 'This looks promising due to the extreme skew. Vega is high, but the risk-defined structure caps potential losses...'"
                    className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
            </div>
        </div>
        <footer className="p-4 bg-gray-900/50 rounded-b-lg">
             <button 
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors"
            >
                <SaveIcon className="h-5 w-5" /> Confirm & Save to Log
            </button>
        </footer>
      </div>
    </div>
  );
};
