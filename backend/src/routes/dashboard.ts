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
import moment from 'moment';

const router = Router();

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

  res.json({
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

  const alert = await RiskAlert.findByIdAndUpdate(
    alertId,
    {
      status: 'resolved',
      resolvedAt: new Date(),
      acknowledgedBy: userId,
      ...(resolution && { actions: [...(alert?.actions || []), resolution] })
    },
    { new: true }
  );

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  res.json({
    success: true,
    data: alert
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
  // Get latest market risk metrics
  const latestMarketRisk = await MarketRisk.findOne({})
    .sort({ calculatedAt: -1 });
  
  // Calculate average credit rating
  const creditRatings = await CreditRisk.aggregate([
    { $match: { calculatedAt: { $gte: moment().subtract(7, 'days').toDate() } } },
    { $group: { _id: null, avgECL: { $avg: '$expectedCreditLoss' } } }
  ]);
  
  return {
    riskExposure: {
      value: '$2.4B', // Would be calculated from actual data
      change: -3.2,
      status: 'healthy'
    },
    capitalAdequacy: {
      value: '18.5%',
      change: 2.1,
      status: 'healthy'
    },
    liquidityRatio: {
      value: '142%',
      change: -1.5,
      status: 'warning'
    },
    creditQuality: {
      value: '94.2%',
      change: 0.8,
      status: 'healthy'
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