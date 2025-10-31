import mongoose, { Document, Schema } from 'mongoose';

// SECZ AML/CFT Compliance Models for Zimbabwe

// Suspicious Activity Report (SAR) Model
export interface ISAR extends Document {
  sarId: string;
  reportType: 'suspicious_transaction' | 'suspicious_activity' | 'cft_related' | 'cash_transaction' | 'cross_border';
  customerId: string;
  customerName: string;
  nationalId?: string;
  transactionIds: string[];
  reportingInstitution: {
    name: string;
    licenseNumber: string;
    address: string;
    contactPerson: string;
    contactDetails: string;
  };
  suspiciousActivity: {
    description: string;
    amountInvolved: number;
    currency: string;
    dateOfActivity: Date;
    locationOfActivity: string;
    methodUsed: string;
    reasonForSuspicion: string[];
    indicators: string[];
  };
  parties: {
    primary: {
      name: string;
      idType: 'national_id' | 'passport' | 'company_registration';
      idNumber: string;
      address: string;
      occupation?: string;
      role: string;
    };
    secondary?: {
      name: string;
      idType: 'national_id' | 'passport' | 'company_registration';
      idNumber: string;
      address: string;
      occupation?: string;
      role: string;
    }[];
  };
  financialInformation: {
    totalAmount: number;
    currency: string;
    transactionDates: Date[];
    accountNumbers: string[];
    instrumentsUsed: string[];
  };
  actionTaken: {
    internalActions: string[];
    accountStatus: 'active' | 'frozen' | 'closed' | 'monitored';
    additionalMonitoring: boolean;
    lawEnforcementNotified: boolean;
  };
  reportingDetails: {
    preparedBy: string;
    position: string;
    dateOfPreparation: Date;
    submissionDate?: Date;
    fiuReference?: string;
    acknowledgmentReceived: boolean;
    followUpRequired: boolean;
  };
  attachments: {
    fileName: string;
    fileType: string;
    uploadDate: Date;
    description: string;
  }[];
  status: 'draft' | 'submitted' | 'acknowledged' | 'under_investigation' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// Cash Transaction Report (CTR) Model
export interface ICTR extends Document {
  ctrId: string;
  reportingInstitution: {
    name: string;
    licenseNumber: string;
    branchCode: string;
    address: string;
  };
  transactionDate: Date;
  customer: {
    name: string;
    nationalId?: string;
    passportNumber?: string;
    address: string;
    phoneNumber: string;
    occupation: string;
    employer?: string;
  };
  transaction: {
    type: 'deposit' | 'withdrawal' | 'exchange';
    amount: number;
    currency: string;
    accountNumber?: string;
    purpose: string;
    source: string;
  };
  cashDetails: {
    denominations: {
      value: number;
      count: number;
    }[];
    totalAmount: number;
    condition: 'new' | 'used' | 'damaged';
  };
  verificationDetails: {
    idVerified: boolean;
    signatureVerified: boolean;
    photographTaken: boolean;
    additionalDocuments: string[];
  };
  reportingOfficer: {
    name: string;
    position: string;
    employeeId: string;
  };
  submissionDate: Date;
  fiuReference?: string;
  status: 'submitted' | 'acknowledged' | 'queried';
  createdAt: Date;
  updatedAt: Date;
}

// Cross-Border Transaction Report Model
export interface ICrossBorderReport extends Document {
  reportId: string;
  reportingInstitution: {
    name: string;
    licenseNumber: string;
    swiftCode?: string;
  };
  transactionDetails: {
    transactionId: string;
    amount: number;
    currency: string;
    usdEquivalent: number;
    exchangeRate: number;
    valueDate: Date;
    purpose: string;
    urgency: 'normal' | 'urgent';
  };
  sender: {
    name: string;
    address: string;
    country: string;
    accountNumber?: string;
    bankName?: string;
    swiftCode?: string;
  };
  beneficiary: {
    name: string;
    address: string;
    country: string;
    accountNumber?: string;
    bankName?: string;
    swiftCode?: string;
  };
  correspondent: {
    bankName?: string;
    swiftCode?: string;
    country?: string;
  };
  complianceChecks: {
    sanctionsScreened: boolean;
    pepScreened: boolean;
    originVerified: boolean;
    purposeVerified: boolean;
  };
  reportingDate: Date;
  submissionDate: Date;
  rbzReference?: string;
  status: 'submitted' | 'approved' | 'rejected' | 'pending_clarification';
  createdAt: Date;
  updatedAt: Date;
}

// KYC/CDD Documentation Model
export interface IKYCDocument extends Document {
  customerId: string;
  documentType: 'national_id' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement' | 
               'employment_letter' | 'company_registration' | 'memorandum' | 'directors_resolution' | 'other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  expiryDate?: Date;
  verified: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
  rejectionReason?: string;
  documentHash: string; // For integrity verification
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionPeriod: number; // in years
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// PEP Database Model
export interface IPEP extends Document {
  pepId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    aliases: string[];
    nationality: string;
    dateOfBirth?: Date;
    placeOfBirth?: string;
  };
  pepDetails: {
    category: 'domestic' | 'foreign' | 'international_org';
    position: string;
    organization: string;
    jurisdiction: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  familyMembers: {
    name: string;
    relationship: string;
    pepStatus: boolean;
  }[];
  associates: {
    name: string;
    relationship: string;
    pepStatus: boolean;
  }[];
  sources: {
    name: string;
    url?: string;
    date: Date;
    reliability: 'high' | 'medium' | 'low';
  }[];
  lastUpdated: Date;
  reviewDate: Date;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// Sanctions List Model
export interface ISanctionsList extends Document {
  listId: string;
  listName: string;
  listType: 'individual' | 'entity' | 'vessel' | 'aircraft';
  issuer: string; // UN, OFAC, EU, AU, SADC, etc.
  entries: {
    name: string;
    aliases: string[];
    identifier?: string; // passport, national id, registration number
    dateOfBirth?: Date;
    placeOfBirth?: string;
    nationality?: string;
    address?: string;
    sanctionType: string;
    reason: string;
    listingDate: Date;
    lastUpdated: Date;
  }[];
  version: string;
  effectiveDate: Date;
  lastUpdate: Date;
  nextUpdate: Date;
  status: 'active' | 'superseded' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// AML/CFT Risk Assessment Model
export interface IAMLRiskAssessment extends Document {
  assessmentId: string;
  entityType: 'customer' | 'product' | 'geography' | 'delivery_channel';
  entityId: string;
  assessmentType: 'initial' | 'periodic' | 'triggered' | 'enhanced';
  riskFactors: {
    customerRisk: {
      pepStatus: number;
      sanctionsRisk: number;
      jurisdictionRisk: number;
      businessRisk: number;
      score: number;
    };
    productRisk: {
      complexity: number;
      anonymity: number;
      velocity: number;
      geography: number;
      score: number;
    };
    deliveryChannelRisk: {
      faceToFace: number;
      verification: number;
      monitoring: number;
      score: number;
    };
  };
  overallRisk: {
    inherentRisk: number;
    residualRisk: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationMeasures: string[];
  };
  assessmentDate: Date;
  nextReviewDate: Date;
  assessedBy: string;
  approvedBy?: string;
  status: 'draft' | 'approved' | 'under_review' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definitions

const SARSchema = new Schema<ISAR>({
  sarId: { type: String, required: true, unique: true },
  reportType: { 
    type: String, 
    enum: ['suspicious_transaction', 'suspicious_activity', 'cft_related', 'cash_transaction', 'cross_border'],
    required: true 
  },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  nationalId: { type: String },
  transactionIds: [{ type: String }],
  reportingInstitution: {
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    address: { type: String, required: true },
    contactPerson: { type: String, required: true },
    contactDetails: { type: String, required: true }
  },
  suspiciousActivity: {
    description: { type: String, required: true },
    amountInvolved: { type: Number, required: true },
    currency: { type: String, required: true },
    dateOfActivity: { type: Date, required: true },
    locationOfActivity: { type: String, required: true },
    methodUsed: { type: String, required: true },
    reasonForSuspicion: [{ type: String }],
    indicators: [{ type: String }]
  },
  parties: {
    primary: {
      name: { type: String, required: true },
      idType: { type: String, enum: ['national_id', 'passport', 'company_registration'], required: true },
      idNumber: { type: String, required: true },
      address: { type: String, required: true },
      occupation: { type: String },
      role: { type: String, required: true }
    },
    secondary: [{
      name: { type: String, required: true },
      idType: { type: String, enum: ['national_id', 'passport', 'company_registration'], required: true },
      idNumber: { type: String, required: true },
      address: { type: String, required: true },
      occupation: { type: String },
      role: { type: String, required: true }
    }]
  },
  financialInformation: {
    totalAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    transactionDates: [{ type: Date }],
    accountNumbers: [{ type: String }],
    instrumentsUsed: [{ type: String }]
  },
  actionTaken: {
    internalActions: [{ type: String }],
    accountStatus: { type: String, enum: ['active', 'frozen', 'closed', 'monitored'], required: true },
    additionalMonitoring: { type: Boolean, default: false },
    lawEnforcementNotified: { type: Boolean, default: false }
  },
  reportingDetails: {
    preparedBy: { type: String, required: true },
    position: { type: String, required: true },
    dateOfPreparation: { type: Date, required: true },
    submissionDate: { type: Date },
    fiuReference: { type: String },
    acknowledgmentReceived: { type: Boolean, default: false },
    followUpRequired: { type: Boolean, default: false }
  },
  attachments: [{
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadDate: { type: Date, required: true },
    description: { type: String, required: true }
  }],
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'acknowledged', 'under_investigation', 'closed'],
    default: 'draft' 
  }
}, { timestamps: true });

const CTRSchema = new Schema<ICTR>({
  ctrId: { type: String, required: true, unique: true },
  reportingInstitution: {
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    branchCode: { type: String, required: true },
    address: { type: String, required: true }
  },
  transactionDate: { type: Date, required: true },
  customer: {
    name: { type: String, required: true },
    nationalId: { type: String },
    passportNumber: { type: String },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    occupation: { type: String, required: true },
    employer: { type: String }
  },
  transaction: {
    type: { type: String, enum: ['deposit', 'withdrawal', 'exchange'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    accountNumber: { type: String },
    purpose: { type: String, required: true },
    source: { type: String, required: true }
  },
  cashDetails: {
    denominations: [{
      value: { type: Number, required: true },
      count: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    condition: { type: String, enum: ['new', 'used', 'damaged'], required: true }
  },
  verificationDetails: {
    idVerified: { type: Boolean, required: true },
    signatureVerified: { type: Boolean, required: true },
    photographTaken: { type: Boolean, required: true },
    additionalDocuments: [{ type: String }]
  },
  reportingOfficer: {
    name: { type: String, required: true },
    position: { type: String, required: true },
    employeeId: { type: String, required: true }
  },
  submissionDate: { type: Date, required: true },
  fiuReference: { type: String },
  status: { type: String, enum: ['submitted', 'acknowledged', 'queried'], default: 'submitted' }
}, { timestamps: true });

const CrossBorderReportSchema = new Schema<ICrossBorderReport>({
  reportId: { type: String, required: true, unique: true },
  reportingInstitution: {
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    swiftCode: { type: String }
  },
  transactionDetails: {
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    usdEquivalent: { type: Number, required: true },
    exchangeRate: { type: Number, required: true },
    valueDate: { type: Date, required: true },
    purpose: { type: String, required: true },
    urgency: { type: String, enum: ['normal', 'urgent'], default: 'normal' }
  },
  sender: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    accountNumber: { type: String },
    bankName: { type: String },
    swiftCode: { type: String }
  },
  beneficiary: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    accountNumber: { type: String },
    bankName: { type: String },
    swiftCode: { type: String }
  },
  correspondent: {
    bankName: { type: String },
    swiftCode: { type: String },
    country: { type: String }
  },
  complianceChecks: {
    sanctionsScreened: { type: Boolean, required: true },
    pepScreened: { type: Boolean, required: true },
    originVerified: { type: Boolean, required: true },
    purposeVerified: { type: Boolean, required: true }
  },
  reportingDate: { type: Date, required: true },
  submissionDate: { type: Date, required: true },
  rbzReference: { type: String },
  status: { 
    type: String, 
    enum: ['submitted', 'approved', 'rejected', 'pending_clarification'],
    default: 'submitted' 
  }
}, { timestamps: true });

const KYCDocumentSchema = new Schema<IKYCDocument>({
  customerId: { type: String, required: true },
  documentType: { 
    type: String, 
    enum: ['national_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement', 
           'employment_letter', 'company_registration', 'memorandum', 'directors_resolution', 'other'],
    required: true 
  },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadDate: { type: Date, required: true },
  expiryDate: { type: Date },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: String },
  verificationDate: { type: Date },
  rejectionReason: { type: String },
  documentHash: { type: String, required: true },
  confidentialityLevel: { 
    type: String, 
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'confidential' 
  },
  retentionPeriod: { type: Number, default: 7 },
  status: { type: String, enum: ['pending', 'verified', 'rejected', 'expired'], default: 'pending' }
}, { timestamps: true });

const PEPSchema = new Schema<IPEP>({
  pepId: { type: String, required: true, unique: true },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    aliases: [{ type: String }],
    nationality: { type: String, required: true },
    dateOfBirth: { type: Date },
    placeOfBirth: { type: String }
  },
  pepDetails: {
    category: { type: String, enum: ['domestic', 'foreign', 'international_org'], required: true },
    position: { type: String, required: true },
    organization: { type: String, required: true },
    jurisdiction: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  familyMembers: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    pepStatus: { type: Boolean, default: false }
  }],
  associates: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    pepStatus: { type: Boolean, default: false }
  }],
  sources: [{
    name: { type: String, required: true },
    url: { type: String },
    date: { type: Date, required: true },
    reliability: { type: String, enum: ['high', 'medium', 'low'], required: true }
  }],
  lastUpdated: { type: Date, required: true },
  reviewDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' }
}, { timestamps: true });

const SanctionsListSchema = new Schema<ISanctionsList>({
  listId: { type: String, required: true, unique: true },
  listName: { type: String, required: true },
  listType: { type: String, enum: ['individual', 'entity', 'vessel', 'aircraft'], required: true },
  issuer: { type: String, required: true },
  entries: [{
    name: { type: String, required: true },
    aliases: [{ type: String }],
    identifier: { type: String },
    dateOfBirth: { type: Date },
    placeOfBirth: { type: String },
    nationality: { type: String },
    address: { type: String },
    sanctionType: { type: String, required: true },
    reason: { type: String, required: true },
    listingDate: { type: Date, required: true },
    lastUpdated: { type: Date, required: true }
  }],
  version: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  nextUpdate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'superseded', 'archived'], default: 'active' }
}, { timestamps: true });

const AMLRiskAssessmentSchema = new Schema<IAMLRiskAssessment>({
  assessmentId: { type: String, required: true, unique: true },
  entityType: { type: String, enum: ['customer', 'product', 'geography', 'delivery_channel'], required: true },
  entityId: { type: String, required: true },
  assessmentType: { type: String, enum: ['initial', 'periodic', 'triggered', 'enhanced'], required: true },
  riskFactors: {
    customerRisk: {
      pepStatus: { type: Number, required: true },
      sanctionsRisk: { type: Number, required: true },
      jurisdictionRisk: { type: Number, required: true },
      businessRisk: { type: Number, required: true },
      score: { type: Number, required: true }
    },
    productRisk: {
      complexity: { type: Number, required: true },
      anonymity: { type: Number, required: true },
      velocity: { type: Number, required: true },
      geography: { type: Number, required: true },
      score: { type: Number, required: true }
    },
    deliveryChannelRisk: {
      faceToFace: { type: Number, required: true },
      verification: { type: Number, required: true },
      monitoring: { type: Number, required: true },
      score: { type: Number, required: true }
    }
  },
  overallRisk: {
    inherentRisk: { type: Number, required: true },
    residualRisk: { type: Number, required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    mitigationMeasures: [{ type: String }]
  },
  assessmentDate: { type: Date, required: true },
  nextReviewDate: { type: Date, required: true },
  assessedBy: { type: String, required: true },
  approvedBy: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'under_review', 'expired'], default: 'draft' }
}, { timestamps: true });

// Indexes for performance
SARSchema.index({ customerId: 1, status: 1 });
SARSchema.index({ 'suspiciousActivity.dateOfActivity': -1 });
SARSchema.index({ reportType: 1 });

CTRSchema.index({ 'customer.nationalId': 1 });
CTRSchema.index({ transactionDate: -1 });
CTRSchema.index({ 'transaction.amount': -1 });

CrossBorderReportSchema.index({ 'transactionDetails.transactionId': 1 });
CrossBorderReportSchema.index({ 'sender.country': 1, 'beneficiary.country': 1 });
CrossBorderReportSchema.index({ reportingDate: -1 });

KYCDocumentSchema.index({ customerId: 1, documentType: 1 });
KYCDocumentSchema.index({ status: 1, expiryDate: 1 });

PEPSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
PEPSchema.index({ 'pepDetails.isActive': 1, 'pepDetails.category': 1 });
PEPSchema.index({ 'personalInfo.nationality': 1 });

SanctionsListSchema.index({ issuer: 1, status: 1 });
SanctionsListSchema.index({ 'entries.name': 1 });
SanctionsListSchema.index({ lastUpdate: -1 });

AMLRiskAssessmentSchema.index({ entityId: 1, entityType: 1 });
AMLRiskAssessmentSchema.index({ assessmentDate: -1 });
AMLRiskAssessmentSchema.index({ 'overallRisk.riskLevel': 1 });

// Export Models
export const SAR = mongoose.model<ISAR>('SAR', SARSchema);
export const CTR = mongoose.model<ICTR>('CTR', CTRSchema);
export const CrossBorderReport = mongoose.model<ICrossBorderReport>('CrossBorderReport', CrossBorderReportSchema);
export const KYCDocument = mongoose.model<IKYCDocument>('KYCDocument', KYCDocumentSchema);
export const PEP = mongoose.model<IPEP>('PEP', PEPSchema);
export const SanctionsList = mongoose.model<ISanctionsList>('SanctionsList', SanctionsListSchema);
export const AMLRiskAssessment = mongoose.model<IAMLRiskAssessment>('AMLRiskAssessment', AMLRiskAssessmentSchema);