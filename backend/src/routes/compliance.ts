import { Router, Request, Response } from 'express';
import { catchAsync, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { ComplianceStatus } from '../models/Risk';
import { requirePermission } from '../middleware/auth';
import moment from 'moment';

const router = Router();

/**
 * GET /api/compliance/status
 * Get overall compliance status
 */
router.get('/status', 
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const framework = req.query.framework as string;
    
    const filter: any = {};
    if (framework) {
      filter.regulatoryFramework = framework;
    }

    const complianceStatuses = await ComplianceStatus.find(filter)
      .sort({ regulatoryFramework: 1, requirement: 1 });

    // Group by framework
    const grouped = complianceStatuses.reduce((acc, status) => {
      if (!acc[status.regulatoryFramework]) {
        acc[status.regulatoryFramework] = {
          framework: status.regulatoryFramework,
          requirements: [],
          summary: {
            totalRequirements: 0,
            compliant: 0,
            partiallyCompliant: 0,
            nonCompliant: 0,
            underReview: 0,
            averageCompletion: 0
          }
        };
      }
      
      acc[status.regulatoryFramework].requirements.push(status);
      acc[status.regulatoryFramework].summary.totalRequirements++;
      
      switch (status.status) {
        case 'compliant':
          acc[status.regulatoryFramework].summary.compliant++;
          break;
        case 'partially_compliant':
          acc[status.regulatoryFramework].summary.partiallyCompliant++;
          break;
        case 'non_compliant':
          acc[status.regulatoryFramework].summary.nonCompliant++;
          break;
        case 'under_review':
          acc[status.regulatoryFramework].summary.underReview++;
          break;
      }
      
      return acc;
    }, {} as any);

    // Calculate average completion for each framework
    Object.values(grouped).forEach((framework: any) => {
      const totalCompletion = framework.requirements.reduce(
        (sum: number, req: any) => sum + req.completionPercentage, 0
      );
      framework.summary.averageCompletion = 
        framework.requirements.length > 0 ? totalCompletion / framework.requirements.length : 0;
    });

    res.json({
      success: true,
      data: {
        frameworks: Object.values(grouped),
        summary: {
          totalFrameworks: Object.keys(grouped).length,
          totalRequirements: complianceStatuses.length,
          overallCompletion: complianceStatuses.length > 0 
            ? complianceStatuses.reduce((sum, s) => sum + s.completionPercentage, 0) / complianceStatuses.length 
            : 0
        }
      }
    });
  })
);

/**
 * GET /api/compliance/frameworks
 * Get list of regulatory frameworks
 */
router.get('/frameworks',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const frameworks = [
      {
        id: 'basel_iii',
        name: 'Basel III',
        description: 'International regulatory accord on bank capital adequacy, stress testing, and market liquidity risk',
        category: 'Capital & Liquidity'
      },
      {
        id: 'ifrs_9',
        name: 'IFRS 9',
        description: 'International Financial Reporting Standard for Financial Instruments',
        category: 'Accounting & Reporting'
      },
      {
        id: 'ccar',
        name: 'CCAR',
        description: 'Comprehensive Capital Analysis and Review',
        category: 'Stress Testing'
      },
      {
        id: 'rbz_requirements',
        name: 'RBZ Requirements',
        description: 'Reserve Bank of Zimbabwe regulatory requirements',
        category: 'Local Regulation'
      },
      {
        id: 'aml_cft',
        name: 'AML/CFT',
        description: 'Anti-Money Laundering and Combating the Financing of Terrorism',
        category: 'Financial Crime'
      }
    ];

    // Get counts for each framework
    const frameworkCounts = await ComplianceStatus.aggregate([
      {
        $group: {
          _id: '$regulatoryFramework',
          count: { $sum: 1 },
          compliant: {
            $sum: { $cond: [{ $eq: ['$status', 'compliant'] }, 1, 0] }
          },
          averageCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]);

    const enrichedFrameworks = frameworks.map(framework => {
      const stats = frameworkCounts.find(count => count._id === framework.id);
      return {
        ...framework,
        totalRequirements: stats?.count || 0,
        compliantRequirements: stats?.compliant || 0,
        averageCompletion: stats?.averageCompletion || 0
      };
    });

    res.json({
      success: true,
      data: enrichedFrameworks
    });
  })
);

/**
 * GET /api/compliance/requirements/:framework
 * Get requirements for specific framework
 */
router.get('/requirements/:framework',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const framework = req.params.framework;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const filter: any = { regulatoryFramework: framework };
    if (status) {
      filter.status = status;
    }

    const [requirements, totalCount] = await Promise.all([
      ComplianceStatus.find(filter)
        .sort({ requirement: 1 })
        .limit(limit)
        .skip((page - 1) * limit),
      ComplianceStatus.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        framework,
        requirements,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * POST /api/compliance/requirements
 * Create new compliance requirement
 */
router.post('/requirements',
  requirePermission('manage_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const {
      regulatoryFramework,
      requirement,
      description,
      status,
      completionPercentage,
      responsibleParty,
      nextAssessment,
      remedialActions = [],
      evidence = []
    } = req.body;

    if (!regulatoryFramework || !requirement || !description || !status || 
        completionPercentage === undefined || !responsibleParty) {
      throw new ValidationError('Required fields: regulatoryFramework, requirement, description, status, completionPercentage, responsibleParty');
    }

    const complianceStatus = new ComplianceStatus({
      regulatoryFramework,
      requirement,
      description,
      status,
      completionPercentage,
      lastAssessment: new Date(),
      nextAssessment: nextAssessment ? new Date(nextAssessment) : moment().add(1, 'month').toDate(),
      responsibleParty,
      remedialActions,
      evidence
    });

    await complianceStatus.save();

    res.status(201).json({
      success: true,
      data: complianceStatus
    });
  })
);

/**
 * PUT /api/compliance/requirements/:id
 * Update compliance requirement
 */
router.put('/requirements/:id',
  requirePermission('manage_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const {
      status,
      completionPercentage,
      responsibleParty,
      nextAssessment,
      remedialActions,
      evidence
    } = req.body;

    const updateData: any = { lastAssessment: new Date() };
    
    if (status) updateData.status = status;
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;
    if (responsibleParty) updateData.responsibleParty = responsibleParty;
    if (nextAssessment) updateData.nextAssessment = new Date(nextAssessment);
    if (remedialActions) updateData.remedialActions = remedialActions;
    if (evidence) updateData.evidence = evidence;

    const requirement = await ComplianceStatus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!requirement) {
      throw new NotFoundError('Compliance Requirement');
    }

    res.json({
      success: true,
      data: requirement
    });
  })
);

/**
 * GET /api/compliance/assessments/due
 * Get assessments due soon
 */
router.get('/assessments/due',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const dueDate = moment().add(days, 'days').toDate();

    const dueAssessments = await ComplianceStatus.find({
      nextAssessment: { $lte: dueDate },
      status: { $ne: 'compliant' }
    }).sort({ nextAssessment: 1 });

    // Group by urgency
    const now = new Date();
    const grouped = {
      overdue: dueAssessments.filter(a => a.nextAssessment < now),
      dueThisWeek: dueAssessments.filter(a => 
        a.nextAssessment >= now && 
        a.nextAssessment <= moment().add(7, 'days').toDate()
      ),
      dueThisMonth: dueAssessments.filter(a => 
        a.nextAssessment > moment().add(7, 'days').toDate() && 
        a.nextAssessment <= moment().add(30, 'days').toDate()
      )
    };

    res.json({
      success: true,
      data: {
        summary: {
          total: dueAssessments.length,
          overdue: grouped.overdue.length,
          dueThisWeek: grouped.dueThisWeek.length,
          dueThisMonth: grouped.dueThisMonth.length
        },
        assessments: grouped
      }
    });
  })
);

/**
 * GET /api/compliance/reports/summary
 * Generate compliance summary report
 */
router.get('/reports/summary',
  requirePermission('generate_compliance_reports'),
  catchAsync(async (req: Request, res: Response) => {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : moment().subtract(1, 'month').toDate();
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate as string)
      : new Date();

    // Get compliance status changes in the period
    const complianceChanges = await ComplianceStatus.find({
      lastAssessment: { $gte: startDate, $lte: endDate }
    }).sort({ lastAssessment: -1 });

    // Calculate metrics
    const metrics = {
      totalRequirements: await ComplianceStatus.countDocuments(),
      compliantRequirements: await ComplianceStatus.countDocuments({ status: 'compliant' }),
      nonCompliantRequirements: await ComplianceStatus.countDocuments({ status: 'non_compliant' }),
      partiallyCompliantRequirements: await ComplianceStatus.countDocuments({ status: 'partially_compliant' }),
      underReviewRequirements: await ComplianceStatus.countDocuments({ status: 'under_review' }),
      assessmentsInPeriod: complianceChanges.length
    };

    // Calculate compliance ratio
    const complianceRatio = metrics.totalRequirements > 0 
      ? (metrics.compliantRequirements / metrics.totalRequirements) * 100 
      : 100;

    // Get framework-wise breakdown
    const frameworkBreakdown = await ComplianceStatus.aggregate([
      {
        $group: {
          _id: '$regulatoryFramework',
          total: { $sum: 1 },
          compliant: { $sum: { $cond: [{ $eq: ['$status', 'compliant'] }, 1, 0] } },
          averageCompletion: { $avg: '$completionPercentage' }
        }
      },
      {
        $addFields: {
          complianceRate: { $multiply: [{ $divide: ['$compliant', '$total'] }, 100] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        reportPeriod: { startDate, endDate },
        metrics: {
          ...metrics,
          complianceRatio: Math.round(complianceRatio * 100) / 100
        },
        frameworkBreakdown,
        recentChanges: complianceChanges.slice(0, 10), // Last 10 changes
        generatedAt: new Date()
      }
    });
  })
);

/**
 * POST /api/compliance/assessments/:id/complete
 * Mark assessment as complete
 */
router.post('/assessments/:id/complete',
  requirePermission('manage_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const { status, completionPercentage, evidence = [], remedialActions = [] } = req.body;

    if (!status || completionPercentage === undefined) {
      throw new ValidationError('Required fields: status, completionPercentage');
    }

    const requirement = await ComplianceStatus.findByIdAndUpdate(
      req.params.id,
      {
        status,
        completionPercentage,
        lastAssessment: new Date(),
        nextAssessment: moment().add(
          status === 'compliant' ? 3 : 1, // 3 months if compliant, 1 month otherwise
          'months'
        ).toDate(),
        evidence: evidence.length > 0 ? evidence : undefined,
        remedialActions: remedialActions.length > 0 ? remedialActions : undefined
      },
      { new: true, runValidators: true }
    );

    if (!requirement) {
      throw new NotFoundError('Compliance Requirement');
    }

    res.json({
      success: true,
      data: requirement,
      message: 'Assessment completed successfully'
    });
  })
);

/**
 * GET /api/compliance/dashboard
 * Get compliance dashboard data
 */
router.get('/dashboard',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    // Get summary statistics
    const [
      totalRequirements,
      compliantCount,
      nonCompliantCount,
      partiallyCompliantCount,
      underReviewCount,
      overdueAssessments
    ] = await Promise.all([
      ComplianceStatus.countDocuments(),
      ComplianceStatus.countDocuments({ status: 'compliant' }),
      ComplianceStatus.countDocuments({ status: 'non_compliant' }),
      ComplianceStatus.countDocuments({ status: 'partially_compliant' }),
      ComplianceStatus.countDocuments({ status: 'under_review' }),
      ComplianceStatus.countDocuments({
        nextAssessment: { $lt: new Date() },
        status: { $ne: 'compliant' }
      })
    ]);

    // Get recent activity
    const recentActivity = await ComplianceStatus.find({})
      .sort({ lastAssessment: -1 })
      .limit(10)
      .select('requirement regulatoryFramework status lastAssessment responsibleParty');

    // Get framework completion rates
    const frameworkStats = await ComplianceStatus.aggregate([
      {
        $group: {
          _id: '$regulatoryFramework',
          total: { $sum: 1 },
          compliant: { $sum: { $cond: [{ $eq: ['$status', 'compliant'] }, 1, 0] } },
          avgCompletion: { $avg: '$completionPercentage' }
        }
      },
      {
        $addFields: {
          completionRate: { $multiply: [{ $divide: ['$compliant', '$total'] }, 100] }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRequirements,
          compliantCount,
          nonCompliantCount,
          partiallyCompliantCount,
          underReviewCount,
          overdueAssessments,
          overallComplianceRate: totalRequirements > 0 
            ? Math.round((compliantCount / totalRequirements) * 100 * 100) / 100 
            : 100
        },
        frameworkStats,
        recentActivity,
        lastUpdated: new Date()
      }
    });
  })
);

export default router;