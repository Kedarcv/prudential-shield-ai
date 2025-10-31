import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calculator,
  Target,
  PieChart,
  LineChart,
  BarChart3,
  RefreshCw,
  Download,
  Plus,
  Eye
} from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { useDashboardMetrics, usePortfolios, useRealTimeMetrics } from '@/hooks/useApi';

const RiskManagerDashboard = () => {
  const { data: dashboardData } = useDashboardMetrics();
  const { data: portfolios } = usePortfolios();
  const { data: realTimeData } = useRealTimeMetrics();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Risk Manager Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive Risk Analysis & Management</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button size="sm">
                <Calculator className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="credit">Credit Risk</TabsTrigger>
            <TabsTrigger value="market">Market Risk</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
            <TabsTrigger value="tools">Risk Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <RiskOverview />
          </TabsContent>

          <TabsContent value="credit" className="space-y-6">
            <CreditRiskManagement />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <MarketRiskManagement />
          </TabsContent>

          <TabsContent value="operational" className="space-y-6">
            <OperationalRiskManagement />
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-6">
            <LiquidityRiskManagement />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <RiskCalculationTools />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const RiskOverview = () => {
  const riskMetrics = [
    { title: 'Total Risk Exposure', value: '$2.4B', change: -3.2, icon: Target, trend: 'down', status: 'healthy' },
    { title: 'VaR (95%)', value: '$1.2M', change: 5.8, icon: TrendingUp, trend: 'up', status: 'warning' },
    { title: 'Credit Risk Score', value: '72', change: -2.1, icon: TrendingDown, trend: 'down', status: 'healthy' },
    { title: 'Risk Appetite Used', value: '64%', change: 1.4, icon: PieChart, trend: 'up', status: 'warning' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {riskMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution by Type</CardTitle>
            <CardDescription>Current risk exposure breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Credit Risk', amount: 890000000, percentage: 37, color: 'bg-blue-500' },
                { type: 'Market Risk', amount: 640000000, percentage: 27, color: 'bg-green-500' },
                { type: 'Operational Risk', amount: 480000000, percentage: 20, color: 'bg-yellow-500' },
                { type: 'Liquidity Risk', amount: 380000000, percentage: 16, color: 'bg-red-500' }
              ].map((risk) => (
                <div key={risk.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                    <span className="font-medium">{risk.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${(risk.amount / 1000000).toFixed(0)}M</div>
                    <div className="text-sm text-muted-foreground">{risk.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Alerts & Actions</CardTitle>
            <CardDescription>Recent risk alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { severity: 'high', message: 'Portfolio concentration limit exceeded', time: '10 minutes ago' },
                { severity: 'medium', message: 'Credit rating downgrade for ABC Corp', time: '1 hour ago' },
                { severity: 'low', message: 'Market volatility increased 15%', time: '2 hours ago' }
              ].map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.severity === 'high' ? 'text-red-500' : 
                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CreditRiskManagement = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Portfolio Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Exposure</span>
                <span className="font-semibold">$890M</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Expected Credit Loss</span>
                <span className="font-semibold">$12.4M</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Non-Performing Loans</span>
                <span className="font-semibold">2.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average PD</span>
                <span className="font-semibold">1.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IFRS 9 Staging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Stage 1 (12-month ECL)</span>
                <Badge>85.2%</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Stage 2 (Lifetime ECL)</span>
                <Badge variant="secondary">12.0%</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Stage 3 (Credit Impaired)</span>
                <Badge variant="destructive">2.8%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate ECL
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Review Watch List
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Portfolio
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Credit Exposures</CardTitle>
          <CardDescription>Largest exposures requiring monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Advanced Manufacturing Ltd', exposure: 15000000, rating: 'BB+', pd: 0.025, stage: 2 },
              { name: 'Tech Innovations PVT', exposure: 12000000, rating: 'A-', pd: 0.012, stage: 1 },
              { name: 'Mining Corporation ZW', exposure: 10000000, rating: 'BBB', pd: 0.018, stage: 1 }
            ].map((borrower, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{borrower.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${(borrower.exposure / 1000000).toFixed(1)}M • Rating: {borrower.rating}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={borrower.stage === 1 ? 'default' : borrower.stage === 2 ? 'secondary' : 'destructive'}>
                    Stage {borrower.stage}
                  </Badge>
                  <span className="text-sm font-medium">{(borrower.pd * 100).toFixed(2)}% PD</span>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MarketRiskManagement = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>VaR (95%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.2M</div>
            <p className="text-sm text-muted-foreground">1-day horizon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Shortfall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.8M</div>
            <p className="text-sm text-muted-foreground">Tail risk (95%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.15</div>
            <p className="text-sm text-muted-foreground">vs market</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.4%</div>
            <p className="text-sm text-muted-foreground">Annualized</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stress Testing Results</CardTitle>
          <CardDescription>Portfolio performance under stress scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { scenario: 'Market Crash (-30%)', loss: 2500000, impact: 'High' },
              { scenario: 'Interest Rate Shock (+200bp)', loss: 1800000, impact: 'Medium' },
              { scenario: 'Currency Crisis', loss: 1200000, impact: 'Medium' },
              { scenario: 'Credit Spread Widening', loss: 900000, impact: 'Low' }
            ].map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{test.scenario}</p>
                  <p className="text-sm text-muted-foreground">Potential Loss: ${(test.loss / 1000000).toFixed(1)}M</p>
                </div>
                <Badge variant={
                  test.impact === 'High' ? 'destructive' :
                  test.impact === 'Medium' ? 'secondary' : 'default'
                }>
                  {test.impact} Impact
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OperationalRiskManagement = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Operational Risk Events</CardTitle>
            <CardDescription>Recent operational risk incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { event: 'System Outage', businessLine: 'IT', impact: 150000, status: 'Investigating' },
                { event: 'Process Error', businessLine: 'Operations', impact: 45000, status: 'Resolved' },
                { event: 'Compliance Violation', businessLine: 'Legal', impact: 25000, status: 'Under Review' }
              ].map((event, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{event.event}</p>
                    <Badge variant="outline">{event.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.businessLine} • Impact: ${event.impact.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Risk Indicators</CardTitle>
            <CardDescription>Operational risk warning indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { indicator: 'Failed Transactions', value: '0.12%', threshold: '0.15%', status: 'Normal' },
                { indicator: 'System Downtime', value: '0.05%', threshold: '0.10%', status: 'Normal' },
                { indicator: 'Staff Turnover', value: '8.5%', threshold: '10%', status: 'Warning' },
                { indicator: 'Error Rate', value: '0.08%', threshold: '0.05%', status: 'Alert' }
              ].map((kri, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{kri.indicator}</p>
                    <p className="text-sm text-muted-foreground">Current: {kri.value} | Threshold: {kri.threshold}</p>
                  </div>
                  <Badge variant={
                    kri.status === 'Normal' ? 'default' :
                    kri.status === 'Warning' ? 'secondary' : 'destructive'
                  }>
                    {kri.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const LiquidityRiskManagement = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Coverage Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">142%</div>
            <p className="text-sm text-muted-foreground">Required: 100%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Stable Funding Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">118%</div>
            <p className="text-sm text-muted-foreground">Required: 100%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liquidity Buffer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45M</div>
            <p className="text-sm text-muted-foreground">Available HQLA</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
          <CardDescription>Projected cash flows by maturity bucket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { period: 'Overnight', inflow: 5000000, outflow: 3000000, net: 2000000 },
              { period: '1-7 days', inflow: 15000000, outflow: 12000000, net: 3000000 },
              { period: '1-30 days', inflow: 25000000, outflow: 30000000, net: -5000000 },
              { period: '30-90 days', inflow: 40000000, outflow: 35000000, net: 5000000 }
            ].map((bucket, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{bucket.period}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-green-600">In: ${(bucket.inflow / 1000000).toFixed(0)}M</span>
                  <span className="text-red-600">Out: ${(bucket.outflow / 1000000).toFixed(0)}M</span>
                  <span className={`font-semibold ${bucket.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Net: {bucket.net >= 0 ? '+' : ''}${(bucket.net / 1000000).toFixed(0)}M
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RiskCalculationTools = () => {
  const [calculationType, setCalculationType] = useState('credit');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Risk Calculation Tools</CardTitle>
          <CardDescription>Perform risk calculations and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calc-type">Calculation Type</Label>
              <Select value={calculationType} onValueChange={setCalculationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit Risk (ECL)</SelectItem>
                  <SelectItem value="market">Market Risk (VaR)</SelectItem>
                  <SelectItem value="stress">Stress Testing</SelectItem>
                  <SelectItem value="liquidity">Liquidity Ratios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {calculationType === 'credit' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="borrower-id">Borrower ID</Label>
                  <Input id="borrower-id" placeholder="Enter borrower ID" />
                </div>
                <div>
                  <Label htmlFor="exposure">Exposure Amount</Label>
                  <Input id="exposure" placeholder="Enter exposure amount" />
                </div>
              </div>
            )}

            {calculationType === 'market' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="portfolio-id">Portfolio ID</Label>
                  <Input id="portfolio-id" placeholder="Enter portfolio ID" />
                </div>
                <div>
                  <Label htmlFor="confidence">Confidence Level</Label>
                  <Select defaultValue="95">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Run Calculation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskManagerDashboard;