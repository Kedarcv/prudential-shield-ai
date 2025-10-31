import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertCircle,
  Eye,
  Edit
} from 'lucide-react';
import { useCompliance } from '@/hooks/useApi';

const ComplianceDashboard = () => {
  const { data: complianceData, loading } = useCompliance();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Compliance Dashboard</h1>
              <p className="text-muted-foreground">Regulatory Compliance Management & Monitoring</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Assessment
              </Button>
              <Button size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="basel">Basel III</TabsTrigger>
            <TabsTrigger value="ifrs">IFRS 9</TabsTrigger>
            <TabsTrigger value="local">Local Regs</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ComplianceOverview data={complianceData} loading={loading} />
          </TabsContent>

          <TabsContent value="basel" className="space-y-6">
            <BaselIIICompliance />
          </TabsContent>

          <TabsContent value="ifrs" className="space-y-6">
            <IFRS9Compliance />
          </TabsContent>

          <TabsContent value="local" className="space-y-6">
            <LocalRegulations />
          </TabsContent>

          <TabsContent value="reporting" className="space-y-6">
            <RegulatoryReporting />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ComplianceOverview = ({ data, loading }: { data: any; loading: boolean }) => {
  if (loading) {
    return <div>Loading compliance data...</div>;
  }

  const overallScore = data?.summary?.overallCompletion || 92;
  const totalRequirements = data?.summary?.totalRequirements || 25;
  const frameworks = data?.frameworks || [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}%</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequirements}</div>
            <p className="text-xs text-muted-foreground">Across all frameworks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Days remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status by Framework */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Framework Status</CardTitle>
          <CardDescription>Compliance status across all regulatory frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Basel III', completion: 96, compliant: 18, total: 19, status: 'compliant' },
              { name: 'IFRS 9', completion: 94, compliant: 15, total: 16, status: 'compliant' },
              { name: 'RBZ Requirements', completion: 88, compliant: 12, total: 14, status: 'partially_compliant' },
              { name: 'AML/CFT', completion: 92, compliant: 8, total: 9, status: 'compliant' }
            ].map((framework) => (
              <div key={framework.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{framework.name}</span>
                    <Badge variant={
                      framework.status === 'compliant' ? 'default' :
                      framework.status === 'partially_compliant' ? 'secondary' : 'destructive'
                    }>
                      {framework.compliant}/{framework.total} Compliant
                    </Badge>
                  </div>
                  <span className="font-semibold">{framework.completion}%</span>
                </div>
                <Progress value={framework.completion} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Compliance Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Latest compliance assessments completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { requirement: 'Capital Adequacy Ratio', result: 'Compliant', date: '2024-10-30', assessor: 'Emma Williams' },
                { requirement: 'Liquidity Coverage Ratio', result: 'Non-Compliant', date: '2024-10-29', assessor: 'Michael Chen' },
                { requirement: 'Expected Credit Loss Model', result: 'Compliant', date: '2024-10-28', assessor: 'Sarah Johnson' }
              ].map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{assessment.requirement}</p>
                    <p className="text-sm text-muted-foreground">
                      {assessment.assessor} • {assessment.date}
                    </p>
                  </div>
                  <Badge variant={assessment.result === 'Compliant' ? 'default' : 'destructive'}>
                    {assessment.result}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Compliance requirements due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { requirement: 'Quarterly Risk Report', due: '2024-11-05', urgency: 'high' },
                { requirement: 'IFRS 9 ECL Review', due: '2024-11-08', urgency: 'medium' },
                { requirement: 'AML Policy Update', due: '2024-11-15', urgency: 'low' }
              ].map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{deadline.requirement}</p>
                    <p className="text-sm text-muted-foreground">Due: {deadline.due}</p>
                  </div>
                  <Badge variant={
                    deadline.urgency === 'high' ? 'destructive' :
                    deadline.urgency === 'medium' ? 'secondary' : 'default'
                  }>
                    {deadline.urgency.toUpperCase()}
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

const BaselIIICompliance = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Basel III implementation status: <strong>96% compliant</strong> - 1 requirement needs attention
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Capital Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>CET1 Ratio</span>
                <Badge>15.2% ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Tier 1 Capital Ratio</span>
                <Badge>16.8% ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Capital Ratio</span>
                <Badge>18.5% ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Capital Conservation Buffer</span>
                <Badge>2.5% ✓</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liquidity Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>LCR</span>
                <Badge variant="destructive">98% ✗</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>NSFR</span>
                <Badge>118% ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>HQLA Buffer</span>
                <Badge>$45M ✓</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Credit Risk Framework</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Market Risk Framework</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Operational Risk Framework</span>
                <Badge>Compliant ✓</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
          <CardDescription>Required actions to achieve full Basel III compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">LCR Below Minimum Requirement</p>
                    <p className="text-sm text-muted-foreground">
                      Current: 98% | Required: 100% | Gap: $2M in HQLA
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Address
                </Button>
              </div>
              <div className="mt-3 ml-8">
                <p className="text-sm"><strong>Recommended Actions:</strong></p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Increase government bond holdings by $2M</li>
                  <li>• Review cash flow projections for next 30 days</li>
                  <li>• Consider accessing central bank facilities if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IFRS9Compliance = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ECL Model Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Stage 1 (12-month ECL)</span>
                <Badge>Implemented ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Stage 2 (Lifetime ECL)</span>
                <Badge>Implemented ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Stage 3 (Credit Impaired)</span>
                <Badge>Implemented ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>SICR Assessment</span>
                <Badge>Implemented ✓</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>PD Model</span>
                <Badge>Validated ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>LGD Model</span>
                <Badge>Validated ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>EAD Model</span>
                <Badge>Validated ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Back-testing</span>
                <Badge>In Progress</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Model Documentation</span>
                <Badge>Complete ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Methodology Paper</span>
                <Badge>Complete ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Process Manual</span>
                <Badge>Complete ✓</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Audit Trail</span>
                <Badge>Complete ✓</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current ECL Portfolio Analysis</CardTitle>
          <CardDescription>Distribution of credit exposures by IFRS 9 stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">85.2%</div>
                <div className="text-sm text-muted-foreground">Stage 1</div>
                <div className="text-xs text-muted-foreground">$758M</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">12.0%</div>
                <div className="text-sm text-muted-foreground">Stage 2</div>
                <div className="text-xs text-muted-foreground">$107M</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">2.8%</div>
                <div className="text-sm text-muted-foreground">Stage 3</div>
                <div className="text-xs text-muted-foreground">$25M</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Expected Credit Loss</span>
                <span className="text-xl font-bold">$12.4M</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>As % of Total Exposure</span>
                <span>1.39%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LocalRegulations = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          RBZ Compliance status: <strong>88% compliant</strong> - Review single borrower exposure limits
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reserve Bank of Zimbabwe (RBZ)</CardTitle>
            <CardDescription>Local banking regulatory requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Minimum Capital Requirements</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Single Borrower Limits</span>
                <Badge variant="secondary">Under Review</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Liquidity Requirements</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Provisioning Requirements</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Corporate Governance</span>
                <Badge>Compliant ✓</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AML/CFT Compliance</CardTitle>
            <CardDescription>Anti-Money Laundering and Counter Terrorism Financing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Customer Due Diligence</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Transaction Monitoring</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Suspicious Activity Reporting</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Record Keeping</span>
                <Badge>Compliant ✓</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span>Staff Training</span>
                <Badge variant="secondary">Due for Update</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regulatory Communications</CardTitle>
          <CardDescription>Recent communications from regulatory authorities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                authority: 'RBZ', 
                subject: 'Updated Single Borrower Exposure Limits', 
                date: '2024-10-25', 
                status: 'Under Review',
                priority: 'High'
              },
              { 
                authority: 'FIU', 
                subject: 'AML Training Requirements Update', 
                date: '2024-10-20', 
                status: 'Acknowledged',
                priority: 'Medium'
              },
              { 
                authority: 'RBZ', 
                subject: 'Climate Risk Disclosure Guidelines', 
                date: '2024-10-15', 
                status: 'Implemented',
                priority: 'Low'
              }
            ].map((comm, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{comm.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {comm.authority} • {comm.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    comm.priority === 'High' ? 'destructive' :
                    comm.priority === 'Medium' ? 'secondary' : 'default'
                  }>
                    {comm.priority}
                  </Badge>
                  <Badge variant="outline">{comm.status}</Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RegulatoryReporting = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Automated regulatory report generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { report: 'Basel III Capital Return', frequency: 'Monthly', nextDue: '2024-11-05', status: 'Scheduled' },
                { report: 'IFRS 9 ECL Report', frequency: 'Quarterly', nextDue: '2024-11-15', status: 'In Progress' },
                { report: 'Liquidity Monitoring', frequency: 'Daily', nextDue: '2024-11-01', status: 'Complete' },
                { report: 'Large Exposures Report', frequency: 'Monthly', nextDue: '2024-11-05', status: 'Scheduled' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{report.report}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.frequency} • Due: {report.nextDue}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      report.status === 'Complete' ? 'default' :
                      report.status === 'In Progress' ? 'secondary' : 'outline'
                    }>
                      {report.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Archive</CardTitle>
            <CardDescription>Recently generated regulatory reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { report: 'Capital Adequacy Report', generated: '2024-10-30', size: '2.4 MB' },
                { report: 'Risk Management Report', generated: '2024-10-28', size: '1.8 MB' },
                { report: 'Operational Risk Report', generated: '2024-10-25', size: '1.2 MB' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{report.report}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated: {report.generated} • {report.size}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>Create ad-hoc compliance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <FileText className="w-6 h-6 mb-2" />
              Capital Adequacy
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <TrendingUp className="w-6 h-6 mb-2" />
              Risk Assessment
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Shield className="w-6 h-6 mb-2" />
              Compliance Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceDashboard;