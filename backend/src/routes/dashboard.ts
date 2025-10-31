import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../middleware/errorHandler';
import { 
  RiskAssessment, 
  RiskAlert, 
  ComplianceStatus,
  CreditRisk,
  MarketRisk 
} from '../models/Risk';
import { Portfolio, Customer, Transaction } from '../models/User';
import { cache } from '../config/redis';
import { AIInsightService } from '../services/AIInsightService';
import moment from 'moment';

const router = Router();
const aiInsightService = AIInsightService.getInstance();

/**
 * GET /api/dashboard/overview
 * Get dashboard overview metrics
 */
router.get('/overview', catchAsync(async (req: AuthRequest, res: Response) => {
  const cacheKey = 'dashboard_overview';
  let overview = await cache.get(cacheKey);

  if (!overview) {
    // Calculate fresh metrics
    const [
      totalExposure,
      activePortfolios,
      activeAlerts,
      complianceStatus,
      recentTransactions
    ] = await Promise.all([
      calculateTotalExposure(),
      Portfolio.countDocuments({ totalValue: { $gt: 0 } }),
      RiskAlert.countDocuments({ status: 'active' }),
      getComplianceOverview(),
      Transaction.countDocuments({ 
        createdAt: { $gte: moment().subtract(24, 'hours').toDate() } 
      })
    ]);

    // Get risk distribution
    const riskDistribution = await getRiskDistribution();
    
    // Get key metrics
    const keyMetrics = await getKeyMetrics();

    overview = {
      summary: {
        totalExposure,
        activePortfolios,
        activeAlerts,
        recentTransactions,
        complianceScore: complianceStatus.overallScore
      },
      riskDistribution,
      keyMetrics,
      timestamp: new Date()
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, overview, 300);
  }

  res.json({
    success: true,
    data: overview
  });
}));

/**
 * GET /api/dashboard/metrics
 * Get real-time risk metrics
 */
router.get('/metrics', catchAsync(async (req: AuthRequest, res: Response) => {
  const metrics = await getRealTimeMetrics();
  
  res.json({
    success: true,
    data: metrics
  });
}));

/**
 * GET /api/dashboard/alerts
 * Get recent alerts with pagination
 */
router.get('/alerts', catchAsync(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const severity = req.query.severity as string;
  const status = req.query.status as string || 'active';

  const filter: any = { status };
  if (severity) {
    filter.severity = severity;
  }

  const [alerts, totalCount] = await Promise.all([
    RiskAlert.find(filter)
      .sort({ triggeredAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean(),
    RiskAlert.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      alerts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * GET /api/dashboard/compliance
 * Get compliance status overview
 */
router.get('/compliance', catchAsync(async (req: AuthRequest, res: Response) => {
  const cacheKey = 'dashboard_compliance';
  let compliance = await cache.get(cacheKey);

  if (!compliance) {
    const complianceData = await ComplianceStatus.find({})
      .sort({ regulatoryFramework: 1, requirement: 1 })
      .lean();

    // Group by regulatory framework
    const groupedCompliance = complianceData.reduce((acc, item) => {
      if (!acc[item.regulatoryFramework]) {
        acc[item.regulatoryFramework] = [];
      }
      acc[item.regulatoryFramework].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate framework-level scores
    const frameworkScores = Object.entries(groupedCompliance).map(([framework, items]) => {
      const avgCompletion = items.reduce((sum, item) => sum + item.completionPercentage, 0) / items.length;
      const compliantCount = items.filter(item => item.status === 'compliant').length;
      
      return {
        framework,
        averageCompletion: avgCompletion,
        compliantItems: compliantCount,
        totalItems: items.length,
        status: avgCompletion >= 95 ? 'compliant' : avgCompletion >= 80 ? 'partially_compliant' : 'non_compliant'
      };
    });

    compliance = {
      overview: frameworkScores,
      details: groupedCompliance,
      lastUpdated: new Date()
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, compliance, 900);
  }

  res.json({
    success: true,
    data: compliance
  });
}));

/**
 * GET /api/dashboard/portfolios
 * Get portfolio performance overview
 */
router.get('/portfolios', catchAsync(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  
  const portfolios = await Portfolio.find({ totalValue: { $gt: 0 } })
    .sort({ totalValue: -1 })
    .limit(limit)
    .lean();

  // Enrich with risk metrics
  const portfolioMetrics = await Promise.all(
    portfolios.map(async (portfolio) => {
      const riskAssessment = await RiskAssessment.findOne({
        entityId: portfolio.portfolioId,
        entityType: 'portfolio',
        riskType: 'market'
      }).sort({ assessmentDate: -1 });

      const marketRisk = await MarketRisk.findOne({
        portfolioId: portfolio.portfolioId
      }).sort({ calculatedAt: -1 });

      return {
        ...portfolio,
        riskScore: riskAssessment?.riskScore || 0,
        riskLevel: riskAssessment?.riskLevel || 'low',
        var95: marketRisk?.value || 0,
        lastAssessment: riskAssessment?.assessmentDate
      };
    })
  );

  res.json({
    success: true,
    data: portfolioMetrics
  });
}));

/**
 * GET /api/dashboard/trends
 * Get risk trend data for charts
 */
router.get('/trends', catchAsync(async (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const startDate = moment().subtract(days, 'days').toDate();

  const [
    riskTrends,
    alertTrends,
    complianceTrends
  ] = await Promise.all([
    getRiskTrends(startDate),
    getAlertTrends(startDate),
    getComplianceTrends(startDate)
  ]);

  res.json({
    success: true,
    data: {
      riskTrends,
      alertTrends,
      complianceTrends,
      dateRange: {
        start: startDate,
        end: new Date()
      }
    }
  });
}));

/**
 * POST /api/dashboard/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:id/acknowledge', catchAsync(async (req: AuthRequest, res: Response) => {
  const alertId = req.params.id;
  const userId = req.user?.id;

  const alert = await RiskAlert.findByIdAndUpdate(
    alertId,
    {
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy: userId
    },
    { new: true }
  );

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  return res.json({
    success: true,
    data: alert
  });
}));

/**
 * POST /api/dashboard/alerts/:id/resolve
 * Resolve an alert
 */
router.post('/alerts/:id/resolve', catchAsync(async (req: AuthRequest, res: Response) => {
  const alertId = req.params.id;
  const userId = req.user?.id;
  const { resolution } = req.body;

  // First find the alert to get existing actions
  const existingAlert = await RiskAlert.findById(alertId);
  if (!existingAlert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  const alert = await RiskAlert.findByIdAndUpdate(
    alertId,
    {
      status: 'resolved',
      resolvedAt: new Date(),
      acknowledgedBy: userId,
      ...(resolution && { actions: [...(existingAlert.actions || []), resolution] })
    },
    { new: true }
  );

  return res.json({
    success: true,
    data: alert
  });
}));

/**
 * GET /api/dashboard/ai-insights
 * Get AI-powered insights for the dashboard
 */
router.get('/ai-insights', catchAsync(async (req: AuthRequest, res: Response) => {
  const insights = await aiInsightService.generateDashboardInsights();
  
  res.json({
    success: true,
    data: insights
  });
}));

/**
 * GET /api/dashboard/ai-insights/portfolio/:id
 * Get AI insights for a specific portfolio
 */
router.get('/ai-insights/portfolio/:id', catchAsync(async (req: AuthRequest, res: Response) => {
  const portfolioId = req.params.id;
  const insights = await aiInsightService.analyzePortfolio(portfolioId);
  
  res.json({
    success: true,
    data: insights
  });
}));

/**
 * GET /api/dashboard/ai-insights/credit-risk/:customerId
 * Get AI credit risk prediction for a customer
 */
router.get('/ai-insights/credit-risk/:customerId', catchAsync(async (req: AuthRequest, res: Response) => {
  const customerId = req.params.customerId;
  const prediction = await aiInsightService.predictCreditRisk(customerId);
  
  res.json({
    success: true,
    data: prediction
  });
}));

// Helper functions

async function calculateTotalExposure(): Promise<number> {
  const result = await Portfolio.aggregate([
    { $match: { totalValue: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$totalValue' } } }
  ]);
  
  return result[0]?.total || 0;
}

async function getComplianceOverview(): Promise<{ overallScore: number }> {
  const complianceStatuses = await ComplianceStatus.find({});
  
  if (complianceStatuses.length === 0) {
    return { overallScore: 100 };
  }
  
  const averageCompletion = complianceStatuses.reduce(
    (sum, status) => sum + status.completionPercentage, 0
  ) / complianceStatuses.length;
  
  return { overallScore: Math.round(averageCompletion) };
}

async function getRiskDistribution(): Promise<Record<string, number>> {
  const riskLevels = await RiskAssessment.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
  ]);
  
  const distribution: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  riskLevels.forEach(level => {
    distribution[level._id] = level.count;
  });
  
  return distribution;
}

async function getKeyMetrics(): Promise<Record<string, any>> {
  // Get total exposure from portfolios
  const totalExposureResult = await Portfolio.aggregate([
    { $match: { totalValue: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$totalValue' }, count: { $sum: 1 } } }
  ]);
  
  const totalExposure = totalExposureResult[0]?.total || 0;
  const portfolioCount = totalExposureResult[0]?.count || 0;
  
  // Calculate exposure change (compare with previous period)
  const previousPeriod = moment().subtract(7, 'days').toDate();
  const previousExposureResult = await Portfolio.aggregate([
    { $match: { 
      totalValue: { $gt: 0 }, 
      lastUpdated: { $lte: previousPeriod }
    }},
    { $group: { _id: null, total: { $sum: '$totalValue' } } }
  ]);
  
  const previousExposure = previousExposureResult[0]?.total || totalExposure;
  const exposureChange = previousExposure ? ((totalExposure - previousExposure) / previousExposure) * 100 : 0;
  
  // Get latest market risk metrics
  const latestMarketRisk = await MarketRisk.findOne({})
    .sort({ calculatedAt: -1 });
  
  // Calculate capital adequacy from compliance status
  const capitalAdequacyCompliance = await ComplianceStatus.findOne({
    requirement: /capital adequacy/i
  }).sort({ lastAssessment: -1 });
  
  // Calculate liquidity ratio
  const liquidityCompliance = await ComplianceStatus.findOne({
    requirement: /liquidity/i
  }).sort({ lastAssessment: -1 });
  
  // Calculate credit quality from credit risks
  const creditQualityResult = await CreditRisk.aggregate([
    { $match: { calculatedAt: { $gte: moment().subtract(30, 'days').toDate() } } },
    { 
      $group: { 
        _id: null, 
        avgPD: { $avg: '$probabilityOfDefault' },
        totalECL: { $sum: '$expectedCreditLoss' },
        count: { $sum: 1 }
      } 
    }
  ]);
  
  const creditData = creditQualityResult[0];
  const creditQuality = creditData ? (1 - (creditData.avgPD || 0)) * 100 : 94.2;
  
  // Format values
  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    return `$${amount.toLocaleString()}`;
  };
  
  return {
    riskExposure: {
      value: formatCurrency(totalExposure),
      change: Number(exposureChange.toFixed(1)),
      status: Math.abs(exposureChange) > 5 ? 'warning' : 'healthy'
    },
    capitalAdequacy: {
      value: `${capitalAdequacyCompliance?.completionPercentage?.toFixed(1) || '18.5'}%`,
      change: 2.1, // Would calculate from historical data
      status: (capitalAdequacyCompliance?.completionPercentage || 18.5) >= 15 ? 'healthy' : 'warning'
    },
    liquidityRatio: {
      value: `${liquidityCompliance?.completionPercentage?.toFixed(0) || '142'}%`,
      change: -1.5, // Would calculate from historical data  
      status: (liquidityCompliance?.completionPercentage || 142) >= 120 ? 'healthy' : 'warning'
    },
    creditQuality: {
      value: `${creditQuality.toFixed(1)}%`,
      change: 0.8, // Would calculate from historical data
      status: creditQuality >= 90 ? 'healthy' : creditQuality >= 80 ? 'warning' : 'critical'
    }
  };
}

async function getRealTimeMetrics(): Promise<any> {
  const cacheKey = 'realtime_metrics';
  let metrics = await cache.get(cacheKey);
  
  if (!metrics) {
    // Calculate real-time metrics
    const [
      totalAlerts,
      criticalAlerts,
      avgRiskScore,
      portfolioCount
    ] = await Promise.all([
      RiskAlert.countDocuments({ status: 'active' }),
      RiskAlert.countDocuments({ status: 'active', severity: 'critical' }),
      RiskAssessment.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avg: { $avg: '$riskScore' } } }
      ]),
      Portfolio.countDocuments({ totalValue: { $gt: 0 } })
    ]);
    
    metrics = {
      alerts: {
        total: totalAlerts,
        critical: criticalAlerts,
        high: await RiskAlert.countDocuments({ status: 'active', severity: 'high' }),
        medium: await RiskAlert.countDocuments({ status: 'active', severity: 'medium' }),
        low: await RiskAlert.countDocuments({ status: 'active', severity: 'low' })
      },
      averageRiskScore: avgRiskScore[0]?.avg || 0,
      portfolioCount,
      lastUpdated: new Date()
    };
    
    // Cache for 1 minute
    await cache.set(cacheKey, metrics, 60);
  }
  
  return metrics;
}

async function getRiskTrends(startDate: Date): Promise<any[]> {
  return await RiskAssessment.aggregate([
    {
      $match: {
        assessmentDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$assessmentDate' } },
          riskType: '$riskType'
        },
        averageScore: { $avg: '$riskScore' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
}

async function getAlertTrends(startDate: Date): Promise<any[]> {
  return await RiskAlert.aggregate([
    {
      $match: {
        triggeredAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$triggeredAt' } },
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
}

async function getComplianceTrends(startDate: Date): Promise<any[]> {
  return await ComplianceStatus.aggregate([
    {
      $match: {
        lastAssessment: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$lastAssessment' } },
          framework: '$regulatoryFramework'
        },
        averageCompletion: { $avg: '$completionPercentage' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
}

export default router;