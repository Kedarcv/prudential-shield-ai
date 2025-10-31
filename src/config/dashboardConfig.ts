// Dashboard Configuration
// This file centralizes all hardcoded values for dashboards

// Risk Manager Dashboard Configuration
export const riskManagerConfig = {
  // Risk Distribution by Type
  riskDistribution: [
    {
      type: 'Credit Risk',
      amount: Number(import.meta.env.VITE_CREDIT_RISK_AMOUNT) || 890000000,
      percentage: Number(import.meta.env.VITE_CREDIT_RISK_PERCENTAGE) || 37,
      color: 'bg-blue-500'
    },
    {
      type: 'Market Risk',
      amount: Number(import.meta.env.VITE_MARKET_RISK_AMOUNT) || 640000000,
      percentage: Number(import.meta.env.VITE_MARKET_RISK_PERCENTAGE) || 27,
      color: 'bg-green-500'
    },
    {
      type: 'Operational Risk',
      amount: Number(import.meta.env.VITE_OPERATIONAL_RISK_AMOUNT) || 480000000,
      percentage: Number(import.meta.env.VITE_OPERATIONAL_RISK_PERCENTAGE) || 20,
      color: 'bg-yellow-500'
    },
    {
      type: 'Liquidity Risk',
      amount: Number(import.meta.env.VITE_LIQUIDITY_RISK_AMOUNT) || 380000000,
      percentage: Number(import.meta.env.VITE_LIQUIDITY_RISK_PERCENTAGE) || 16,
      color: 'bg-red-500'
    }
  ],

  // Credit Risk Management
  creditRisk: {
    portfolio: {
      totalExposure: Number(import.meta.env.VITE_CREDIT_TOTAL_EXPOSURE) || 890000000,
      expectedCreditLoss: Number(import.meta.env.VITE_CREDIT_ECL) || 12400000,
      nonPerformingLoansRate: Number(import.meta.env.VITE_CREDIT_NPL_RATE) || 2.8,
      averagePD: Number(import.meta.env.VITE_CREDIT_AVERAGE_PD) || 1.4
    },
    ifrsStaging: {
      stage1: Number(import.meta.env.VITE_IFRS_STAGE1) || 85.2,
      stage2: Number(import.meta.env.VITE_IFRS_STAGE2) || 12.0,
      stage3: Number(import.meta.env.VITE_IFRS_STAGE3) || 2.8
    },
    topExposures: [
      {
        name: import.meta.env.VITE_CREDIT_EXPOSURE_1_NAME || 'Advanced Manufacturing Ltd',
        exposure: Number(import.meta.env.VITE_CREDIT_EXPOSURE_1_AMOUNT) || 15000000,
        rating: import.meta.env.VITE_CREDIT_EXPOSURE_1_RATING || 'BB+',
        pd: Number(import.meta.env.VITE_CREDIT_EXPOSURE_1_PD) || 0.025,
        stage: Number(import.meta.env.VITE_CREDIT_EXPOSURE_1_STAGE) || 2
      },
      {
        name: import.meta.env.VITE_CREDIT_EXPOSURE_2_NAME || 'Tech Innovations PVT',
        exposure: Number(import.meta.env.VITE_CREDIT_EXPOSURE_2_AMOUNT) || 12000000,
        rating: import.meta.env.VITE_CREDIT_EXPOSURE_2_RATING || 'A-',
        pd: Number(import.meta.env.VITE_CREDIT_EXPOSURE_2_PD) || 0.012,
        stage: Number(import.meta.env.VITE_CREDIT_EXPOSURE_2_STAGE) || 1
      },
      {
        name: import.meta.env.VITE_CREDIT_EXPOSURE_3_NAME || 'Mining Corporation ZW',
        exposure: Number(import.meta.env.VITE_CREDIT_EXPOSURE_3_AMOUNT) || 10000000,
        rating: import.meta.env.VITE_CREDIT_EXPOSURE_3_RATING || 'BBB',
        pd: Number(import.meta.env.VITE_CREDIT_EXPOSURE_3_PD) || 0.018,
        stage: Number(import.meta.env.VITE_CREDIT_EXPOSURE_3_STAGE) || 1
      }
    ]
  },

  // Market Risk Management
  marketRisk: {
    metrics: {
      var95: Number(import.meta.env.VITE_MARKET_VAR95) || 1200000,
      expectedShortfall: Number(import.meta.env.VITE_MARKET_EXPECTED_SHORTFALL) || 1800000,
      portfolioBeta: Number(import.meta.env.VITE_MARKET_BETA) || 1.15,
      volatility: Number(import.meta.env.VITE_MARKET_VOLATILITY) || 18.4
    },
    stressTests: [
      {
        scenario: import.meta.env.VITE_STRESS_TEST_1_NAME || 'Market Crash (-30%)',
        loss: Number(import.meta.env.VITE_STRESS_TEST_1_LOSS) || 2500000,
        impact: import.meta.env.VITE_STRESS_TEST_1_IMPACT || 'High'
      },
      {
        scenario: import.meta.env.VITE_STRESS_TEST_2_NAME || 'Interest Rate Shock (+200bp)',
        loss: Number(import.meta.env.VITE_STRESS_TEST_2_LOSS) || 1800000,
        impact: import.meta.env.VITE_STRESS_TEST_2_IMPACT || 'Medium'
      },
      {
        scenario: import.meta.env.VITE_STRESS_TEST_3_NAME || 'Currency Crisis',
        loss: Number(import.meta.env.VITE_STRESS_TEST_3_LOSS) || 1200000,
        impact: import.meta.env.VITE_STRESS_TEST_3_IMPACT || 'Medium'
      },
      {
        scenario: import.meta.env.VITE_STRESS_TEST_4_NAME || 'Credit Spread Widening',
        loss: Number(import.meta.env.VITE_STRESS_TEST_4_LOSS) || 900000,
        impact: import.meta.env.VITE_STRESS_TEST_4_IMPACT || 'Low'
      }
    ]
  },

  // Operational Risk Management
  operationalRisk: {
    events: [
      {
        event: import.meta.env.VITE_OP_RISK_EVENT_1 || 'System Outage',
        businessLine: import.meta.env.VITE_OP_RISK_BUSINESS_LINE_1 || 'IT',
        impact: Number(import.meta.env.VITE_OP_RISK_IMPACT_1) || 150000,
        status: import.meta.env.VITE_OP_RISK_STATUS_1 || 'Investigating'
      },
      {
        event: import.meta.env.VITE_OP_RISK_EVENT_2 || 'Process Error',
        businessLine: import.meta.env.VITE_OP_RISK_BUSINESS_LINE_2 || 'Operations',
        impact: Number(import.meta.env.VITE_OP_RISK_IMPACT_2) || 45000,
        status: import.meta.env.VITE_OP_RISK_STATUS_2 || 'Resolved'
      },
      {
        event: import.meta.env.VITE_OP_RISK_EVENT_3 || 'Compliance Violation',
        businessLine: import.meta.env.VITE_OP_RISK_BUSINESS_LINE_3 || 'Legal',
        impact: Number(import.meta.env.VITE_OP_RISK_IMPACT_3) || 25000,
        status: import.meta.env.VITE_OP_RISK_STATUS_3 || 'Under Review'
      }
    ],
    keyRiskIndicators: [
      {
        indicator: import.meta.env.VITE_KRI_1_NAME || 'Failed Transactions',
        value: import.meta.env.VITE_KRI_1_VALUE || '0.12%',
        threshold: import.meta.env.VITE_KRI_1_THRESHOLD || '0.15%',
        status: import.meta.env.VITE_KRI_1_STATUS || 'Normal'
      },
      {
        indicator: import.meta.env.VITE_KRI_2_NAME || 'System Downtime',
        value: import.meta.env.VITE_KRI_2_VALUE || '0.05%',
        threshold: import.meta.env.VITE_KRI_2_THRESHOLD || '0.10%',
        status: import.meta.env.VITE_KRI_2_STATUS || 'Normal'
      },
      {
        indicator: import.meta.env.VITE_KRI_3_NAME || 'Staff Turnover',
        value: import.meta.env.VITE_KRI_3_VALUE || '8.5%',
        threshold: import.meta.env.VITE_KRI_3_THRESHOLD || '10%',
        status: import.meta.env.VITE_KRI_3_STATUS || 'Warning'
      },
      {
        indicator: import.meta.env.VITE_KRI_4_NAME || 'Error Rate',
        value: import.meta.env.VITE_KRI_4_VALUE || '0.08%',
        threshold: import.meta.env.VITE_KRI_4_THRESHOLD || '0.05%',
        status: import.meta.env.VITE_KRI_4_STATUS || 'Alert'
      }
    ]
  },

  // Liquidity Risk Management
  liquidityRisk: {
    ratios: {
      liquidityCoverage: Number(import.meta.env.VITE_LCR) || 142,
      netStableFunding: Number(import.meta.env.VITE_NSFR) || 118,
      liquidityBuffer: Number(import.meta.env.VITE_LIQUIDITY_BUFFER) || 45000000
    },
    cashFlowForecast: [
      {
        period: 'Overnight',
        inflow: Number(import.meta.env.VITE_CF_OVERNIGHT_IN) || 5000000,
        outflow: Number(import.meta.env.VITE_CF_OVERNIGHT_OUT) || 3000000,
        net: Number(import.meta.env.VITE_CF_OVERNIGHT_NET) || 2000000
      },
      {
        period: '1-7 days',
        inflow: Number(import.meta.env.VITE_CF_WEEK_IN) || 15000000,
        outflow: Number(import.meta.env.VITE_CF_WEEK_OUT) || 12000000,
        net: Number(import.meta.env.VITE_CF_WEEK_NET) || 3000000
      },
      {
        period: '1-30 days',
        inflow: Number(import.meta.env.VITE_CF_MONTH_IN) || 25000000,
        outflow: Number(import.meta.env.VITE_CF_MONTH_OUT) || 30000000,
        net: Number(import.meta.env.VITE_CF_MONTH_NET) || -5000000
      },
      {
        period: '30-90 days',
        inflow: Number(import.meta.env.VITE_CF_QUARTER_IN) || 40000000,
        outflow: Number(import.meta.env.VITE_CF_QUARTER_OUT) || 35000000,
        net: Number(import.meta.env.VITE_CF_QUARTER_NET) || 5000000
      }
    ]
  }
};

// Index Page Configuration (Homepage)
export const indexPageConfig = {
  // Fallback metrics when API fails
  fallbackMetrics: {
    riskExposure: {
      value: import.meta.env.VITE_FALLBACK_RISK_EXPOSURE || '$2.4B',
      change: Number(import.meta.env.VITE_FALLBACK_RISK_EXPOSURE_CHANGE) || -3.2,
      status: import.meta.env.VITE_FALLBACK_RISK_EXPOSURE_STATUS || 'healthy'
    },
    capitalAdequacy: {
      value: import.meta.env.VITE_FALLBACK_CAPITAL_ADEQUACY || '18.5%',
      change: Number(import.meta.env.VITE_FALLBACK_CAPITAL_ADEQUACY_CHANGE) || 2.1,
      status: import.meta.env.VITE_FALLBACK_CAPITAL_ADEQUACY_STATUS || 'healthy'
    },
    liquidityRatio: {
      value: import.meta.env.VITE_FALLBACK_LIQUIDITY_RATIO || '142%',
      change: Number(import.meta.env.VITE_FALLBACK_LIQUIDITY_RATIO_CHANGE) || -1.5,
      status: import.meta.env.VITE_FALLBACK_LIQUIDITY_RATIO_STATUS || 'warning'
    },
    creditQuality: {
      value: import.meta.env.VITE_FALLBACK_CREDIT_QUALITY || '94.2%',
      change: Number(import.meta.env.VITE_FALLBACK_CREDIT_QUALITY_CHANGE) || 0.8,
      status: import.meta.env.VITE_FALLBACK_CREDIT_QUALITY_STATUS || 'healthy'
    }
  },

  // Fallback alerts when API fails
  fallbackAlerts: [
    {
      _id: '1',
      alertType: 'warning',
      severity: 'medium',
      title: import.meta.env.VITE_FALLBACK_ALERT_1_TITLE || 'Market volatility increased by 15% in tech sector holdings',
      description: import.meta.env.VITE_FALLBACK_ALERT_1_DESCRIPTION || 'Market volatility increased by 15% in tech sector holdings',
      triggeredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      _id: '2',
      alertType: 'info',
      severity: 'low',
      title: import.meta.env.VITE_FALLBACK_ALERT_2_TITLE || 'Liquidity coverage ratio improved to 142%',
      description: import.meta.env.VITE_FALLBACK_ALERT_2_DESCRIPTION || 'Liquidity coverage ratio improved to 142%',
      triggeredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      _id: '3',
      alertType: 'breach',
      severity: 'high',
      title: import.meta.env.VITE_FALLBACK_ALERT_3_TITLE || 'Credit concentration limit approaching threshold (92%)',
      description: import.meta.env.VITE_FALLBACK_ALERT_3_DESCRIPTION || 'Credit concentration limit approaching threshold (92%)',
      triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }
  ]
};

// Compliance Dashboard Configuration
export const complianceConfig = {
  // SECZ AML/CFT Compliance Ratios
  ratios: {
    capitalAdequacy: {
      current: Number(import.meta.env.VITE_COMPLIANCE_CAPITAL_ADEQUACY) || 15.8,
      required: Number(import.meta.env.VITE_COMPLIANCE_CAPITAL_ADEQUACY_REQ) || 12.0,
      target: Number(import.meta.env.VITE_COMPLIANCE_CAPITAL_ADEQUACY_TARGET) || 16.0
    },
    liquidityCoverage: {
      current: Number(import.meta.env.VITE_COMPLIANCE_LCR) || 142.5,
      required: Number(import.meta.env.VITE_COMPLIANCE_LCR_REQ) || 100.0,
      target: Number(import.meta.env.VITE_COMPLIANCE_LCR_TARGET) || 120.0
    },
    leverageRatio: {
      current: Number(import.meta.env.VITE_COMPLIANCE_LEVERAGE_RATIO) || 6.8,
      required: Number(import.meta.env.VITE_COMPLIANCE_LEVERAGE_RATIO_REQ) || 3.0,
      target: Number(import.meta.env.VITE_COMPLIANCE_LEVERAGE_RATIO_TARGET) || 5.0
    }
  },

  // SECZ AML/CFT Compliance Metrics
  secz: {
    amlMetrics: {
      sarSubmissionRate: Number(import.meta.env.VITE_SECZ_SAR_SUBMISSION_RATE) || 98.5,
      ctrCompletionRate: Number(import.meta.env.VITE_SECZ_CTR_COMPLETION_RATE) || 99.2,
      crossBorderReportingRate: Number(import.meta.env.VITE_SECZ_CBR_RATE) || 100.0,
      pepScreeningCoverage: Number(import.meta.env.VITE_SECZ_PEP_COVERAGE) || 100.0,
      sanctionsScreeningAccuracy: Number(import.meta.env.VITE_SECZ_SANCTIONS_ACCURACY) || 99.8
    },
    transactionMonitoring: {
      realTimeMonitoringCoverage: Number(import.meta.env.VITE_SECZ_RT_MONITORING) || 100.0,
      alertGenerationRate: Number(import.meta.env.VITE_SECZ_ALERT_RATE) || 2.3,
      falsePositiveRate: Number(import.meta.env.VITE_SECZ_FALSE_POSITIVE) || 12.5,
      investigationCompletionRate: Number(import.meta.env.VITE_SECZ_INVESTIGATION_RATE) || 96.8
    },
    customerDueDiligence: {
      kycCompletionRate: Number(import.meta.env.VITE_SECZ_KYC_COMPLETION) || 99.1,
      eddRequiredRate: Number(import.meta.env.VITE_SECZ_EDD_RATE) || 8.7,
      customerRiskAssessmentCoverage: Number(import.meta.env.VITE_SECZ_RISK_ASSESSMENT) || 100.0,
      documentVerificationRate: Number(import.meta.env.VITE_SECZ_DOC_VERIFICATION) || 98.9
    }
  }
};

// SECZ-specific Dashboard Configuration
export const seczDashboardConfig = {
  // Transaction Thresholds (for display purposes)
  thresholds: {
    cashTransactionThreshold: Number(import.meta.env.VITE_SECZ_CTR_THRESHOLD) || 10000,
    crossBorderThreshold: Number(import.meta.env.VITE_SECZ_CBR_THRESHOLD) || 5000,
    largeTransactionThreshold: Number(import.meta.env.VITE_SECZ_LARGE_TX_THRESHOLD) || 50000,
    aggregateMonthlyThreshold: Number(import.meta.env.VITE_SECZ_MONTHLY_THRESHOLD) || 100000
  },

  // Recent Activity (fallback data)
  fallbackActivity: {
    sars: [
      {
        sarId: 'SAR-2024-001',
        customerName: 'Corporate Client A',
        reportType: 'suspicious_transaction',
        amountInvolved: 25000,
        status: 'submitted',
        dateCreated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sarId: 'SAR-2024-002',
        customerName: 'Individual Client B',
        reportType: 'suspicious_activity',
        amountInvolved: 15000,
        status: 'under_investigation',
        dateCreated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sarId: 'SAR-2024-003',
        customerName: 'Corporate Client C',
        reportType: 'cft_related',
        amountInvolved: 100000,
        status: 'acknowledged',
        dateCreated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    ctrs: [
      {
        ctrId: 'CTR-2024-045',
        customerName: 'Cash Intensive Business Ltd',
        transactionAmount: 12000,
        transactionType: 'deposit',
        currency: 'USD',
        dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        ctrId: 'CTR-2024-046',
        customerName: 'Import Export Co.',
        transactionAmount: 15500,
        transactionType: 'withdrawal',
        currency: 'USD',
        dateReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        ctrId: 'CTR-2024-047',
        customerName: 'Mining Operations PVT',
        transactionAmount: 22000,
        transactionType: 'exchange',
        currency: 'ZWL',
        dateReported: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    crossBorderReports: [
      {
        reportId: 'CBR-2024-089',
        senderCountry: 'Zimbabwe',
        beneficiaryCountry: 'South Africa',
        amount: 8500,
        currency: 'USD',
        status: 'approved',
        dateReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        reportId: 'CBR-2024-090',
        senderCountry: 'Botswana',
        beneficiaryCountry: 'Zimbabwe',
        amount: 6200,
        currency: 'USD',
        status: 'submitted',
        dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },

  // Regulatory Framework Status
  regulatoryFrameworks: [
    {
      id: 'secz_aml_cft',
      name: 'SECZ AML/CFT Framework',
      status: 'compliant',
      completionRate: 98.5,
      lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: 25,
      compliantRequirements: 24
    },
    {
      id: 'mlpc_act',
      name: 'MLPC Act Compliance',
      status: 'compliant',
      completionRate: 96.8,
      lastAssessment: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      nextAssessment: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: 31,
      compliantRequirements: 30
    },
    {
      id: 'cft_act',
      name: 'CFT Act Compliance',
      status: 'partially_compliant',
      completionRate: 92.3,
      lastAssessment: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      nextAssessment: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: 13,
      compliantRequirements: 12
    },
    {
      id: 'rbz_requirements',
      name: 'RBZ Risk-Based Framework',
      status: 'compliant',
      completionRate: 99.1,
      lastAssessment: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      nextAssessment: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: 18,
      compliantRequirements: 18
    }
  ],

  // High-Risk Indicators
  riskIndicators: [
    {
      indicator: 'PEP Transactions',
      currentValue: 15,
      threshold: 20,
      status: 'normal',
      trend: 'stable'
    },
    {
      indicator: 'Sanctions Matches',
      currentValue: 0,
      threshold: 1,
      status: 'healthy',
      trend: 'stable'
    },
    {
      indicator: 'Cross-Border Transactions',
      currentValue: 234,
      threshold: 300,
      status: 'normal',
      trend: 'increasing'
    },
    {
      indicator: 'Structuring Patterns',
      currentValue: 3,
      threshold: 5,
      status: 'warning',
      trend: 'increasing'
    }
  ]
};

// Loading states configuration
export const loadingConfig = {
  skeletonCount: {
    metrics: Number(import.meta.env.VITE_SKELETON_METRICS_COUNT) || 4,
    alerts: Number(import.meta.env.VITE_SKELETON_ALERTS_COUNT) || 3,
    insights: Number(import.meta.env.VITE_SKELETON_INSIGHTS_COUNT) || 3
  }
};