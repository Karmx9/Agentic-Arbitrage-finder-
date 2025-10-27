
import { blackScholes } from './mockDataService';
import type { StrategyLeg } from '../types';

export function calculatePositionValue(
    legs: StrategyLeg[], 
    currentStockPrice: number, 
    volatility: number, 
    daysToExpiry: number
): number {
    const riskFreeRate = 0.02;
    const timeToExpiry = Math.max(0, daysToExpiry / 365);

    const value = legs.reduce((acc, leg) => {
        const price = blackScholes(currentStockPrice, leg.strike, timeToExpiry, riskFreeRate, volatility, leg.type);
        // We multiply by 100 as one contract represents 100 shares
        const legValue = price * 100;
        return acc + (leg.action === 'BUY' ? legValue : -legValue);
    }, 0);
    
    // We assume 1 contract for each leg for simplicity in P/L calculation per share
    // The total position size is handled by the initial capital allocation
    return value;
}
