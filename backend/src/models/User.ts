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
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerType: 'individual' | 'corporate';
  riskProfile: 'low' | 'medium' | 'high';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  amlStatus: 'clear' | 'flagged' | 'under_review';
  creditRating?: string;
  totalExposure: number;
  relationshipManager: string;
  onboardingDate: Date;
  lastReviewDate: Date;
  isActive: boolean;
  watchlistFlags: string[];
  sanctions: string[];
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
  type: 'credit' | 'debit' | 'transfer' | 'trade' | 'settlement';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  counterparty?: string;
  settlementDate?: Date;
  valueDate: Date;
  bookingDate: Date;
  channel: 'online' | 'branch' | 'atm' | 'api' | 'system';
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  riskScore?: number;
  fraudFlags: string[];
  amlFlags: string[];
  processedBy: string;
  approvedBy?: string;
  metadata: Record<string, any>;
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
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  customerType: { type: String, enum: ['individual', 'corporate'], required: true },
  riskProfile: { type: String, enum: ['low', 'medium', 'high'], required: true },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' },
  amlStatus: { type: String, enum: ['clear', 'flagged', 'under_review'], default: 'clear' },
  creditRating: { type: String },
  totalExposure: { type: Number, default: 0 },
  relationshipManager: { type: String, required: true },
  onboardingDate: { type: Date, required: true },
  lastReviewDate: { type: Date },
  isActive: { type: Boolean, default: true },
  watchlistFlags: [{ type: String }],
  sanctions: [{ type: String }]
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
  type: { type: String, enum: ['credit', 'debit', 'transfer', 'trade', 'settlement'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  description: { type: String, required: true },
  reference: { type: String },
  counterparty: { type: String },
  settlementDate: { type: Date },
  valueDate: { type: Date, required: true },
  bookingDate: { type: Date, required: true },
  channel: { type: String, enum: ['online', 'branch', 'atm', 'api', 'system'], required: true },
  location: {
    country: { type: String },
    city: { type: String },
    coordinates: [{ type: Number }] // [longitude, latitude]
  },
  riskScore: { type: Number },
  fraudFlags: [{ type: String }],
  amlFlags: [{ type: String }],
  processedBy: { type: String, required: true },
  approvedBy: { type: String },
  metadata: { type: Schema.Types.Mixed }
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