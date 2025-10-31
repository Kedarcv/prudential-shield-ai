import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  BarChart3,
  Shield,
  TrendingUp,
  Building,
  FileSpreadsheet,
  Eye,
  Clock,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

const Reports = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reportTemplates = [
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Report',
      description: 'Comprehensive risk analysis across all portfolios',
      category: 'risk',
      icon: Shield,
      lastGenerated: '2 hours ago',
      formats: ['PDF', 'Excel', 'CSV']
    },
    {
      id: 'portfolio-performance',
      name: 'Portfolio Performance Report',
      description: 'Performance metrics and attribution analysis',
      category: 'portfolio',
      icon: BarChart3,
      lastGenerated: '1 day ago',
      formats: ['PDF', 'Excel']
    },
    {
      id: 'compliance-summary',
      name: 'Compliance Summary',
      description: 'Regulatory compliance status and metrics',
      category: 'compliance',
      icon: Building,
      lastGenerated: '3 hours ago',
      formats: ['PDF', 'Word']
    },
    {
      id: 'market-risk-var',
      name: 'Market Risk VaR Report',
      description: 'Value at Risk analysis and stress testing results',
      category: 'risk',
      icon: TrendingUp,
      lastGenerated: '30 minutes ago',
      formats: ['PDF', 'Excel']
    }
  ];

  const recentReports = [
    {
      id: '1',
      name: 'Monthly Risk Assessment - November 2023',
      type: 'Risk Assessment Report',
      generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      format: 'PDF',
      size: '2.3 MB',
      status: 'completed'
    },
    {
      id: '2',
      name: 'Compliance Review Q4 2023',
      type: 'Compliance Summary',
      generatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      format: 'Excel',
      size: '1.8 MB',
      status: 'completed'
    },
    {
      id: '3',
      name: 'Portfolio Performance - October 2023',
      type: 'Portfolio Performance Report',
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      format: 'PDF',
      size: '3.1 MB',
      status: 'completed'
    }
  ];

  const handleGenerateReport = (templateId: string, format: string) => {
    toast({
      title: "Report Generation Started",
      description: `Your ${format} report is being generated. You'll be notified when it's ready.`,
    });
  };

  const handleDownloadReport = (reportId: string) => {
    toast({
      title: "Download Started",
      description: "Your report download has started.",
    });
  };

  const categories = [
    { value: 'all', label: 'All Reports' },
    { value: 'risk', label: 'Risk Reports' },
    { value: 'compliance', label: 'Compliance Reports' },
    { value: 'portfolio', label: 'Portfolio Reports' },
    { value: 'regulatory', label: 'Regulatory Reports' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(template => template.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate and manage risk management reports</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Custom Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Report Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <div className="flex gap-2 mt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {dateFrom ? format(dateFrom, 'MMM dd') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {dateTo ? format(dateTo, 'MMM dd') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button className="w-full" size="sm">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Report Templates */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <template.icon className="w-6 h-6 text-primary" />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">{template.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Generated:</span>
                          <span>{template.lastGenerated}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {template.formats.map((format) => (
                            <Badge key={format} variant="outline" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Select onValueChange={(format) => handleGenerateReport(template.id, format)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Generate" />
                            </SelectTrigger>
                            <SelectContent>
                              {template.formats.map((format) => (
                                <SelectItem key={format} value={format}>
                                  Generate {format}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {recentReports.map((report) => (
                      <div key={report.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {report.format === 'PDF' ? (
                            <FileText className="w-8 h-8 text-red-500" />
                          ) : (
                            <FileSpreadsheet className="w-8 h-8 text-green-500" />
                          )}
                          <div>
                            <h3 className="font-medium">{report.name}</h3>
                            <p className="text-sm text-muted-foreground">{report.type}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {report.generatedAt.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">• {report.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;