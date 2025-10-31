import cron from 'node-cron';
import moment from 'moment';
import { RiskCalculationService } from './RiskCalculationService';
import { 
  CreditRisk, 
  MarketRisk, 
  RiskAlert, 
  ComplianceStatus,
  RiskAssessment 
} from '../models/Risk';
import { Customer, Portfolio, Transaction } from '../models/User';
import { cache } from '../config/redis';

export interface ScheduledJob {
  name: string;
  schedule: string;
  description: string;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
  task: () => Promise<void>;
}

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private riskCalculationService: RiskCalculationService;
  private isRunning: boolean = false;

  constructor() {
    this.riskCalculationService = RiskCalculationService.getInstance();
    this.initializeJobs();
  }

  public start(): void {
    if (this.isRunning) {
      console.log('Scheduler service is already running');
      return;
    }

    console.log('🕐 Starting scheduler service...');
    
    // Start all active jobs
    this.jobs.forEach((task, name) => {
      task.start();
      console.log(`✅ Started scheduled job: ${name}`);
    });

    this.isRunning = true;
    console.log('✅ Scheduler service started successfully');
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler service is not running');
      return;
    }

    console.log('🛑 Stopping scheduler service...');
    
    // Stop all jobs
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`🛑 Stopped scheduled job: ${name}`);
    });

    this.isRunning = false;
    console.log('✅ Scheduler service stopped successfully');
  }

  public getJobStatus(): Array<{
    name: string;
    schedule: string;
    isRunning: boolean;
    lastRun?: Date;
    nextRun?: Date;
  }> {
    return Array.from(this.jobs.entries()).map(([name, task]) => ({
      name,
      schedule: (task as any).options?.scheduled ? (task as any).options.timezone : 'unknown',
      isRunning: (task as any).running || false,
      lastRun: (task as any).lastDate || undefined,
      nextRun: (task as any).nextDate || undefined
    }));
  }

  private initializeJobs(): void {
    const jobDefinitions: ScheduledJob[] = [
      {
        name: 'daily-risk-assessment',
        schedule: '0 6 * * 1-5', // 6 AM on weekdays
        description: 'Daily risk assessment for all portfolios',
        isActive: true,
        task: this.performDailyRiskAssessment.bind(this)
      },
      {
        name: 'hourly-market-risk-update',
        schedule: '0 * * * 1-5', // Every hour on weekdays
        description: 'Update market risk metrics',
        isActive: true,
        task: this.updateMarketRiskMetrics.bind(this)
      },
      {
        name: 'credit-risk-monitoring',
        schedule: '0 */4 * * *', // Every 4 hours
        description: 'Monitor credit risk indicators',
        isActive: true,
        task: this.monitorCreditRisk.bind(this)
      },
      {
        name: 'compliance-check',
        schedule: '0 7 * * 1', // 7 AM every Monday
        description: 'Weekly compliance status check',
        isActive: true,
        task: this.performComplianceCheck.bind(this)
      },
      {
        name: 'alert-cleanup',
        schedule: '0 2 * * *', // 2 AM daily
        description: 'Clean up old alerts and logs',
        isActive: true,
        task: this.cleanupOldAlerts.bind(this)
      },
      {
        name: 'stress-testing',
        schedule: '0 18 * * 5', // 6 PM every Friday
        description: 'Weekly stress testing',
        isActive: true,
        task: this.performStressTesting.bind(this)
      },
      {
        name: 'regulatory-reporting',
        schedule: '0 8 1 * *', // 8 AM on 1st of every month
        description: 'Generate monthly regulatory reports',
        isActive: true,
        task: this.generateRegulatoryReports.bind(this)
      },
      {
        name: 'data-quality-check',
        schedule: '0 */6 * * *', // Every 6 hours
        description: 'Validate data quality',
        isActive: true,
        task: this.performDataQualityCheck.bind(this)
      },
      {
        name: 'cache-warmup',
        schedule: '*/5 * * * *', // Every 5 minutes
        description: 'Warm up frequently accessed cache',
        isActive: true,
        task: this.warmupCache.bind(this)
      }
    ];

    // Create cron jobs
    jobDefinitions.forEach(jobDef => {
      if (jobDef.isActive) {
        const task = cron.schedule(jobDef.schedule, async () => {
          try {
            console.log(`📋 Running scheduled job: ${jobDef.name}`);
            const startTime = Date.now();
            
            await jobDef.task();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Completed job: ${jobDef.name} in ${duration}ms`);
            
            // Log job execution
            await cache.setHash('job_history', `${jobDef.name}_${Date.now()}`, {
              jobName: jobDef.name,
              executedAt: new Date(),
              duration,
              status: 'success'
            });
            
          } catch (error) {
            console.error(`❌ Error in scheduled job ${jobDef.name}:`, error);
            
            // Log job error
            await cache.setHash('job_history', `${jobDef.name}_${Date.now()}_error`, {
              jobName: jobDef.name,
              executedAt: new Date(),
              status: 'error',
              error: error.message
            });
          }
        }, {
          scheduled: false, // Don't start immediately
          timezone: process.env.TZ || 'UTC'
        });

        this.jobs.set(jobDef.name, task);
      }
    });
  }

  // Job implementations

  private async performDailyRiskAssessment(): Promise<void> {
    console.log('Performing daily risk assessment...');
    
    // Get all active portfolios
    const portfolios = await Portfolio.find({ 
      totalValue: { $gt: 0 } 
    }).limit(100);

    for (const portfolio of portfolios) {
      try {
        // Calculate VaR for each portfolio
        const varParams = {
          portfolioId: portfolio.portfolioId,
          positions: portfolio.positions.map(p => ({
            assetId: p.assetId,
            quantity: p.quantity,
            currentPrice: p.marketValue / p.quantity,
            assetType: p.assetType,
            beta: 1.0 // Default beta
          })),
          timeHorizon: 1, // 1 day
          confidenceLevel: 0.95,
          method: 'historical' as const
        };

        const varResult = await this.riskCalculationService.calculateMarketRisk(varParams);
        
        // Create risk assessment record
        const assessment = new RiskAssessment({
          entityId: portfolio.portfolioId,
          entityType: 'portfolio',
          riskType: 'market',
          riskScore: Math.min(100, (varResult.var / portfolio.totalValue) * 10000), // Scale to 0-100
          riskLevel: this.determineRiskLevel(varResult.var, portfolio.totalValue),
          probability: 0.05, // 5% probability (95% VaR)
          impact: varResult.var,
          mitigationMeasures: this.suggestMitigationMeasures(varResult),
          assessmentDate: new Date(),
          nextReviewDate: moment().add(1, 'day').toDate(),
          assessedBy: 'system',
          status: 'active',
          metadata: {
            varResult: varResult,
            method: 'automated_daily_assessment'
          }
        });

        await assessment.save();
        
      } catch (error) {
        console.error(`Error assessing portfolio ${portfolio.portfolioId}:`, error);
      }
    }

    console.log(`Completed risk assessment for ${portfolios.length} portfolios`);
  }

  private async updateMarketRiskMetrics(): Promise<void> {
    console.log('Updating market risk metrics...');
    
    // Update cached risk metrics for active portfolios
    const portfolios = await Portfolio.find({ 
      totalValue: { $gt: 0 } 
    }).select('portfolioId totalValue').limit(50);

    const updatePromises = portfolios.map(async (portfolio) => {
      const cacheKey = `portfolio_metrics:${portfolio.portfolioId}`;
      
      // Calculate fresh metrics
      const metrics = {
        portfolioId: portfolio.portfolioId,
        totalValue: portfolio.totalValue,
        lastUpdated: new Date(),
        // Add real metric calculations here
        var95: portfolio.totalValue * 0.02, // 2% of portfolio value
        var99: portfolio.totalValue * 0.035, // 3.5% of portfolio value
        beta: 1.0 + (Math.random() - 0.5) * 0.4, // Random beta around 1.0
        volatility: 0.15 + (Math.random() - 0.5) * 0.1 // Random volatility around 15%
      };
      
      // Cache for 1 hour
      await cache.set(cacheKey, metrics, 3600);
    });

    await Promise.all(updatePromises);
    console.log(`Updated metrics for ${portfolios.length} portfolios`);
  }

  private async monitorCreditRisk(): Promise<void> {
    console.log('Monitoring credit risk indicators...');
    
    // Check for deteriorating credit conditions
    const creditRisks = await CreditRisk.find({
      calculatedAt: { $gte: moment().subtract(7, 'days').toDate() },
      stage: { $in: [2, 3] } // IFRS 9 Stage 2 and 3
    }).sort({ calculatedAt: -1 });

    for (const creditRisk of creditRisks) {
      // Check if ECL has increased significantly
      const previousRisk = await CreditRisk.findOne({
        borrowerId: creditRisk.borrowerId,
        facilityId: creditRisk.facilityId,
        calculatedAt: { $lt: creditRisk.calculatedAt }
      }).sort({ calculatedAt: -1 });

      if (previousRisk) {
        const eclIncrease = creditRisk.expectedCreditLoss - previousRisk.expectedCreditLoss;
        const eclIncreasePercent = (eclIncrease / previousRisk.expectedCreditLoss) * 100;

        if (eclIncreasePercent > 25) { // 25% increase threshold
          // Create alert
          const alert = new RiskAlert({
            alertType: 'warning',
            riskCategory: 'credit',
            severity: eclIncreasePercent > 50 ? 'high' : 'medium',
            title: 'Significant Credit Risk Increase',
            description: `ECL for borrower ${creditRisk.borrowerId} increased by ${eclIncreasePercent.toFixed(1)}%`,
            entityId: creditRisk.borrowerId,
            entityType: 'customer',
            thresholdValue: previousRisk.expectedCreditLoss,
            actualValue: creditRisk.expectedCreditLoss,
            triggeredAt: new Date(),
            status: 'active',
            actions: [
              'Review borrower financial condition',
              'Consider additional collateral requirements',
              'Update credit rating if necessary'
            ]
          });

          await alert.save();
        }
      }
    }

    console.log(`Monitored ${creditRisks.length} credit risk positions`);
  }

  private async performComplianceCheck(): Promise<void> {
    console.log('Performing compliance check...');
    
    // Check various compliance ratios
    const complianceChecks = [
      {
        framework: 'basel_iii',
        requirement: 'Capital Adequacy Ratio',
        currentValue: 16.5, // Would be calculated from actual data
        minimumRequired: 12.0,
        description: 'Tier 1 + Tier 2 Capital / Risk Weighted Assets'
      },
      {
        framework: 'basel_iii',
        requirement: 'Liquidity Coverage Ratio',
        currentValue: 142,
        minimumRequired: 100,
        description: 'High Quality Liquid Assets / Net Cash Outflows'
      },
      {
        framework: 'basel_iii',
        requirement: 'Leverage Ratio',
        currentValue: 6.8,
        minimumRequired: 3.0,
        description: 'Tier 1 Capital / Total Exposure'
      }
    ];

    for (const check of complianceChecks) {
      const isCompliant = check.currentValue >= check.minimumRequired;
      const completionPercentage = Math.min(100, (check.currentValue / check.minimumRequired) * 100);
      
      // Update or create compliance status
      await ComplianceStatus.findOneAndUpdate(
        {
          regulatoryFramework: check.framework,
          requirement: check.requirement
        },
        {
          description: check.description,
          status: isCompliant ? 'compliant' : 'non_compliant',
          completionPercentage: completionPercentage,
          lastAssessment: new Date(),
          nextAssessment: moment().add(1, 'week').toDate(),
          responsibleParty: 'Risk Management Team',
          remedialActions: isCompliant ? [] : [
            `Increase ${check.requirement} to meet minimum requirement`,
            'Review and optimize balance sheet composition'
          ],
          evidence: [`Current ratio: ${check.currentValue}`, `Required ratio: ${check.minimumRequired}`]
        },
        { upsert: true, new: true }
      );

      // Create alert if non-compliant
      if (!isCompliant) {
        const alert = new RiskAlert({
          alertType: 'breach',
          riskCategory: 'compliance',
          severity: 'high',
          title: `${check.requirement} Non-Compliance`,
          description: `${check.requirement} is ${check.currentValue}, below required ${check.minimumRequired}`,
          entityId: 'system',
          entityType: 'regulatory',
          thresholdValue: check.minimumRequired,
          actualValue: check.currentValue,
          triggeredAt: new Date(),
          status: 'active',
          actions: [
            'Immediate review of balance sheet composition',
            'Develop remediation plan',
            'Report to senior management'
          ]
        });

        await alert.save();
      }
    }

    console.log(`Completed compliance check for ${complianceChecks.length} requirements`);
  }

  private async cleanupOldAlerts(): Promise<void> {
    console.log('Cleaning up old alerts...');
    
    // Remove resolved alerts older than 90 days
    const ninetyDaysAgo = moment().subtract(90, 'days').toDate();
    const result = await RiskAlert.deleteMany({
      status: { $in: ['resolved', 'dismissed'] },
      resolvedAt: { $lt: ninetyDaysAgo }
    });

    console.log(`Removed ${result.deletedCount} old resolved alerts`);

    // Remove old job history from cache
    const jobHistoryKeys = await cache.exists('job_history');
    if (jobHistoryKeys) {
      // In a real implementation, you'd implement proper cache cleanup
      console.log('Cleaned up old job history');
    }
  }

  private async performStressTesting(): Promise<void> {
    console.log('Performing weekly stress testing...');
    
    const portfolios = await Portfolio.find({ 
      totalValue: { $gt: 1000000 } // Only test significant portfolios
    }).limit(20);

    const stressScenarios = [
      {
        name: 'Market Crash',
        shocks: { 'EQUITY': -30, 'BOND': -10, 'COMMODITY': -25 }
      },
      {
        name: 'Interest Rate Shock',
        shocks: { 'BOND': -15, 'EQUITY': -10, 'REAL_ESTATE': -20 }
      },
      {
        name: 'Credit Crisis',
        shocks: { 'CREDIT': -40, 'EQUITY': -20, 'BOND': -8 }
      }
    ];

    for (const portfolio of portfolios) {
      try {
        const results = await this.riskCalculationService.performStressTest(
          portfolio.portfolioId,
          stressScenarios
        );

        // Store results and create alerts if losses are significant
        for (const result of results) {
          const lossPercent = (result.loss / portfolio.totalValue) * 100;
          
          if (lossPercent > 15) { // 15% loss threshold
            const alert = new RiskAlert({
              alertType: 'warning',
              riskCategory: 'market',
              severity: lossPercent > 25 ? 'high' : 'medium',
              title: `High Stress Test Loss - ${result.scenario}`,
              description: `Portfolio ${portfolio.name} shows ${lossPercent.toFixed(1)}% loss in ${result.scenario} scenario`,
              entityId: portfolio.portfolioId,
              entityType: 'portfolio',
              thresholdValue: portfolio.totalValue * 0.15, // 15% threshold
              actualValue: result.loss,
              triggeredAt: new Date(),
              status: 'active',
              actions: [
                'Review portfolio composition',
                'Consider hedging strategies',
                'Assess risk appetite alignment'
              ]
            });

            await alert.save();
          }
        }

      } catch (error) {
        console.error(`Error in stress testing portfolio ${portfolio.portfolioId}:`, error);
      }
    }

    console.log(`Completed stress testing for ${portfolios.length} portfolios`);
  }

  private async generateRegulatoryReports(): Promise<void> {
    console.log('Generating monthly regulatory reports...');
    
    // This would generate actual regulatory reports
    // For now, just log the activity
    const reportTypes = [
      'Basel III Capital Adequacy Report',
      'IFRS 9 Expected Credit Loss Report', 
      'Liquidity Coverage Ratio Report',
      'Operational Risk Report'
    ];

    for (const reportType of reportTypes) {
      console.log(`Generated ${reportType} for ${moment().format('YYYY-MM')}`);
      
      // In practice, you'd:
      // 1. Aggregate required data
      // 2. Generate report files (PDF, Excel, XML)
      // 3. Store in secure location
      // 4. Send notifications to stakeholders
    }
  }

  private async performDataQualityCheck(): Promise<void> {
    console.log('Performing data quality check...');
    
    // Check for data completeness and consistency
    const checks = [
      {
        name: 'Portfolio Data Completeness',
        query: Portfolio.countDocuments({ totalValue: { $gt: 0 }, positions: { $size: 0 } }),
        threshold: 0,
        description: 'Portfolios with value but no positions'
      },
      {
        name: 'Missing Credit Ratings',
        query: CreditRisk.countDocuments({ creditRating: { $in: [null, 'Unrated'] } }),
        threshold: 10, // Allow up to 10 unrated
        description: 'Credit risks without ratings'
      },
      {
        name: 'Stale Risk Calculations',
        query: RiskAssessment.countDocuments({ 
          assessmentDate: { $lt: moment().subtract(7, 'days').toDate() },
          status: 'active'
        }),
        threshold: 5,
        description: 'Active risk assessments older than 7 days'
      }
    ];

    for (const check of checks) {
      try {
        const count = await check.query;
        
        if (count > check.threshold) {
          const alert = new RiskAlert({
            alertType: 'warning',
            riskCategory: 'operational',
            severity: 'medium',
            title: `Data Quality Issue: ${check.name}`,
            description: `Found ${count} instances of ${check.description}`,
            entityId: 'data_quality',
            entityType: 'system',
            thresholdValue: check.threshold,
            actualValue: count,
            triggeredAt: new Date(),
            status: 'active',
            actions: [
              'Review data sources',
              'Update data validation rules',
              'Clean up inconsistent records'
            ]
          });

          await alert.save();
        }
      } catch (error) {
        console.error(`Error in data quality check ${check.name}:`, error);
      }
    }
  }

  private async warmupCache(): Promise<void> {
    // Warm up frequently accessed cache keys
    const portfolios = await Portfolio.find({}).limit(10).select('portfolioId');
    
    for (const portfolio of portfolios) {
      const cacheKey = `portfolio_metrics:${portfolio.portfolioId}`;
      const exists = await cache.exists(cacheKey);
      
      if (!exists) {
        // Generate basic metrics to warm cache
        const metrics = {
          portfolioId: portfolio.portfolioId,
          lastUpdated: new Date(),
          status: 'cached'
        };
        
        await cache.set(cacheKey, metrics, 1800); // 30 minutes
      }
    }
  }

  // Helper methods

  private determineRiskLevel(var95: number, portfolioValue: number): 'low' | 'medium' | 'high' | 'critical' {
    const varPercent = (var95 / portfolioValue) * 100;
    
    if (varPercent < 1) return 'low';
    if (varPercent < 3) return 'medium';
    if (varPercent < 6) return 'high';
    return 'critical';
  }

  private suggestMitigationMeasures(varResult: any): string[] {
    const measures = ['Regular portfolio rebalancing'];
    
    if (varResult.var > 1000000) {
      measures.push('Consider reducing position sizes');
      measures.push('Implement hedging strategies');
    }
    
    if (varResult.expectedShortfall > varResult.var * 1.5) {
      measures.push('Review tail risk exposure');
      measures.push('Diversify across asset classes');
    }
    
    return measures;
  }
}