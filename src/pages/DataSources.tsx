import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
  BarChart3,
  Building,
  DollarSign,
  FileText,
  Globe,
  Key,
  Link,
  Monitor,
  Server,
  Wifi
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  description: string;
  lastSync: Date;
  recordCount: number;
  icon: any;
  config: any;
}

const DataSources = () => {
  const [activeTab, setActiveTab] = useState('sources');
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: '1',
      name: 'Core Banking System',
      type: 'database',
      status: 'connected',
      description: 'Primary banking database containing customer and transaction data',
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      recordCount: 1250000,
      icon: Building,
      config: { host: 'core-db.bank.local', port: 5432 }
    },
    {
      id: '2',
      name: 'Market Data Feed',
      type: 'api',
      status: 'connected',
      description: 'Real-time market data and pricing information',
      lastSync: new Date(Date.now() - 1 * 60 * 1000),
      recordCount: 45000,
      icon: BarChart3,
      config: { endpoint: 'https://api.marketdata.com', refreshRate: 5 }
    },
    {
      id: '3',
      name: 'Credit Rating Agency',
      type: 'api',
      status: 'error',
      description: 'Credit ratings and risk assessments from external agencies',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      recordCount: 0,
      icon: FileText,
      config: { endpoint: 'https://api.creditrating.com' }
    },
    {
      id: '4',
      name: 'Regulatory Reporting',
      type: 'sftp',
      status: 'disconnected',
      description: 'SFTP connection for regulatory data submission',
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      recordCount: 0,
      icon: Shield,
      config: { host: 'sftp.regulator.gov', port: 22 }
    },
    {
      id: '5',
      name: 'Portfolio Management',
      type: 'database',
      status: 'syncing',
      description: 'Portfolio holdings and performance data',
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      recordCount: 85000,
      icon: DollarSign,
      config: { host: 'portfolio-db.internal', port: 3306 }
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleConnect = (sourceId: string) => {
    setDataSources(prev => prev.map(source => 
      source.id === sourceId 
        ? { ...source, status: 'syncing' as const }
        : source
    ));

    // Simulate connection process
    setTimeout(() => {
      setDataSources(prev => prev.map(source => 
        source.id === sourceId 
          ? { ...source, status: 'connected' as const, lastSync: new Date() }
          : source
      ));
      toast({
        title: "Data Source Connected",
        description: "Successfully connected to the data source.",
      });
    }, 2000);
  };

  const handleDisconnect = (sourceId: string) => {
    setDataSources(prev => prev.map(source => 
      source.id === sourceId 
        ? { ...source, status: 'disconnected' as const }
        : source
    ));
    toast({
      title: "Data Source Disconnected",
      description: "Data source has been disconnected.",
    });
  };

  const handleSync = (sourceId: string) => {
    setDataSources(prev => prev.map(source => 
      source.id === sourceId 
        ? { ...source, status: 'syncing' as const }
        : source
    ));

    setTimeout(() => {
      setDataSources(prev => prev.map(source => 
        source.id === sourceId 
          ? { ...source, status: 'connected' as const, lastSync: new Date() }
          : source
      ));
      toast({
        title: "Sync Complete",
        description: "Data synchronization completed successfully.",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Sources</h1>
              <p className="text-muted-foreground">Manage system integrations and data connections</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Data Source
                  </Button>
                </DialogTrigger>
                <AddDataSourceDialog onClose={() => setIsAddDialogOpen(false)} />
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-6">
            <DataSourcesTab 
              dataSources={dataSources}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
            />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <MonitoringTab dataSources={dataSources} />
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <DataMappingTab />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <ActivityLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const DataSourcesTab = ({ dataSources, onConnect, onDisconnect, onSync }: any) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'default',
      disconnected: 'secondary',
      error: 'destructive',
      syncing: 'outline'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {dataSources.map((source: DataSource) => (
        <Card key={source.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <source.icon className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(source.status)}
                    {getStatusBadge(source.status)}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{source.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span>{source.lastSync.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Records:</span>
                  <span>{source.recordCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{source.type}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {source.status === 'disconnected' || source.status === 'error' ? (
                  <Button 
                    size="sm" 
                    onClick={() => onConnect(source.id)}
                    className="flex-1"
                  >
                    <Link className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDisconnect(source.id)}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onSync(source.id)}
                  disabled={source.status !== 'connected'}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const MonitoringTab = ({ dataSources }: any) => {
  const connectedSources = dataSources.filter((s: DataSource) => s.status === 'connected').length;
  const totalRecords = dataSources.reduce((sum: number, s: DataSource) => sum + s.recordCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connected Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {connectedSources}/{dataSources.length}
            </div>
            <p className="text-sm text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalRecords.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Synchronized records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">98.5%</div>
            <p className="text-sm text-muted-foreground">Overall quality score</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Monitoring</CardTitle>
          <CardDescription>Monitor data source performance and connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataSources.map((source: DataSource) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <source.icon className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last sync: {source.lastSync.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={source.status === 'connected' ? 'default' : 'destructive'}>
                    {source.status}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium">{source.recordCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">records</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DataMappingTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Field Mapping</CardTitle>
        <CardDescription>Configure how data fields are mapped between systems</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { source: 'Core Banking', field: 'customer_id', target: 'Customer ID', mapped: true },
            { source: 'Core Banking', field: 'account_balance', target: 'Account Balance', mapped: true },
            { source: 'Market Data', field: 'security_price', target: 'Security Price', mapped: true },
            { source: 'Market Data', field: 'volatility', target: 'Volatility Index', mapped: false },
            { source: 'Credit Rating', field: 'rating_score', target: 'Credit Score', mapped: true }
          ].map((mapping, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{mapping.source}</p>
                  <p className="text-sm text-muted-foreground">{mapping.field}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-border" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-4 h-0.5 bg-border" />
                </div>
                <div>
                  <p className="font-medium">{mapping.target}</p>
                  <p className="text-sm text-muted-foreground">Target field</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={mapping.mapped ? 'default' : 'secondary'}>
                  {mapping.mapped ? 'Mapped' : 'Unmapped'}
                </Badge>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityLogsTab = () => {
  const logs = [
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      action: 'Data Sync',
      source: 'Market Data Feed',
      status: 'Success',
      details: 'Synchronized 1,250 market prices'
    },
    {
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      action: 'Connection Test',
      source: 'Core Banking System',
      status: 'Success',
      details: 'Connection verified successfully'
    },
    {
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      action: 'Data Sync',
      source: 'Credit Rating Agency',
      status: 'Failed',
      details: 'Authentication failed - invalid API key'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>Recent data source activities and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-sm text-muted-foreground">{log.source}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                  {log.status}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {log.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AddDataSourceDialog = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    endpoint: '',
    credentials: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Data Source Added",
      description: "New data source has been configured successfully.",
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Data Source</DialogTitle>
        <DialogDescription>
          Configure a new data source connection for your risk management system.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Data Source Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., External Risk Database"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="type">Connection Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select connection type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="api">REST API</SelectItem>
              <SelectItem value="sftp">SFTP/FTP</SelectItem>
              <SelectItem value="file">File Import</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this data source"
          />
        </div>

        <div>
          <Label htmlFor="endpoint">Connection Details</Label>
          <Input
            id="endpoint"
            value={formData.endpoint}
            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
            placeholder="Host, URL, or connection string"
          />
        </div>

        <DialogFooter>
          <Button type="submit">Add Data Source</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default DataSources;