import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { RiskAlert, IRiskAlert } from '../models/Risk';
import { cache } from '../config/redis';
import { RiskCalculationService } from './RiskCalculationService';

export interface RealTimeMetrics {
  timestamp: Date;
  portfolioValues: Record<string, number>;
  riskMetrics: {
    var95: number;
    var99: number;
    expectedShortfall: number;
    stressTestResults: Array<{ scenario: string; loss: number }>;
  };
  complianceRatios: {
    capitalAdequacy: number;
    liquidityCoverage: number;
    leverageRatio: number;
  };
  alertSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export interface RiskThreshold {
  metric: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class RealTimeService extends EventEmitter {
  private wss: WebSocket.Server;
  private connectedClients: Map<string, WebSocket> = new Map();
  private riskCalculationService: RiskCalculationService;
  private marketDataSubscriptions: Set<string> = new Set();
  private thresholds: RiskThreshold[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocket.Server) {
    super();
    this.wss = wss;
    this.riskCalculationService = RiskCalculationService.getInstance();
    this.initializeThresholds();
    this.startRealTimeUpdates();
  }

  public handleMessage(ws: WebSocket, data: any): void {
    try {
      switch (data.type) {
        case 'subscribe_portfolio':
          this.subscribeToPortfolio(ws, data.portfolioId, data.userId);
          break;
        case 'subscribe_alerts':
          this.subscribeToAlerts(ws, data.userId);
          break;
        case 'subscribe_market_data':
          this.subscribeToMarketData(ws, data.symbols);
          break;
        case 'unsubscribe':
          this.unsubscribe(ws, data.subscription);
          break;
        case 'ping':
          this.sendPong(ws);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  public async broadcastRiskAlert(alert: IRiskAlert): Promise<void> {
    const message = {
      type: 'risk_alert',
      data: {
        id: alert._id,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        entityId: alert.entityId,
        triggeredAt: alert.triggeredAt,
        status: alert.status
      },
      timestamp: new Date()
    };

    // Broadcast to all connected clients
    this.broadcast(message);

    // Cache for offline clients
    await cache.setHash('pending_alerts', alert._id.toString(), message);
  }

  public async broadcastMarketUpdate(update: MarketDataUpdate): Promise<void> {
    const message = {
      type: 'market_update',
      data: update,
      timestamp: new Date()
    };

    // Only send to clients subscribed to this symbol
    const subscribedClients = Array.from(this.connectedClients.entries())
      .filter(([_, client]) => {
        const clientData = (client as any).subscriptions;
        return clientData && clientData.marketData && clientData.marketData.includes(update.symbol);
      });

    subscribedClients.forEach(([_, client]) => {
      this.sendMessage(client, message);
    });

    // Update portfolio values and trigger risk recalculation if needed
    await this.handleMarketDataUpdate(update);
  }

  public async broadcastMetricsUpdate(metrics: RealTimeMetrics): Promise<void> {
    const message = {
      type: 'metrics_update',
      data: metrics,
      timestamp: new Date()
    };

    this.broadcast(message);

    // Check thresholds and trigger alerts if needed
    await this.checkThresholds(metrics);
  }

  private subscribeToPortfolio(ws: WebSocket, portfolioId: string, userId: string): void {
    const clientId = this.getClientId(ws);
    
    if (!clientId) {
      this.sendError(ws, 'Client not authenticated');
      return;
    }

    // Add subscription to client
    const clientData = (ws as any).subscriptions || {};
    if (!clientData.portfolios) clientData.portfolios = [];
    
    if (!clientData.portfolios.includes(portfolioId)) {
      clientData.portfolios.push(portfolioId);
      (ws as any).subscriptions = clientData;
    }

    // Send current portfolio metrics
    this.sendPortfolioMetrics(ws, portfolioId);

    console.log(`Client ${clientId} subscribed to portfolio ${portfolioId}`);
  }

  private subscribeToAlerts(ws: WebSocket, userId: string): void {
    const clientId = this.getClientId(ws);
    
    if (!clientId) {
      this.sendError(ws, 'Client not authenticated');
      return;
    }

    const clientData = (ws as any).subscriptions || {};
    clientData.alerts = true;
    clientData.userId = userId;
    (ws as any).subscriptions = clientData;

    // Send pending alerts for this user
    this.sendPendingAlerts(ws, userId);

    console.log(`Client ${clientId} subscribed to alerts`);
  }

  private subscribeToMarketData(ws: WebSocket, symbols: string[]): void {
    const clientId = this.getClientId(ws);
    
    if (!clientId) {
      this.sendError(ws, 'Client not authenticated');
      return;
    }

    const clientData = (ws as any).subscriptions || {};
    clientData.marketData = [...(clientData.marketData || []), ...symbols];
    (ws as any).subscriptions = clientData;

    // Add to global subscriptions
    symbols.forEach(symbol => this.marketDataSubscriptions.add(symbol));

    console.log(`Client ${clientId} subscribed to market data: ${symbols.join(', ')}`);
  }

  private unsubscribe(ws: WebSocket, subscription: string): void {
    const clientData = (ws as any).subscriptions;
    if (clientData && clientData[subscription]) {
      delete clientData[subscription];
    }
  }

  private sendPong(ws: WebSocket): void {
    this.sendMessage(ws, { type: 'pong', timestamp: new Date() });
  }

  private sendError(ws: WebSocket, message: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message,
      timestamp: new Date()
    });
  }

  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: any): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private getClientId(ws: WebSocket): string | null {
    return (ws as any).clientId || null;
  }

  private async sendPortfolioMetrics(ws: WebSocket, portfolioId: string): Promise<void> {
    try {
      // Get cached metrics or calculate them
      const metrics = await this.getPortfolioMetrics(portfolioId);
      
      this.sendMessage(ws, {
        type: 'portfolio_metrics',
        data: {
          portfolioId,
          metrics
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending portfolio metrics:', error);
      this.sendError(ws, 'Failed to retrieve portfolio metrics');
    }
  }

  private async sendPendingAlerts(ws: WebSocket, userId: string): Promise<void> {
    try {
      // Get recent alerts for user
      const alerts = await RiskAlert.find({
        status: 'active',
        triggeredAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ triggeredAt: -1 }).limit(50);

      this.sendMessage(ws, {
        type: 'pending_alerts',
        data: alerts,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending pending alerts:', error);
      this.sendError(ws, 'Failed to retrieve pending alerts');
    }
  }

  private async getPortfolioMetrics(portfolioId: string): Promise<any> {
    const cacheKey = `portfolio_metrics:${portfolioId}`;
    let metrics = await cache.get(cacheKey);

    if (!metrics) {
      // Calculate fresh metrics
      metrics = await this.calculatePortfolioMetrics(portfolioId);
      await cache.set(cacheKey, metrics, 300); // Cache for 5 minutes
    }

    return metrics;
  }

  private async calculatePortfolioMetrics(portfolioId: string): Promise<any> {
    // This would integrate with your portfolio data and risk calculations
    // For now, return sample data structure
    return {
      totalValue: 10000000,
      dailyReturn: 0.0023,
      volatility: 0.15,
      var95: 150000,
      var99: 250000,
      expectedShortfall: 300000,
      beta: 1.05,
      sharpeRatio: 1.2,
      positions: {
        equity: 0.6,
        bonds: 0.3,
        alternatives: 0.1
      },
      lastUpdated: new Date()
    };
  }

  private async handleMarketDataUpdate(update: MarketDataUpdate): Promise<void> {
    // Check if this price change triggers any risk recalculations
    const changePercent = Math.abs(update.changePercent);
    
    if (changePercent > 5) { // 5% threshold for recalculation
      console.log(`Significant price movement in ${update.symbol}: ${update.changePercent}%`);
      
      // Trigger portfolio revaluation for affected portfolios
      await this.triggerPortfolioRevaluation(update.symbol);
    }
  }

  private async triggerPortfolioRevaluation(symbol: string): Promise<void> {
    // Find portfolios containing this symbol and update their metrics
    // This is a simplified version - in production you'd have more sophisticated logic
    console.log(`Triggering revaluation for portfolios containing ${symbol}`);
    
    // Emit event for other services to handle
    this.emit('portfolio_revaluation_needed', { symbol, timestamp: new Date() });
  }

  private initializeThresholds(): void {
    this.thresholds = [
      {
        metric: 'var95',
        threshold: 1000000, // $1M
        comparison: 'greater_than',
        severity: 'high'
      },
      {
        metric: 'capitalAdequacy',
        threshold: 12, // 12%
        comparison: 'less_than',
        severity: 'critical'
      },
      {
        metric: 'liquidityCoverage',
        threshold: 100, // 100%
        comparison: 'less_than',
        severity: 'high'
      },
      {
        metric: 'leverageRatio',
        threshold: 3, // 3%
        comparison: 'less_than',
        severity: 'medium'
      }
    ];
  }

  private async checkThresholds(metrics: RealTimeMetrics): Promise<void> {
    for (const threshold of this.thresholds) {
      const value = this.getMetricValue(metrics, threshold.metric);
      
      if (this.isThresholdBreached(value, threshold)) {
        await this.createThresholdAlert(threshold, value);
      }
    }
  }

  private getMetricValue(metrics: RealTimeMetrics, metric: string): number {
    switch (metric) {
      case 'var95':
        return metrics.riskMetrics.var95;
      case 'var99':
        return metrics.riskMetrics.var99;
      case 'capitalAdequacy':
        return metrics.complianceRatios.capitalAdequacy;
      case 'liquidityCoverage':
        return metrics.complianceRatios.liquidityCoverage;
      case 'leverageRatio':
        return metrics.complianceRatios.leverageRatio;
      default:
        return 0;
    }
  }

  private isThresholdBreached(value: number, threshold: RiskThreshold): boolean {
    switch (threshold.comparison) {
      case 'greater_than':
        return value > threshold.threshold;
      case 'less_than':
        return value < threshold.threshold;
      case 'equals':
        return value === threshold.threshold;
      default:
        return false;
    }
  }

  private async createThresholdAlert(threshold: RiskThreshold, actualValue: number): Promise<void> {
    // Check if similar alert was created recently to avoid spam
    const recentAlert = await RiskAlert.findOne({
      riskCategory: 'compliance',
      title: { $regex: threshold.metric, $options: 'i' },
      triggeredAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      status: 'active'
    });

    if (recentAlert) {
      console.log(`Skipping duplicate alert for ${threshold.metric}`);
      return;
    }

    const alert = new RiskAlert({
      alertType: 'breach',
      riskCategory: 'compliance',
      severity: threshold.severity,
      title: `${threshold.metric} Threshold Breach`,
      description: `${threshold.metric} value ${actualValue} ${threshold.comparison.replace('_', ' ')} threshold ${threshold.threshold}`,
      entityId: 'system',
      entityType: 'system',
      thresholdValue: threshold.threshold,
      actualValue: actualValue,
      triggeredAt: new Date(),
      status: 'active',
      actions: [`Review ${threshold.metric} immediately`, 'Assess impact on risk profile', 'Consider remedial actions']
    });

    await alert.save();
    await this.broadcastRiskAlert(alert);
  }

  private startRealTimeUpdates(): void {
    // Update metrics every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        const metrics = await this.generateRealTimeMetrics();
        await this.broadcastMetricsUpdate(metrics);
      } catch (error) {
        console.error('Error updating real-time metrics:', error);
      }
    }, 30000);
  }

  private async generateRealTimeMetrics(): Promise<RealTimeMetrics> {
    // This would integrate with your actual data sources
    // For now, generate sample data with some randomness
    const baseMetrics = {
      var95: 800000 + (Math.random() - 0.5) * 200000,
      var99: 1200000 + (Math.random() - 0.5) * 300000,
      capitalAdequacy: 15.5 + (Math.random() - 0.5) * 2,
      liquidityCoverage: 135 + (Math.random() - 0.5) * 20,
      leverageRatio: 6.2 + (Math.random() - 0.5) * 1
    };

    return {
      timestamp: new Date(),
      portfolioValues: {
        'MAIN_PORTFOLIO': 50000000 + (Math.random() - 0.5) * 1000000,
        'TRADING_PORTFOLIO': 25000000 + (Math.random() - 0.5) * 500000,
        'FIXED_INCOME': 75000000 + (Math.random() - 0.5) * 750000
      },
      riskMetrics: {
        var95: baseMetrics.var95,
        var99: baseMetrics.var99,
        expectedShortfall: baseMetrics.var99 * 1.3,
        stressTestResults: [
          { scenario: 'Market Crash', loss: 2500000 },
          { scenario: 'Interest Rate Shock', loss: 1800000 },
          { scenario: 'Credit Crisis', loss: 3200000 }
        ]
      },
      complianceRatios: {
        capitalAdequacy: baseMetrics.capitalAdequacy,
        liquidityCoverage: baseMetrics.liquidityCoverage,
        leverageRatio: baseMetrics.leverageRatio
      },
      alertSummary: {
        critical: Math.floor(Math.random() * 3),
        high: Math.floor(Math.random() * 8),
        medium: Math.floor(Math.random() * 15),
        low: Math.floor(Math.random() * 25)
      }
    };
  }

  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}