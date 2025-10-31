import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'risk_manager' | 'analyst' | 'auditor' | 'viewer';
  department: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ISession extends Document {
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface ICustomer extends Document {
  customerId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  alternativePhone?: string;
  dateOfBirth: Date;
  placeOfBirth?: string;
  nationality: string;
  nationalId: string; // Zimbabwe National ID
  passportNumber?: string;
  address: {
    street: string;
    suburb: string;
    city: string;
    province: string;
    postalCode?: string;
    country: string;
  };
  employmentInfo?: {
    employer: string;
    occupation: string;
    industry: string;
    monthlyIncome: number;
    sourceOfIncome: string[];
  };
  customerType: 'individual' | 'corporate' | 'trust' | 'partnership';
  riskProfile: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
    lastAssessment: Date;
    nextReview: Date;
  };
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired' | 'enhanced_required';
  cddLevel: 'simplified' | 'standard' | 'enhanced' | 'ongoing';
  amlStatus: 'clear' | 'flagged' | 'under_review' | 'high_risk';
  pepStatus: {
    isPEP: boolean;
    pepCategory?: 'domestic' | 'foreign' | 'international_org';
    position?: string;
    jurisdiction?: string;
    lastChecked: Date;
  };
  sanctionsScreening: {
    status: 'clear' | 'match' | 'potential_match';
    lastChecked: Date;
    matchedLists: string[];
    screeningProvider?: string;
  };
  expectedTransactionProfile: {
    monthlyTurnover: number;
    transactionTypes: string[];
    geographicExposure: string[];
    averageTransactionSize: number;
  };
  actualTransactionProfile: {
    monthlyTurnover: number;
    lastCalculated: Date;
    deviationFlags: string[];
  };
  complianceFlags: {
    flag: string;
    severity: 'low' | 'medium' | 'high';
    dateRaised: Date;
    status: 'open' | 'investigating' | 'resolved';
    notes?: string;
  }[];
  creditRating?: string;
  totalExposure: number;
  relationshipManager: string;
  onboardingDate: Date;
  lastReviewDate: Date;
  nextReviewDate: Date;
  isActive: boolean;
  inactivityReason?: string;
  watchlistFlags: string[];
  sanctions: string[];
  sezRequirements: {
    licenseNumber?: string;
    registrationDate?: Date;
    complianceOfficer?: string;
    lastComplianceCheck: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPortfolio extends Document {
  portfolioId: string;
  name: string;
  type: 'loan' | 'investment' | 'trading' | 'treasury';
  manager: string;
  totalValue: number;
  currency: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  benchmarkIndex?: string;
  inception: Date;
  positions: {
    assetId: string;
    assetType: string;
    quantity: number;
    marketValue: number;
    weight: number;
  }[];
  limits: {
    singleNameLimit: number;
    sectorLimit: number;
    countryLimit: number;
    currencyLimit: number;
  };
  performance: {
    date: Date;
    return: number;
    volatility: number;
    sharpeRatio: number;
    var: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction extends Document {
  transactionId: string;
  customerId?: string;
  portfolioId?: string;
  accountNumber: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'securities_trade' | 'forex' | 'loan_disbursement' | 'loan_repayment';
  subType?: string;
  amount: number;
  currency: string;
  usdEquivalent?: number;
  exchangeRate?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'under_review' | 'blocked';
  description: string;
  reference?: string;
  counterparty: {
    name?: string;
    accountNumber?: string;
    bankName?: string;
    bankCode?: string;
    swiftCode?: string;
    country: string;
    city?: string;
  };
  purposeCode?: string; // For regulatory reporting
  settlementDate?: Date;
  valueDate: Date;
  bookingDate: Date;
  reportingDate: Date;
  channel: 'online' | 'branch' | 'atm' | 'mobile' | 'pos' | 'swift' | 'rtgs';
  location: {
    country: string;
    city?: string;
    branch?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  riskAssessment: {
    overallScore: number;
    amlScore: number;
    cftScore: number;
    sanctionsScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
  };
  complianceChecks: {
    sanctionsScreening: {
      status: 'pass' | 'fail' | 'pending';
      matchedLists: string[];
      checkedAt: Date;
    };
    amlMonitoring: {
      alerts: string[];
      patterns: string[];
      checkedAt: Date;
    };
    cftScreening: {
      status: 'pass' | 'fail' | 'pending';
      indicators: string[];
      checkedAt: Date;
    };
    thresholdBreaches: {
      type: string;
      threshold: number;
      actual: number;
      action: string;
    }[];
  };
  fraudFlags: string[];
  amlFlags: string[];
  cftFlags: string[];
  suspiciousIndicators: {
    indicator: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  reviewStatus: 'auto_approved' | 'manual_review' | 'escalated' | 'investigated';
  processedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  metadata: Record<string, any>;
  sezReporting: {
    reportable: boolean;
    reportType?: 'ctr' | 'str' | 'cft' | 'large_cash' | 'cross_border';
    reportingThreshold?: number;
    reportDate?: Date;
    reportReference?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { 
    type: String, 
    enum: ['admin', 'risk_manager', 'analyst', 'auditor', 'viewer'], 
    required: true 
  },
  department: { type: String, required: true },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false }
}, { timestamps: true });

// Session Schema
const SessionSchema = new Schema<ISession>({
  userId: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Customer Schema
const CustomerSchema = new Schema<ICustomer>({
  customerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  alternativePhone: { type: String },
  dateOfBirth: { type: Date, required: true },
  placeOfBirth: { type: String },
  nationality: { type: String, required: true, default: 'Zimbabwean' },
  nationalId: { type: String, required: true, unique: true },
  passportNumber: { type: String },
  address: {
    street: { type: String, required: true },
    suburb: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, required: true, default: 'Zimbabwe' }
  },
  employmentInfo: {
    employer: { type: String },
    occupation: { type: String },
    industry: { type: String },
    monthlyIncome: { type: Number },
    sourceOfIncome: [{ type: String }]
  },
  customerType: { type: String, enum: ['individual', 'corporate', 'trust', 'partnership'], required: true },
  riskProfile: {
    level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    factors: [{ type: String }],
    lastAssessment: { type: Date, required: true },
    nextReview: { type: Date, required: true }
  },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'expired', 'enhanced_required'], default: 'pending' },
  cddLevel: { type: String, enum: ['simplified', 'standard', 'enhanced', 'ongoing'], default: 'standard' },
  amlStatus: { type: String, enum: ['clear', 'flagged', 'under_review', 'high_risk'], default: 'clear' },
  pepStatus: {
    isPEP: { type: Boolean, default: false },
    pepCategory: { type: String, enum: ['domestic', 'foreign', 'international_org'] },
    position: { type: String },
    jurisdiction: { type: String },
    lastChecked: { type: Date, default: Date.now }
  },
  sanctionsScreening: {
    status: { type: String, enum: ['clear', 'match', 'potential_match'], default: 'clear' },
    lastChecked: { type: Date, default: Date.now },
    matchedLists: [{ type: String }],
    screeningProvider: { type: String }
  },
  expectedTransactionProfile: {
    monthlyTurnover: { type: Number, default: 0 },
    transactionTypes: [{ type: String }],
    geographicExposure: [{ type: String }],
    averageTransactionSize: { type: Number, default: 0 }
  },
  actualTransactionProfile: {
    monthlyTurnover: { type: Number, default: 0 },
    lastCalculated: { type: Date, default: Date.now },
    deviationFlags: [{ type: String }]
  },
  complianceFlags: [{
    flag: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    dateRaised: { type: Date, required: true },
    status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
    notes: { type: String }
  }],
  creditRating: { type: String },
  totalExposure: { type: Number, default: 0 },
  relationshipManager: { type: String, required: true },
  onboardingDate: { type: Date, required: true },
  lastReviewDate: { type: Date },
  nextReviewDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  inactivityReason: { type: String },
  watchlistFlags: [{ type: String }],
  sanctions: [{ type: String }],
  sezRequirements: {
    licenseNumber: { type: String },
    registrationDate: { type: Date },
    complianceOfficer: { type: String },
    lastComplianceCheck: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Portfolio Schema
const PortfolioSchema = new Schema<IPortfolio>({
  portfolioId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['loan', 'investment', 'trading', 'treasury'], required: true },
  manager: { type: String, required: true },
  totalValue: { type: Number, required: true },
  currency: { type: String, required: true },
  riskProfile: { type: String, enum: ['conservative', 'moderate', 'aggressive'], required: true },
  benchmarkIndex: { type: String },
  inception: { type: Date, required: true },
  positions: [{
    assetId: { type: String, required: true },
    assetType: { type: String, required: true },
    quantity: { type: Number, required: true },
    marketValue: { type: Number, required: true },
    weight: { type: Number, required: true }
  }],
  limits: {
    singleNameLimit: { type: Number, required: true },
    sectorLimit: { type: Number, required: true },
    countryLimit: { type: Number, required: true },
    currencyLimit: { type: Number, required: true }
  },
  performance: [{
    date: { type: Date, required: true },
    return: { type: Number, required: true },
    volatility: { type: Number, required: true },
    sharpeRatio: { type: Number },
    var: { type: Number }
  }]
}, { timestamps: true });

// Transaction Schema
const TransactionSchema = new Schema<ITransaction>({
  transactionId: { type: String, required: true, unique: true },
  customerId: { type: String },
  portfolioId: { type: String },
  accountNumber: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'securities_trade', 'forex', 'loan_disbursement', 'loan_repayment'], 
    required: true 
  },
  subType: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  usdEquivalent: { type: Number },
  exchangeRate: { type: Number },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'under_review', 'blocked'], 
    default: 'pending' 
  },
  description: { type: String, required: true },
  reference: { type: String },
  counterparty: {
    name: { type: String },
    accountNumber: { type: String },
    bankName: { type: String },
    bankCode: { type: String },
    swiftCode: { type: String },
    country: { type: String, required: true },
    city: { type: String }
  },
  purposeCode: { type: String },
  settlementDate: { type: Date },
  valueDate: { type: Date, required: true },
  bookingDate: { type: Date, required: true },
  reportingDate: { type: Date, required: true },
  channel: { type: String, enum: ['online', 'branch', 'atm', 'mobile', 'pos', 'swift', 'rtgs'], required: true },
  location: {
    country: { type: String, required: true },
    city: { type: String },
    branch: { type: String },
    coordinates: [{ type: Number }] // [longitude, latitude]
  },
  riskAssessment: {
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    amlScore: { type: Number, required: true, min: 0, max: 100 },
    cftScore: { type: Number, required: true, min: 0, max: 100 },
    sanctionsScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    riskFactors: [{ type: String }]
  },
  complianceChecks: {
    sanctionsScreening: {
      status: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
      matchedLists: [{ type: String }],
      checkedAt: { type: Date, default: Date.now }
    },
    amlMonitoring: {
      alerts: [{ type: String }],
      patterns: [{ type: String }],
      checkedAt: { type: Date, default: Date.now }
    },
    cftScreening: {
      status: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
      indicators: [{ type: String }],
      checkedAt: { type: Date, default: Date.now }
    },
    thresholdBreaches: [{
      type: { type: String, required: true },
      threshold: { type: Number, required: true },
      actual: { type: Number, required: true },
      action: { type: String, required: true }
    }]
  },
  fraudFlags: [{ type: String }],
  amlFlags: [{ type: String }],
  cftFlags: [{ type: String }],
  suspiciousIndicators: [{
    indicator: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    description: { type: String, required: true }
  }],
  reviewStatus: { 
    type: String, 
    enum: ['auto_approved', 'manual_review', 'escalated', 'investigated'], 
    default: 'auto_approved' 
  },
  processedBy: { type: String, required: true },
  reviewedBy: { type: String },
  approvedBy: { type: String },
  metadata: { type: Schema.Types.Mixed },
  sezReporting: {
    reportable: { type: Boolean, default: false },
    reportType: { type: String, enum: ['ctr', 'str', 'cft', 'large_cash', 'cross_border'] },
    reportingThreshold: { type: Number },
    reportDate: { type: Date },
    reportReference: { type: String }
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });

SessionSchema.index({ token: 1 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

CustomerSchema.index({ customerId: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ riskProfile: 1, isActive: 1 });
CustomerSchema.index({ kycStatus: 1, amlStatus: 1 });

PortfolioSchema.index({ portfolioId: 1 });
PortfolioSchema.index({ type: 1, manager: 1 });

TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ customerId: 1, bookingDate: -1 });
TransactionSchema.index({ portfolioId: 1, bookingDate: -1 });
TransactionSchema.index({ status: 1, type: 1 });
TransactionSchema.index({ bookingDate: -1 });

// Export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Session = mongoose.model<ISession>('Session', SessionSchema);
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);