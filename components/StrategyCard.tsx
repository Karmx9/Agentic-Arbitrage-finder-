
import React from 'react';
import type { ProposedStrategy } from '../types';
import { TargetIcon, StopLossIcon, RiskIcon, PositionSizeIcon, DeltaIcon, ThetaIcon, VegaIcon } from './icons';

const PayoffDiagram: React.FC<{ strategy: ProposedStrategy }> = ({ strategy }) => {
    const width = 300;
    const height = 150;
    const padding = 20;

    const strikes = strategy.tradeDetails.legs.map(leg => leg.strike);
    const centerStrike = strikes.reduce((a, b) => a + b, 0) / strikes.length;
    const priceRange = Math.max(...strikes) - Math.min(...strikes) || centerStrike * 0.4;
    
    const minPrice = centerStrike - priceRange * 1.5;
    const maxPrice = centerStrike + priceRange * 1.5;

    const calculatePayoff = (price: number) => {
        return strategy.tradeDetails.legs.reduce((totalPayoff, leg) => {
            let legPayoff = 0;
            if (leg.type === 'CALL') {
                legPayoff = Math.max(0, price - leg.strike);
            } else { // PUT
                legPayoff = Math.max(0, leg.strike - price);
            }
            return totalPayoff + (leg.action === 'BUY' ? legPayoff : -legPayoff);
        }, 0);
    };
    
    const entryCost = strategy.tradeDetails.legs.reduce((cost, leg) => {
       // This is a rough estimation since we don't have option prices
       const estimatedPremium = Math.abs(centerStrike-leg.strike)*0.2 + 5;
       return cost + (leg.action === 'BUY' ? -estimatedPremium : estimatedPremium)
    }, 0)

    const points = [];
    for (let i = 0; i <= width; i++) {
        const price = minPrice + (maxPrice - minPrice) * (i / width);
        const payoff = calculatePayoff(price) + entryCost;
        points.push({ x: i, y: payoff });
    }

    const maxPayoff = Math.max(...points.map(p => p.y), 0.01);
    const minPayoff = Math.min(...points.map(p => p.y), -0.01);

    const scaleY = (y: number) => {
      const range = maxPayoff - minPayoff;
      if (range === 0) return height / 2;
      return height - padding - ((y - minPayoff) / range) * (height - 2 * padding);
    };

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${scaleY(p.y)}`).join(' ');

    const zeroLineY = scaleY(0);

    return (
        <div className="relative mt-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Axes */}
                <line x1="0" y1={zeroLineY} x2={width} y2={zeroLineY} stroke="#4A5568" strokeWidth="1" />
                
                {/* Dashed strike lines */}
                 {strikes.map(strike => {
                    const x = ((strike - minPrice) / (maxPrice - minPrice)) * width;
                    return <line key={strike} x1={x} y1="0" x2={x} y2={height} stroke="#4A5568" strokeWidth="0.5" strokeDasharray="2 2" />
                })}

                {/* Payoff line - below zero */}
                <path d={pathData} stroke="#F87171" strokeWidth="2" fill="none" />
                 {/* Payoff line - above zero */}
                <path d={pathData} stroke="#34D399" strokeWidth="2" fill="none" clipPath="url(#clip-above-zero)" />

                <defs>
                    <clipPath id="clip-above-zero">
                        <rect x="0" y="0" width={width} height={zeroLineY} />
                    </clipPath>
                </defs>
            </svg>
            <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>${minPrice.toFixed(2)}</span>
                <span className="font-semibold">Stock Price at Expiry</span>
                <span>${maxPrice.toFixed(2)}</span>
            </div>
        </div>
    );
};


export const StrategyCard: React.FC<{strategy: ProposedStrategy}> = ({ strategy }) => (
    <div className="bg-gray-900/30 rounded-lg border border-gray-700/50 p-4 text-sm transition-all duration-300 hover:border-gray-600 hover:shadow-cyan-500/10">
        <div className='flex justify-between items-start mb-3'>
            <div>
                <p className="font-bold text-cyan-400">{strategy.strategyName} on {strategy.ticker}</p>
                <p className="text-xs text-gray-400">Analysis complete. Strategy formulated.</p>
            </div>
            {strategy.strategyType && <span className="text-xs bg-gray-700 text-cyan-300 font-semibold px-2 py-1 rounded-full h-fit">{strategy.strategyType}</span>}
        </div>
        
        <p className="mb-3 pb-3 border-b border-gray-700/50 text-gray-300"><span className='font-semibold text-gray-200'>Analysis:</span> {strategy.analysis}</p>

        <div className='space-y-4 mb-4'>
            <div>
                <h4 className='font-semibold text-gray-300 text-base mb-2'>Key Rationale</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {strategy.rationale.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
            </div>
            <div>
                <h4 className='font-semibold text-gray-300 text-base mb-2'>Risk Considerations</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                     {strategy.rationale.riskConsiderations.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
            </div>
        </div>


        <div className='grid grid-cols-2 gap-x-6 gap-y-4 my-4 pt-4 border-t border-gray-700/50'>
            <div className="flex items-center space-x-2">
                <PositionSizeIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                <div>
                    <span className='text-xs text-gray-500'>Position Size</span>
                    <p className='font-semibold text-white leading-tight'>{strategy.tradeDetails.positionSize}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                 <RiskIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                <div>
                    <span className='text-xs text-gray-500'>Max Risk</span>
                    <p className='font-semibold text-white leading-tight'>{strategy.tradeDetails.maxRisk}</p>
                </div>
            </div>
             <div className="flex items-center space-x-2">
                <TargetIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                <div>
                    <span className='text-xs text-gray-500'>Target Profit</span>
                    <p className='font-semibold text-white leading-tight'>{strategy.tradeDetails.targetProfit}</p>
                </div>
            </div>
             <div className="flex items-center space-x-2">
                <StopLossIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                <div>
                    <span className='text-xs text-gray-500'>Stop Loss</span>
                    <p className='font-semibold text-white leading-tight'>{strategy.tradeDetails.stopLoss}</p>
                </div>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/50">
             <h4 className='font-semibold text-gray-300 text-base mb-3'>Risk Profile (Greeks)</h4>
             <div className='grid grid-cols-3 gap-4 text-center'>
                 <div className="bg-gray-800/50 p-2 rounded-md">
                    <div className="flex items-center justify-center space-x-1">
                        <DeltaIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">Delta</span>
                    </div>
                    <p className="font-mono text-lg font-semibold text-white">{strategy.greeks.delta.toFixed(2)}</p>
                 </div>
                 <div className="bg-gray-800/50 p-2 rounded-md">
                    <div className="flex items-center justify-center space-x-1">
                        <ThetaIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">Theta</span>
                    </div>
                    <p className="font-mono text-lg font-semibold text-white">{strategy.greeks.theta.toFixed(2)}</p>
                 </div>
                  <div className="bg-gray-800/50 p-2 rounded-md">
                    <div className="flex items-center justify-center space-x-1">
                        <VegaIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">Vega</span>
                    </div>
                    <p className="font-mono text-lg font-semibold text-white">{strategy.greeks.vega.toFixed(2)}</p>
                 </div>
             </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
            <div>
                <h4 className='font-semibold text-gray-300 text-base'>Trade Structure <span className="text-xs text-gray-400">({strategy.tradeDetails.entryPrice})</span></h4>
                <ul className='space-y-1.5 mt-2'>
                    {strategy.tradeDetails.legs.map((leg, i) => (
                         <li key={i} className="flex items-center space-x-2 text-gray-300">
                            <span className={`w-12 text-center text-xs font-bold py-0.5 rounded ${leg.action === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{leg.action}</span>
                            <span className="flex-1">{leg.type} @ ${leg.strike}</span>
                            <span className="text-xs text-gray-500">(Expiry: {leg.expiry})</span>
                         </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className='font-semibold text-gray-300 text-base'>Payoff at Expiry</h4>
                <PayoffDiagram strategy={strategy} />
            </div>
        </div>
    </div>
);
