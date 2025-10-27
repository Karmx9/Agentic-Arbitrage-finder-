
import React from 'react';
import type { Alert } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons'; // Assuming you have these

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
);


const alertConfig = {
    profit: {
        icon: <CheckCircleIcon />,
        color: 'text-green-300',
        bgColor: 'bg-green-500/10'
    },
    loss: {
        icon: <XCircleIcon />,
        color: 'text-red-300',
        bgColor: 'bg-red-500/10'
    },
    info: {
        icon: <InfoIcon />,
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-500/10'
    }
}

export const AlertsLog: React.FC<{alerts: (Alert | null)[]}> = ({ alerts }) => {
    const validAlerts = alerts.filter((a): a is Alert => a !== null);
    
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 h-full">
            <h3 className="text-base font-bold text-white mb-3">Execution Log</h3>
            <div className="space-y-3 h-full max-h-96 overflow-y-auto pr-2">
                {validAlerts.length === 0 && (
                    <div className="text-center text-sm text-gray-500 pt-8">
                        <p>No trade alerts triggered during simulation.</p>
                    </div>
                )}
                {validAlerts.map((alert, index) => {
                    const config = alertConfig[alert.type];
                    return (
                        <div key={index} className={`flex items-start space-x-3 p-2 rounded-md text-sm ${config.bgColor}`}>
                           <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                            <div>
                                <p className={`font-semibold ${config.color}`}>Day {alert.day}: {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}</p>
                                <p className="text-gray-400">{alert.message}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
