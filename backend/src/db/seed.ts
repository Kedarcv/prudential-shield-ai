import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from './connection';
import { User, Customer, Portfolio, Transaction } from '../models/User';
import {
  RiskAssessment,
  CreditRisk,
  MarketRisk,
  OperationalRisk,
  LiquidityRisk,
  RiskAlert,
  ComplianceStatus
} from '../models/Risk';
import moment from 'moment';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Portfolio.deleteMany({}),
      Transaction.deleteMany({}),
      RiskAssessment.deleteMany({}),
      CreditRisk.deleteMany({}),
      MarketRisk.deleteMany({}),
      OperationalRisk.deleteMany({}),
      LiquidityRisk.deleteMany({}),
      RiskAlert.deleteMany({}),
      ComplianceStatus.deleteMany({})
    ]);

    // Create Users
    console.log('👥 Creating users...');
    const users = await User.insertMany([
      {
        email: 'admin@riskwise.com',
        password: 'Sentry2024!',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        department: 'IT',
        permissions: [
          'view_dashboard', 'manage_users', 'view_users', 'generate_reports', 'manage_compliance',
          'calculate_credit_risk', 'calculate_market_risk', 'calculate_liquidity_risk',
          'perform_stress_test', 'view_risk_assessments', 'update_risk_assessments',
          'create_operational_risk', 'view_operational_risk', 'view_credit_risk',
          'view_market_risk', 'view_liquidity_risk', 'view_compliance', 'view_alerts',
          'create_alerts', 'manage_alerts', 'delete_alerts', 'export_data'
        ],
        isActive: true
      },
      {
        email: 'risk.manager@riskwise.com',
        password: 'RiskManager2024!',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'risk_manager',
        department: 'Risk Management',
        permissions: [
          'view_dashboard', 'generate_reports', 'calculate_credit_risk',
          'calculate_market_risk', 'perform_stress_test', 'view_risk_assessments',
          'update_risk_assessments', 'view_operational_risk', 'view_credit_risk',
          'view_market_risk', 'view_alerts', 'manage_alerts'
        ],
        isActive: true
      },
      {
        email: 'analyst@riskwise.com',
        password: 'Analyst2024!',
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'analyst',
        department: 'Risk Analysis',
        permissions: [
          'view_dashboard', 'view_risk_assessments', 'view_operational_risk',
          'view_credit_risk', 'view_market_risk', 'view_alerts'
        ],
        isActive: true
      },
      {
        email: 'compliance@riskwise.com',
        password: 'Compliance2024!',
        firstName: 'Emma',
        lastName: 'Williams',
        role: 'auditor',
        department: 'Compliance',
        permissions: [
          'view_dashboard', 'view_compliance', 'manage_compliance',
          'generate_reports', 'view_alerts'
        ],
        isActive: true
      }
    ]);

    // Create Customers
    console.log('🏦 Creating customers...');
    const customers = await Customer.insertMany([
      {
        customerId: 'CUST001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phoneNumber: '+263123456789',
        dateOfBirth: new Date('1985-06-15'),
        address: {
          street: '123 Main Street',
          city: 'Harare',
          state: 'Harare',
          postalCode: '00263',
          country: 'Zimbabwe'
        },
        customerType: 'individual',
        riskProfile: 'medium',
        kycStatus: 'approved',
        amlStatus: 'clear',
        creditRating: 'BBB',
        totalExposure: 500000,
        relationshipManager: 'Sarah Johnson',
        onboardingDate: moment().subtract(2, 'years').toDate(),
        lastReviewDate: moment().subtract(3, 'months').toDate(),
        isActive: true,
        watchlistFlags: [],
        sanctions: []
      },
      {
        customerId: 'CUST002',
        firstName: 'Advanced Manufacturing',
        lastName: 'Ltd',
        email: 'contact@advmanufacturing.co.zw',
        phoneNumber: '+263987654321',
        dateOfBirth: new Date('2010-03-20'),
        address: {
          street: '456 Industrial Road',
          city: 'Bulawayo',
          state: 'Bulawayo',
          postalCode: '00263',
          country: 'Zimbabwe'
        },
        customerType: 'corporate',
        riskProfile: 'high',
        kycStatus: 'approved',
        amlStatus: 'clear',
        creditRating: 'BB+',
        totalExposure: 2500000,
        relationshipManager: 'Michael Chen',
        onboardingDate: moment().subtract(5, 'years').toDate(),
        lastReviewDate: moment().subtract(1, 'month').toDate(),
        isActive: true,
        watchlistFlags: ['large_exposure'],
        sanctions: []
      },
      {
        customerId: 'CUST003',
        firstName: 'Tech Innovations',
        lastName: 'PVT Ltd',
        email: 'info@techinnovations.co.zw',
        phoneNumber: '+263111222333',
        dateOfBirth: new Date('2018-09-10'),
        address: {
          street: '789 Tech Park',
          city: 'Harare',
          state: 'Harare',
          postalCode: '00263',
          country: 'Zimbabwe'
        },
        customerType: 'corporate',
        riskProfile: 'low',
        kycStatus: 'approved',
        amlStatus: 'clear',
        creditRating: 'A-',
        totalExposure: 750000,
        relationshipManager: 'Emma Williams',
        onboardingDate: moment().subtract(1, 'year').toDate(),
        lastReviewDate: moment().subtract(2, 'months').toDate(),
        isActive: true,
        watchlistFlags: [],
        sanctions: []
      }
    ]);

    // Create Portfolios
    console.log('📊 Creating portfolios...');
    const portfolios = await Portfolio.insertMany([
      {
        portfolioId: 'PORT001',
        name: 'Corporate Lending Portfolio',
        type: 'loan',
        manager: 'Sarah Johnson',
        totalValue: 50000000,
        currency: 'USD',
        riskProfile: 'moderate',
        inception: moment().subtract(3, 'years').toDate(),
        positions: [
          {
            assetId: 'LOAN001',
            assetType: 'corporate_loan',
            quantity: 1,
            marketValue: 2500000,
            weight: 0.05
          },
          {
            assetId: 'LOAN002',
            assetType: 'corporate_loan',
            quantity: 1,
            marketValue: 5000000,
            weight: 0.10
          },
          {
            assetId: 'LOAN003',
            assetType: 'retail_loan',
            quantity: 100,
            marketValue: 15000000,
            weight: 0.30
          }
        ],
        limits: {
          singleNameLimit: 0.15, // 15%
          sectorLimit: 0.25, // 25%
          countryLimit: 0.80, // 80%
          currencyLimit: 0.70 // 70%
        },
        performance: [
          {
            date: moment().subtract(1, 'month').toDate(),
            return: 0.023,
            volatility: 0.12,
            sharpeRatio: 1.2,
            var: 850000
          }
        ]
      },
      {
        portfolioId: 'PORT002',
        name: 'Investment Portfolio',
        type: 'investment',
        manager: 'Michael Chen',
        totalValue: 25000000,
        currency: 'USD',
        riskProfile: 'aggressive',
        inception: moment().subtract(2, 'years').toDate(),
        positions: [
          {
            assetId: 'EQUITY001',
            assetType: 'equity',
            quantity: 10000,
            marketValue: 15000000,
            weight: 0.60
          },
          {
            assetId: 'BOND001',
            assetType: 'bond',
            quantity: 100,
            marketValue: 8000000,
            weight: 0.32
          },
          {
            assetId: 'COMMODITY001',
            assetType: 'commodity',
            quantity: 50,
            marketValue: 2000000,
            weight: 0.08
          }
        ],
        limits: {
          singleNameLimit: 0.10,
          sectorLimit: 0.30,
          countryLimit: 0.60,
          currencyLimit: 0.80
        },
        performance: [
          {
            date: moment().subtract(1, 'month').toDate(),
            return: 0.045,
            volatility: 0.18,
            sharpeRatio: 1.8,
            var: 1250000
          }
        ]
      },
      {
        portfolioId: 'PORT003',
        name: 'Treasury Portfolio',
        type: 'treasury',
        manager: 'Emma Williams',
        totalValue: 75000000,
        currency: 'USD',
        riskProfile: 'conservative',
        inception: moment().subtract(5, 'years').toDate(),
        positions: [
          {
            assetId: 'TBILL001',
            assetType: 'treasury_bill',
            quantity: 1000,
            marketValue: 45000000,
            weight: 0.60
          },
          {
            assetId: 'BOND002',
            assetType: 'government_bond',
            quantity: 300,
            marketValue: 25000000,
            weight: 0.33
          },
          {
            assetId: 'CASH001',
            assetType: 'cash',
            quantity: 1,
            marketValue: 5000000,
            weight: 0.07
          }
        ],
        limits: {
          singleNameLimit: 0.20,
          sectorLimit: 0.50,
          countryLimit: 1.00,
          currencyLimit: 0.90
        },
        performance: [
          {
            date: moment().subtract(1, 'month').toDate(),
            return: 0.012,
            volatility: 0.05,
            sharpeRatio: 0.8,
            var: 350000
          }
        ]
      }
    ]);

    // Create Sample Transactions
    console.log('💸 Creating transactions...');
    const transactions = [];
    for (let i = 0; i < 50; i++) {
      transactions.push({
        transactionId: `TXN${String(i + 1).padStart(6, '0')}`,
        customerId: customers[Math.floor(Math.random() * customers.length)].customerId,
        portfolioId: i % 3 === 0 ? portfolios[Math.floor(Math.random() * portfolios.length)].portfolioId : undefined,
        type: ['credit', 'debit', 'transfer', 'trade'][Math.floor(Math.random() * 4)] as any,
        amount: Math.floor(Math.random() * 1000000) + 10000,
        currency: 'USD',
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as any,
        description: `Transaction ${i + 1}`,
        valueDate: moment().subtract(Math.floor(Math.random() * 30), 'days').toDate(),
        bookingDate: moment().subtract(Math.floor(Math.random() * 30), 'days').toDate(),
        channel: ['online', 'branch', 'api'][Math.floor(Math.random() * 3)] as any,
        location: {
          country: 'Zimbabwe',
          city: ['Harare', 'Bulawayo', 'Gweru'][Math.floor(Math.random() * 3)]
        },
        riskScore: Math.random() * 100,
        fraudFlags: Math.random() > 0.9 ? ['unusual_pattern'] : [],
        amlFlags: Math.random() > 0.95 ? ['high_risk_country'] : [],
        processedBy: 'system',
        metadata: {}
      });
    }
    await Transaction.insertMany(transactions);

    // Create Credit Risk Records
    console.log('🎯 Creating credit risk records...');
    const creditRisks = [];
    for (const customer of customers) {
      creditRisks.push({
        borrowerId: customer.customerId,
        facilityId: `FAC${customer.customerId}001`,
        probabilityOfDefault: Math.random() * 0.1 + 0.001, // 0.1% to 10.1%
        lossGivenDefault: Math.random() * 0.4 + 0.2, // 20% to 60%
        exposureAtDefault: customer.totalExposure,
        expectedCreditLoss: customer.totalExposure * (Math.random() * 0.02 + 0.001), // 0.1% to 2.1% of exposure
        stage: Math.random() > 0.8 ? (Math.random() > 0.5 ? 2 : 3) : 1 as any,
        creditRating: customer.creditRating || 'Unrated',
        limitUtilization: Math.random() * 0.8 + 0.1, // 10% to 90%
        daysPastDue: Math.random() > 0.9 ? Math.floor(Math.random() * 60) : 0,
        restructuringFlag: Math.random() > 0.95,
        watchListFlag: customer.watchlistFlags.length > 0,
        calculatedAt: moment().subtract(Math.floor(Math.random() * 7), 'days').toDate()
      });
    }
    await CreditRisk.insertMany(creditRisks);

    // Create Market Risk Records
    console.log('📈 Creating market risk records...');
    const marketRisks = [];
    for (const portfolio of portfolios) {
      marketRisks.push({
        portfolioId: portfolio.portfolioId,
        riskMetric: 'var',
        value: portfolio.totalValue * (Math.random() * 0.03 + 0.01), // 1% to 4% of portfolio value
        confidence: 0.95,
        timeHorizon: 1,
        method: ['historical', 'parametric', 'monte_carlo'][Math.floor(Math.random() * 3)] as any,
        assetClass: portfolio.type === 'loan' ? 'credit' : portfolio.type === 'investment' ? 'equity' : 'fixed_income',
        currency: portfolio.currency,
        calculatedAt: moment().subtract(Math.floor(Math.random() * 3), 'days').toDate(),
        validUntil: moment().add(1, 'day').toDate()
      });
    }
    await MarketRisk.insertMany(marketRisks);

    // Create Operational Risk Events
    console.log('⚠️ Creating operational risk events...');
    const operationalRisks = await OperationalRisk.insertMany([
      {
        businessLine: 'Corporate Banking',
        eventType: 'System Failure',
        lossAmount: 150000,
        recoveryAmount: 25000,
        netLoss: 125000,
        eventDate: moment().subtract(15, 'days').toDate(),
        reportedDate: moment().subtract(14, 'days').toDate(),
        status: 'investigating',
        riskCategory: 'system_failures',
        description: 'Core banking system outage during peak hours',
        rootCause: 'Hardware failure in primary data center',
        correctiveActions: [
          'Implemented redundant hardware',
          'Enhanced monitoring systems',
          'Updated disaster recovery procedures'
        ]
      },
      {
        businessLine: 'Treasury',
        eventType: 'Fraud',
        lossAmount: 75000,
        recoveryAmount: 0,
        netLoss: 75000,
        eventDate: moment().subtract(45, 'days').toDate(),
        reportedDate: moment().subtract(44, 'days').toDate(),
        status: 'resolved',
        riskCategory: 'internal_fraud',
        description: 'Unauthorized trading activity by junior trader',
        rootCause: 'Inadequate supervision and control systems',
        correctiveActions: [
          'Strengthened trading controls',
          'Enhanced staff training',
          'Implemented real-time monitoring'
        ]
      }
    ]);

    // Create Risk Assessments
    console.log('📋 Creating risk assessments...');
    const riskAssessments = [];
    
    // Portfolio risk assessments
    for (const portfolio of portfolios) {
      riskAssessments.push({
        entityId: portfolio.portfolioId,
        entityType: 'portfolio',
        riskType: 'market',
        riskScore: Math.floor(Math.random() * 40) + 20, // 20-60 score
        riskLevel: portfolio.riskProfile === 'aggressive' ? 'high' : 
                  portfolio.riskProfile === 'moderate' ? 'medium' : 'low',
        probability: Math.random() * 0.1 + 0.01,
        impact: portfolio.totalValue * 0.05,
        mitigationMeasures: [
          'Regular portfolio rebalancing',
          'Diversification across asset classes',
          'Hedging strategies implementation'
        ],
        assessmentDate: moment().subtract(Math.floor(Math.random() * 7), 'days').toDate(),
        nextReviewDate: moment().add(30, 'days').toDate(),
        assessedBy: portfolio.manager,
        status: 'active',
        metadata: {
          portfolioType: portfolio.type,
          totalValue: portfolio.totalValue
        }
      });
    }

    // Customer risk assessments
    for (const customer of customers) {
      riskAssessments.push({
        entityId: customer.customerId,
        entityType: 'customer',
        riskType: 'credit',
        riskScore: customer.riskProfile === 'high' ? Math.floor(Math.random() * 30) + 60 :
                  customer.riskProfile === 'medium' ? Math.floor(Math.random() * 30) + 30 :
                  Math.floor(Math.random() * 30) + 10,
        riskLevel: customer.riskProfile as any,
        probability: Math.random() * 0.05 + 0.001,
        impact: customer.totalExposure,
        mitigationMeasures: [
          'Regular credit reviews',
          'Enhanced monitoring',
          'Collateral requirements'
        ],
        assessmentDate: customer.lastReviewDate,
        nextReviewDate: moment().add(90, 'days').toDate(),
        assessedBy: customer.relationshipManager,
        status: 'active',
        metadata: {
          customerType: customer.customerType,
          totalExposure: customer.totalExposure,
          creditRating: customer.creditRating
        }
      });
    }

    await RiskAssessment.insertMany(riskAssessments);

    // Create Risk Alerts
    console.log('🚨 Creating risk alerts...');
    const riskAlerts = await RiskAlert.insertMany([
      {
        alertType: 'breach',
        riskCategory: 'market',
        severity: 'high',
        title: 'Portfolio VaR Limit Exceeded',
        description: 'Investment Portfolio VaR exceeded daily limit of $1M (current: $1.25M)',
        entityId: 'PORT002',
        entityType: 'portfolio',
        thresholdValue: 1000000,
        actualValue: 1250000,
        triggeredAt: moment().subtract(2, 'hours').toDate(),
        status: 'active',
        actions: [
          'Review portfolio composition',
          'Consider position reduction',
          'Implement hedging strategies'
        ]
      },
      {
        alertType: 'warning',
        riskCategory: 'credit',
        severity: 'medium',
        title: 'Credit Rating Downgrade',
        description: 'Advanced Manufacturing Ltd credit rating downgraded from BBB to BB+',
        entityId: 'CUST002',
        entityType: 'customer',
        triggeredAt: moment().subtract(1, 'day').toDate(),
        status: 'acknowledged',
        acknowledgedAt: moment().subtract(12, 'hours').toDate(),
        acknowledgedBy: users[1]._id.toString(),
        actions: [
          'Review credit facility terms',
          'Request updated financials',
          'Consider additional collateral'
        ]
      },
      {
        alertType: 'information',
        riskCategory: 'compliance',
        severity: 'low',
        title: 'Compliance Review Due',
        description: 'Basel III capital adequacy assessment due for review',
        entityId: 'system',
        entityType: 'regulatory',
        triggeredAt: moment().subtract(3, 'days').toDate(),
        status: 'resolved',
        resolvedAt: moment().subtract(1, 'day').toDate(),
        acknowledgedBy: users[3]._id.toString(),
        actions: [
          'Complete capital adequacy calculation',
          'Update regulatory reporting',
          'Submit compliance documentation'
        ]
      },
      {
        alertType: 'breach',
        riskCategory: 'liquidity',
        severity: 'critical',
        title: 'Liquidity Coverage Ratio Below Minimum',
        description: 'LCR dropped to 98%, below regulatory minimum of 100%',
        entityId: 'system',
        entityType: 'system',
        thresholdValue: 100,
        actualValue: 98,
        triggeredAt: moment().subtract(30, 'minutes').toDate(),
        status: 'active',
        actions: [
          'Immediate liquidity injection required',
          'Review cash flow projections',
          'Notify senior management',
          'Contact regulatory authorities'
        ]
      }
    ]);

    // Create Compliance Status Records
    console.log('✅ Creating compliance status records...');
    await ComplianceStatus.insertMany([
      {
        regulatoryFramework: 'basel_iii',
        requirement: 'Capital Adequacy Ratio',
        description: 'Minimum 8% Tier 1 + Tier 2 Capital to Risk Weighted Assets',
        status: 'compliant',
        completionPercentage: 98,
        lastAssessment: moment().subtract(7, 'days').toDate(),
        nextAssessment: moment().add(30, 'days').toDate(),
        responsibleParty: 'Risk Management Team',
        remedialActions: [],
        evidence: [
          'Monthly capital calculation report',
          'Risk weighted assets computation',
          'Regulatory capital return submission'
        ]
      },
      {
        regulatoryFramework: 'basel_iii',
        requirement: 'Liquidity Coverage Ratio',
        description: 'Minimum 100% High Quality Liquid Assets to Net Cash Outflows',
        status: 'non_compliant',
        completionPercentage: 85,
        lastAssessment: moment().subtract(1, 'day').toDate(),
        nextAssessment: moment().add(7, 'days').toDate(),
        responsibleParty: 'Treasury Team',
        remedialActions: [
          'Increase HQLA holdings',
          'Optimize cash flow management',
          'Review funding structure'
        ],
        evidence: [
          'Daily LCR monitoring report',
          'Liquidity stress test results'
        ]
      },
      {
        regulatoryFramework: 'ifrs_9',
        requirement: 'Expected Credit Loss Calculation',
        description: 'Implement forward-looking ECL model for financial instruments',
        status: 'compliant',
        completionPercentage: 95,
        lastAssessment: moment().subtract(14, 'days').toDate(),
        nextAssessment: moment().add(60, 'days').toDate(),
        responsibleParty: 'Credit Risk Team',
        remedialActions: [],
        evidence: [
          'ECL model validation report',
          'Quarterly provision calculations',
          'Stage migration analysis'
        ]
      },
      {
        regulatoryFramework: 'rbz_requirements',
        requirement: 'Single Borrower Exposure Limits',
        description: 'Maximum 25% of Tier 1 capital exposure to single borrower',
        status: 'compliant',
        completionPercentage: 92,
        lastAssessment: moment().subtract(21, 'days').toDate(),
        nextAssessment: moment().add(30, 'days').toDate(),
        responsibleParty: 'Credit Committee',
        remedialActions: [],
        evidence: [
          'Large exposure monitoring report',
          'Concentration risk analysis'
        ]
      },
      {
        regulatoryFramework: 'aml_cft',
        requirement: 'Customer Due Diligence',
        description: 'Enhanced due diligence for high-risk customers and transactions',
        status: 'partially_compliant',
        completionPercentage: 78,
        lastAssessment: moment().subtract(10, 'days').toDate(),
        nextAssessment: moment().add(14, 'days').toDate(),
        responsibleParty: 'Compliance Team',
        remedialActions: [
          'Update CDD procedures',
          'Enhanced staff training',
          'System improvements for screening'
        ],
        evidence: [
          'CDD policy document',
          'Training completion records',
          'Customer risk assessment forms'
        ]
      }
    ]);

    console.log('✅ Database seeding completed successfully!');
    
    // Print summary
    const summary = {
      users: await User.countDocuments(),
      customers: await Customer.countDocuments(),
      portfolios: await Portfolio.countDocuments(),
      transactions: await Transaction.countDocuments(),
      riskAssessments: await RiskAssessment.countDocuments(),
      creditRisks: await CreditRisk.countDocuments(),
      marketRisks: await MarketRisk.countDocuments(),
      operationalRisks: await OperationalRisk.countDocuments(),
      riskAlerts: await RiskAlert.countDocuments(),
      complianceStatus: await ComplianceStatus.countDocuments()
    };
    
    console.log('\n📊 Seeding Summary:');
    console.log(`👥 Users: ${summary.users}`);
    console.log(`🏦 Customers: ${summary.customers}`);
    console.log(`📊 Portfolios: ${summary.portfolios}`);
    console.log(`💸 Transactions: ${summary.transactions}`);
    console.log(`📋 Risk Assessments: ${summary.riskAssessments}`);
    console.log(`🎯 Credit Risks: ${summary.creditRisks}`);
    console.log(`📈 Market Risks: ${summary.marketRisks}`);
    console.log(`⚠️ Operational Risks: ${summary.operationalRisks}`);
    console.log(`🚨 Risk Alerts: ${summary.riskAlerts}`);
    console.log(`✅ Compliance Records: ${summary.complianceStatus}`);
    
    console.log('\n🔐 Default Admin Credentials:');
    console.log('Email: admin@riskwise.com');
    console.log('Password: RiskWise2024!');
    
    console.log('\n🔐 Other User Credentials:');
    console.log('Risk Manager - Email: risk.manager@riskwise.com, Password: RiskManager2024!');
    console.log('Analyst - Email: analyst@riskwise.com, Password: Analyst2024!');
    console.log('Compliance - Email: compliance@riskwise.com, Password: Compliance2024!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;