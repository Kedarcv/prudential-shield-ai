import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Customer, Transaction, Portfolio } from '../models/User';
import { RiskAssessment, ComplianceStatus, RiskAlert } from '../models/Risk';
import { SAR, CTR, CrossBorderReport, KYCDocument, PEP, SanctionsList, AMLRiskAssessment } from '../models/SECZCompliance';
import seczConfig from '../config/seczConfig';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prudential-shield-ai');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Transaction.deleteMany({});
    await Portfolio.deleteMany({});
    await RiskAssessment.deleteMany({});
    await ComplianceStatus.deleteMany({});
    await RiskAlert.deleteMany({});
    await SAR.deleteMany({});
    await CTR.deleteMany({});
    await CrossBorderReport.deleteMany({});
    await KYCDocument.deleteMany({});
    await PEP.deleteMany({});
    await SanctionsList.deleteMany({});
    await AMLRiskAssessment.deleteMany({});
    console.log('🗑️ Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
};

// Seed Users
const seedUsers = async () => {
  try {
    const users = [
      {
        email: 'admin@prudential-zw.co.zw',
        password: await bcrypt.hash('admin123', 12),
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        department: 'IT Security',
        permissions: ['*'],
        isActive: true
      },
      {
        email: 'aml.officer@prudential-zw.co.zw',
        password: await bcrypt.hash('aml123', 12),
        firstName: 'Tendai',
        lastName: 'Mukamuri',
        role: 'auditor',
        department: 'AML/CFT Compliance',
        permissions: ['view_compliance', 'manage_compliance', 'generate_reports'],
        isActive: true
      },
      {
        email: 'risk.manager@prudential-zw.co.zw',
        password: await bcrypt.hash('risk123', 12),
        firstName: 'Chipo',
        lastName: 'Mandaza',
        role: 'risk_manager',
        department: 'Risk Management',
        permissions: ['view_risk', 'manage_risk', 'generate_reports'],
        isActive: true
      },
      {
        email: 'compliance.analyst@prudential-zw.co.zw',
        password: await bcrypt.hash('analyst123', 12),
        firstName: 'Simba',
        lastName: 'Chikwanha',
        role: 'analyst',
        department: 'Compliance',
        permissions: ['view_compliance', 'view_reports'],
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`👥 Seeded ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    return [];
  }
};

// Seed Zimbabwe PEPs
const seedPEPs = async () => {
  try {
    const peps = [
      {
        pepId: 'PEP-ZW-001',
        personalInfo: {
          firstName: 'Emmerson',
          lastName: 'Mnangagwa',
          aliases: ['His Excellency President Mnangagwa'],
          nationality: 'Zimbabwean',
          dateOfBirth: new Date('1942-09-15'),
          placeOfBirth: 'Shabani, Zimbabwe'
        },
        pepDetails: {
          category: 'domestic',
          position: 'President of Zimbabwe',
          organization: 'Government of Zimbabwe',
          jurisdiction: 'Zimbabwe',
          startDate: new Date('2017-11-24'),
          isActive: true
        },
        riskLevel: 'high',
        familyMembers: [
          { name: 'Auxillia Mnangagwa', relationship: 'Spouse', pepStatus: true }
        ],
        sources: [
          { name: 'Government of Zimbabwe', date: new Date(), reliability: 'high' }
        ],
        lastUpdated: new Date(),
        reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        pepId: 'PEP-ZW-002',
        personalInfo: {
          firstName: 'Constantino',
          lastName: 'Chiwenga',
          aliases: ['Vice President Chiwenga', 'General Chiwenga'],
          nationality: 'Zimbabwean',
          dateOfBirth: new Date('1956-08-25'),
          placeOfBirth: 'Wedza, Zimbabwe'
        },
        pepDetails: {
          category: 'domestic',
          position: 'Vice President of Zimbabwe',
          organization: 'Government of Zimbabwe',
          jurisdiction: 'Zimbabwe',
          startDate: new Date('2017-12-28'),
          isActive: true
        },
        riskLevel: 'high',
        sources: [
          { name: 'Government of Zimbabwe', date: new Date(), reliability: 'high' }
        ],
        lastUpdated: new Date(),
        reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        pepId: 'PEP-ZW-003',
        personalInfo: {
          firstName: 'John',
          lastName: 'Mangudya',
          nationality: 'Zimbabwean',
          dateOfBirth: new Date('1963-03-10')
        },
        pepDetails: {
          category: 'domestic',
          position: 'Governor',
          organization: 'Reserve Bank of Zimbabwe',
          jurisdiction: 'Zimbabwe',
          startDate: new Date('2014-05-01'),
          isActive: true
        },
        riskLevel: 'medium',
        sources: [
          { name: 'Reserve Bank of Zimbabwe', date: new Date(), reliability: 'high' }
        ],
        lastUpdated: new Date(),
        reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active'
      }
    ];

    const createdPEPs = await PEP.insertMany(peps);
    console.log(`🏛️ Seeded ${createdPEPs.length} PEPs`);
    return createdPEPs;
  } catch (error) {
    console.error('❌ Error seeding PEPs:', error);
    return [];
  }
};

// Seed Sanctions Lists
const seedSanctionsList = async () => {
  try {
    const sanctionsLists = [
      {
        listId: 'UN-SANCTIONS-2024',
        listName: 'UN Security Council Consolidated List',
        listType: 'individual',
        issuer: 'United Nations',
        entries: [
          {
            name: 'Kim Jong-un',
            aliases: ['Supreme Leader Kim Jong-un'],
            nationality: 'North Korean',
            sanctionType: 'Asset Freeze, Travel Ban',
            reason: 'DPRK nuclear and missile programs',
            listingDate: new Date('2017-09-11'),
            lastUpdated: new Date()
          },
          {
            name: 'Ali Khamenei',
            aliases: ['Ayatollah Ali Khamenei', 'Supreme Leader Khamenei'],
            nationality: 'Iranian',
            sanctionType: 'Asset Freeze',
            reason: 'Iran nuclear program',
            listingDate: new Date('2019-06-24'),
            lastUpdated: new Date()
          }
        ],
        version: '2024.1',
        effectiveDate: new Date(),
        lastUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        listId: 'OFAC-SDN-2024',
        listName: 'OFAC Specially Designated Nationals List',
        listType: 'individual',
        issuer: 'US Treasury OFAC',
        entries: [
          {
            name: 'Vladimir Putin',
            aliases: ['President Putin'],
            nationality: 'Russian',
            sanctionType: 'Asset Freeze, Prohibition on US persons',
            reason: 'Actions undermining Ukraine sovereignty',
            listingDate: new Date('2022-02-26'),
            lastUpdated: new Date()
          }
        ],
        version: '2024.2',
        effectiveDate: new Date(),
        lastUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active'
      }
    ];

    const createdLists = await SanctionsList.insertMany(sanctionsLists);
    console.log(`⛔ Seeded ${createdLists.length} sanctions lists`);
    return createdLists;
  } catch (error) {
    console.error('❌ Error seeding sanctions lists:', error);
    return [];
  }
};

// Seed Zimbabwe Customers
const seedCustomers = async () => {
  try {
    const customers = [
      {
        customerId: 'ZW-CORP-001',
        firstName: 'Advanced',
        lastName: 'Manufacturing Limited',
        email: 'admin@advancedmfg.co.zw',
        phoneNumber: '+263-4-123456',
        dateOfBirth: new Date('1985-01-15'), // Company incorporation date
        nationality: 'Zimbabwean',
        nationalId: 'REG-001-1985',
        address: {
          street: '123 Industrial Road',
          suburb: 'Workington',
          city: 'Harare',
          province: 'Harare',
          country: 'Zimbabwe'
        },
        customerType: 'corporate',
        riskProfile: {
          level: 'medium',
          score: 45,
          factors: ['Manufacturing sector', 'Large transactions', 'Import/Export activities'],
          lastAssessment: new Date(),
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        kycStatus: 'approved',
        cddLevel: 'standard',
        amlStatus: 'clear',
        pepStatus: {
          isPEP: false,
          lastChecked: new Date()
        },
        sanctionsScreening: {
          status: 'clear',
          lastChecked: new Date(),
          matchedLists: []
        },
        expectedTransactionProfile: {
          monthlyTurnover: 500000,
          transactionTypes: ['payment', 'transfer', 'loan_repayment'],
          geographicExposure: ['Zimbabwe', 'South Africa', 'Zambia'],
          averageTransactionSize: 25000
        },
        totalExposure: 15000000,
        relationshipManager: 'Chipo Mandaza',
        onboardingDate: new Date('2020-03-15'),
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        customerId: 'ZW-IND-001',
        firstName: 'Tatenda',
        lastName: 'Moyo',
        email: 'tmoyo@email.co.zw',
        phoneNumber: '+263-77-123456',
        dateOfBirth: new Date('1980-05-20'),
        nationality: 'Zimbabwean',
        nationalId: '63-123456-A-80',
        address: {
          street: '456 Borrowdale Road',
          suburb: 'Borrowdale',
          city: 'Harare',
          province: 'Harare',
          country: 'Zimbabwe'
        },
        employmentInfo: {
          employer: 'Ministry of Finance',
          occupation: 'Senior Economist',
          industry: 'Government',
          monthlyIncome: 5000,
          sourceOfIncome: ['Salary', 'Consulting']
        },
        customerType: 'individual',
        riskProfile: {
          level: 'high',
          score: 65,
          factors: ['Government employment', 'High-value transactions', 'Frequent international transfers'],
          lastAssessment: new Date(),
          nextReview: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        },
        kycStatus: 'approved',
        cddLevel: 'enhanced',
        amlStatus: 'clear',
        pepStatus: {
          isPEP: false, // Will be updated by PEP screening
          lastChecked: new Date()
        },
        sanctionsScreening: {
          status: 'clear',
          lastChecked: new Date(),
          matchedLists: []
        },
        expectedTransactionProfile: {
          monthlyTurnover: 20000,
          transactionTypes: ['deposit', 'withdrawal', 'transfer'],
          geographicExposure: ['Zimbabwe', 'South Africa'],
          averageTransactionSize: 5000
        },
        totalExposure: 50000,
        relationshipManager: 'Tendai Mukamuri',
        onboardingDate: new Date('2019-08-10'),
        nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        customerId: 'ZW-IND-002',
        firstName: 'Sarah',
        lastName: 'Dube',
        email: 'sdube@mining.co.zw',
        phoneNumber: '+263-77-654321',
        dateOfBirth: new Date('1975-11-30'),
        nationality: 'Zimbabwean',
        nationalId: '63-654321-B-75',
        address: {
          street: '789 Mining Avenue',
          suburb: 'Eastlea',
          city: 'Harare',
          province: 'Harare',
          country: 'Zimbabwe'
        },
        employmentInfo: {
          employer: 'Zimbabwe Mining Corporation',
          occupation: 'Mining Executive',
          industry: 'Mining',
          monthlyIncome: 8000,
          sourceOfIncome: ['Salary', 'Bonuses', 'Share Options']
        },
        customerType: 'individual',
        riskProfile: {
          level: 'medium',
          score: 40,
          factors: ['Mining industry', 'High income', 'Share ownership'],
          lastAssessment: new Date(),
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        kycStatus: 'approved',
        cddLevel: 'standard',
        amlStatus: 'clear',
        pepStatus: {
          isPEP: false,
          lastChecked: new Date()
        },
        sanctionsScreening: {
          status: 'clear',
          lastChecked: new Date(),
          matchedLists: []
        },
        expectedTransactionProfile: {
          monthlyTurnover: 30000,
          transactionTypes: ['deposit', 'payment', 'transfer'],
          geographicExposure: ['Zimbabwe'],
          averageTransactionSize: 8000
        },
        totalExposure: 120000,
        relationshipManager: 'Simba Chikwanha',
        onboardingDate: new Date('2021-02-20'),
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];

    const createdCustomers = await Customer.insertMany(customers);
    console.log(`👤 Seeded ${createdCustomers.length} customers`);
    return createdCustomers;
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    return [];
  }
};

// Seed Transactions
const seedTransactions = async (customers: any[]) => {
  try {
    const currentDate = new Date();
    const transactions = [];

    // Generate transactions for each customer
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // Generate 5-10 transactions per customer
      const transactionCount = Math.floor(Math.random() * 6) + 5;
      
      for (let j = 0; j < transactionCount; j++) {
        const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
        const transactionDate = new Date(currentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        const amount = customer.customerType === 'corporate' 
          ? Math.floor(Math.random() * 100000) + 10000 // $10K - $110K for corporate
          : Math.floor(Math.random() * 20000) + 1000;  // $1K - $21K for individual
          
        const usdEquivalent = amount; // Assuming USD transactions
        
        const transactionTypes = ['deposit', 'withdrawal', 'transfer', 'payment'];
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        
        const transaction = {
          transactionId: `TXN-ZW-${Date.now()}-${i}-${j}`,
          customerId: customer.customerId,
          accountNumber: `ACC-${customer.customerId}`,
          type: type as any,
          amount,
          currency: 'USD',
          usdEquivalent,
          exchangeRate: 1,
          status: 'completed',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
          counterparty: {
            name: j % 3 === 0 ? 'South African Bank' : 'Local Business',
            country: j % 3 === 0 ? 'South Africa' : 'Zimbabwe',
            city: j % 3 === 0 ? 'Johannesburg' : 'Harare'
          },
          valueDate: transactionDate,
          bookingDate: transactionDate,
          reportingDate: transactionDate,
          channel: ['branch', 'online', 'mobile'][Math.floor(Math.random() * 3)] as any,
          location: {
            country: 'Zimbabwe',
            city: 'Harare',
            branch: 'Head Office'
          },
          riskAssessment: {
            overallScore: Math.floor(Math.random() * 60) + 10, // 10-70 score
            amlScore: Math.floor(Math.random() * 50) + 10,
            cftScore: Math.floor(Math.random() * 30) + 10,
            sanctionsScore: 0,
            riskLevel: 'low' as any,
            riskFactors: []
          },
          complianceChecks: {
            sanctionsScreening: {
              status: 'pass' as any,
              matchedLists: [],
              checkedAt: transactionDate
            },
            amlMonitoring: {
              alerts: [],
              patterns: [],
              checkedAt: transactionDate
            },
            cftScreening: {
              status: 'pass' as any,
              indicators: [],
              checkedAt: transactionDate
            },
            thresholdBreaches: []
          },
          fraudFlags: [],
          amlFlags: [],
          cftFlags: [],
          suspiciousIndicators: [],
          reviewStatus: 'auto_approved' as any,
          processedBy: 'System',
          metadata: {},
          sezReporting: {
            reportable: usdEquivalent >= 10000,
            reportType: usdEquivalent >= 10000 ? 'ctr' : undefined,
            reportingThreshold: usdEquivalent >= 10000 ? 10000 : undefined,
            reportDate: usdEquivalent >= 10000 ? transactionDate : undefined
          }
        };
        
        transactions.push(transaction);
      }
    }

    const createdTransactions = await Transaction.insertMany(transactions);
    console.log(`💳 Seeded ${createdTransactions.length} transactions`);
    return createdTransactions;
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
    return [];
  }
};

// Seed Compliance Status
const seedComplianceStatus = async () => {
  try {
    const complianceStatuses = [
      {
        regulatoryFramework: 'secz_aml_cft',
        requirement: 'Customer Due Diligence',
        description: 'Implement comprehensive customer due diligence procedures',
        sectionReference: 'SECZ AML/CFT Framework Section 4.1',
        status: 'compliant',
        completionPercentage: 100,
        lastAssessment: new Date(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        responsibleParty: 'AML Officer',
        complianceOfficer: 'Tendai Mukamuri',
        remedialActions: [],
        evidence: [
          {
            type: 'Policy Document',
            description: 'CDD Policy v2.1',
            dateProvided: new Date(),
            location: 'Compliance/Policies/CDD_Policy_v2.1.pdf'
          }
        ],
        riskOfNonCompliance: 'high',
        regulatoryDeadlines: [],
        auditFindings: []
      },
      {
        regulatoryFramework: 'mlpc_act',
        requirement: 'Suspicious Transaction Reporting',
        description: 'Report suspicious transactions to FIU within required timeframes',
        sectionReference: 'MLPC Act Section 12',
        status: 'compliant',
        completionPercentage: 95,
        lastAssessment: new Date(),
        nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        responsibleParty: 'Compliance Team',
        complianceOfficer: 'Tendai Mukamuri',
        remedialActions: [
          {
            action: 'Improve SAR submission timeliness',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'in_progress',
            assignedTo: 'AML Analyst'
          }
        ],
        evidence: [
          {
            type: 'Submission Records',
            description: 'SAR submissions Q1 2024',
            dateProvided: new Date(),
            location: 'Compliance/Reports/SAR_Q1_2024.xlsx'
          }
        ],
        riskOfNonCompliance: 'medium',
        regulatoryDeadlines: [],
        auditFindings: []
      }
    ];

    const createdStatuses = await ComplianceStatus.insertMany(complianceStatuses);
    console.log(`📋 Seeded ${createdStatuses.length} compliance statuses`);
    return createdStatuses;
  } catch (error) {
    console.error('❌ Error seeding compliance statuses:', error);
    return [];
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting Zimbabwe database seeding...\n');
    
    await connectDB();
    await clearData();
    
    console.log('\n📊 Seeding core data...');
    const users = await seedUsers();
    const peps = await seedPEPs();
    const sanctionsLists = await seedSanctionsList();
    const customers = await seedCustomers();
    const transactions = await seedTransactions(customers);
    const complianceStatuses = await seedComplianceStatus();
    
    console.log('\n✅ Zimbabwe database seeding completed successfully!');
    console.log(`
📈 Summary:
- Users: ${users.length}
- PEPs: ${peps.length}  
- Sanctions Lists: ${sanctionsLists.length}
- Customers: ${customers.length}
- Transactions: ${transactions.length}
- Compliance Items: ${complianceStatuses.length}

🚀 You can now start the application with SECZ-compliant data!
    `);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;