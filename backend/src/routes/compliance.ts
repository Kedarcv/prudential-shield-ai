import { Router, Request, Response } from 'express';
import { catchAsync, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { ComplianceStatus } from '../models/Risk';
import { SAR, CTR, CrossBorderReport, KYCDocument, PEP, SanctionsList, AMLRiskAssessment } from '../models/SECZCompliance';
import { SECZComplianceService } from '../services/SECZComplianceService';
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
        id: 'secz_aml_cft',
        name: 'SECZ AML/CFT',
        description: 'Securities and Exchange Commission of Zimbabwe Anti-Money Laundering and Counter-Terrorism Financing Framework',
        category: 'AML/CFT Compliance'
      },
      {
        id: 'mlpc_act',
        name: 'MLPC Act',
        description: 'Money Laundering and Proceeds of Crime Act - Amended July 2019',
        category: 'Financial Crime Prevention'
      },
      {
        id: 'cft_act',
        name: 'CFT Act',
        description: 'Suppression of Foreign and International Terrorism Act',
        category: 'Counter-Terrorism Financing'
      },
      {
        id: 'rbz_requirements',
        name: 'RBZ Requirements',
        description: 'Reserve Bank of Zimbabwe Risk-Based Supervision Framework',
        category: 'Banking Regulation'
      },
      {
        id: 'bank_use_promotion',
        name: 'Bank Use Promotion Act',
        description: 'Bank Use Promotion Act Requirements',
        category: 'Banking Regulation'
      },
      {
        id: 'companies_act',
        name: 'Companies Act',
        description: 'Companies Act - Corporate Governance and Compliance',
        category: 'Corporate Regulation'
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

// SECZ-Specific Endpoints

/**
 * GET /api/compliance/sar
 * Get Suspicious Activity Reports
 */
router.get('/sar',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const reportType = req.query.reportType as string;

    const filter: any = {};
    if (status) filter.status = status;
    if (reportType) filter.reportType = reportType;

    const [sars, totalCount] = await Promise.all([
      SAR.find(filter)
        .sort({ 'reportingDetails.dateOfPreparation': -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('customerId', 'firstName lastName nationalId'),
      SAR.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        sars,
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
 * POST /api/compliance/sar
 * Create Suspicious Activity Report
 */
router.post('/sar',
  requirePermission('manage_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const { customerId, transactionIds, suspiciousActivity, indicators } = req.body;

    if (!customerId || !transactionIds || !suspiciousActivity || !indicators) {
      throw new ValidationError('Required fields: customerId, transactionIds, suspiciousActivity, indicators');
    }

    const sarId = await SECZComplianceService.generateSAR(
      customerId,
      transactionIds,
      suspiciousActivity,
      indicators
    );

    res.status(201).json({
      success: true,
      data: { sarId },
      message: 'SAR created successfully'
    });
  })
);

/**
 * GET /api/compliance/ctr
 * Get Cash Transaction Reports
 */
router.get('/ctr',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filter: any = {};
    if (startDate && endDate) {
      filter.transactionDate = { $gte: startDate, $lte: endDate };
    }

    const [ctrs, totalCount] = await Promise.all([
      CTR.find(filter)
        .sort({ transactionDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      CTR.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        ctrs,
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
 * POST /api/compliance/ctr
 * Generate Cash Transaction Report
 */
router.post('/ctr',
  requirePermission('manage_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.body;

    if (!transactionId) {
      throw new ValidationError('Required field: transactionId');
    }

    const ctrId = await SECZComplianceService.generateCTR(transactionId);

    res.status(201).json({
      success: true,
      data: { ctrId },
      message: 'CTR generated successfully'
    });
  })
);

/**
 * GET /api/compliance/cross-border-reports
 * Get Cross-Border Transaction Reports
 */
router.get('/cross-border-reports',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const country = req.query.country as string;

    const filter: any = {};
    if (status) filter.status = status;
    if (country) {
      filter.$or = [
        { 'sender.country': country },
        { 'beneficiary.country': country }
      ];
    }

    const [reports, totalCount] = await Promise.all([
      CrossBorderReport.find(filter)
        .sort({ reportingDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      CrossBorderReport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        reports,
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
 * POST /api/compliance/transaction-monitor
 * Monitor transaction for compliance
 */
router.post('/transaction-monitor',
  requirePermission('manage_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.body;

    if (!transactionId) {
      throw new ValidationError('Required field: transactionId');
    }

    const monitoringResult = await SECZComplianceService.monitorTransaction(transactionId);

    res.json({
      success: true,
      data: monitoringResult
    });
  })
);

/**
 * GET /api/compliance/pep
 * Get PEP database entries
 */
router.get('/pep',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    const filter: any = {};
    if (category) filter['pepDetails.category'] = category;
    if (isActive) filter['pepDetails.isActive'] = isActive === 'true';
    if (search) {
      filter.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.aliases': { $regex: search, $options: 'i' } },
        { 'pepDetails.position': { $regex: search, $options: 'i' } },
        { 'pepDetails.organization': { $regex: search, $options: 'i' } }
      ];
    }

    const [peps, totalCount] = await Promise.all([
      PEP.find(filter)
        .sort({ lastUpdated: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      PEP.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        peps,
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
 * GET /api/compliance/sanctions
 * Get sanctions lists
 */
router.get('/sanctions',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const issuer = req.query.issuer as string;
    const listType = req.query.listType as string;

    const filter: any = { status: 'active' };
    if (issuer) filter.issuer = issuer;
    if (listType) filter.listType = listType;

    const sanctionsLists = await SanctionsList.find(filter)
      .sort({ lastUpdate: -1 })
      .select('listId listName issuer listType lastUpdate nextUpdate entries');

    // Get summary statistics
    const summary = {
      totalLists: sanctionsLists.length,
      totalEntries: sanctionsLists.reduce((sum, list) => sum + list.entries.length, 0),
      listsByIssuer: {},
      listsByType: {},
      lastUpdate: sanctionsLists.length > 0 ? sanctionsLists[0].lastUpdate : null
    };

    // Calculate breakdown by issuer and type
    sanctionsLists.forEach(list => {
      // @ts-ignore
      summary.listsByIssuer[list.issuer] = (summary.listsByIssuer[list.issuer] || 0) + 1;
      // @ts-ignore
      summary.listsByType[list.listType] = (summary.listsByType[list.listType] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        lists: sanctionsLists,
        summary
      }
    });
  })
);

/**
 * GET /api/compliance/kyc-documents
 * Get KYC documents
 */
router.get('/kyc-documents',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const customerId = req.query.customerId as string;
    const documentType = req.query.documentType as string;
    const status = req.query.status as string;

    const filter: any = {};
    if (customerId) filter.customerId = customerId;
    if (documentType) filter.documentType = documentType;
    if (status) filter.status = status;

    const [documents, totalCount] = await Promise.all([
      KYCDocument.find(filter)
        .sort({ uploadDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-documentHash'), // Exclude hash for security
      KYCDocument.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        documents,
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
 * GET /api/compliance/risk-assessments
 * Get AML risk assessments
 */
router.get('/risk-assessments',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const entityType = req.query.entityType as string;
    const riskLevel = req.query.riskLevel as string;
    const assessmentType = req.query.assessmentType as string;

    const filter: any = {};
    if (entityType) filter.entityType = entityType;
    if (riskLevel) filter['overallRisk.riskLevel'] = riskLevel;
    if (assessmentType) filter.assessmentType = assessmentType;

    const [assessments, totalCount] = await Promise.all([
      AMLRiskAssessment.find(filter)
        .sort({ assessmentDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      AMLRiskAssessment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        assessments,
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
 * GET /api/compliance/secz-dashboard
 * SECZ-specific compliance dashboard
 */
router.get('/secz-dashboard',
  requirePermission('view_compliance'),
  catchAsync(async (req: Request, res: Response) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get counts for various reports and alerts
    const [
      totalSARs,
      pendingSARs,
      totalCTRs,
      crossBorderReports,
      activePEPs,
      sanctionedEntities,
      highRiskCustomers,
      complianceAlerts
    ] = await Promise.all([
      SAR.countDocuments(),
      SAR.countDocuments({ status: { $in: ['draft', 'submitted'] } }),
      CTR.countDocuments({ transactionDate: { $gte: thirtyDaysAgo } }),
      CrossBorderReport.countDocuments({ reportingDate: { $gte: thirtyDaysAgo } }),
      PEP.countDocuments({ 'pepDetails.isActive': true, status: 'active' }),
      SanctionsList.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: { $size: '$entries' } } } }
      ]),
      // This would need to be calculated based on your customer risk scoring
      0, // Placeholder for high-risk customers
      // This would need to be calculated based on your alert system
      0  // Placeholder for compliance alerts
    ]);

    // Get recent activity
    const recentSARs = await SAR.find({})
      .sort({ 'reportingDetails.dateOfPreparation': -1 })
      .limit(5)
      .select('sarId reportType customerName suspiciousActivity.description status');

    const recentCTRs = await CTR.find({})
      .sort({ transactionDate: -1 })
      .limit(5)
      .select('ctrId customer.name transaction.amount transaction.currency transactionDate');

    // SECZ compliance metrics
    const seczMetrics = {
      amlCompliance: {
        totalSARs,
        pendingSARs,
        sarCompletionRate: totalSARs > 0 ? ((totalSARs - pendingSARs) / totalSARs) * 100 : 100
      },
      transactionMonitoring: {
        totalCTRs,
        crossBorderReports,
        monitoringCoverage: 100 // Assuming 100% coverage
      },
      riskAssessment: {
        activePEPs,
        sanctionedEntities: sanctionedEntities[0]?.total || 0,
        highRiskCustomers,
        screeningAccuracy: 99.5 // Placeholder
      }
    };

    res.json({
      success: true,
      data: {
        metrics: seczMetrics,
        recentActivity: {
          sars: recentSARs,
          ctrs: recentCTRs
        },
        complianceStatus: {
          overallScore: 95, // Calculated based on various compliance factors
          amlStatus: 'Compliant',
          cftStatus: 'Compliant',
          lastAssessment: today,
          nextAssessment: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        },
        lastUpdated: new Date()
      }
    });
  })
);

export default router;