import { Router, Request, Response } from 'express';
import { catchAsync, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { RiskCalculationService } from '../services/RiskCalculationService';
import { 
  RiskAssessment, 
  CreditRisk, 
  MarketRisk, 
  OperationalRisk,
  LiquidityRisk
} from '../models/Risk';
import { Portfolio, Customer } from '../models/User';
import { requirePermission } from '../middleware/auth';

const router = Router();
const riskCalculationService = RiskCalculationService.getInstance();

/**
 * POST /api/risk/credit/calculate
 * Calculate credit risk for a borrower
 */
router.post('/credit/calculate', 
  requirePermission('calculate_credit_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const {
      borrowerId,
      facilityId,
      exposureAmount,
      collateralValue,
      creditRating,
      industryCode,
      maturityDate,
      paymentHistory,
      financialMetrics
    } = req.body;

    // Validate required fields
    if (!borrowerId || !facilityId || !exposureAmount || paymentHistory === undefined || !financialMetrics) {
      throw new ValidationError('Required fields: borrowerId, facilityId, exposureAmount, paymentHistory, financialMetrics');
    }

    // Verify borrower exists
    const borrower = await Customer.findOne({ customerId: borrowerId });
    if (!borrower) {
      throw new NotFoundError('Borrower');
    }

    const params = {
      borrowerId,
      facilityId,
      exposureAmount,
      collateralValue: collateralValue || 0,
      creditRating,
      industryCode,
      maturityDate: new Date(maturityDate),
      paymentHistory,
      financialMetrics
    };

    const creditRisk = await riskCalculationService.calculateCreditRisk(params);

    res.json({
      success: true,
      data: {
        creditRisk: {
          id: creditRisk._id,
          borrowerId: creditRisk.borrowerId,
          facilityId: creditRisk.facilityId,
          probabilityOfDefault: creditRisk.probabilityOfDefault,
          lossGivenDefault: creditRisk.lossGivenDefault,
          exposureAtDefault: creditRisk.exposureAtDefault,
          expectedCreditLoss: creditRisk.expectedCreditLoss,
          stage: creditRisk.stage,
          creditRating: creditRisk.creditRating,
          calculatedAt: creditRisk.calculatedAt
        }
      }
    });
  })
);

/**
 * POST /api/risk/market/var
 * Calculate Value at Risk for a portfolio
 */
router.post('/market/var',
  requirePermission('calculate_market_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const {
      portfolioId,
      positions,
      timeHorizon = 1,
      confidenceLevel = 0.95,
      method = 'historical'
    } = req.body;

    if (!portfolioId || !positions || !Array.isArray(positions)) {
      throw new ValidationError('Required fields: portfolioId, positions (array)');
    }

    // Verify portfolio exists
    const portfolio = await Portfolio.findOne({ portfolioId });
    if (!portfolio) {
      throw new NotFoundError('Portfolio');
    }

    const params = {
      portfolioId,
      positions: positions.map((p: any) => ({
        assetId: p.assetId,
        quantity: p.quantity,
        currentPrice: p.currentPrice,
        assetType: p.assetType,
        beta: p.beta || 1.0
      })),
      timeHorizon,
      confidenceLevel,
      method: method as 'historical' | 'parametric' | 'monte_carlo'
    };

    const varResult = await riskCalculationService.calculateMarketRisk(params);

    res.json({
      success: true,
      data: varResult
    });
  })
);

/**
 * POST /api/risk/stress-test
 * Perform stress testing on a portfolio
 */
router.post('/stress-test',
  requirePermission('perform_stress_test'),
  catchAsync(async (req: Request, res: Response) => {
    const { portfolioId, scenarios } = req.body;

    if (!portfolioId || !scenarios || !Array.isArray(scenarios)) {
      throw new ValidationError('Required fields: portfolioId, scenarios (array)');
    }

    // Verify portfolio exists
    const portfolio = await Portfolio.findOne({ portfolioId });
    if (!portfolio) {
      throw new NotFoundError('Portfolio');
    }

    const results = await riskCalculationService.performStressTest(portfolioId, scenarios);

    res.json({
      success: true,
      data: {
        portfolioId,
        stressTestResults: results,
        executedAt: new Date()
      }
    });
  })
);

/**
 * GET /api/risk/assessments
 * Get risk assessments with filtering and pagination
 */
router.get('/assessments', 
  requirePermission('view_risk_assessments'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const entityType = req.query.entityType as string;
    const riskType = req.query.riskType as string;
    const riskLevel = req.query.riskLevel as string;
    const status = req.query.status as string || 'active';

    const filter: any = { status };
    if (entityType) filter.entityType = entityType;
    if (riskType) filter.riskType = riskType;
    if (riskLevel) filter.riskLevel = riskLevel;

    const [assessments, totalCount] = await Promise.all([
      RiskAssessment.find(filter)
        .sort({ assessmentDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      RiskAssessment.countDocuments(filter)
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
 * GET /api/risk/assessments/:id
 * Get specific risk assessment
 */
router.get('/assessments/:id',
  requirePermission('view_risk_assessments'),
  catchAsync(async (req: Request, res: Response) => {
    const assessment = await RiskAssessment.findById(req.params.id);
    
    if (!assessment) {
      throw new NotFoundError('Risk Assessment');
    }

    res.json({
      success: true,
      data: assessment
    });
  })
);

/**
 * PUT /api/risk/assessments/:id
 * Update risk assessment
 */
router.put('/assessments/:id',
  requirePermission('update_risk_assessments'),
  catchAsync(async (req: Request, res: Response) => {
    const { mitigationMeasures, status, nextReviewDate } = req.body;
    
    const assessment = await RiskAssessment.findByIdAndUpdate(
      req.params.id,
      {
        ...(mitigationMeasures && { mitigationMeasures }),
        ...(status && { status }),
        ...(nextReviewDate && { nextReviewDate: new Date(nextReviewDate) })
      },
      { new: true, runValidators: true }
    );

    if (!assessment) {
      throw new NotFoundError('Risk Assessment');
    }

    res.json({
      success: true,
      data: assessment
    });
  })
);

/**
 * GET /api/risk/credit
 * Get credit risk data with filtering
 */
router.get('/credit',
  requirePermission('view_credit_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const stage = req.query.stage ? parseInt(req.query.stage as string) : undefined;
    const borrowerId = req.query.borrowerId as string;

    const filter: any = {};
    if (stage) filter.stage = stage;
    if (borrowerId) filter.borrowerId = borrowerId;

    const [creditRisks, totalCount] = await Promise.all([
      CreditRisk.find(filter)
        .sort({ calculatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      CreditRisk.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        creditRisks,
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
 * GET /api/risk/market
 * Get market risk data with filtering
 */
router.get('/market',
  requirePermission('view_market_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const portfolioId = req.query.portfolioId as string;
    const riskMetric = req.query.riskMetric as string;

    const filter: any = {};
    if (portfolioId) filter.portfolioId = portfolioId;
    if (riskMetric) filter.riskMetric = riskMetric;

    const [marketRisks, totalCount] = await Promise.all([
      MarketRisk.find(filter)
        .sort({ calculatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      MarketRisk.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        marketRisks,
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
 * GET /api/risk/operational
 * Get operational risk events
 */
router.get('/operational',
  requirePermission('view_operational_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const businessLine = req.query.businessLine as string;
    const status = req.query.status as string;
    const riskCategory = req.query.riskCategory as string;

    const filter: any = {};
    if (businessLine) filter.businessLine = businessLine;
    if (status) filter.status = status;
    if (riskCategory) filter.riskCategory = riskCategory;

    const [operationalRisks, totalCount] = await Promise.all([
      OperationalRisk.find(filter)
        .sort({ eventDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      OperationalRisk.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        operationalRisks,
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
 * POST /api/risk/operational
 * Report new operational risk event
 */
router.post('/operational',
  requirePermission('create_operational_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const {
      businessLine,
      eventType,
      lossAmount,
      recoveryAmount = 0,
      eventDate,
      riskCategory,
      description,
      rootCause,
      correctiveActions = []
    } = req.body;

    if (!businessLine || !eventType || lossAmount === undefined || !eventDate || !riskCategory || !description) {
      throw new ValidationError('Required fields: businessLine, eventType, lossAmount, eventDate, riskCategory, description');
    }

    const operationalRisk = new OperationalRisk({
      businessLine,
      eventType,
      lossAmount,
      recoveryAmount,
      netLoss: lossAmount - recoveryAmount,
      eventDate: new Date(eventDate),
      reportedDate: new Date(),
      riskCategory,
      description,
      rootCause,
      correctiveActions,
      status: 'reported'
    });

    await operationalRisk.save();

    res.status(201).json({
      success: true,
      data: operationalRisk
    });
  })
);

/**
 * GET /api/risk/liquidity/ratios
 * Get liquidity risk ratios
 */
router.get('/liquidity/ratios',
  requirePermission('view_liquidity_risk'),
  catchAsync(async (req: Request, res: Response) => {
    // In production, these would be calculated from actual balance sheet data
    const ratios = {
      liquidityCoverageRatio: {
        current: 142.5,
        minimum: 100,
        status: 'compliant',
        trend: 'stable'
      },
      netStableFundingRatio: {
        current: 118.3,
        minimum: 100,
        status: 'compliant',
        trend: 'improving'
      },
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: ratios
    });
  })
);

/**
 * POST /api/risk/liquidity/calculate-lcr
 * Calculate Liquidity Coverage Ratio
 */
router.post('/liquidity/calculate-lcr',
  requirePermission('calculate_liquidity_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const { highQualityLiquidAssets, totalNetCashOutflows } = req.body;

    if (highQualityLiquidAssets === undefined || totalNetCashOutflows === undefined) {
      throw new ValidationError('Required fields: highQualityLiquidAssets, totalNetCashOutflows');
    }

    const lcr = await riskCalculationService.calculateLCR(
      highQualityLiquidAssets,
      totalNetCashOutflows
    );

    res.json({
      success: true,
      data: {
        liquidityCoverageRatio: lcr,
        highQualityLiquidAssets,
        totalNetCashOutflows,
        status: lcr >= 100 ? 'compliant' : 'non_compliant',
        calculatedAt: new Date()
      }
    });
  })
);

/**
 * POST /api/risk/liquidity/calculate-nsfr
 * Calculate Net Stable Funding Ratio
 */
router.post('/liquidity/calculate-nsfr',
  requirePermission('calculate_liquidity_risk'),
  catchAsync(async (req: Request, res: Response) => {
    const { availableStableFunding, requiredStableFunding } = req.body;

    if (availableStableFunding === undefined || requiredStableFunding === undefined) {
      throw new ValidationError('Required fields: availableStableFunding, requiredStableFunding');
    }

    const nsfr = await riskCalculationService.calculateNSFR(
      availableStableFunding,
      requiredStableFunding
    );

    res.json({
      success: true,
      data: {
        netStableFundingRatio: nsfr,
        availableStableFunding,
        requiredStableFunding,
        status: nsfr >= 100 ? 'compliant' : 'non_compliant',
        calculatedAt: new Date()
      }
    });
  })
);

export default router;