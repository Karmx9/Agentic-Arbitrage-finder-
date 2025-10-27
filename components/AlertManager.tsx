
import React, { useEffect } from 'react';
import type { Notification } from '../types';
import { XCircleIcon, CheckCircleIcon } from './icons';

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-cyan-400">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
);


const alertConfig = {
    success: { icon: <CheckCircleIcon />, color: 'text-green-300', base: 'border-green-500/50 bg-green-500/10' },
    error: { icon: <XCircleIcon />, color: 'text-red-300', base: 'border-red-500/50 bg-red-500/10' },
    info: { icon: <InfoIcon />, color: 'text-cyan-300', base: 'border-cyan-500/50 bg-cyan-500/10' },
};

let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return null;
        }
    }
    return audioCtx;
};

const playSound = (type: Notification['type']) => {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);

    oscillator.type = type === 'success' ? 'sine' : type === 'error' ? 'square' : 'triangle';
    oscillator.frequency.setValueAtTime(type === 'success' ? 880 : type === 'error' ? 220 : 440, context.currentTime);
    
    oscillator.start(context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
    oscillator.stop(context.currentTime + 0.5);
};


export const AlertManager: React.FC<{ notifications: Notification[], setNotifications: React.Dispatch<React.SetStateAction<Notification[]>> }> = ({ notifications, setNotifications }) => {
    
    useEffect(() => {
        if (notifications.length > 0) {
            const lastNotification = notifications[notifications.length - 1];
            playSound(lastNotification.type);
            const timer = setTimeout(() => {
                setNotifications(prev => prev.slice(1));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notifications, setNotifications]);

    return (
        <div className="fixed top-20 right-5 z-50 space-y-3 w-full max-w-sm">
            {notifications.map(notif => {
                const config = alertConfig[notif.type];
                return (
                    <div key={notif.id} className={`relative flex items-center p-3 rounded-lg border text-sm shadow-lg animate-slide-in-right ${config.base}`}>
                        <div className="flex-shrink-0 mr-3">{config.icon}</div>
                        <p className={`font-semibold ${config.color}`}>{notif.message}</p>
                    </div>
                );
            })}
             <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
