import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Globe,
  DollarSign,
  Eye,
  Flag,
  Building,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { seczDashboardConfig } from '../config/dashboardConfig';

interface SECZMetrics {
  metrics: {
    amlCompliance: {
      totalSARs: number;
      pendingSARs: number;
      sarCompletionRate: number;
    };
    transactionMonitoring: {
      totalCTRs: number;
      crossBorderReports: number;
      monitoringCoverage: number;
    };
    riskAssessment: {
      activePEPs: number;
      sanctionedEntities: number;
      highRiskCustomers: number;
      screeningAccuracy: number;
    };
  };
  recentActivity: {
    sars: Array<{
      sarId: string;
      reportType: string;
      customerName: string;
      suspiciousActivity: {
        description: string;
      };
      status: string;
    }>;
    ctrs: Array<{
      ctrId: string;
      customer: {
        name: string;
      };
      transaction: {
        amount: number;
        currency: string;
      };
      transactionDate: string;
    }>;
  };
  complianceStatus: {
    overallScore: number;
    amlStatus: string;
    cftStatus: string;
    lastAssessment: string;
    nextAssessment: string;
  };
  lastUpdated: string;
}

const SECZComplianceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SECZMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      // Try to fetch from API
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/compliance/secz-dashboard`);
      if (response.ok) {
        const result = await response.json();
        setMetrics(result.data);
        setError(null);
      } else {
        throw new Error('Failed to fetch SECZ metrics');
      }
    } catch (err: any) {
      setError(err.message);
      // Use fallback data
      setMetrics({
        metrics: {
          amlCompliance: {
            totalSARs: 12,
            pendingSARs: 3,
            sarCompletionRate: 75
          },
          transactionMonitoring: {
            totalCTRs: 45,
            crossBorderReports: 23,
            monitoringCoverage: 100
          },
          riskAssessment: {
            activePEPs: 15,
            sanctionedEntities: 0,
            highRiskCustomers: 8,
            screeningAccuracy: 99.5
          }
        },
        recentActivity: {
          sars: seczDashboardConfig.fallbackActivity.sars.map(sar => ({
            sarId: sar.sarId,
            reportType: sar.reportType,
            customerName: sar.customerName,
            suspiciousActivity: {
              description: `${sar.reportType} - Amount: $${sar.amountInvolved.toLocaleString()}`
            },
            status: sar.status
          })),
          ctrs: seczDashboardConfig.fallbackActivity.ctrs.map(ctr => ({
            ctrId: ctr.ctrId,
            customer: { name: ctr.customerName },
            transaction: { amount: ctr.transactionAmount, currency: ctr.currency },
            transactionDate: ctr.dateReported
          }))
        },
        complianceStatus: {
          overallScore: 95,
          amlStatus: 'Compliant',
          cftStatus: 'Compliant',
          lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant': return 'default';
      case 'submitted': case 'acknowledged': return 'secondary';
      case 'under_investigation': case 'pending': return 'outline';
      default: return 'destructive';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">SECZ AML/CFT Compliance</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SECZ AML/CFT Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Securities and Exchange Commission of Zimbabwe compliance monitoring and reporting
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchMetrics}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics?.complianceStatus.overallScore}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <Progress value={metrics?.complianceStatus.overallScore} className="mt-2" />
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2">
                {metrics?.complianceStatus.amlStatus}
              </Badge>
              <div className="text-sm text-muted-foreground">AML Compliance</div>
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2">
                {metrics?.complianceStatus.cftStatus}
              </Badge>
              <div className="text-sm text-muted-foreground">CFT Compliance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.amlCompliance.totalSARs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.metrics.amlCompliance.pendingSARs || 0} pending submission
            </p>
            <div className="mt-2">
              <Progress 
                value={metrics?.metrics.amlCompliance.sarCompletionRate || 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Transaction Reports</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.transactionMonitoring.totalCTRs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {`This month (>${formatCurrency(seczDashboardConfig.thresholds.cashTransactionThreshold)})`}
            </p>
            <div className="mt-2">
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cross-Border Reports</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.transactionMonitoring.crossBorderReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {`RBZ reporting (>${formatCurrency(seczDashboardConfig.thresholds.crossBorderThreshold)})`}
            </p>
            <div className="mt-2">
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PEPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.metrics.riskAssessment.activePEPs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Politically Exposed Persons under enhanced monitoring
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Enhanced Due Diligence
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Transaction Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="screening">Screening & Sanctions</TabsTrigger>
          <TabsTrigger value="frameworks">Regulatory Frameworks</TabsTrigger>
        </TabsList>

        {/* Transaction Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Monitoring Coverage</CardTitle>
                <CardDescription>
                  Percentage of transactions monitored in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {metrics?.metrics.transactionMonitoring.monitoringCoverage || 100}%
                </div>
                <Progress 
                  value={metrics?.metrics.transactionMonitoring.monitoringCoverage || 100} 
                  className="mb-4" 
                />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cash transactions</span>
                    <Badge variant="secondary">100%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Cross-border transactions</span>
                    <Badge variant="secondary">100%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>PEP transactions</span>
                    <Badge variant="secondary">100%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Indicators</CardTitle>
                <CardDescription>
                  Key risk indicators and thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seczDashboardConfig.riskIndicators.map((indicator, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{indicator.indicator}</span>
                        <Badge 
                          variant={
                            indicator.status === 'healthy' ? 'default' :
                            indicator.status === 'warning' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {indicator.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Current: {indicator.currentValue}</span>
                        <span>Threshold: {indicator.threshold}</span>
                      </div>
                      <Progress 
                        value={(indicator.currentValue / indicator.threshold) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent SARs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Recent SARs
                </CardTitle>
                <CardDescription>
                  Latest Suspicious Activity Reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.recentActivity.sars?.slice(0, 5).map((sar) => (
                    <div key={sar.sarId} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{sar.sarId}</div>
                        <div className="text-xs text-muted-foreground">{sar.customerName}</div>
                        <Badge variant={getStatusBadgeVariant(sar.status)} className="text-xs">
                          {sar.status}
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent CTRs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Recent CTRs
                </CardTitle>
                <CardDescription>
                  Latest Cash Transaction Reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.recentActivity.ctrs?.slice(0, 5).map((ctr) => (
                    <div key={ctr.ctrId} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{ctr.ctrId}</div>
                        <div className="text-xs text-muted-foreground">{ctr.customer.name}</div>
                        <div className="text-xs">
                          {formatCurrency(ctr.transaction.amount, ctr.transaction.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(ctr.transactionDate)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Submitted
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Screening & Sanctions Tab */}
        <TabsContent value="screening" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Sanctions Screening
                </CardTitle>
                <CardDescription>
                  Real-time sanctions screening results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {metrics?.metrics.riskAssessment.screeningAccuracy || 99.5}%
                    </div>
                    <div className="text-sm text-muted-foreground">Screening Accuracy</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Exact matches</span>
                      <Badge variant="destructive">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Possible matches</span>
                      <Badge variant="secondary">2</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cleared transactions</span>
                      <Badge variant="default">1,247</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  PEP Management
                </CardTitle>
                <CardDescription>
                  Politically Exposed Persons monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {metrics?.metrics.riskAssessment.activePEPs || 15}
                    </div>
                    <div className="text-sm text-muted-foreground">Active PEPs</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Domestic PEPs</span>
                      <Badge variant="outline">8</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Foreign PEPs</span>
                      <Badge variant="outline">5</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">International Org PEPs</span>
                      <Badge variant="outline">2</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regulatory Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-6">
          <div className="grid gap-6">
            {seczDashboardConfig.regulatoryFrameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {framework.name}
                    </CardTitle>
                    <Badge 
                      variant={
                        framework.status === 'compliant' ? 'default' :
                        framework.status === 'partially_compliant' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {framework.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {framework.completionRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Completion Rate</div>
                      <Progress value={framework.completionRate} className="mt-2" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {framework.compliantRequirements}/{framework.requirements}
                      </div>
                      <div className="text-sm text-muted-foreground">Requirements Met</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Last Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(framework.lastAssessment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Next Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(framework.nextAssessment)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {metrics?.lastUpdated ? formatDate(metrics.lastUpdated) : 'Never'}
      </div>
    </div>
  );
};

export default SECZComplianceDashboard;