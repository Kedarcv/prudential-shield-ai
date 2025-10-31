import { RiskThreshold } from '../services/RealTimeService';

// Environment-based configuration
const env = process.env.NODE_ENV || 'development';

// Risk Thresholds Configuration
export const riskThresholds: RiskThreshold[] = [
  {
    metric: 'var95',
    threshold: Number(process.env.VAR95_THRESHOLD) || 1000000, // $1M default
    comparison: 'greater_than',
    severity: 'high'
  },
  {
    metric: 'capitalAdequacy',
    threshold: Number(process.env.CAPITAL_ADEQUACY_THRESHOLD) || 12, // 12% default
    comparison: 'less_than',
    severity: 'critical'
  },
  {
    metric: 'liquidityCoverage',
    threshold: Number(process.env.LIQUIDITY_COVERAGE_THRESHOLD) || 100, // 100% default
    comparison: 'less_than',
    severity: 'high'
  },
  {
    metric: 'leverageRatio',
    threshold: Number(process.env.LEVERAGE_RATIO_THRESHOLD) || 3, // 3% default
    comparison: 'less_than',
    severity: 'medium'
  }
];

// Real-time service configuration
export const realTimeConfig = {
  updateIntervalMs: Number(process.env.REALTIME_UPDATE_INTERVAL_MS) || 30000, // 30 seconds default
  cacheExpirationSeconds: Number(process.env.CACHE_EXPIRATION_SECONDS) || 300, // 5 minutes default
  alertLookbackHours: Number(process.env.ALERT_LOOKBACK_HOURS) || 24, // 24 hours default
  alertLimitRecent: Number(process.env.ALERT_LIMIT_RECENT) || 50, // 50 alerts default
  duplicateAlertWindowMs: Number(process.env.DUPLICATE_ALERT_WINDOW_MS) || 3600000, // 1 hour default
  significantPriceChangeThreshold: Number(process.env.SIGNIFICANT_PRICE_CHANGE_THRESHOLD) || 5 // 5% default
};

// Portfolio metrics base values (for simulation)
export const portfolioBaseMetrics = {
  totalValue: Number(process.env.BASE_PORTFOLIO_VALUE) || 10000000, // $10M default
  dailyReturnBase: Number(process.env.BASE_DAILY_RETURN) || 0.0023,
  volatilityBase: Number(process.env.BASE_VOLATILITY) || 0.15,
  var95Base: Number(process.env.BASE_VAR95) || 150000,
  var99Base: Number(process.env.BASE_VAR99) || 250000,
  betaBase: Number(process.env.BASE_BETA) || 1.05,
  sharpeRatioBase: Number(process.env.BASE_SHARPE_RATIO) || 1.2,
  positions: {
    equity: Number(process.env.BASE_EQUITY_ALLOCATION) || 0.6,
    bonds: Number(process.env.BASE_BONDS_ALLOCATION) || 0.3,
    alternatives: Number(process.env.BASE_ALTERNATIVES_ALLOCATION) || 0.1
  }
};

// Real-time metrics base values
export const realTimeMetricsBase = {
  var95: Number(process.env.REALTIME_VAR95_BASE) || 800000,
  var95Variance: Number(process.env.REALTIME_VAR95_VARIANCE) || 200000,
  var99: Number(process.env.REALTIME_VAR99_BASE) || 1200000,
  var99Variance: Number(process.env.REALTIME_VAR99_VARIANCE) || 300000,
  capitalAdequacy: Number(process.env.REALTIME_CAPITAL_ADEQUACY_BASE) || 15.5,
  capitalAdequacyVariance: Number(process.env.REALTIME_CAPITAL_ADEQUACY_VARIANCE) || 2,
  liquidityCoverage: Number(process.env.REALTIME_LIQUIDITY_COVERAGE_BASE) || 135,
  liquidityCoverageVariance: Number(process.env.REALTIME_LIQUIDITY_COVERAGE_VARIANCE) || 20,
  leverageRatio: Number(process.env.REALTIME_LEVERAGE_RATIO_BASE) || 6.2,
  leverageRatioVariance: Number(process.env.REALTIME_LEVERAGE_RATIO_VARIANCE) || 1,
  expectedShortfallMultiplier: Number(process.env.EXPECTED_SHORTFALL_MULTIPLIER) || 1.3
};

// Portfolio values configuration
export const portfolioValues = {
  mainPortfolio: {
    base: Number(process.env.MAIN_PORTFOLIO_BASE) || 50000000,
    variance: Number(process.env.MAIN_PORTFOLIO_VARIANCE) || 1000000
  },
  tradingPortfolio: {
    base: Number(process.env.TRADING_PORTFOLIO_BASE) || 25000000,
    variance: Number(process.env.TRADING_PORTFOLIO_VARIANCE) || 500000
  },
  fixedIncome: {
    base: Number(process.env.FIXED_INCOME_BASE) || 75000000,
    variance: Number(process.env.FIXED_INCOME_VARIANCE) || 750000
  }
};

// Stress test scenarios configuration
export const stressTestScenarios = [
  {
    scenario: process.env.STRESS_TEST_SCENARIO_1 || 'Market Crash',
    loss: Number(process.env.STRESS_TEST_LOSS_1) || 2500000
  },
  {
    scenario: process.env.STRESS_TEST_SCENARIO_2 || 'Interest Rate Shock',
    loss: Number(process.env.STRESS_TEST_LOSS_2) || 1800000
  },
  {
    scenario: process.env.STRESS_TEST_SCENARIO_3 || 'Credit Crisis',
    loss: Number(process.env.STRESS_TEST_LOSS_3) || 3200000
  }
];

// Alert summary configuration
export const alertSummaryConfig = {
  criticalMax: Number(process.env.ALERT_CRITICAL_MAX) || 3,
  highMax: Number(process.env.ALERT_HIGH_MAX) || 8,
  mediumMax: Number(process.env.ALERT_MEDIUM_MAX) || 15,
  lowMax: Number(process.env.ALERT_LOW_MAX) || 25
};