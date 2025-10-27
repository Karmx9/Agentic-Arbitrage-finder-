
import React from 'react';
import type { AnalysisStep } from '../types';
import { LoadingSpinner, CheckCircleIcon, XCircleIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface AnalysisCardProps {
    step: AnalysisStep;
    icon: React.ReactNode;
}

const statusIndicator = {
  pending: <div className="h-5 w-5 border-2 border-gray-600 rounded-full" />,
  running: <LoadingSpinner />,
  complete: <CheckCircleIcon />,
  error: <XCircleIcon />,
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ step, icon }) => {
  return (
    <div className="flex items-start space-x-4 animate-fade-in">
        <div className="flex flex-col items-center">
            <div className="bg-gray-700 p-3 rounded-full text-cyan-400">
                {icon}
            </div>
        </div>
        <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-5">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                {statusIndicator[step.status]}
            </div>
            {step.status !== 'pending' && (
                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                    {typeof step.content === 'string' ? (
                        <ReactMarkdown>{step.content}</ReactMarkdown>
                    ) : (
                        step.content
                    )}
                </div>
            )}
             {step.citations && step.citations.length > 0 && step.status === 'complete' && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
                    <div className="flex flex-wrap gap-2">
                        {step.citations.map((citation, index) => (
                            <a 
                                key={index} 
                                href={citation.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-cyan-300 px-2 py-1 rounded-full transition-colors truncate max-w-xs"
                                title={citation.web.title}
                            >
                                {citation.web.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};