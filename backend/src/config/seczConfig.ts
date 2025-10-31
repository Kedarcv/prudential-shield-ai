// Zimbabwe SECZ AML/CFT Configuration and Thresholds

export const seczConfig = {
  // Institution Details
  institution: {
    name: process.env.INSTITUTION_NAME || 'Zimbabwe Financial Institution',
    licenseNumber: process.env.SECZ_LICENSE_NUMBER || 'SECZ-2024-001',
    registrationNumber: process.env.INSTITUTION_REG_NUMBER || 'REG-2024-001',
    address: process.env.INSTITUTION_ADDRESS || 'Harare, Zimbabwe',
    contactDetails: process.env.COMPLIANCE_CONTACT || 'compliance@institution.co.zw',
    swiftCode: process.env.INSTITUTION_SWIFT || 'BANKZWHX',
  },

  // AML/CFT Transaction Thresholds (USD equivalent)
  transactionThresholds: {
    // Cash Transaction Reporting (CTR) - SECZ Requirement
    cashTransactionThreshold: Number(process.env.CTR_THRESHOLD) || 10000, // USD $10,000
    
    // Cross-Border Transaction Reporting - RBZ Requirement
    crossBorderThreshold: Number(process.env.CBR_THRESHOLD) || 5000, // USD $5,000
    
    // Suspicious Activity Reporting (SAR) - Pattern-based
    suspiciousPatternThreshold: Number(process.env.SAR_PATTERN_THRESHOLD) || 3,
    
    // Structuring Detection - Just below reporting threshold
    structuringThreshold: Number(process.env.STRUCTURING_THRESHOLD) || 9000, // USD $9,000
    
    // Large Transaction Monitoring
    largeTransactionThreshold: Number(process.env.LARGE_TX_THRESHOLD) || 50000, // USD $50,000
    
    // Aggregate Transaction Monitoring (Monthly)
    aggregateMonthlyThreshold: Number(process.env.MONTHLY_AGG_THRESHOLD) || 100000, // USD $100,000
  },

  // Zimbabwe Currency Thresholds (ZWL - when applicable)
  localCurrencyThresholds: {
    exchangeRate: Number(process.env.USD_ZWL_RATE) || 85, // 1 USD = 85 ZWL (approximate)
    cashTransactionThresholdZWL: 10000 * 85, // CTR threshold in ZWL
    crossBorderThresholdZWL: 5000 * 85, // Cross-border threshold in ZWL
    structuringThresholdZWL: 9000 * 85, // Structuring threshold in ZWL
  },

  // Customer Risk Scoring
  customerRiskScoring: {
    // PEP (Politically Exposed Person) Risk Scores
    pepRiskScores: {
      domestic: 30,           // Domestic PEPs
      foreign: 40,            // Foreign PEPs
      internationalOrg: 35,   // International Organization PEPs
      family: 20,             // Family members of PEPs
      closeAssociates: 15,    // Close associates of PEPs
    },
    
    // Business Type Risk Scores
    businessTypeScores: {
      moneychanger: 50,
      casino: 45,
      jewelryDealer: 40,
      artDealer: 40,
      realEstate: 35,
      charityNgo: 30,
      importExport: 25,
      professional: 15,
      retail: 10,
      other: 20,
    },
    
    // Geographic Risk Scores
    geographicRiskScores: {
      zimbabwe: 10,
      sadc: 15,             // SADC countries
      africa: 20,
      developed: 15,        // Developed countries
      offshore: 45,         // Offshore jurisdictions
      sanctions: 100,       // Sanctioned countries
    },
    
    // Delivery Channel Risk Scores
    deliveryChannelScores: {
      branch: 10,           // Face-to-face at branch
      atm: 15,
      online: 25,
      mobile: 20,
      correspondent: 35,    // Correspondent banking
      nonFaceToFace: 40,   // Non-face-to-face transactions
    },
  },

  // High-Risk Jurisdictions (FATF and Zimbabwe-specific)
  highRiskJurisdictions: [
    // FATF High-Risk Jurisdictions
    'North Korea', 'Iran', 'Myanmar',
    
    // FATF Increased Monitoring Jurisdictions
    'Albania', 'Barbados', 'Burkina Faso', 'Cambodia', 'Cayman Islands',
    'Democratic Republic of Congo', 'Gibraltar', 'Haiti', 'Jamaica', 'Jordan',
    'Mali', 'Morocco', 'Mozambique', 'Nigeria', 'Panama', 'Philippines',
    'Senegal', 'South Sudan', 'Syria', 'Tanzania', 'Turkey', 'Uganda',
    'United Arab Emirates', 'Yemen',
    
    // Additional Regional Risk Countries
    'Somalia', 'Sudan', 'Libya', 'Central African Republic',
  ],

  // SECZ Reporting Requirements and Deadlines
  reportingRequirements: {
    // Suspicious Activity Report (SAR)
    sar: {
      submissionDeadlineDays: 15,        // 15 days to submit to FIU
      preparationTimeHours: 72,          // 72 hours to prepare after detection
      followUpRequiredDays: 30,          // 30 days for follow-up if requested
      retentionYears: 7,                 // 7 years retention period
    },
    
    // Cash Transaction Report (CTR)
    ctr: {
      submissionDeadlineDays: 15,        // 15 days to submit to FIU
      batchReportingAllowed: true,       // Can be submitted in batches
      retentionYears: 5,                 // 5 years retention period
    },
    
    // Cross-Border Transaction Report (CBR)
    cbr: {
      submissionDeadlineHours: 48,       // 48 hours to submit to RBZ
      priorApprovalRequired: false,      // No prior approval needed
      retentionYears: 5,                 // 5 years retention period
    },
    
    // Enhanced Due Diligence (EDD) Report
    edd: {
      completionDeadlineDays: 30,        // 30 days to complete EDD
      reviewFrequencyMonths: 6,          // Review every 6 months
      approvalLevel: 'senior_management', // Requires senior management approval
    },
  },

  // Enhanced Due Diligence (EDD) Triggers
  eddTriggers: {
    riskScoreThreshold: 70,              // Risk score above 70 requires EDD
    pepStatus: true,                     // All PEPs require EDD
    sanctionsMatch: true,                // Any sanctions match requires EDD
    highRiskCountry: true,               // High-risk jurisdiction requires EDD
    largeTransactionThreshold: 50000,    // USD $50,000 single transaction
    aggregatedTransactionThreshold: 100000, // USD $100,000 monthly aggregate
    cashIntensiveBusiness: true,         // Cash-intensive businesses require EDD
    nonFaceToFaceOnboarding: true,       // Non-face-to-face onboarding requires EDD
  },

  // Transaction Monitoring Patterns and Rules
  monitoringPatterns: {
    // Structuring Pattern
    structuring: {
      threshold: 9000,                   // Just below reporting threshold
      frequencyCount: 3,                 // 3 or more transactions
      timeframeDays: 7,                  // Within 7 days
      riskScore: 40,
    },
    
    // Rapid Movement of Funds
    rapidMovement: {
      transactionCount: 5,               // 5 or more transactions
      timeframeHours: 24,                // Within 24 hours
      riskScore: 25,
    },
    
    // Round Number Transactions
    roundNumbers: {
      minimumAmount: 10000,              // Minimum USD $10,000
      pattern: /^[1-9]0+$/,             // Round number pattern (10000, 20000, etc.)
      riskScore: 10,
    },
    
    // Unusual Hours Transactions
    unusualHours: {
      startHour: 22,                     // After 10 PM
      endHour: 6,                        // Before 6 AM
      riskScore: 15,
    },
    
    // Geographic Velocity
    geographicVelocity: {
      countryCount: 2,                   // Transactions in 2+ countries
      timeframeHours: 24,                // Within 24 hours
      riskScore: 25,
    },
    
    // Inconsistent Customer Profile
    profileInconsistency: {
      volumeMultiplier: 3,               // 3x expected volume
      riskScore: 20,
    },
  },

  // Sanctions Screening Configuration
  sanctionsScreening: {
    // Match Score Thresholds
    matchThresholds: {
      exactMatch: 100,                   // 100% match score
      strongMatch: 85,                   // 85%+ strong match - requires investigation
      possibleMatch: 70,                 // 70%+ possible match - requires review
      noAction: 50,                      // Below 50% no action needed
    },
    
    // Screening Frequency
    frequency: {
      realTime: true,                    // Real-time transaction screening
      daily: true,                       // Daily customer batch screening
      weekly: false,                     // Weekly full database screening
      onListUpdate: true,                // Screen on sanctions list updates
    },
    
    // Screening Sources
    sources: [
      'UN Security Council',
      'OFAC (US)',
      'EU Sanctions',
      'UK Sanctions',
      'AU Sanctions',
      'SADC Sanctions',
      'Zimbabwe National Sanctions',
    ],
  },

  // PEP (Politically Exposed Person) Management
  pepManagement: {
    // PEP Categories
    categories: {
      domestic: 'Domestic PEP',
      foreign: 'Foreign PEP',
      internationalOrg: 'International Organization PEP',
    },
    
    // PEP Risk Management
    coolOffPeriodDays: 365,              // 1 year cool-off period after leaving position
    familyRiskExtension: true,           // Extend PEP risk to family members
    closeAssociatesRiskExtension: true,  // Extend PEP risk to close associates
    automaticEddRequired: true,          // Automatic EDD for all PEPs
    approvalLevel: 'board',              // Board-level approval for PEP relationships
    
    // PEP Review Requirements
    reviewFrequencyMonths: 6,            // Review every 6 months
    transactionLimitReduction: 0.5,      // 50% reduction in transaction limits
    enhancedMonitoring: true,            // Enhanced ongoing monitoring
  },

  // KYC (Know Your Customer) Requirements
  kycRequirements: {
    // Required Documents for Individuals
    individualDocuments: [
      'national_id',                     // Zimbabwe National ID (mandatory)
      'proof_of_address',                // Utility bill or bank statement
      'passport_photo',                  // Recent passport-size photo
      'employment_letter',               // Employment verification (if applicable)
    ],
    
    // Required Documents for Corporates
    corporateDocuments: [
      'certificate_of_incorporation',    // Certificate of Incorporation
      'memorandum_articles',             // Memorandum and Articles of Association
      'directors_resolution',            // Board Resolution
      'beneficial_ownership_declaration', // Beneficial ownership information
      'directors_id_copies',             // Copies of directors' IDs
      'audited_financials',              // Latest audited financial statements
    ],
    
    // Document Verification Requirements
    verification: {
      inPersonVerificationRequired: true, // In-person verification required
      documentExpiryMonths: 3,           // Documents expire after 3 months
      updateFrequencyMonths: 12,         // Annual KYC updates required
      biometricVerificationRequired: false, // Biometric verification optional
    },
    
    // Risk-Based KYC Review Frequency
    reviewFrequency: {
      low: 24,                           // Low-risk: 24 months
      medium: 12,                        // Medium-risk: 12 months
      high: 6,                           // High-risk: 6 months
      critical: 3,                       // Critical-risk: 3 months
    },
  },

  // Risk Assessment Framework
  riskAssessment: {
    // Overall Risk Level Calculation
    riskLevels: {
      low: { min: 0, max: 30 },
      medium: { min: 31, max: 60 },
      high: { min: 61, max: 85 },
      critical: { min: 86, max: 100 },
    },
    
    // Risk Mitigation Measures by Level
    mitigationMeasures: {
      low: [
        'Standard CDD',
        'Periodic transaction monitoring',
        'Annual account review',
      ],
      medium: [
        'Enhanced transaction monitoring',
        'Manager approval for large transactions',
        'Semi-annual account review',
        'Additional documentation verification',
      ],
      high: [
        'Enhanced Due Diligence (EDD)',
        'Senior management approval',
        'Continuous transaction monitoring',
        'Quarterly account review',
        'Source of funds verification',
      ],
      critical: [
        'Board-level approval',
        'Full Enhanced Due Diligence',
        'Real-time transaction monitoring',
        'Monthly account review',
        'SAR consideration for all activities',
        'Legal counsel consultation',
      ],
    },
    
    // Reassessment Triggers
    reassessmentTriggers: [
      'Significant change in transaction patterns',
      'Change in customer circumstances',
      'New adverse media information',
      'Sanctions screening alerts',
      'PEP status changes',
      'Geographic risk changes',
      'Business relationship changes',
    ],
  },

  // System Configuration and Operational Parameters
  systemConfig: {
    // Data Retention Periods (in days)
    dataRetention: {
      transactions: 5 * 365,             // 5 years transaction data
      customerRecords: 7 * 365,          // 7 years customer records
      sars: 7 * 365,                     // 7 years SAR records
      ctrs: 5 * 365,                     // 5 years CTR records
      auditLogs: 10 * 365,               // 10 years audit logs
      riskAssessments: 5 * 365,          // 5 years risk assessments
      sanctions: 3 * 365,                // 3 years sanctions screening results
      pep: 5 * 365,                      // 5 years PEP information
    },
    
    // System Performance Parameters
    performance: {
      realTimeProcessingTimeoutMs: 5000,  // 5 second timeout for real-time processing
      batchProcessingIntervalHours: 24,   // Daily batch processing
      alertProcessingTimeoutMs: 10000,    // 10 second timeout for alert processing
      reportGenerationTimeoutMs: 60000,   // 1 minute timeout for report generation
    },
    
    // Backup and Recovery
    backupConfig: {
      frequencyHours: 24,                // Daily backups
      retentionDays: 90,                 // 90 days backup retention
      encryptionRequired: true,          // Backup encryption required
      offsiteStorageRequired: true,      // Offsite storage required
    },
    
    // Monitoring and Alerting
    monitoring: {
      healthCheckIntervalMs: 60000,      // 1 minute health checks
      performanceMonitoringEnabled: true,
      errorLoggingLevel: 'ERROR',
      auditLoggingEnabled: true,
      realTimeAlertsEnabled: true,
    },
  },

  // Integration Configuration
  integrations: {
    // Financial Intelligence Unit (FIU) Integration
    fiu: {
      endpoint: process.env.FIU_ENDPOINT || 'https://fiu.gov.zw/api',
      apiKey: process.env.FIU_API_KEY || '',
      certificatePath: process.env.FIU_CERT_PATH || '',
      timeoutMs: 30000,                  // 30 second timeout
      retryAttempts: 3,                  // 3 retry attempts
    },
    
    // Reserve Bank of Zimbabwe (RBZ) Integration
    rbz: {
      endpoint: process.env.RBZ_ENDPOINT || 'https://rbz.co.zw/api',
      apiKey: process.env.RBZ_API_KEY || '',
      certificatePath: process.env.RBZ_CERT_PATH || '',
      timeoutMs: 30000,                  // 30 second timeout
      retryAttempts: 3,                  // 3 retry attempts
    },
    
    // SECZ Integration
    secz: {
      endpoint: process.env.SECZ_ENDPOINT || 'https://secz.co.zw/api',
      apiKey: process.env.SECZ_API_KEY || '',
      certificatePath: process.env.SECZ_CERT_PATH || '',
      timeoutMs: 30000,                  // 30 second timeout
      retryAttempts: 3,                  // 3 retry attempts
    },
    
    // External Sanctions Providers
    sanctionsProviders: {
      enabled: true,
      primaryProvider: process.env.SANCTIONS_PROVIDER || 'world_check',
      backupProvider: process.env.SANCTIONS_BACKUP_PROVIDER || 'refinitiv',
      updateFrequencyHours: 24,          // Daily updates
    },
  },
};

// Export default configuration
export default seczConfig;