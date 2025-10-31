import { Router, Request, Response } from 'express';
import { catchAsync, ValidationError } from '../middleware/errorHandler';
import { 
  RiskAssessment, 
  RiskAlert, 
  ComplianceStatus,
  CreditRisk,
  MarketRisk,
  OperationalRisk 
} from '../models/Risk';
import { Portfolio, Customer, Transaction } from '../models/User';
import { requirePermission } from '../middleware/auth';
import moment from 'moment';

const router = Router();

/**
 * GET /api/reports/dashboard
 * Generate comprehensive dashboard report
 */
router.get('/dashboard',
  requirePermission('generate_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : moment().subtract(30, 'days').toDate();
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    // Risk Summary
    const riskSummary = await generateRiskSummary(startDate, endDate);
    
    // Compliance Summary
    const complianceSummary = await generateComplianceSummary();
    
    // Alert Summary
    const alertSummary = await generateAlertSummary(startDate, endDate);
    
    // Portfolio Summary
    const portfolioSummary = await generatePortfolioSummary();

    res.json({
      success: true,
      data: {
        reportType: 'dashboard',
        period: { startDate, endDate },
        generatedAt: new Date(),
        sections: {
          riskSummary,
          complianceSummary,
          alertSummary,
          portfolioSummary
        }
      }
    });
  })
);

/**
 * GET /api/reports/risk/comprehensive
 * Generate comprehensive risk report
 */
router.get('/risk/comprehensive',
  requirePermission('generate_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : moment().subtract(30, 'days').toDate();
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    // Credit Risk Analysis
    const creditRiskAnalysis = await generateCreditRiskAnalysis(startDate, endDate);
    
    // Market Risk Analysis
    const marketRiskAnalysis = await generateMarketRiskAnalysis(startDate, endDate);
    
    // Operational Risk Analysis
    const operationalRiskAnalysis = await generateOperationalRiskAnalysis(startDate, endDate);
    
    // Risk Trends
    const riskTrends = await generateRiskTrends(startDate, endDate);

    res.json({
      success: true,
      data: {
        reportType: 'comprehensive_risk',
        period: { startDate, endDate },
        generatedAt: new Date(),
        executive_summary: await generateExecutiveSummary(startDate, endDate),
        sections: {
          creditRiskAnalysis,
          marketRiskAnalysis,
          operationalRiskAnalysis,
          riskTrends
        }
      }
    });
  })
);

/**
 * GET /api/reports/compliance/regulatory
 * Generate regulatory compliance report
 */
router.get('/compliance/regulatory',
  requirePermission('generate_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const framework = req.query.framework as string;
    const asOfDate = req.query.asOfDate 
      ? new Date(req.query.asOfDate as string)
      : new Date();

    const filter: any = {};
    if (framework) {
      filter.regulatoryFramework = framework;
    }

    const complianceData = await ComplianceStatus.find(filter)
      .sort({ regulatoryFramework: 1, requirement: 1 });

    // Group by framework
    const frameworkReports = complianceData.reduce((acc, item) => {
      if (!acc[item.regulatoryFramework]) {
        acc[item.regulatoryFramework] = {
          framework: item.regulatoryFramework,
          requirements: [],
          summary: {
            totalRequirements: 0,
            compliant: 0,
            partiallyCompliant: 0,
            nonCompliant: 0,
            underReview: 0,
            averageCompletion: 0,
            lastAssessment: null as Date | null
          }
        };
      }
      
      acc[item.regulatoryFramework].requirements.push(item);
      acc[item.regulatoryFramework].summary.totalRequirements++;
      
      // Update summary
      const summary = acc[item.regulatoryFramework].summary;
      switch (item.status) {
        case 'compliant': summary.compliant++; break;
        case 'partially_compliant': summary.partiallyCompliant++; break;
        case 'non_compliant': summary.nonCompliant++; break;
        case 'under_review': summary.underReview++; break;
      }
      
      // Update last assessment date
      if (!summary.lastAssessment || item.lastAssessment > summary.lastAssessment) {
        summary.lastAssessment = item.lastAssessment;
      }
      
      return acc;
    }, {} as any);

    // Calculate average completion for each framework
    Object.values(frameworkReports).forEach((report: any) => {
      const totalCompletion = report.requirements.reduce(
        (sum: number, req: any) => sum + req.completionPercentage, 0
      );
      report.summary.averageCompletion = 
        report.requirements.length > 0 ? totalCompletion / report.requirements.length : 0;
    });

    res.json({
      success: true,
      data: {
        reportType: 'regulatory_compliance',
        asOfDate,
        framework: framework || 'all',
        generatedAt: new Date(),
        frameworks: Object.values(frameworkReports),
        overallSummary: {
          totalFrameworks: Object.keys(frameworkReports).length,
          totalRequirements: complianceData.length,
          overallComplianceRate: complianceData.length > 0 
            ? complianceData.filter(c => c.status === 'compliant').length / complianceData.length * 100 
            : 100
        }
      }
    });
  })
);

/**
 * GET /api/reports/portfolio/performance
 * Generate portfolio performance report
 */
router.get('/portfolio/performance',
  requirePermission('generate_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const portfolioId = req.query.portfolioId as string;
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : moment().subtract(90, 'days').toDate();
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    const filter: any = {};
    if (portfolioId) {
      filter.portfolioId = portfolioId;
    }

    const portfolios = await Portfolio.find(filter);
    const portfolioReports = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Get risk assessments for this portfolio
        const riskAssessments = await RiskAssessment.find({
          entityId: portfolio.portfolioId,
          entityType: 'portfolio',
          assessmentDate: { $gte: startDate, $lte: endDate }
        }).sort({ assessmentDate: -1 });

        // Get market risk data
        const marketRisks = await MarketRisk.find({
          portfolioId: portfolio.portfolioId,
          calculatedAt: { $gte: startDate, $lte: endDate }
        }).sort({ calculatedAt: -1 });

        // Calculate performance metrics
        const performanceMetrics = await calculatePortfolioPerformance(portfolio, startDate, endDate);

        return {
          portfolio: {
            id: portfolio.portfolioId,
            name: portfolio.name,
            type: portfolio.type,
            totalValue: portfolio.totalValue,
            manager: portfolio.manager
          },
          riskMetrics: {
            currentRiskScore: riskAssessments[0]?.riskScore || 0,
            riskLevel: riskAssessments[0]?.riskLevel || 'low',
            var95: marketRisks[0]?.value || 0,
            riskTrend: calculateRiskTrend(riskAssessments)
          },
          performanceMetrics,
          riskHistory: riskAssessments.slice(0, 30), // Last 30 assessments
          alerts: await RiskAlert.find({
            entityId: portfolio.portfolioId,
            triggeredAt: { $gte: startDate, $lte: endDate }
          }).countDocuments()
        };
      })
    );

    res.json({
      success: true,
      data: {
        reportType: 'portfolio_performance',
        period: { startDate, endDate },
        portfolioId: portfolioId || 'all',
        generatedAt: new Date(),
        portfolios: portfolioReports,
        summary: {
          totalPortfolios: portfolios.length,
          totalValue: portfolios.reduce((sum, p) => sum + p.totalValue, 0),
          averageRiskScore: portfolioReports.reduce((sum, p) => sum + p.riskMetrics.currentRiskScore, 0) / portfolioReports.length
        }
      }
    });
  })
);

/**
 * GET /api/reports/alerts/analysis
 * Generate alert analysis report
 */
router.get('/alerts/analysis',
  requirePermission('generate_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : moment().subtract(30, 'days').toDate();
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    // Alert volume analysis
    const alertVolume = await RiskAlert.aggregate([
      {
        $match: {
          triggeredAt: { $gte: startDate, $lte: endDate }
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
      { $sort: { '_id.date': 1 } }
    ]);

    // Alert resolution analysis
    const resolutionMetrics = await RiskAlert.aggregate([
      {
        $match: {
          triggeredAt: { $gte: startDate, $lte: endDate },
          resolvedAt: { $exists: true }
        }
      },
      {
        $addFields: {
          resolutionTimeHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$triggeredAt'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $group: {
          _id: '$severity',
          avgResolutionTime: { $avg: '$resolutionTimeHours' },
          minResolutionTime: { $min: '$resolutionTimeHours' },
          maxResolutionTime: { $max: '$resolutionTimeHours' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Category distribution
    const categoryDistribution = await RiskAlert.aggregate([
      {
        $match: {
          triggeredAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$riskCategory',
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reportType: 'alert_analysis',
        period: { startDate, endDate },
        generatedAt: new Date(),
        summary: {
          totalAlerts: await RiskAlert.countDocuments({
            triggeredAt: { $gte: startDate, $lte: endDate }
          }),
          resolvedAlerts: await RiskAlert.countDocuments({
            triggeredAt: { $gte: startDate, $lte: endDate },
            status: 'resolved'
          }),
          activeAlerts: await RiskAlert.countDocuments({
            status: 'active'
          })
        },
        analysis: {
          alertVolume,
          resolutionMetrics,
          categoryDistribution
        }
      }
    });
  })
);

/**
 * POST /api/reports/custom
 * Generate custom report
 */
router.post('/custom',
  requirePermission('generate_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const {
      reportName,
      dataTypes = [],
      filters = {},
      startDate,
      endDate,
      groupBy,
      metrics = []
    } = req.body;

    if (!reportName || dataTypes.length === 0) {
      throw new ValidationError('reportName and dataTypes are required');
    }

    const reportData: any = {
      reportType: 'custom',
      reportName,
      generatedAt: new Date(),
      period: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      filters,
      data: {}
    };

    // Process each requested data type
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'risk_assessments':
          reportData.data.riskAssessments = await getRiskAssessmentsData(filters, startDate, endDate);
          break;
        case 'alerts':
          reportData.data.alerts = await getAlertsData(filters, startDate, endDate);
          break;
        case 'compliance':
          reportData.data.compliance = await getComplianceData(filters);
          break;
        case 'portfolios':
          reportData.data.portfolios = await getPortfoliosData(filters);
          break;
        case 'transactions':
          reportData.data.transactions = await getTransactionsData(filters, startDate, endDate);
          break;
      }
    }

    res.json({
      success: true,
      data: reportData
    });
  })
);

// Helper functions

async function generateRiskSummary(startDate: Date, endDate: Date) {
  const [
    totalAssessments,
    highRiskCount,
    criticalRiskCount,
    riskTrends
  ] = await Promise.all([
    RiskAssessment.countDocuments({
      assessmentDate: { $gte: startDate, $lte: endDate }
    }),
    RiskAssessment.countDocuments({
      assessmentDate: { $gte: startDate, $lte: endDate },
      riskLevel: 'high'
    }),
    RiskAssessment.countDocuments({
      assessmentDate: { $gte: startDate, $lte: endDate },
      riskLevel: 'critical'
    }),
    RiskAssessment.aggregate([
      {
        $match: {
          assessmentDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$riskType',
          avgScore: { $avg: '$riskScore' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    totalAssessments,
    highRiskCount,
    criticalRiskCount,
    riskTrends
  };
}

async function generateComplianceSummary() {
  const complianceData = await ComplianceStatus.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = complianceData.reduce((sum, item) => sum + item.count, 0);
  const compliant = complianceData.find(item => item._id === 'compliant')?.count || 0;

  return {
    totalRequirements: total,
    compliantRequirements: compliant,
    complianceRate: total > 0 ? (compliant / total) * 100 : 100,
    statusBreakdown: complianceData
  };
}

async function generateAlertSummary(startDate: Date, endDate: Date) {
  return await RiskAlert.aggregate([
    {
      $match: {
        triggeredAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);
}

async function generatePortfolioSummary() {
  return await Portfolio.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalValue' }
      }
    }
  ]);
}

async function generateCreditRiskAnalysis(startDate: Date, endDate: Date) {
  return await CreditRisk.aggregate([
    {
      $match: {
        calculatedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalECL: { $sum: '$expectedCreditLoss' },
        avgPD: { $avg: '$probabilityOfDefault' },
        avgLGD: { $avg: '$lossGivenDefault' }
      }
    }
  ]);
}

async function generateMarketRiskAnalysis(startDate: Date, endDate: Date) {
  return await MarketRisk.aggregate([
    {
      $match: {
        calculatedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$method',
        avgVaR: { $avg: '$value' },
        maxVaR: { $max: '$value' },
        count: { $sum: 1 }
      }
    }
  ]);
}

async function generateOperationalRiskAnalysis(startDate: Date, endDate: Date) {
  return await OperationalRisk.aggregate([
    {
      $match: {
        eventDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$riskCategory',
        count: { $sum: 1 },
        totalLoss: { $sum: '$netLoss' },
        avgLoss: { $avg: '$netLoss' }
      }
    }
  ]);
}

async function generateRiskTrends(startDate: Date, endDate: Date) {
  return await RiskAssessment.aggregate([
    {
      $match: {
        assessmentDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$assessmentDate' } },
          riskType: '$riskType'
        },
        avgScore: { $avg: '$riskScore' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
}

async function generateExecutiveSummary(startDate: Date, endDate: Date) {
  const keyMetrics = await Promise.all([
    RiskAssessment.countDocuments({ riskLevel: { $in: ['high', 'critical'] } }),
    RiskAlert.countDocuments({ status: 'active', severity: { $in: ['high', 'critical'] } }),
    ComplianceStatus.countDocuments({ status: 'non_compliant' })
  ]);

  return {
    highRiskItems: keyMetrics[0],
    criticalAlerts: keyMetrics[1],
    nonCompliantItems: keyMetrics[2],
    overallRiskStatus: keyMetrics[0] > 10 ? 'elevated' : 'normal'
  };
}

async function calculatePortfolioPerformance(portfolio: any, startDate: Date, endDate: Date) {
  // This would integrate with actual performance data
  // For now, return sample calculations
  return {
    return: 0.05, // 5% return
    volatility: 0.15, // 15% volatility
    sharpeRatio: 0.33,
    maxDrawdown: 0.08,
    var95: portfolio.totalValue * 0.02
  };
}

function calculateRiskTrend(assessments: any[]): 'improving' | 'stable' | 'deteriorating' {
  if (assessments.length < 2) return 'stable';
  
  const recent = assessments[0].riskScore;
  const previous = assessments[1].riskScore;
  
  if (recent < previous - 5) return 'improving';
  if (recent > previous + 5) return 'deteriorating';
  return 'stable';
}

async function getRiskAssessmentsData(filters: any, startDate?: string, endDate?: string) {
  const filter: any = { ...filters };
  if (startDate || endDate) {
    filter.assessmentDate = {};
    if (startDate) filter.assessmentDate.$gte = new Date(startDate);
    if (endDate) filter.assessmentDate.$lte = new Date(endDate);
  }
  
  return await RiskAssessment.find(filter).limit(1000);
}

async function getAlertsData(filters: any, startDate?: string, endDate?: string) {
  const filter: any = { ...filters };
  if (startDate || endDate) {
    filter.triggeredAt = {};
    if (startDate) filter.triggeredAt.$gte = new Date(startDate);
    if (endDate) filter.triggeredAt.$lte = new Date(endDate);
  }
  
  return await RiskAlert.find(filter).limit(1000);
}

async function getComplianceData(filters: any) {
  return await ComplianceStatus.find(filters).limit(1000);
}

async function getPortfoliosData(filters: any) {
  return await Portfolio.find(filters).limit(1000);
}

async function getTransactionsData(filters: any, startDate?: string, endDate?: string) {
  const filter: any = { ...filters };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  return await Transaction.find(filter).limit(1000);
}

export default router;