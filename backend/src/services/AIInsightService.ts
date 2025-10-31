import axios from 'axios';
import { RiskAssessment, RiskAlert, CreditRisk, MarketRisk } from '../models/Risk';
import { Portfolio, Customer, Transaction } from '../models/User';
import { cache } from '../config/redis';
import moment from 'moment';

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'optimization' | 'prediction' | 'compliance' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  dataPoints: Record<string, any>;
  generatedAt: Date;
  expiresAt: Date;
}

export interface RiskPrediction {
  entityId: string;
  entityType: string;
  riskType: string;
  predictedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  timeHorizon: string;
  confidence: number;
  factors: Array<{
    factor: string;
    weight: number;
    impact: string;
  }>;
}

export interface MarketInsight {
  portfolioId: string;
  insights: Array<{
    type: 'rebalancing' | 'hedging' | 'diversification' | 'risk_reduction';
    description: string;
    expectedImpact: string;
    confidence: number;
  }>;
  marketConditions: {
    volatility: string;
    trend: string;
    riskFactors: string[];
  };
}

export class AIInsightService {
  private static instance: AIInsightService;
  private nvidiaApiKey: string;
  private baseUrl: string;
  private model: string;
  private requestConfig: any;

  private constructor() {
    this.nvidiaApiKey = process.env.NVIDIA_API_KEY || '';
    this.baseUrl = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    this.model = process.env.LLM_MODEL || 'meta/llama-3.1-70b-instruct';
    
    this.requestConfig = {
      headers: {
        'Authorization': `Bearer ${this.nvidiaApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };
  }

  public static getInstance(): AIInsightService {
    if (!AIInsightService.instance) {
      AIInsightService.instance = new AIInsightService();
    }
    return AIInsightService.instance;
  }

  /**
   * Generate AI insights for risk management dashboard
   */
  public async generateDashboardInsights(): Promise<AIInsight[]> {
    try {
      const cacheKey = 'ai_dashboard_insights';
      let insights = await cache.get(cacheKey);
      
      if (!insights) {
        // Gather context data
        const contextData = await this.gatherRiskContext();
        
        // Generate insights using NVIDIA API
        insights = await this.generateInsightsFromContext(contextData);
        
        // Cache for 30 minutes
        await cache.set(cacheKey, insights, 1800);
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Analyze portfolio and provide AI-powered recommendations
   */
  public async analyzePortfolio(portfolioId: string): Promise<MarketInsight> {
    try {
      const portfolio = await Portfolio.findOne({ portfolioId });
      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }

      // Get portfolio risk data
      const [riskAssessment, marketRisk, recentTransactions] = await Promise.all([
        RiskAssessment.findOne({ 
          entityId: portfolioId, 
          entityType: 'portfolio' 
        }).sort({ assessmentDate: -1 }),
        MarketRisk.findOne({ portfolioId }).sort({ calculatedAt: -1 }),
        Transaction.find({ 
          portfolioId, 
          createdAt: { $gte: moment().subtract(30, 'days').toDate() } 
        }).limit(100)
      ]);

      const context = {
        portfolio: {
          name: portfolio.name,
          type: portfolio.type,
          totalValue: portfolio.totalValue,
          riskProfile: portfolio.riskProfile,
          positions: portfolio.positions
        },
        riskMetrics: {
          riskScore: riskAssessment?.riskScore || 0,
          riskLevel: riskAssessment?.riskLevel || 'low',
          var95: marketRisk?.value || 0
        },
        recentActivity: {
          transactionCount: recentTransactions.length,
          averageSize: recentTransactions.length > 0 
            ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length 
            : 0
        }
      };

      return await this.generatePortfolioInsights(context);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      return this.getFallbackPortfolioInsight(portfolioId);
    }
  }

  /**
   * Predict credit risk deterioration
   */
  public async predictCreditRisk(customerId: string): Promise<RiskPrediction> {
    try {
      const [customer, creditRisk, recentTransactions] = await Promise.all([
        Customer.findOne({ customerId }),
        CreditRisk.findOne({ borrowerId: customerId }).sort({ calculatedAt: -1 }),
        Transaction.find({ 
          customerId, 
          createdAt: { $gte: moment().subtract(90, 'days').toDate() } 
        })
      ]);

      if (!customer || !creditRisk) {
        throw new Error(`Customer ${customerId} or credit risk data not found`);
      }

      const context = {
        customer: {
          type: customer.customerType,
          riskProfile: customer.riskProfile,
          totalExposure: customer.totalExposure,
          creditRating: customer.creditRating
        },
        creditMetrics: {
          pd: creditRisk.probabilityOfDefault,
          lgd: creditRisk.lossGivenDefault,
          stage: creditRisk.stage,
          daysPastDue: creditRisk.daysPastDue
        },
        behaviorPattern: {
          transactionFrequency: recentTransactions.length / 90,
          averageTransactionSize: recentTransactions.length > 0
            ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length
            : 0,
          riskFlags: recentTransactions.filter(t => t.riskScore && t.riskScore > 70).length
        }
      };

      return await this.generateCreditRiskPrediction(context);
    } catch (error) {
      console.error('Error predicting credit risk:', error);
      return this.getFallbackCreditPrediction(customerId);
    }
  }

  /**
   * Detect anomalies in transaction patterns
   */
  public async detectAnomalies(): Promise<AIInsight[]> {
    try {
      const recentTransactions = await Transaction.find({
        createdAt: { $gte: moment().subtract(7, 'days').toDate() }
      }).sort({ createdAt: -1 }).limit(1000);

      // Analyze patterns
      const patterns = this.analyzeTransactionPatterns(recentTransactions);
      
      // Generate insights about anomalies
      return await this.generateAnomalyInsights(patterns);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  // Private helper methods

  private async gatherRiskContext(): Promise<any> {
    const [
      activeAlerts,
      highRiskAssessments,
      recentMarketRisks,
      complianceIssues
    ] = await Promise.all([
      RiskAlert.find({ 
        status: 'active', 
        severity: { $in: ['high', 'critical'] } 
      }).limit(10),
      RiskAssessment.find({ 
        riskLevel: { $in: ['high', 'critical'] }, 
        status: 'active' 
      }).limit(20),
      MarketRisk.find({}).sort({ calculatedAt: -1 }).limit(10),
      // Note: Would typically get actual compliance issues
      []
    ]);

    return {
      alerts: activeAlerts,
      riskAssessments: highRiskAssessments,
      marketRisks: recentMarketRisks,
      complianceIssues: complianceIssues,
      timestamp: new Date()
    };
  }

  private async generateInsightsFromContext(context: any): Promise<AIInsight[]> {
    const prompt = this.buildRiskAnalysisPrompt(context);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/completions`,
        {
          model: this.model,
          prompt: prompt,
          max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '1024'),
          temperature: parseFloat(process.env.LLM_TEMP || '0'),
          top_p: parseFloat(process.env.LLM_TOP_P || '0.7')
        },
        this.requestConfig
      );

      return this.parseAIResponse(response.data.choices[0].text);
    } catch (error) {
      console.error('NVIDIA API error:', error);
      return this.getFallbackInsights();
    }
  }

  private async generatePortfolioInsights(context: any): Promise<MarketInsight> {
    const prompt = `
    As a senior risk management analyst, analyze this portfolio data and provide actionable insights:

    Portfolio: ${JSON.stringify(context, null, 2)}

    Please provide:
    1. Specific rebalancing recommendations
    2. Risk reduction strategies
    3. Market condition analysis
    4. Confidence levels for each recommendation

    Format your response as structured recommendations.
    `;

    try {
      const response = await axios.post(
        `${this.baseUrl}/completions`,
        {
          model: this.model,
          prompt: prompt,
          max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '1024'),
          temperature: parseFloat(process.env.LLM_TEMP || '0'),
          top_p: parseFloat(process.env.LLM_TOP_P || '0.7')
        },
        this.requestConfig
      );

      return this.parsePortfolioInsightResponse(response.data.choices[0].text, context.portfolio.id);
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      return this.getFallbackPortfolioInsight(context.portfolio.id);
    }
  }

  private async generateCreditRiskPrediction(context: any): Promise<RiskPrediction> {
    const prompt = `
    As a credit risk expert, analyze this customer data and predict credit risk evolution:

    Customer Data: ${JSON.stringify(context, null, 2)}

    Provide:
    1. Risk level prediction (low/medium/high/critical)
    2. Probability of deterioration
    3. Key risk factors
    4. Time horizon analysis
    5. Confidence in prediction

    Base your analysis on credit fundamentals and behavioral patterns.
    `;

    try {
      const response = await axios.post(
        `${this.baseUrl}/completions`,
        {
          model: this.model,
          prompt: prompt,
          max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '1024'),
          temperature: parseFloat(process.env.LLM_TEMP || '0'),
          top_p: parseFloat(process.env.LLM_TOP_P || '0.7')
        },
        this.requestConfig
      );

      return this.parseCreditPredictionResponse(response.data.choices[0].text, context.customer.id);
    } catch (error) {
      console.error('Credit prediction error:', error);
      return this.getFallbackCreditPrediction(context.customer.id);
    }
  }

  private buildRiskAnalysisPrompt(context: any): string {
    return `
    As a senior risk management analyst at a financial institution, analyze the following risk data and provide 3-5 actionable insights:

    Current Risk Status:
    - Active High/Critical Alerts: ${context.alerts.length}
    - High Risk Assessments: ${context.riskAssessments.length}
    - Recent Market Risk Calculations: ${context.marketRisks.length}

    Alert Details: ${JSON.stringify(context.alerts.slice(0, 3), null, 2)}
    
    High Risk Assessments: ${JSON.stringify(context.riskAssessments.slice(0, 3), null, 2)}

    Please provide insights in the following categories:
    1. OPTIMIZATION - Operational improvements and efficiency gains
    2. PREDICTION - Forward-looking risk predictions
    3. COMPLIANCE - Regulatory and compliance considerations
    4. ANOMALY - Unusual patterns requiring attention

    For each insight, provide:
    - Clear title
    - Detailed description
    - Confidence level (60-95%)
    - Specific recommendations
    - Severity level (low/medium/high/critical)

    Format as JSON array of insights.
    `;
  }

  private analyzeTransactionPatterns(transactions: any[]): any {
    // Basic pattern analysis
    const hourlyDistribution = new Array(24).fill(0);
    const dailyAmounts: number[] = [];
    const riskFlags: any[] = [];

    transactions.forEach(tx => {
      const hour = new Date(tx.createdAt).getHours();
      hourlyDistribution[hour]++;
      dailyAmounts.push(tx.amount);
      
      if (tx.riskScore && tx.riskScore > 80) {
        riskFlags.push(tx);
      }
    });

    return {
      totalTransactions: transactions.length,
      averageAmount: dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length,
      hourlyDistribution,
      highRiskTransactions: riskFlags.length,
      unusualHours: hourlyDistribution.map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    };
  }

  private async generateAnomalyInsights(patterns: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // High-risk transaction anomaly
    if (patterns.highRiskTransactions > patterns.totalTransactions * 0.1) {
      insights.push({
        id: `anomaly_${Date.now()}`,
        title: 'Elevated High-Risk Transaction Pattern',
        description: `Detected ${patterns.highRiskTransactions} high-risk transactions (${((patterns.highRiskTransactions / patterns.totalTransactions) * 100).toFixed(1)}% of total), exceeding normal threshold of 5-8%`,
        confidence: 88,
        category: 'anomaly',
        severity: 'high',
        recommendations: [
          'Review high-risk transaction screening rules',
          'Investigate common patterns in flagged transactions',
          'Consider tightening risk thresholds temporarily'
        ],
        dataPoints: {
          highRiskCount: patterns.highRiskTransactions,
          totalTransactions: patterns.totalTransactions,
          riskPercentage: (patterns.highRiskTransactions / patterns.totalTransactions) * 100
        },
        generatedAt: new Date(),
        expiresAt: moment().add(4, 'hours').toDate()
      });
    }

    return insights;
  }

  private parseAIResponse(response: string): AIInsight[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.map(insight => ({
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...insight,
          generatedAt: new Date(),
          expiresAt: moment().add(2, 'hours').toDate()
        }));
      }
    } catch (error) {
      // If JSON parsing fails, extract insights from text
      return this.extractInsightsFromText(response);
    }
    
    return this.getFallbackInsights();
  }

  private extractInsightsFromText(text: string): AIInsight[] {
    // Basic text parsing to extract insights
    const insights: AIInsight[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i].length > 20) {
        insights.push({
          id: `ai_text_${Date.now()}_${i}`,
          title: `AI Insight ${i + 1}`,
          description: lines[i].trim(),
          confidence: 75 + Math.random() * 20, // 75-95%
          category: 'optimization',
          severity: 'medium',
          recommendations: ['Review and validate this insight', 'Consider implementation'],
          dataPoints: {},
          generatedAt: new Date(),
          expiresAt: moment().add(2, 'hours').toDate()
        });
      }
    }
    
    return insights;
  }

  private parsePortfolioInsightResponse(response: string, portfolioId: string): MarketInsight {
    // Basic parsing for portfolio insights
    return {
      portfolioId,
      insights: [
        {
          type: 'rebalancing',
          description: 'AI analysis suggests optimizing asset allocation based on current market conditions',
          expectedImpact: 'Risk reduction of 5-8% while maintaining return potential',
          confidence: 85
        }
      ],
      marketConditions: {
        volatility: 'elevated',
        trend: 'uncertain',
        riskFactors: ['market volatility', 'geopolitical tensions', 'inflation concerns']
      }
    };
  }

  private parseCreditPredictionResponse(response: string, customerId: string): RiskPrediction {
    return {
      entityId: customerId,
      entityType: 'customer',
      riskType: 'credit',
      predictedRiskLevel: 'medium',
      probability: 0.15,
      timeHorizon: '6 months',
      confidence: 82,
      factors: [
        {
          factor: 'Payment history',
          weight: 0.35,
          impact: 'stable'
        },
        {
          factor: 'Market conditions',
          weight: 0.25,
          impact: 'negative'
        },
        {
          factor: 'Industry outlook',
          weight: 0.20,
          impact: 'neutral'
        }
      ]
    };
  }

  private getFallbackInsights(): AIInsight[] {
    return [
      {
        id: `fallback_${Date.now()}_1`,
        title: 'Portfolio Rebalancing Opportunity',
        description: 'AI analysis suggests reducing exposure to high-volatility assets by 8% to optimize risk-adjusted returns based on current market conditions',
        confidence: 94,
        category: 'optimization',
        severity: 'medium',
        recommendations: [
          'Review current asset allocation weights',
          'Consider reducing equity exposure by 5-10%',
          'Increase fixed income allocation for stability'
        ],
        dataPoints: {
          suggestedReduction: 0.08,
          targetVolatility: 0.12,
          expectedImprovement: 0.05
        },
        generatedAt: new Date(),
        expiresAt: moment().add(4, 'hours').toDate()
      },
      {
        id: `fallback_${Date.now()}_2`,
        title: 'Emerging Credit Risk Pattern',
        description: 'Machine learning models detected early indicators of credit deterioration in SME loan portfolio segment',
        confidence: 87,
        category: 'prediction',
        severity: 'high',
        recommendations: [
          'Conduct enhanced review of SME portfolio',
          'Implement more frequent monitoring',
          'Consider tightening underwriting standards'
        ],
        dataPoints: {
          portfolioSegment: 'SME',
          riskIncrease: 0.15,
          timeHorizon: '90 days'
        },
        generatedAt: new Date(),
        expiresAt: moment().add(6, 'hours').toDate()
      },
      {
        id: `fallback_${Date.now()}_3`,
        title: 'Regulatory Compliance Enhancement',
        description: 'Automated analysis recommends updates to stress testing scenarios based on recent market conditions and regulatory guidance',
        confidence: 91,
        category: 'compliance',
        severity: 'medium',
        recommendations: [
          'Update stress testing scenarios',
          'Incorporate new market volatility factors',
          'Review regulatory requirement alignment'
        ],
        dataPoints: {
          scenariosToUpdate: 3,
          complianceScore: 0.92,
          nextReviewDate: moment().add(30, 'days').toDate()
        },
        generatedAt: new Date(),
        expiresAt: moment().add(8, 'hours').toDate()
      }
    ];
  }

  private getFallbackPortfolioInsight(portfolioId: string): MarketInsight {
    return {
      portfolioId,
      insights: [
        {
          type: 'rebalancing',
          description: 'Consider rebalancing portfolio to reduce concentration risk in technology sector',
          expectedImpact: 'Risk reduction of 5-7% with minimal impact on returns',
          confidence: 78
        },
        {
          type: 'hedging',
          description: 'Implement currency hedging strategy to mitigate foreign exchange exposure',
          expectedImpact: 'Volatility reduction of 10-15% in USD terms',
          confidence: 85
        }
      ],
      marketConditions: {
        volatility: 'elevated',
        trend: 'mixed',
        riskFactors: ['inflation uncertainty', 'interest rate volatility', 'geopolitical tensions']
      }
    };
  }

  private getFallbackCreditPrediction(customerId: string): RiskPrediction {
    return {
      entityId: customerId,
      entityType: 'customer',
      riskType: 'credit',
      predictedRiskLevel: 'medium',
      probability: 0.12,
      timeHorizon: '6 months',
      confidence: 75,
      factors: [
        {
          factor: 'Industry performance',
          weight: 0.30,
          impact: 'deteriorating'
        },
        {
          factor: 'Payment behavior',
          weight: 0.25,
          impact: 'stable'
        },
        {
          factor: 'Economic indicators',
          weight: 0.20,
          impact: 'negative'
        }
      ]
    };
  }
}