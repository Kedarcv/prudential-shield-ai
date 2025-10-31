import { Transaction, Customer } from '../models/User';
import { RiskAlert } from '../models/Risk';
import { SAR, PEP, SanctionsList } from '../models/SECZCompliance';
import { SECZComplianceService } from './SECZComplianceService';
import seczConfig from '../config/seczConfig';
import { EventEmitter } from 'events';

// AML Monitoring Service for Real-time Transaction Monitoring
export class AMLMonitoringService extends EventEmitter {
  private static instance: AMLMonitoringService;
  private monitoringActive: boolean = true;
  private processedTransactions: Set<string> = new Set();

  private constructor() {
    super();
    this.initializeMonitoring();
  }

  static getInstance(): AMLMonitoringService {
    if (!AMLMonitoringService.instance) {
      AMLMonitoringService.instance = new AMLMonitoringService();
    }
    return AMLMonitoringService.instance;
  }

  /**
   * Initialize AML monitoring system
   */
  private initializeMonitoring(): void {
    console.log('🚀 AML Monitoring Service initialized for SECZ compliance');
    
    // Set up periodic monitoring tasks
    this.setupPeriodicTasks();
    
    // Set up real-time event listeners
    this.setupEventListeners();
  }

  /**
   * Set up periodic monitoring tasks
   */
  private setupPeriodicTasks(): void {
    // Daily sanctions screening
    setInterval(async () => {
      await this.performDailySanctionsScreening();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Hourly pattern analysis
    setInterval(async () => {
      await this.analyzeTransactionPatterns();
    }, 60 * 60 * 1000); // 1 hour

    // Real-time monitoring health check
    setInterval(() => {
      this.performHealthCheck();
    }, seczConfig.systemConfig.monitoring.healthCheckIntervalMs);
  }

  /**
   * Set up real-time event listeners
   */
  private setupEventListeners(): void {
    this.on('transaction_created', async (transactionId: string) => {
      await this.monitorTransaction(transactionId);
    });

    this.on('customer_updated', async (customerId: string) => {
      await this.reassessCustomerRisk(customerId);
    });

    this.on('sanctions_list_updated', async () => {
      await this.performBulkSanctionsScreening();
    });
  }

  /**
   * Monitor a single transaction for AML/CFT compliance
   */
  async monitorTransaction(transactionId: string): Promise<void> {
    try {
      // Prevent duplicate processing
      if (this.processedTransactions.has(transactionId)) {
        return;
      }

      this.processedTransactions.add(transactionId);

      console.log(`🔍 Monitoring transaction: ${transactionId}`);

      const transaction = await Transaction.findOne({ transactionId }).populate('customerId');
      if (!transaction) {
        console.error(`Transaction not found: ${transactionId}`);
        return;
      }

      // Perform comprehensive AML monitoring
      const monitoringResults = await Promise.all([
        this.checkCashReportingThresholds(transaction),
        this.screenForSanctions(transaction),
        this.checkPEPStatus(transaction),
        this.analyzeTransactionPatterns([transaction]),
        this.checkGeographicRisks(transaction),
        this.validateTransactionConsistency(transaction)
      ]);

      // Compile overall risk assessment
      const overallRisk = this.calculateOverallRisk(monitoringResults);
      
      // Update transaction with monitoring results
      await this.updateTransactionWithResults(transaction, overallRisk, monitoringResults);

      // Generate alerts if necessary
      if (overallRisk.requiresAlert) {
        await this.generateComplianceAlert(transaction, overallRisk);
      }

      // Generate reports if required
      if (overallRisk.requiresReporting) {
        await this.initiateReporting(transaction, overallRisk.reportType);
      }

      this.emit('transaction_monitored', {
        transactionId,
        riskScore: overallRisk.score,
        alertGenerated: overallRisk.requiresAlert,
        reportGenerated: overallRisk.requiresReporting
      });

    } catch (error) {
      console.error(`Error monitoring transaction ${transactionId}:`, error);
      await this.logMonitoringError(transactionId, error);
    }
  }

  /**
   * Check cash reporting thresholds (CTR requirements)
   */
  private async checkCashReportingThresholds(transaction: any): Promise<any> {
    const result = {
      type: 'cash_threshold',
      triggered: false,
      riskScore: 0,
      details: {},
      requiresReporting: false,
      reportType: null
    };

    // Check CTR threshold
    if ((transaction.type === 'deposit' || transaction.type === 'withdrawal') &&
        transaction.usdEquivalent >= seczConfig.transactionThresholds.cashTransactionThreshold) {
      
      result.triggered = true;
      result.riskScore = 20;
      result.requiresReporting = true;
      result.reportType = 'ctr';
      result.details = {
        threshold: seczConfig.transactionThresholds.cashTransactionThreshold,
        amount: transaction.usdEquivalent,
        currency: transaction.currency
      };
    }

    // Check structuring patterns (amounts just below threshold)
    if (transaction.usdEquivalent >= seczConfig.monitoringPatterns.structuring.threshold &&
        transaction.usdEquivalent < seczConfig.transactionThresholds.cashTransactionThreshold) {
      
      // Look for other similar transactions in the timeframe
      const recentTransactions = await this.getRecentTransactionsForCustomer(
        transaction.customerId,
        seczConfig.monitoringPatterns.structuring.timeframeDays
      );

      const structuringTransactions = recentTransactions.filter(tx => 
        tx.usdEquivalent >= seczConfig.monitoringPatterns.structuring.threshold &&
        tx.usdEquivalent < seczConfig.transactionThresholds.cashTransactionThreshold
      );

      if (structuringTransactions.length >= seczConfig.monitoringPatterns.structuring.frequencyCount) {
        result.triggered = true;
        result.riskScore = 40;
        result.requiresReporting = true;
        result.reportType = 'sar';
        result.details = {
          ...result.details,
          structuringPattern: {
            transactionCount: structuringTransactions.length,
            timeframeDays: seczConfig.monitoringPatterns.structuring.timeframeDays,
            totalAmount: structuringTransactions.reduce((sum, tx) => sum + tx.usdEquivalent, 0)
          }
        };
      }
    }

    return result;
  }

  /**
   * Screen transaction parties for sanctions
   */
  private async screenForSanctions(transaction: any): Promise<any> {
    const result = {
      type: 'sanctions_screening',
      triggered: false,
      riskScore: 0,
      details: {},
      matchType: 'none',
      matchedLists: []
    };

    try {
      // Get customer information
      const customer = await Customer.findOne({ customerId: transaction.customerId });
      if (!customer) {
        return result;
      }

      // Screen customer name
      const customerScreeningResult = await this.screenNameAgainstSanctions(
        `${customer.firstName} ${customer.lastName}`
      );

      // Screen counterparty if available
      let counterpartyScreeningResult = { hasMatch: false, matchedLists: [], matchType: 'none' };
      if (transaction.counterparty?.name) {
        counterpartyScreeningResult = await this.screenNameAgainstSanctions(
          transaction.counterparty.name
        );
      }

      // Combine results
      if (customerScreeningResult.hasMatch || counterpartyScreeningResult.hasMatch) {
        result.triggered = true;
        result.riskScore = 100; // Maximum risk for sanctions match
        result.matchType = customerScreeningResult.matchType || counterpartyScreeningResult.matchType;
        result.matchedLists = [
          ...customerScreeningResult.matchedLists,
          ...counterpartyScreeningResult.matchedLists
        ];
        result.details = {
          customerMatch: customerScreeningResult.hasMatch,
          counterpartyMatch: counterpartyScreeningResult.hasMatch,
          matchDetails: {
            customer: customerScreeningResult,
            counterparty: counterpartyScreeningResult
          }
        };

        // Block transaction for sanctions match
        transaction.status = 'blocked';
        transaction.complianceChecks.sanctionsScreening.status = 'fail';
        transaction.complianceChecks.sanctionsScreening.matchedLists = result.matchedLists;
        await transaction.save();
      } else {
        transaction.complianceChecks.sanctionsScreening.status = 'pass';
        transaction.complianceChecks.sanctionsScreening.checkedAt = new Date();
        await transaction.save();
      }

    } catch (error) {
      console.error('Error in sanctions screening:', error);
      result.details = { error: 'Sanctions screening failed' };
    }

    return result;
  }

  /**
   * Check if customer or counterparty is a PEP
   */
  private async checkPEPStatus(transaction: any): Promise<any> {
    const result = {
      type: 'pep_screening',
      triggered: false,
      riskScore: 0,
      details: {},
      pepCategory: null
    };

    try {
      // Get customer information
      const customer = await Customer.findOne({ customerId: transaction.customerId });
      if (!customer) {
        return result;
      }

      // Check customer PEP status
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
        result.triggered = true;
        result.riskScore = seczConfig.customerRiskScoring.pepRiskScores[pepMatch.pepDetails.category];
        result.pepCategory = pepMatch.pepDetails.category;
        result.details = {
          pepId: pepMatch.pepId,
          category: pepMatch.pepDetails.category,
          position: pepMatch.pepDetails.position,
          organization: pepMatch.pepDetails.organization,
          jurisdiction: pepMatch.pepDetails.jurisdiction
        };

        // Update customer PEP status
        customer.pepStatus = {
          isPEP: true,
          pepCategory: pepMatch.pepDetails.category,
          position: pepMatch.pepDetails.position,
          jurisdiction: pepMatch.pepDetails.jurisdiction,
          lastChecked: new Date()
        };
        await customer.save();

        // Enhanced monitoring for PEP transactions
        if (transaction.usdEquivalent > 5000) {
          result.riskScore += 10; // Additional risk for large PEP transactions
          result.details.enhancedMonitoringRequired = true;
        }
      }

    } catch (error) {
      console.error('Error in PEP screening:', error);
      result.details = { error: 'PEP screening failed' };
    }

    return result;
  }

  /**
   * Analyze transaction patterns for suspicious activity
   */
  private async analyzeTransactionPatterns(transactions: any[]): Promise<any> {
    const result = {
      type: 'pattern_analysis',
      triggered: false,
      riskScore: 0,
      details: {},
      suspiciousPatterns: []
    };

    if (transactions.length === 0) {
      return result;
    }

    const transaction = transactions[0];
    const customerId = transaction.customerId;

    try {
      // Get customer's recent transaction history
      const recentTransactions = await this.getRecentTransactionsForCustomer(customerId, 30); // 30 days

      const patterns = [];
      let patternRiskScore = 0;

      // Pattern 1: Rapid movement of funds
      const rapidTransactions = await this.detectRapidMovement(customerId, transaction);
      if (rapidTransactions.detected) {
        patterns.push('rapid_movement');
        patternRiskScore += seczConfig.monitoringPatterns.rapidMovement.riskScore;
      }

      // Pattern 2: Round number transactions
      if (this.isRoundNumberTransaction(transaction)) {
        patterns.push('round_numbers');
        patternRiskScore += seczConfig.monitoringPatterns.roundNumbers.riskScore;
      }

      // Pattern 3: Unusual hours
      if (this.isUnusualHours(transaction)) {
        patterns.push('unusual_hours');
        patternRiskScore += seczConfig.monitoringPatterns.unusualHours.riskScore;
      }

      // Pattern 4: Geographic velocity
      const geoVelocity = await this.detectGeographicVelocity(customerId, transaction);
      if (geoVelocity.detected) {
        patterns.push('geographic_velocity');
        patternRiskScore += seczConfig.monitoringPatterns.geographicVelocity.riskScore;
      }

      // Pattern 5: Profile inconsistency
      const profileConsistency = await this.checkProfileConsistency(customerId, transaction);
      if (!profileConsistency.consistent) {
        patterns.push('profile_inconsistency');
        patternRiskScore += seczConfig.monitoringPatterns.profileInconsistency.riskScore;
      }

      if (patterns.length > 0) {
        result.triggered = true;
        result.riskScore = patternRiskScore;
        result.suspiciousPatterns = patterns;
        result.details = {
          patternCount: patterns.length,
          patterns: {
            rapidMovement: rapidTransactions,
            roundNumbers: this.isRoundNumberTransaction(transaction),
            unusualHours: this.isUnusualHours(transaction),
            geographicVelocity: geoVelocity,
            profileConsistency: profileConsistency
          }
        };
      }

    } catch (error) {
      console.error('Error in pattern analysis:', error);
      result.details = { error: 'Pattern analysis failed' };
    }

    return result;
  }

  /**
   * Check geographic risks
   */
  private async checkGeographicRisks(transaction: any): Promise<any> {
    const result = {
      type: 'geographic_risk',
      triggered: false,
      riskScore: 0,
      details: {},
      riskCountries: []
    };

    try {
      const countries = [];
      
      // Check transaction location
      if (transaction.location?.country) {
        countries.push(transaction.location.country);
      }

      // Check counterparty country
      if (transaction.counterparty?.country) {
        countries.push(transaction.counterparty.country);
      }

      // Assess each country's risk
      for (const country of countries) {
        if (seczConfig.highRiskJurisdictions.includes(country)) {
          result.triggered = true;
          result.riskScore += seczConfig.customerRiskScoring.geographicRiskScores.sanctions;
          result.riskCountries.push(country);
        }
      }

      if (result.triggered) {
        result.details = {
          highRiskCountries: result.riskCountries,
          crossBorderTransaction: transaction.counterparty?.country !== 'Zimbabwe',
          additionalScrutinyRequired: true
        };

        // Check if cross-border reporting is required
        if (transaction.counterparty?.country !== 'Zimbabwe' && 
            transaction.usdEquivalent >= seczConfig.transactionThresholds.crossBorderThreshold) {
          result.details.crossBorderReportingRequired = true;
        }
      }

    } catch (error) {
      console.error('Error in geographic risk assessment:', error);
      result.details = { error: 'Geographic risk assessment failed' };
    }

    return result;
  }

  /**
   * Validate transaction consistency with customer profile
   */
  private async validateTransactionConsistency(transaction: any): Promise<any> {
    const result = {
      type: 'transaction_consistency',
      triggered: false,
      riskScore: 0,
      details: {},
      inconsistencies: []
    };

    try {
      const customer = await Customer.findOne({ customerId: transaction.customerId });
      if (!customer || !customer.expectedTransactionProfile) {
        return result;
      }

      const inconsistencies = [];
      let consistencyRiskScore = 0;

      // Check transaction amount against expected profile
      if (transaction.usdEquivalent > customer.expectedTransactionProfile.averageTransactionSize * 5) {
        inconsistencies.push('unusual_amount');
        consistencyRiskScore += 15;
      }

      // Check transaction type against expected profile
      if (!customer.expectedTransactionProfile.transactionTypes.includes(transaction.type)) {
        inconsistencies.push('unusual_transaction_type');
        consistencyRiskScore += 10;
      }

      // Check geographic consistency
      if (transaction.counterparty?.country && 
          !customer.expectedTransactionProfile.geographicExposure.includes(transaction.counterparty.country)) {
        inconsistencies.push('unusual_geography');
        consistencyRiskScore += 12;
      }

      if (inconsistencies.length > 0) {
        result.triggered = true;
        result.riskScore = consistencyRiskScore;
        result.inconsistencies = inconsistencies;
        result.details = {
          expectedProfile: customer.expectedTransactionProfile,
          actualTransaction: {
            amount: transaction.usdEquivalent,
            type: transaction.type,
            country: transaction.counterparty?.country
          }
        };
      }

    } catch (error) {
      console.error('Error in transaction consistency validation:', error);
      result.details = { error: 'Consistency validation failed' };
    }

    return result;
  }

  /**
   * Calculate overall risk from monitoring results
   */
  private calculateOverallRisk(results: any[]): any {
    let totalRiskScore = 0;
    let requiresAlert = false;
    let requiresReporting = false;
    let reportType = null;

    const riskFactors = [];
    const alerts = [];

    results.forEach(result => {
      totalRiskScore += result.riskScore || 0;

      if (result.triggered) {
        riskFactors.push(result.type);
        alerts.push(result.details);
      }

      if (result.requiresReporting) {
        requiresReporting = true;
        reportType = result.reportType;
      }
    });

    // Determine if alert is required
    requiresAlert = totalRiskScore >= 50 || requiresReporting;

    const riskLevel = this.determineRiskLevel(totalRiskScore);

    return {
      score: Math.min(totalRiskScore, 100), // Cap at 100
      level: riskLevel,
      requiresAlert,
      requiresReporting,
      reportType,
      riskFactors,
      alerts,
      mitigationRequired: riskLevel === 'high' || riskLevel === 'critical'
    };
  }

  /**
   * Helper methods
   */
  private async screenNameAgainstSanctions(name: string): Promise<any> {
    try {
      const sanctionsLists = await SanctionsList.find({ status: 'active' });
      
      for (const list of sanctionsLists) {
        for (const entry of list.entries) {
          // Simple name matching (in production, use fuzzy matching)
          if (name.toLowerCase().includes(entry.name.toLowerCase()) ||
              entry.name.toLowerCase().includes(name.toLowerCase())) {
            return {
              hasMatch: true,
              matchedLists: [list.listName],
              matchType: 'partial',
              confidence: 0.8
            };
          }

          // Check aliases
          for (const alias of entry.aliases) {
            if (name.toLowerCase().includes(alias.toLowerCase())) {
              return {
                hasMatch: true,
                matchedLists: [list.listName],
                matchType: 'alias',
                confidence: 0.7
              };
            }
          }
        }
      }

      return { hasMatch: false, matchedLists: [], matchType: 'none' };
    } catch (error) {
      console.error('Error screening name against sanctions:', error);
      return { hasMatch: false, matchedLists: [], matchType: 'none' };
    }
  }

  private async getRecentTransactionsForCustomer(customerId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Transaction.find({
      customerId,
      bookingDate: { $gte: startDate },
      status: 'completed'
    }).sort({ bookingDate: -1 });
  }

  private async detectRapidMovement(customerId: string, currentTransaction: any): Promise<any> {
    const timeframe = seczConfig.monitoringPatterns.rapidMovement.timeframeHours * 60 * 60 * 1000;
    const startTime = new Date(currentTransaction.bookingDate.getTime() - timeframe);

    const recentTransactions = await Transaction.find({
      customerId,
      bookingDate: { $gte: startTime, $lte: currentTransaction.bookingDate },
      status: 'completed'
    });

    return {
      detected: recentTransactions.length >= seczConfig.monitoringPatterns.rapidMovement.transactionCount,
      transactionCount: recentTransactions.length,
      timeframeHours: seczConfig.monitoringPatterns.rapidMovement.timeframeHours
    };
  }

  private isRoundNumberTransaction(transaction: any): boolean {
    return transaction.amount >= seczConfig.monitoringPatterns.roundNumbers.minimumAmount &&
           seczConfig.monitoringPatterns.roundNumbers.pattern.test(transaction.amount.toString());
  }

  private isUnusualHours(transaction: any): boolean {
    const hour = new Date(transaction.bookingDate).getHours();
    return hour >= seczConfig.monitoringPatterns.unusualHours.startHour || 
           hour <= seczConfig.monitoringPatterns.unusualHours.endHour;
  }

  private async detectGeographicVelocity(customerId: string, currentTransaction: any): Promise<any> {
    const timeframe = seczConfig.monitoringPatterns.geographicVelocity.timeframeHours * 60 * 60 * 1000;
    const startTime = new Date(currentTransaction.bookingDate.getTime() - timeframe);

    const recentTransactions = await Transaction.find({
      customerId,
      bookingDate: { $gte: startTime, $lte: currentTransaction.bookingDate },
      'counterparty.country': { $exists: true, $ne: null }
    });

    const uniqueCountries = [...new Set(recentTransactions.map(tx => tx.counterparty.country))];

    return {
      detected: uniqueCountries.length >= seczConfig.monitoringPatterns.geographicVelocity.countryCount,
      countryCount: uniqueCountries.length,
      countries: uniqueCountries
    };
  }

  private async checkProfileConsistency(customerId: string, transaction: any): Promise<any> {
    const customer = await Customer.findOne({ customerId });
    if (!customer || !customer.expectedTransactionProfile) {
      return { consistent: true };
    }

    const monthlyTransactions = await this.getRecentTransactionsForCustomer(customerId, 30);
    const actualMonthlyVolume = monthlyTransactions.reduce((sum, tx) => sum + (tx.usdEquivalent || 0), 0);

    const expectedVolume = customer.expectedTransactionProfile.monthlyTurnover;
    const volumeRatio = expectedVolume > 0 ? actualMonthlyVolume / expectedVolume : 1;

    return {
      consistent: volumeRatio <= seczConfig.monitoringPatterns.profileInconsistency.volumeMultiplier,
      expectedVolume,
      actualVolume: actualMonthlyVolume,
      volumeRatio
    };
  }

  private determineRiskLevel(score: number): string {
    const levels = seczConfig.riskAssessment.riskLevels;
    
    if (score >= levels.critical.min) return 'critical';
    if (score >= levels.high.min) return 'high';
    if (score >= levels.medium.min) return 'medium';
    return 'low';
  }

  private async updateTransactionWithResults(transaction: any, overallRisk: any, results: any[]): Promise<void> {
    transaction.riskAssessment = {
      overallScore: overallRisk.score,
      amlScore: overallRisk.score * 0.7,
      cftScore: overallRisk.score * 0.3,
      sanctionsScore: results.find(r => r.type === 'sanctions_screening')?.riskScore || 0,
      riskLevel: overallRisk.level,
      riskFactors: overallRisk.riskFactors
    };

    transaction.complianceChecks.amlMonitoring = {
      alerts: overallRisk.alerts.map(alert => alert.type || 'unknown'),
      patterns: overallRisk.riskFactors,
      checkedAt: new Date()
    };

    if (overallRisk.requiresReporting) {
      transaction.sezReporting = {
        reportable: true,
        reportType: overallRisk.reportType,
        reportingThreshold: this.getReportingThreshold(overallRisk.reportType),
        reportDate: new Date()
      };
    }

    await transaction.save();
  }

  private async generateComplianceAlert(transaction: any, overallRisk: any): Promise<void> {
    const alert = new RiskAlert({
      alertType: overallRisk.level === 'critical' ? 'breach' : 'warning',
      riskCategory: 'compliance',
      severity: overallRisk.level,
      title: 'AML/CFT Compliance Alert',
      description: `Transaction ${transaction.transactionId} triggered multiple compliance alerts`,
      entityId: transaction.transactionId,
      entityType: 'transaction',
      thresholdValue: 50,
      actualValue: overallRisk.score,
      triggeredAt: new Date(),
      status: 'active',
      actions: overallRisk.alerts.map(alert => alert.description || 'Review required')
    });

    await alert.save();
  }

  private async initiateReporting(transaction: any, reportType: string): Promise<void> {
    try {
      switch (reportType) {
        case 'ctr':
          await SECZComplianceService.generateCTR(transaction.transactionId);
          break;
        case 'sar':
          await SECZComplianceService.generateSAR(
            transaction.customerId,
            [transaction.transactionId],
            'Suspicious transaction patterns detected',
            ['Pattern analysis', 'Risk assessment']
          );
          break;
        default:
          console.log(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      console.error(`Error initiating ${reportType} reporting:`, error);
    }
  }

  private getReportingThreshold(reportType: string): number | undefined {
    switch (reportType) {
      case 'ctr': return seczConfig.transactionThresholds.cashTransactionThreshold;
      case 'cbr': return seczConfig.transactionThresholds.crossBorderThreshold;
      default: return undefined;
    }
  }

  // Additional monitoring methods
  async performDailySanctionsScreening(): Promise<void> {
    console.log('🔍 Performing daily sanctions screening...');
    // Implementation for bulk sanctions screening
  }

  async analyzeTransactionPatterns(): Promise<void> {
    console.log('📊 Analyzing transaction patterns...');
    // Implementation for periodic pattern analysis
  }

  async reassessCustomerRisk(customerId: string): Promise<void> {
    console.log(`📋 Reassessing customer risk: ${customerId}`);
    // Implementation for customer risk reassessment
  }

  async performBulkSanctionsScreening(): Promise<void> {
    console.log('🔍 Performing bulk sanctions screening after list update...');
    // Implementation for bulk screening after sanctions list updates
  }

  private performHealthCheck(): void {
    if (this.monitoringActive) {
      console.log('✅ AML Monitoring Service health check: OK');
    }
  }

  private async logMonitoringError(transactionId: string, error: any): Promise<void> {
    console.error(`❌ AML Monitoring Error for transaction ${transactionId}:`, error);
    // In production, this would log to a centralized logging system
  }

  // Public methods for external integration
  async startMonitoring(): Promise<void> {
    this.monitoringActive = true;
    console.log('🚀 AML Monitoring Service started');
  }

  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
    console.log('⏹️ AML Monitoring Service stopped');
  }

  isMonitoringActive(): boolean {
    return this.monitoringActive;
  }
}

// Export singleton instance
export default AMLMonitoringService.getInstance();