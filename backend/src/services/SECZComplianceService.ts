import { SAR, CTR, CrossBorderReport, KYCDocument, PEP, SanctionsList, AMLRiskAssessment } from '../models/SECZCompliance';
import { Customer, Transaction } from '../models/User';
import { ComplianceStatus, RiskAlert } from '../models/Risk';

// SECZ AML/CFT Compliance Service for Zimbabwe
export class SECZComplianceService {
  
  // Transaction Monitoring Constants (in USD equivalent)
  private static readonly CASH_TRANSACTION_THRESHOLD = 10000; // USD $10,000
  private static readonly CROSS_BORDER_THRESHOLD = 5000; // USD $5,000
  private static readonly SUSPICIOUS_PATTERN_THRESHOLD = 3; // Number of patterns to trigger alert
  
  // Zimbabwe-specific risk jurisdictions
  private static readonly HIGH_RISK_COUNTRIES = [
    'North Korea', 'Iran', 'Syria', 'Afghanistan', 'Myanmar', 'Belarus'
  ];
  
  // SECZ reportable transaction types
  private static readonly REPORTABLE_TRANSACTION_TYPES = [
    'large_cash', 'cross_border', 'suspicious_pattern', 'pep_related', 'sanctions_match'
  ];

  /**
   * Monitor transaction for AML/CFT compliance
   */
  static async monitorTransaction(transactionId: string): Promise<{
    requiresReporting: boolean;
    reportType?: string;
    riskScore: number;
    alerts: string[];
  }> {
    try {
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const customer = await Customer.findOne({ customerId: transaction.customerId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      const monitoringResult = {
        requiresReporting: false,
        reportType: undefined as string | undefined,
        riskScore: 0,
        alerts: [] as string[]
      };

      // 1. Cash Transaction Reporting (CTR) Check
      if (transaction.type === 'deposit' || transaction.type === 'withdrawal') {
        if (transaction.usdEquivalent && transaction.usdEquivalent >= this.CASH_TRANSACTION_THRESHOLD) {
          monitoringResult.requiresReporting = true;
          monitoringResult.reportType = 'ctr';
          monitoringResult.alerts.push('Large cash transaction - CTR required');
        }
      }

      // 2. Cross-Border Reporting Check
      if (transaction.counterparty.country && transaction.counterparty.country !== 'Zimbabwe') {
        if (transaction.usdEquivalent && transaction.usdEquivalent >= this.CROSS_BORDER_THRESHOLD) {
          await this.generateCrossBorderReport(transaction);
          monitoringResult.alerts.push('Cross-border transaction reported to RBZ');
        }
      }

      // 3. Sanctions Screening
      const sanctionsResult = await this.performSanctionsScreening(transaction, customer);
      if (sanctionsResult.hasMatch) {
        monitoringResult.requiresReporting = true;
        monitoringResult.reportType = 'sar';
        monitoringResult.riskScore += 50;
        monitoringResult.alerts.push('Sanctions screening match detected');
        
        // Block transaction if positive sanctions match
        transaction.status = 'blocked';
        await transaction.save();
      }

      // 4. PEP Screening
      const pepResult = await this.performPEPScreening(customer);
      if (pepResult.isPEP) {
        monitoringResult.riskScore += 30;
        monitoringResult.alerts.push(`PEP detected: ${pepResult.category}`);
        
        // Enhanced monitoring for PEPs
        if (transaction.usdEquivalent && transaction.usdEquivalent > 5000) {
          monitoringResult.alerts.push('Large transaction by PEP - enhanced monitoring required');
        }
      }

      // 5. Suspicious Pattern Detection
      const patternResult = await this.detectSuspiciousPatterns(customer, transaction);
      if (patternResult.suspiciousPatterns.length >= this.SUSPICIOUS_PATTERN_THRESHOLD) {
        monitoringResult.requiresReporting = true;
        monitoringResult.reportType = 'sar';
        monitoringResult.riskScore += 40;
        monitoringResult.alerts.push(`Suspicious patterns detected: ${patternResult.suspiciousPatterns.join(', ')}`);
      }

      // 6. High-Risk Geography Check
      if (transaction.counterparty.country && this.HIGH_RISK_COUNTRIES.includes(transaction.counterparty.country)) {
        monitoringResult.riskScore += 25;
        monitoringResult.alerts.push(`High-risk jurisdiction: ${transaction.counterparty.country}`);
      }

      // 7. Update transaction with compliance results
      transaction.riskAssessment = {
        overallScore: monitoringResult.riskScore,
        amlScore: monitoringResult.riskScore * 0.6,
        cftScore: this.calculateCFTScore(transaction),
        sanctionsScore: sanctionsResult.hasMatch ? 100 : 0,
        riskLevel: this.determineRiskLevel(monitoringResult.riskScore),
        riskFactors: monitoringResult.alerts
      };

      transaction.sezReporting = {
        reportable: monitoringResult.requiresReporting,
        reportType: monitoringResult.reportType as any,
        reportingThreshold: this.getReportingThreshold(monitoringResult.reportType),
        reportDate: monitoringResult.requiresReporting ? new Date() : undefined
      };

      await transaction.save();

      // 8. Generate alerts if necessary
      if (monitoringResult.riskScore > 70) {
        await this.generateRiskAlert(transaction, monitoringResult);
      }

      return monitoringResult;
      
    } catch (error) {
      console.error('Error monitoring transaction:', error);
      throw error;
    }
  }

  /**
   * Perform sanctions screening
   */
  private static async performSanctionsScreening(transaction: any, customer: any): Promise<{
    hasMatch: boolean;
    matchedLists: string[];
    matchType: 'exact' | 'partial' | 'none';
  }> {
    try {
      const activeSanctionsLists = await SanctionsList.find({ status: 'active' });
      let hasMatch = false;
      const matchedLists: string[] = [];
      let matchType: 'exact' | 'partial' | 'none' = 'none';

      // Screen customer name
      for (const list of activeSanctionsLists) {
        for (const entry of list.entries) {
          const customerFullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
          const entryName = entry.name.toLowerCase();
          
          if (customerFullName === entryName) {
            hasMatch = true;
            matchType = 'exact';
            matchedLists.push(list.listName);
          } else if (customerFullName.includes(entryName) || entryName.includes(customerFullName)) {
            hasMatch = true;
            matchType = 'partial';
            matchedLists.push(list.listName);
          }
          
          // Check aliases
          for (const alias of entry.aliases) {
            if (customerFullName.includes(alias.toLowerCase())) {
              hasMatch = true;
              matchType = 'partial';
              matchedLists.push(list.listName);
            }
          }
        }
      }

      // Screen counterparty if available
      if (transaction.counterparty?.name) {
        for (const list of activeSanctionsLists) {
          for (const entry of list.entries) {
            const counterpartyName = transaction.counterparty.name.toLowerCase();
            const entryName = entry.name.toLowerCase();
            
            if (counterpartyName === entryName || counterpartyName.includes(entryName)) {
              hasMatch = true;
              matchType = matchType === 'exact' ? 'exact' : 'partial';
              matchedLists.push(list.listName);
            }
          }
        }
      }

      // Update customer sanctions screening status
      customer.sanctionsScreening = {
        status: hasMatch ? 'match' : 'clear',
        lastChecked: new Date(),
        matchedLists: [...new Set(matchedLists)], // Remove duplicates
        screeningProvider: 'SECZ_Internal'
      };
      await customer.save();

      return { hasMatch, matchedLists: [...new Set(matchedLists)], matchType };
      
    } catch (error) {
      console.error('Error performing sanctions screening:', error);
      return { hasMatch: false, matchedLists: [], matchType: 'none' };
    }
  }

  /**
   * Perform PEP screening
   */
  private static async performPEPScreening(customer: any): Promise<{
    isPEP: boolean;
    category?: string;
    position?: string;
    riskLevel?: string;
  }> {
    try {
      const customerFullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      
      const pepMatch = await PEP.findOne({
        $or: [
          {
            'personalInfo.firstName': { $regex: customer.firstName, $options: 'i' },
            'personalInfo.lastName': { $regex: customer.lastName, $options: 'i' }
          },
          {
            'personalInfo.aliases': { $regex: customerFullName, $options: 'i' }
          }
        ],
        'pepDetails.isActive': true,
        status: 'active'
      });

      if (pepMatch) {
        // Update customer PEP status
        customer.pepStatus = {
          isPEP: true,
          pepCategory: pepMatch.pepDetails.category,
          position: pepMatch.pepDetails.position,
          jurisdiction: pepMatch.pepDetails.jurisdiction,
          lastChecked: new Date()
        };
        await customer.save();

        return {
          isPEP: true,
          category: pepMatch.pepDetails.category,
          position: pepMatch.pepDetails.position,
          riskLevel: pepMatch.riskLevel
        };
      }

      // Update customer PEP status as not PEP
      customer.pepStatus = {
        isPEP: false,
        lastChecked: new Date()
      };
      await customer.save();

      return { isPEP: false };
      
    } catch (error) {
      console.error('Error performing PEP screening:', error);
      return { isPEP: false };
    }
  }

  /**
   * Detect suspicious transaction patterns
   */
  private static async detectSuspiciousPatterns(customer: any, currentTransaction: any): Promise<{
    suspiciousPatterns: string[];
    riskScore: number;
  }> {
    try {
      const suspiciousPatterns: string[] = [];
      let riskScore = 0;

      // Get customer's recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTransactions = await Transaction.find({
        customerId: customer.customerId,
        bookingDate: { $gte: thirtyDaysAgo },
        status: 'completed'
      }).sort({ bookingDate: -1 });

      // Pattern 1: Structuring (multiple transactions just below reporting threshold)
      const nearThresholdTransactions = recentTransactions.filter(tx => 
        tx.usdEquivalent && tx.usdEquivalent >= 9000 && tx.usdEquivalent < 10000
      );
      if (nearThresholdTransactions.length >= 3) {
        suspiciousPatterns.push('Potential structuring - multiple transactions near cash threshold');
        riskScore += 30;
      }

      // Pattern 2: Rapid movement of funds
      const rapidTransactions = recentTransactions.filter(tx => {
        const timeDiff = Math.abs(new Date(tx.bookingDate).getTime() - new Date(currentTransaction.bookingDate).getTime());
        return timeDiff < (24 * 60 * 60 * 1000); // Within 24 hours
      });
      if (rapidTransactions.length >= 5) {
        suspiciousPatterns.push('Rapid movement of funds detected');
        riskScore += 25;
      }

      // Pattern 3: Inconsistent with customer profile
      const totalMonthlyVolume = recentTransactions.reduce((sum, tx) => 
        sum + (tx.usdEquivalent || 0), 0
      );
      if (customer.expectedTransactionProfile && 
          totalMonthlyVolume > customer.expectedTransactionProfile.monthlyTurnover * 3) {
        suspiciousPatterns.push('Transaction volume inconsistent with customer profile');
        riskScore += 20;
      }

      // Pattern 4: Round number transactions
      if (currentTransaction.amount % 1000 === 0 && currentTransaction.amount >= 10000) {
        suspiciousPatterns.push('Round number large transaction');
        riskScore += 10;
      }

      // Pattern 5: Cross-border patterns
      const crossBorderTransactions = recentTransactions.filter(tx => 
        tx.counterparty.country && tx.counterparty.country !== 'Zimbabwe'
      );
      if (crossBorderTransactions.length >= 3) {
        const uniqueCountries = [...new Set(crossBorderTransactions.map(tx => tx.counterparty.country))];
        if (uniqueCountries.length >= 3) {
          suspiciousPatterns.push('Multiple cross-border transactions to different countries');
          riskScore += 25;
        }
      }

      // Pattern 6: Time-based patterns (unusual hours)
      const transactionHour = new Date(currentTransaction.bookingDate).getHours();
      if (transactionHour < 6 || transactionHour > 22) {
        suspiciousPatterns.push('Transaction conducted outside normal business hours');
        riskScore += 15;
      }

      return { suspiciousPatterns, riskScore };
      
    } catch (error) {
      console.error('Error detecting suspicious patterns:', error);
      return { suspiciousPatterns: [], riskScore: 0 };
    }
  }

  /**
   * Generate Suspicious Activity Report (SAR)
   */
  static async generateSAR(customerId: string, transactionIds: string[], suspiciousActivity: string, indicators: string[]): Promise<string> {
    try {
      const customer = await Customer.findOne({ customerId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      const transactions = await Transaction.find({ 
        transactionId: { $in: transactionIds } 
      });

      const sarId = `SAR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sar = new SAR({
        sarId,
        reportType: 'suspicious_activity',
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        nationalId: customer.nationalId,
        transactionIds,
        reportingInstitution: {
          name: process.env.INSTITUTION_NAME || 'Financial Institution',
          licenseNumber: process.env.INSTITUTION_LICENSE || 'LICENSE-001',
          address: process.env.INSTITUTION_ADDRESS || 'Harare, Zimbabwe',
          contactPerson: 'Compliance Officer',
          contactDetails: process.env.COMPLIANCE_CONTACT || 'compliance@institution.co.zw'
        },
        suspiciousActivity: {
          description: suspiciousActivity,
          amountInvolved: transactions.reduce((sum, tx) => sum + (tx.usdEquivalent || 0), 0),
          currency: 'USD',
          dateOfActivity: new Date(),
          locationOfActivity: transactions[0]?.location?.city || 'Zimbabwe',
          methodUsed: transactions[0]?.channel || 'Unknown',
          reasonForSuspicion: indicators,
          indicators
        },
        parties: {
          primary: {
            name: `${customer.firstName} ${customer.lastName}`,
            idType: 'national_id',
            idNumber: customer.nationalId,
            address: `${customer.address.street}, ${customer.address.city}`,
            occupation: customer.employmentInfo?.occupation || 'Unknown',
            role: 'Primary suspect'
          }
        },
        financialInformation: {
          totalAmount: transactions.reduce((sum, tx) => sum + (tx.usdEquivalent || 0), 0),
          currency: 'USD',
          transactionDates: transactions.map(tx => tx.bookingDate),
          accountNumbers: [...new Set(transactions.map(tx => tx.accountNumber))],
          instrumentsUsed: [...new Set(transactions.map(tx => tx.type))]
        },
        actionTaken: {
          internalActions: ['Enhanced monitoring activated', 'Risk assessment updated'],
          accountStatus: 'monitored',
          additionalMonitoring: true,
          lawEnforcementNotified: false
        },
        reportingDetails: {
          preparedBy: 'AML System',
          position: 'Automated Monitoring System',
          dateOfPreparation: new Date(),
          acknowledgmentReceived: false,
          followUpRequired: true
        },
        attachments: [],
        status: 'draft'
      });

      await sar.save();
      return sarId;
      
    } catch (error) {
      console.error('Error generating SAR:', error);
      throw error;
    }
  }

  /**
   * Generate Cash Transaction Report (CTR)
   */
  static async generateCTR(transactionId: string): Promise<string> {
    try {
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const customer = await Customer.findOne({ customerId: transaction.customerId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      const ctrId = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const ctr = new CTR({
        ctrId,
        reportingInstitution: {
          name: process.env.INSTITUTION_NAME || 'Financial Institution',
          licenseNumber: process.env.INSTITUTION_LICENSE || 'LICENSE-001',
          branchCode: transaction.location.branch || 'HEAD-001',
          address: process.env.INSTITUTION_ADDRESS || 'Harare, Zimbabwe'
        },
        transactionDate: transaction.bookingDate,
        customer: {
          name: `${customer.firstName} ${customer.lastName}`,
          nationalId: customer.nationalId,
          passportNumber: customer.passportNumber,
          address: `${customer.address.street}, ${customer.address.city}`,
          phoneNumber: customer.phoneNumber,
          occupation: customer.employmentInfo?.occupation || 'Unknown',
          employer: customer.employmentInfo?.employer
        },
        transaction: {
          type: transaction.type as 'deposit' | 'withdrawal' | 'exchange',
          amount: transaction.amount,
          currency: transaction.currency,
          accountNumber: transaction.accountNumber,
          purpose: transaction.description,
          source: customer.employmentInfo?.sourceOfIncome?.[0] || 'Unknown'
        },
        cashDetails: {
          denominations: [], // This would be populated from teller input
          totalAmount: transaction.amount,
          condition: 'used' // Default assumption
        },
        verificationDetails: {
          idVerified: true,
          signatureVerified: true,
          photographTaken: false,
          additionalDocuments: []
        },
        reportingOfficer: {
          name: transaction.processedBy,
          position: 'Teller',
          employeeId: transaction.processedBy
        },
        submissionDate: new Date(),
        status: 'submitted'
      });

      await ctr.save();
      return ctrId;
      
    } catch (error) {
      console.error('Error generating CTR:', error);
      throw error;
    }
  }

  /**
   * Generate Cross-Border Transaction Report
   */
  private static async generateCrossBorderReport(transaction: any): Promise<string> {
    try {
      const reportId = `CBR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const report = new CrossBorderReport({
        reportId,
        reportingInstitution: {
          name: process.env.INSTITUTION_NAME || 'Financial Institution',
          licenseNumber: process.env.INSTITUTION_LICENSE || 'LICENSE-001',
          swiftCode: process.env.INSTITUTION_SWIFT || 'BANKZWHX'
        },
        transactionDetails: {
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          usdEquivalent: transaction.usdEquivalent || transaction.amount,
          exchangeRate: transaction.exchangeRate || 1,
          valueDate: transaction.valueDate,
          purpose: transaction.description,
          urgency: 'normal'
        },
        sender: {
          name: `${transaction.customerId}`, // This would be expanded with customer details
          address: 'Zimbabwe',
          country: 'Zimbabwe',
          accountNumber: transaction.accountNumber,
          bankName: process.env.INSTITUTION_NAME || 'Financial Institution'
        },
        beneficiary: {
          name: transaction.counterparty.name || 'Unknown',
          address: transaction.counterparty.city || 'Unknown',
          country: transaction.counterparty.country,
          accountNumber: transaction.counterparty.accountNumber,
          bankName: transaction.counterparty.bankName
        },
        correspondent: {
          bankName: transaction.counterparty.bankName,
          swiftCode: transaction.counterparty.swiftCode,
          country: transaction.counterparty.country
        },
        complianceChecks: {
          sanctionsScreened: true,
          pepScreened: true,
          originVerified: true,
          purposeVerified: true
        },
        reportingDate: new Date(),
        submissionDate: new Date(),
        status: 'submitted'
      });

      await report.save();
      return reportId;
      
    } catch (error) {
      console.error('Error generating cross-border report:', error);
      throw error;
    }
  }

  /**
   * Generate risk alert
   */
  private static async generateRiskAlert(transaction: any, monitoringResult: any): Promise<void> {
    try {
      const alert = new RiskAlert({
        alertType: monitoringResult.riskScore > 90 ? 'breach' : 'warning',
        riskCategory: 'compliance',
        severity: this.determineSeverity(monitoringResult.riskScore),
        title: 'High-Risk Transaction Detected',
        description: `Transaction ${transaction.transactionId} has triggered multiple compliance alerts`,
        entityId: transaction.transactionId,
        entityType: 'transaction',
        thresholdValue: 70,
        actualValue: monitoringResult.riskScore,
        triggeredAt: new Date(),
        status: 'active',
        actions: monitoringResult.alerts
      });

      await alert.save();
    } catch (error) {
      console.error('Error generating risk alert:', error);
    }
  }

  /**
   * Helper methods
   */
  private static calculateCFTScore(transaction: any): number {
    let cftScore = 0;
    
    // Check for CFT risk factors
    if (transaction.counterparty.country && this.HIGH_RISK_COUNTRIES.includes(transaction.counterparty.country)) {
      cftScore += 40;
    }
    
    if (transaction.amount > 50000) {
      cftScore += 20;
    }
    
    if (transaction.channel === 'online' && transaction.usdEquivalent && transaction.usdEquivalent > 10000) {
      cftScore += 15;
    }
    
    return Math.min(cftScore, 100);
  }

  private static determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private static determineSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private static getReportingThreshold(reportType?: string): number | undefined {
    switch (reportType) {
      case 'ctr': return this.CASH_TRANSACTION_THRESHOLD;
      case 'cbr': return this.CROSS_BORDER_THRESHOLD;
      default: return undefined;
    }
  }
}