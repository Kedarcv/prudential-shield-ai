import mongoose, { Document, Schema } from 'mongoose';

// Risk Assessment Interface
export interface IRiskAssessment extends Document {
  entityId: string;
  entityType: 'customer' | 'counterparty' | 'portfolio' | 'transaction';
  riskType: 'credit' | 'market' | 'operational' | 'liquidity' | 'compliance';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  mitigationMeasures: string[];
  assessmentDate: Date;
  nextReviewDate: Date;
  assessedBy: string;
  status: 'active' | 'under_review' | 'mitigated' | 'expired';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Risk Model
export interface ICreditRisk extends Document {
  borrowerId: string;
  facilityId: string;
  probabilityOfDefault: number; // PD
  lossGivenDefault: number; // LGD
  exposureAtDefault: number; // EAD
  expectedCreditLoss: number; // ECL
  stage: 1 | 2 | 3; // IFRS 9 stages
  creditRating: string;
  limitUtilization: number;
  daysPastDue: number;
  restructuringFlag: boolean;
  watchListFlag: boolean;
  impairmentDate?: Date;
  calculatedAt: Date;
}

// Market Risk Model
export interface IMarketRisk extends Document {
  portfolioId: string;
  riskMetric: 'var' | 'expected_shortfall' | 'stress_test' | 'back_test';
  value: number;
  confidence: number;
  timeHorizon: number; // in days
  method: 'historical' | 'parametric' | 'monte_carlo';
  assetClass: string;
  currency: string;
  calculatedAt: Date;
  validUntil: Date;
}

// Operational Risk Model
export interface IOperationalRisk extends Document {
  businessLine: string;
  eventType: string;
  lossAmount: number;
  recoveryAmount: number;
  netLoss: number;
  eventDate: Date;
  reportedDate: Date;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  riskCategory: 'internal_fraud' | 'external_fraud' | 'employment_practices' | 
                'clients_products' | 'physical_assets' | 'business_disruption' | 'system_failures';
  description: string;
  rootCause: string;
  correctiveActions: string[];
}

// Liquidity Risk Model
export interface ILiquidityRisk extends Document {
  assetType: string;
  maturityBucket: '1d' | '7d' | '30d' | '90d' | '180d' | '1y' | '1y+';
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  liquidityBuffer: number;
  lcr: number; // Liquidity Coverage Ratio
  nsfr: number; // Net Stable Funding Ratio
  stressScenario?: string;
  calculatedAt: Date;
}

// Risk Alert Model
export interface IRiskAlert extends Document {
  alertType: 'breach' | 'warning' | 'information';
  riskCategory: 'credit' | 'market' | 'operational' | 'liquidity' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId: string;
  entityType: string;
  thresholdValue: number;
  actualValue: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  actions: string[];
}

// Compliance Status Model
export interface IComplianceStatus extends Document {
  regulatoryFramework: 'basel_iii' | 'ifrs_9' | 'ccar' | 'rbz_requirements' | 'aml_cft';
  requirement: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'under_review';
  completionPercentage: number;
  lastAssessment: Date;
  nextAssessment: Date;
  responsibleParty: string;
  remedialActions: string[];
  evidence: string[];
}

// Schema Definitions
const RiskAssessmentSchema = new Schema<IRiskAssessment>({
  entityId: { type: String, required: true },
  entityType: { type: String, enum: ['customer', 'counterparty', 'portfolio', 'transaction'], required: true },
  riskType: { type: String, enum: ['credit', 'market', 'operational', 'liquidity', 'compliance'], required: true },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  probability: { type: Number, required: true, min: 0, max: 1 },
  impact: { type: Number, required: true },
  mitigationMeasures: [{ type: String }],
  assessmentDate: { type: Date, required: true },
  nextReviewDate: { type: Date, required: true },
  assessedBy: { type: String, required: true },
  status: { type: String, enum: ['active', 'under_review', 'mitigated', 'expired'], default: 'active' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

const CreditRiskSchema = new Schema<ICreditRisk>({
  borrowerId: { type: String, required: true },
  facilityId: { type: String, required: true },
  probabilityOfDefault: { type: Number, required: true, min: 0, max: 1 },
  lossGivenDefault: { type: Number, required: true, min: 0, max: 1 },
  exposureAtDefault: { type: Number, required: true },
  expectedCreditLoss: { type: Number, required: true },
  stage: { type: Number, enum: [1, 2, 3], required: true },
  creditRating: { type: String, required: true },
  limitUtilization: { type: Number, required: true },
  daysPastDue: { type: Number, default: 0 },
  restructuringFlag: { type: Boolean, default: false },
  watchListFlag: { type: Boolean, default: false },
  impairmentDate: { type: Date },
  calculatedAt: { type: Date, required: true }
});

const MarketRiskSchema = new Schema<IMarketRisk>({
  portfolioId: { type: String, required: true },
  riskMetric: { type: String, enum: ['var', 'expected_shortfall', 'stress_test', 'back_test'], required: true },
  value: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  timeHorizon: { type: Number, required: true },
  method: { type: String, enum: ['historical', 'parametric', 'monte_carlo'], required: true },
  assetClass: { type: String, required: true },
  currency: { type: String, required: true },
  calculatedAt: { type: Date, required: true },
  validUntil: { type: Date, required: true }
});

const OperationalRiskSchema = new Schema<IOperationalRisk>({
  businessLine: { type: String, required: true },
  eventType: { type: String, required: true },
  lossAmount: { type: Number, required: true },
  recoveryAmount: { type: Number, default: 0 },
  netLoss: { type: Number, required: true },
  eventDate: { type: Date, required: true },
  reportedDate: { type: Date, required: true },
  status: { type: String, enum: ['reported', 'investigating', 'resolved', 'closed'], default: 'reported' },
  riskCategory: { 
    type: String, 
    enum: ['internal_fraud', 'external_fraud', 'employment_practices', 'clients_products', 
           'physical_assets', 'business_disruption', 'system_failures'],
    required: true 
  },
  description: { type: String, required: true },
  rootCause: { type: String },
  correctiveActions: [{ type: String }]
});

const LiquidityRiskSchema = new Schema<ILiquidityRisk>({
  assetType: { type: String, required: true },
  maturityBucket: { 
    type: String, 
    enum: ['1d', '7d', '30d', '90d', '180d', '1y', '1y+'], 
    required: true 
  },
  cashInflow: { type: Number, required: true },
  cashOutflow: { type: Number, required: true },
  netCashFlow: { type: Number, required: true },
  liquidityBuffer: { type: Number, required: true },
  lcr: { type: Number },
  nsfr: { type: Number },
  stressScenario: { type: String },
  calculatedAt: { type: Date, required: true }
});

const RiskAlertSchema = new Schema<IRiskAlert>({
  alertType: { type: String, enum: ['breach', 'warning', 'information'], required: true },
  riskCategory: { type: String, enum: ['credit', 'market', 'operational', 'liquidity', 'compliance'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  entityId: { type: String, required: true },
  entityType: { type: String, required: true },
  thresholdValue: { type: Number },
  actualValue: { type: Number },
  triggeredAt: { type: Date, required: true },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date },
  acknowledgedBy: { type: String },
  status: { type: String, enum: ['active', 'acknowledged', 'resolved', 'dismissed'], default: 'active' },
  actions: [{ type: String }]
});

const ComplianceStatusSchema = new Schema<IComplianceStatus>({
  regulatoryFramework: { 
    type: String, 
    enum: ['basel_iii', 'ifrs_9', 'ccar', 'rbz_requirements', 'aml_cft'], 
    required: true 
  },
  requirement: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['compliant', 'non_compliant', 'partially_compliant', 'under_review'], 
    required: true 
  },
  completionPercentage: { type: Number, required: true, min: 0, max: 100 },
  lastAssessment: { type: Date, required: true },
  nextAssessment: { type: Date, required: true },
  responsibleParty: { type: String, required: true },
  remedialActions: [{ type: String }],
  evidence: [{ type: String }]
});

// Indexes for performance
RiskAssessmentSchema.index({ entityId: 1, riskType: 1 });
RiskAssessmentSchema.index({ assessmentDate: -1 });
RiskAssessmentSchema.index({ riskLevel: 1, status: 1 });

CreditRiskSchema.index({ borrowerId: 1, calculatedAt: -1 });
CreditRiskSchema.index({ stage: 1 });
CreditRiskSchema.index({ creditRating: 1 });

MarketRiskSchema.index({ portfolioId: 1, calculatedAt: -1 });
MarketRiskSchema.index({ riskMetric: 1, assetClass: 1 });

OperationalRiskSchema.index({ businessLine: 1, eventDate: -1 });
OperationalRiskSchema.index({ riskCategory: 1, status: 1 });

LiquidityRiskSchema.index({ assetType: 1, calculatedAt: -1 });
LiquidityRiskSchema.index({ maturityBucket: 1 });

RiskAlertSchema.index({ triggeredAt: -1 });
RiskAlertSchema.index({ status: 1, severity: 1 });
RiskAlertSchema.index({ entityId: 1 });

ComplianceStatusSchema.index({ regulatoryFramework: 1, status: 1 });
ComplianceStatusSchema.index({ nextAssessment: 1 });

// Export Models
export const RiskAssessment = mongoose.model<IRiskAssessment>('RiskAssessment', RiskAssessmentSchema);
export const CreditRisk = mongoose.model<ICreditRisk>('CreditRisk', CreditRiskSchema);
export const MarketRisk = mongoose.model<IMarketRisk>('MarketRisk', MarketRiskSchema);
export const OperationalRisk = mongoose.model<IOperationalRisk>('OperationalRisk', OperationalRiskSchema);
export const LiquidityRisk = mongoose.model<ILiquidityRisk>('LiquidityRisk', LiquidityRiskSchema);
export const RiskAlert = mongoose.model<IRiskAlert>('RiskAlert', RiskAlertSchema);
export const ComplianceStatus = mongoose.model<IComplianceStatus>('ComplianceStatus', ComplianceStatusSchema);