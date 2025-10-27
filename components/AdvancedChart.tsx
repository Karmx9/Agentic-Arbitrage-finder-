
import React, { useEffect } from 'react';
import { Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, Scatter } from 'recharts';
import type { BacktestResult, OHLCV, FullBacktest, Alert } from '../types';
import { LoadingSpinner } from './icons';

// FIX: Replaced unreliable data URI audio with the robust Web Audio API.
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

const playSound = (type: Alert['type']) => {
    try {
        const context = getAudioContext();
        if (!context) return;

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);

        switch (type) {
            case 'profit':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
                break;
            case 'loss':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(220, context.currentTime); // A3
                break;
            case 'info':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
                break;
        }

        oscillator.start(context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
        oscillator.stop(context.currentTime + 0.2);
    } catch (e) {
        console.error("Error playing sound with Web Audio API:", e);
    }
};


const Candlestick = (props: any) => {
  // FIX: Add defensive check to prevent crash if yAxis or its scale function is not ready
  if (!props.yAxis || typeof props.yAxis.scale !== 'function' || !props.payload?.ohlcv) {
      return null;
  }
  
  const { low, high, open, close } = props.payload.ohlcv;

  if ([low, high, open, close].some(v => typeof v !== 'number')) {
      return null;
  }
  
  const isBullish = close > open;
  const color = isBullish ? '#22C55E' : '#EF4444';
  const Y = props.yAxis.scale;
  
  return (
    <g stroke={color} fill="none" strokeWidth="1">
      <path d={`M ${props.x + props.width / 2},${Y(high)} L ${props.x + props.width / 2},${Y(low)}`} />
      <rect x={props.x} y={Y(isBullish ? close : open)} width={props.width} height={Math.max(1, Math.abs(Y(open) - Y(close)))} fill={color} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { ohlcv, profitLoss, alert } = data;

    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg text-sm">
        <p className="label text-gray-300 font-bold mb-2">{`Day ${label}`}</p>
        <p className={`font-semibold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{`Strategy P/L: ${profitLoss.toFixed(2)}%`}</p>
        {alert && <p className={`mt-1 text-xs font-bold ${alert.type === 'profit' ? 'text-green-400' : alert.type === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}>ALERT: {alert.message}</p>}
        <div className="mt-2 text-gray-400">
            <p>O: <span className="font-mono text-white">{ohlcv.open.toFixed(2)}</span> H: <span className="font-mono text-white">{ohlcv.high.toFixed(2)}</span></p>
            <p>L: <span className="font-mono text-white">{ohlcv.low.toFixed(2)}</span> C: <span className="font-mono text-white">{ohlcv.close.toFixed(2)}</span></p>
            <p>Vol: <span className="font-mono text-white">{(ohlcv.volume / 1_000_000).toFixed(2)}M</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export const AdvancedChart: React.FC<{ title: string; backtestData: FullBacktest | null, isLoading: boolean }> = ({ title, backtestData, isLoading }) => {
  
  useEffect(() => {
    if (backtestData) {
        backtestData.results.forEach(result => {
            if (result.alert) {
                playSound(result.alert.type);
            }
        });
    }
  }, [backtestData]);

  if (isLoading) {
    return (
         <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <div className="h-96 flex items-center justify-center bg-gray-900/50 rounded-md">
                <div className='text-center'>
                    <LoadingSpinner/>
                    <p className="mt-2 text-gray-400">Simulating 30-day market conditions...</p>
                </div>
            </div>
        </div>
    );
  }

  if (!backtestData) return null;
  
  const { results: backtestResult, metrics } = backtestData;

  const chartData = backtestResult;
  const alertData = backtestResult.filter(r => r.alert).map(r => ({ ...r, alertPL: r.profitLoss }));

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-fade-in">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="h-96 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="ohlcv.day" stroke="#A0AEC0" tick={{ fill: '#A0AEC0' }} label={{ value: 'Days', position: 'insideBottom', offset: -10, fill: '#A0AEC0' }} />
            <YAxis yAxisId="left" stroke="#A0AEC0" tick={{ fill: '#A0AEC0' }} tickFormatter={(value) => `$${value}`} domain={['dataMin - 5', 'dataMax + 5']} hide />
            <YAxis yAxisId="right" orientation="right" stroke="#A0AEC0" tick={{ fill: '#A0AEC0' }} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#A0AEC0', paddingTop: '20px' }} />
            
            <Bar yAxisId="left" dataKey="ohlcv.close" shape={<Candlestick />} name="Price" />

            <Line yAxisId="right" type="monotone" dataKey="profitLoss" name="Strategy P/L" stroke="#2DD4BF" strokeWidth={2} dot={false} />
            <ReferenceLine x={20} stroke="#ca8a04" strokeDasharray="3 3" yAxisId="left">
                <Legend payload={[{ value: 'Catalyst Event', type: 'line', color: '#ca8a04' }]} />
            </ReferenceLine>

             <Scatter yAxisId="right" dataKey="alertPL" name="Alerts" fill="red">
                {alertData.map((entry, index) => {
                    const color = entry.alert.type === 'profit' ? '#22C55E' : entry.alert.type === 'loss' ? '#EF4444' : '#FBBF24';
                    return <Cell key={`cell-${index}`} fill={color} />;
                })}
            </Scatter>

          </ComposedChart>
        </ResponsiveContainer>
      </div>
       <div className="mt-4 p-4 bg-gray-900/50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
                <p className="text-sm text-gray-400">Final P/L</p>
                <p className={`text-2xl font-bold ${backtestResult[backtestResult.length-1].profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{backtestResult[backtestResult.length-1].profitLoss.toFixed(2)}%</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-white">{metrics.sharpeRatio.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Alpha</p>
                <p className={`text-2xl font-bold ${metrics.alpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>{metrics.alpha.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-400">Beta</p>
                <p className="text-2xl font-bold text-white">{metrics.beta.toFixed(2)}</p>
            </div>
        </div>
    </div>
  );
};
