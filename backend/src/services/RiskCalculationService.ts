import { Matrix } from 'ml-matrix';
import * as stats from 'simple-statistics';
import * as math from 'mathjs';
import moment from 'moment';

import { 
  CreditRisk, 
  MarketRisk, 
  OperationalRisk, 
  LiquidityRisk, 
  RiskAssessment,
  ICreditRisk,
  IMarketRisk,
  IOperationalRisk,
  ILiquidityRisk
} from '../models/Risk';
import { Customer, Portfolio, Transaction } from '../models/User';
import { cache } from '../config/redis';

export interface RiskCalculationResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  breakdown: Record<string, number>;
  recommendations: string[];
  calculatedAt: Date;
}

export interface CreditRiskParams {
  borrowerId: string;
  facilityId: string;
  exposureAmount: number;
  collateralValue: number;
  creditRating?: string;
  industryCode?: string;
  maturityDate: Date;
  paymentHistory: Array<{
    date: Date;
    amountDue: number;
    amountPaid: number;
    daysPastDue: number;
  }>;
  financialMetrics: {
    debtToEquity: number;
    currentRatio: number;
    interestCoverageRatio: number;
    returnOnAssets: number;
  };
}

export interface MarketRiskParams {
  portfolioId: string;
  positions: Array<{
    assetId: string;
    quantity: number;
    currentPrice: number;
    assetType: string;
    beta?: number;
  }>;
  timeHorizon: number;
  confidenceLevel: number;
  method: 'historical' | 'parametric' | 'monte_carlo';
}

export interface VaRResult {
  var: number;
  expectedShortfall: number;
  confidence: number;
  method: string;
  timeHorizon: number;
  breakdown: Record<string, number>;
}

export class RiskCalculationService {
  private static instance: RiskCalculationService;
  
  private constructor() {}

  public static getInstance(): RiskCalculationService {
    if (!RiskCalculationService.instance) {
      RiskCalculationService.instance = new RiskCalculationService();
    }
    return RiskCalculationService.instance;
  }

  /**
   * Calculate Credit Risk using PD, LGD, EAD model
   */
  public async calculateCreditRisk(params: CreditRiskParams): Promise<ICreditRisk> {
    try {
      // Calculate Probability of Default (PD)
      const pd = await this.calculateProbabilityOfDefault(params);
      
      // Calculate Loss Given Default (LGD)
      const lgd = this.calculateLossGivenDefault(params);
      
      // Calculate Exposure at Default (EAD)
      const ead = this.calculateExposureAtDefault(params);
      
      // Calculate Expected Credit Loss (ECL)
      const ecl = pd * lgd * ead;
      
      // Determine IFRS 9 stage
      const stage = this.determineIFRS9Stage(params, pd);
      
      // Calculate limit utilization
      const limitUtilization = params.exposureAmount / (params.exposureAmount * 1.2); // Assume limit is 20% higher
      
      const creditRisk = new CreditRisk({
        borrowerId: params.borrowerId,
        facilityId: params.facilityId,
        probabilityOfDefault: pd,
        lossGivenDefault: lgd,
        exposureAtDefault: ead,
        expectedCreditLoss: ecl,
        stage: stage,
        creditRating: params.creditRating || 'Unrated',
        limitUtilization: limitUtilization,
        daysPastDue: this.calculateDaysPastDue(params.paymentHistory),
        restructuringFlag: false,
        watchListFlag: this.isWatchListed(params),
        calculatedAt: new Date()
      });

      await creditRisk.save();
      return creditRisk;
      
    } catch (error) {
      console.error('Credit risk calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate Market Risk using Value at Risk (VaR)
   */
  public async calculateMarketRisk(params: MarketRiskParams): Promise<VaRResult> {
    try {
      const cacheKey = `market_risk:${params.portfolioId}:${params.method}:${params.timeHorizon}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      let varResult: VaRResult;

      switch (params.method) {
        case 'historical':
          varResult = await this.calculateHistoricalVaR(params);
          break;
        case 'parametric':
          varResult = await this.calculateParametricVaR(params);
          break;
        case 'monte_carlo':
          varResult = await this.calculateMonteCarloVaR(params);
          break;
        default:
          throw new Error(`Unsupported VaR method: ${params.method}`);
      }

      // Cache result for 1 hour
      await cache.set(cacheKey, varResult, 3600);

      // Save to database
      await this.saveMarketRiskResults(params, varResult);

      return varResult;

    } catch (error) {
      console.error('Market risk calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate Operational Risk using Basic Indicator Approach
   */
  public async calculateOperationalRisk(businessLine: string, grossIncome: number[]): Promise<number> {
    // Basic Indicator Approach: 15% of average gross income over 3 years
    const averageGrossIncome = stats.mean(grossIncome);
    const operationalRiskCapital = averageGrossIncome * 0.15;
    
    return Math.max(operationalRiskCapital, 0);
  }

  /**
   * Calculate Liquidity Coverage Ratio (LCR)
   */
  public async calculateLCR(
    highQualityLiquidAssets: number,
    totalNetCashOutflows: number
  ): Promise<number> {
    if (totalNetCashOutflows === 0) return Infinity;
    return (highQualityLiquidAssets / totalNetCashOutflows) * 100;
  }

  /**
   * Calculate Net Stable Funding Ratio (NSFR)
   */
  public async calculateNSFR(
    availableStableFunding: number,
    requiredStableFunding: number
  ): Promise<number> {
    if (requiredStableFunding === 0) return Infinity;
    return (availableStableFunding / requiredStableFunding) * 100;
  }

  /**
   * Perform stress testing on portfolio
   */
  public async performStressTest(
    portfolioId: string,
    scenarios: Array<{
      name: string;
      shocks: Record<string, number>; // asset_id -> shock percentage
    }>
  ): Promise<Array<{ scenario: string; loss: number; newValue: number }>> {
    const portfolio = await Portfolio.findOne({ portfolioId });
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    const results = [];

    for (const scenario of scenarios) {
      let totalLoss = 0;
      let newPortfolioValue = 0;

      for (const position of portfolio.positions) {
        const shock = scenario.shocks[position.assetId] || 0;
        const positionLoss = position.marketValue * (shock / 100);
        const newPositionValue = position.marketValue - positionLoss;
        
        totalLoss += positionLoss;
        newPortfolioValue += newPositionValue;
      }

      results.push({
        scenario: scenario.name,
        loss: totalLoss,
        newValue: newPortfolioValue
      });
    }

    return results;
  }

  // Private helper methods

  private async calculateProbabilityOfDefault(params: CreditRiskParams): Promise<number> {
    // Simplified PD calculation based on financial metrics and payment history
    let pdScore = 0;
    
    // Financial metrics contribution (60% weight)
    const financialScore = this.calculateFinancialScore(params.financialMetrics);
    pdScore += financialScore * 0.6;
    
    // Payment history contribution (30% weight)
    const paymentScore = this.calculatePaymentScore(params.paymentHistory);
    pdScore += paymentScore * 0.3;
    
    // Credit rating contribution (10% weight)
    const ratingScore = this.calculateRatingScore(params.creditRating);
    pdScore += ratingScore * 0.1;
    
    // Convert score to PD (inverted sigmoid function)
    const pd = 1 / (1 + Math.exp(5 - pdScore * 10));
    
    return Math.min(Math.max(pd, 0.0001), 0.9999); // Bound between 0.01% and 99.99%
  }

  private calculateLossGivenDefault(params: CreditRiskParams): number {
    // LGD calculation based on collateral
    const collateralCoverage = params.collateralValue / params.exposureAmount;
    
    let lgd: number;
    if (collateralCoverage >= 1.0) {
      lgd = 0.1; // 10% LGD for fully collateralized
    } else if (collateralCoverage >= 0.8) {
      lgd = 0.25; // 25% LGD for well-collateralized
    } else if (collateralCoverage >= 0.5) {
      lgd = 0.45; // 45% LGD for partially collateralized
    } else {
      lgd = 0.65; // 65% LGD for unsecured
    }
    
    return lgd;
  }

  private calculateExposureAtDefault(params: CreditRiskParams): number {
    // For simplicity, EAD equals current exposure
    // In practice, this would consider credit conversion factors for off-balance sheet items
    return params.exposureAmount;
  }

  private determineIFRS9Stage(params: CreditRiskParams, pd: number): 1 | 2 | 3 {
    const daysPastDue = this.calculateDaysPastDue(params.paymentHistory);
    
    // Stage 3: Credit-impaired (>90 days past due)
    if (daysPastDue > 90) return 3;
    
    // Stage 2: Significant increase in credit risk (>30 days past due or PD > 2%)
    if (daysPastDue > 30 || pd > 0.02) return 2;
    
    // Stage 1: 12-month ECL
    return 1;
  }

  private calculateDaysPastDue(paymentHistory: Array<{
    date: Date;
    amountDue: number;
    amountPaid: number;
    daysPastDue: number;
  }>): number {
    if (paymentHistory.length === 0) return 0;
    
    // Get the most recent payment record
    const mostRecent = paymentHistory.reduce((latest, payment) => 
      payment.date > latest.date ? payment : latest
    );
    
    return mostRecent.daysPastDue;
  }

  private isWatchListed(params: CreditRiskParams): boolean {
    // Simple watch list criteria
    const { debtToEquity, currentRatio, interestCoverageRatio } = params.financialMetrics;
    
    return debtToEquity > 3 || currentRatio < 1 || interestCoverageRatio < 2;
  }

  private calculateFinancialScore(metrics: {
    debtToEquity: number;
    currentRatio: number;
    interestCoverageRatio: number;
    returnOnAssets: number;
  }): number {
    let score = 5; // Start with neutral score
    
    // Debt to equity ratio (lower is better)
    if (metrics.debtToEquity > 2) score -= 2;
    else if (metrics.debtToEquity > 1) score -= 1;
    else if (metrics.debtToEquity < 0.5) score += 1;
    
    // Current ratio (around 1.5-2 is optimal)
    if (metrics.currentRatio < 1) score -= 2;
    else if (metrics.currentRatio >= 1.5 && metrics.currentRatio <= 2) score += 1;
    
    // Interest coverage ratio (higher is better)
    if (metrics.interestCoverageRatio < 2) score -= 2;
    else if (metrics.interestCoverageRatio > 5) score += 1;
    
    // Return on assets (higher is better)
    if (metrics.returnOnAssets < 0.02) score -= 1;
    else if (metrics.returnOnAssets > 0.10) score += 1;
    
    return Math.max(0, Math.min(10, score));
  }

  private calculatePaymentScore(paymentHistory: Array<{
    date: Date;
    amountDue: number;
    amountPaid: number;
    daysPastDue: number;
  }>): number {
    if (paymentHistory.length === 0) return 5; // Neutral score for no history
    
    let score = 10;
    let totalPayments = 0;
    let latePayments = 0;
    
    for (const payment of paymentHistory) {
      totalPayments++;
      
      if (payment.daysPastDue > 0) {
        latePayments++;
        
        if (payment.daysPastDue > 90) score -= 3;
        else if (payment.daysPastDue > 30) score -= 2;
        else score -= 1;
      }
      
      // Partial payment penalty
      if (payment.amountPaid < payment.amountDue) {
        score -= 1;
      }
    }
    
    // Adjust for payment history quality
    const latePaymentRatio = latePayments / totalPayments;
    if (latePaymentRatio > 0.3) score -= 2;
    
    return Math.max(0, Math.min(10, score));
  }

  private calculateRatingScore(creditRating?: string): number {
    if (!creditRating || creditRating === 'Unrated') return 5;
    
    const ratingMap: Record<string, number> = {
      'AAA': 10, 'AA+': 9.5, 'AA': 9, 'AA-': 8.5,
      'A+': 8, 'A': 7.5, 'A-': 7,
      'BBB+': 6.5, 'BBB': 6, 'BBB-': 5.5,
      'BB+': 5, 'BB': 4.5, 'BB-': 4,
      'B+': 3.5, 'B': 3, 'B-': 2.5,
      'CCC+': 2, 'CCC': 1.5, 'CCC-': 1,
      'CC': 0.5, 'C': 0.25, 'D': 0
    };
    
    return ratingMap[creditRating] || 5;
  }

  private async calculateHistoricalVaR(params: MarketRiskParams): Promise<VaRResult> {
    // Get historical returns for the portfolio
    const returns = await this.getHistoricalReturns(params.portfolioId, 252); // 1 year of daily returns
    
    if (returns.length === 0) {
      throw new Error('Insufficient historical data for VaR calculation');
    }
    
    // Calculate percentile for VaR
    const varPercentile = (1 - params.confidenceLevel) * 100;
    const var95 = stats.quantile(returns, varPercentile / 100);
    
    // Calculate Expected Shortfall (Conditional VaR)
    const tailReturns = returns.filter(r => r <= var95);
    const expectedShortfall = tailReturns.length > 0 ? stats.mean(tailReturns) : var95;
    
    return {
      var: Math.abs(var95),
      expectedShortfall: Math.abs(expectedShortfall),
      confidence: params.confidenceLevel,
      method: 'historical',
      timeHorizon: params.timeHorizon,
      breakdown: this.calculateVaRBreakdown(params)
    };
  }

  private async calculateParametricVaR(params: MarketRiskParams): Promise<VaRResult> {
    // Get portfolio statistics
    const returns = await this.getHistoricalReturns(params.portfolioId, 252);
    const portfolioReturn = stats.mean(returns);
    const portfolioVolatility = stats.standardDeviation(returns);
    
    // Z-score for confidence level
    const zScore = this.getZScore(params.confidenceLevel);
    
    // VaR calculation: VaR = μ + z * σ * √t
    const timeAdjustment = Math.sqrt(params.timeHorizon);
    const var95 = Math.abs(portfolioReturn + zScore * portfolioVolatility * timeAdjustment);
    
    // Expected Shortfall approximation for normal distribution
    const expectedShortfall = var95 * (1 + (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * zScore * zScore) / (1 - params.confidenceLevel));
    
    return {
      var: var95,
      expectedShortfall: expectedShortfall,
      confidence: params.confidenceLevel,
      method: 'parametric',
      timeHorizon: params.timeHorizon,
      breakdown: this.calculateVaRBreakdown(params)
    };
  }

  private async calculateMonteCarloVaR(params: MarketRiskParams): Promise<VaRResult> {
    const numSimulations = 10000;
    const simulatedReturns: number[] = [];
    
    // Get portfolio statistics
    const returns = await this.getHistoricalReturns(params.portfolioId, 252);
    const portfolioReturn = stats.mean(returns);
    const portfolioVolatility = stats.standardDeviation(returns);
    
    // Monte Carlo simulation
    for (let i = 0; i < numSimulations; i++) {
      // Generate random return using normal distribution
      const randomReturn = this.generateNormalRandom(portfolioReturn, portfolioVolatility);
      simulatedReturns.push(randomReturn);
    }
    
    // Calculate VaR from simulated returns
    const varPercentile = (1 - params.confidenceLevel) * 100;
    const var95 = Math.abs(stats.quantile(simulatedReturns, varPercentile / 100));
    
    // Calculate Expected Shortfall
    const tailReturns = simulatedReturns.filter(r => r <= -var95);
    const expectedShortfall = Math.abs(stats.mean(tailReturns));
    
    return {
      var: var95,
      expectedShortfall: expectedShortfall,
      confidence: params.confidenceLevel,
      method: 'monte_carlo',
      timeHorizon: params.timeHorizon,
      breakdown: this.calculateVaRBreakdown(params)
    };
  }

  private calculateVaRBreakdown(params: MarketRiskParams): Record<string, number> {
    // Simplified breakdown by asset type
    const breakdown: Record<string, number> = {};
    let totalValue = 0;
    
    for (const position of params.positions) {
      totalValue += position.currentPrice * position.quantity;
    }
    
    for (const position of params.positions) {
      const weight = (position.currentPrice * position.quantity) / totalValue;
      const assetType = position.assetType;
      
      if (!breakdown[assetType]) {
        breakdown[assetType] = 0;
      }
      breakdown[assetType] += weight;
    }
    
    return breakdown;
  }

  private async getHistoricalReturns(portfolioId: string, days: number): Promise<number[]> {
    // In a real implementation, this would fetch historical price data
    // For now, simulate some returns
    const returns: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Generate random return with some autocorrelation
      const randomReturn = Math.random() * 0.04 - 0.02; // ±2% daily return
      returns.push(randomReturn);
    }
    
    return returns;
  }

  private getZScore(confidenceLevel: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<string, number> = {
      '0.90': -1.282,
      '0.95': -1.645,
      '0.99': -2.326
    };
    
    return zScores[confidenceLevel.toString()] || -1.645;
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  private async saveMarketRiskResults(params: MarketRiskParams, result: VaRResult): Promise<void> {
    const marketRisk = new MarketRisk({
      portfolioId: params.portfolioId,
      riskMetric: 'var',
      value: result.var,
      confidence: result.confidence,
      timeHorizon: result.timeHorizon,
      method: result.method,
      assetClass: 'mixed', // Would be more specific in real implementation
      currency: 'USD', // Would be determined from portfolio
      calculatedAt: new Date(),
      validUntil: moment().add(1, 'day').toDate()
    });

    await marketRisk.save();
  }
}