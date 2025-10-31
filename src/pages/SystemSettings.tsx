import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Mail, 
  Server, 
  Key,
  Download,
  Upload,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useSystemSettings } from '@/hooks/useApi';
import { toast } from '@/components/ui/use-toast';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { data: settings, updateSettings, loading } = useSystemSettings();

  const handleSaveSettings = async (section: string, data: any) => {
    try {
      await updateSettings(section, data);
      toast({
        title: "Settings Updated",
        description: "System settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
              <p className="text-muted-foreground">Configure system parameters, security, and integrations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Config
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import Config
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralSettings onSave={(data) => handleSaveSettings('general', data)} />
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <RiskSettings onSave={(data) => handleSaveSettings('risk', data)} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings onSave={(data) => handleSaveSettings('security', data)} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings onSave={(data) => handleSaveSettings('notifications', data)} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationSettings onSave={(data) => handleSaveSettings('integrations', data)} />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const GeneralSettings = ({ onSave }: { onSave: (data: any) => void }) => {
  const [settings, setSettings] = useState({
    organizationName: 'Prudential Financial Services',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en',
    enableAuditLog: true,
    sessionTimeout: 1440
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Configure basic organization information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={settings.organizationName}
              onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Track all user activities and system changes</p>
            </div>
            <Switch
              checked={settings.enableAuditLog}
              onCheckedChange={(checked) => setSettings({ ...settings, enableAuditLog: checked })}
            />
          </div>

          <div>
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save General Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const RiskSettings = ({ onSave }: { onSave: (data: any) => void }) => {
  const [settings, setSettings] = useState({
    var95Threshold: 1000000,
    capitalAdequacyThreshold: 12,
    liquidityCoverageThreshold: 100,
    leverageRatioThreshold: 3,
    enableRealTimeMonitoring: true,
    updateInterval: 30,
    alertDuplication: 60,
    significantPriceChange: 5
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Management Configuration</CardTitle>
        <CardDescription>Configure risk thresholds and monitoring parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="var95">VaR 95% Threshold ($)</Label>
            <Input
              id="var95"
              type="number"
              value={settings.var95Threshold}
              onChange={(e) => setSettings({ ...settings, var95Threshold: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label htmlFor="capitalAdequacy">Capital Adequacy Threshold (%)</Label>
            <Input
              id="capitalAdequacy"
              type="number"
              value={settings.capitalAdequacyThreshold}
              onChange={(e) => setSettings({ ...settings, capitalAdequacyThreshold: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="liquidity">Liquidity Coverage Threshold (%)</Label>
            <Input
              id="liquidity"
              type="number"
              value={settings.liquidityCoverageThreshold}
              onChange={(e) => setSettings({ ...settings, liquidityCoverageThreshold: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label htmlFor="leverage">Leverage Ratio Threshold (%)</Label>
            <Input
              id="leverage"
              type="number"
              step="0.1"
              value={settings.leverageRatioThreshold}
              onChange={(e) => setSettings({ ...settings, leverageRatioThreshold: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Real-time Monitoring</Label>
            <p className="text-sm text-muted-foreground">Continuously monitor risk metrics</p>
          </div>
          <Switch
            checked={settings.enableRealTimeMonitoring}
            onCheckedChange={(checked) => setSettings({ ...settings, enableRealTimeMonitoring: checked })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="updateInterval">Update Interval (seconds)</Label>
            <Input
              id="updateInterval"
              type="number"
              value={settings.updateInterval}
              onChange={(e) => setSettings({ ...settings, updateInterval: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <Label htmlFor="priceChange">Significant Price Change (%)</Label>
            <Input
              id="priceChange"
              type="number"
              value={settings.significantPriceChange}
              onChange={(e) => setSettings({ ...settings, significantPriceChange: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Risk Settings
        </Button>
      </CardContent>
    </Card>
  );
};

const SecuritySettings = ({ onSave }: { onSave: (data: any) => void }) => {
  const [settings, setSettings] = useState({
    enforcePasswordPolicy: true,
    minPasswordLength: 8,
    requireMFA: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    enableIPWhitelist: false,
    ipAddresses: '',
    apiRateLimit: 100
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Access</CardTitle>
          <CardDescription>Configure user authentication and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enforce Password Policy</Label>
              <p className="text-sm text-muted-foreground">Require strong passwords with complexity rules</p>
            </div>
            <Switch
              checked={settings.enforcePasswordPolicy}
              onCheckedChange={(checked) => setSettings({ ...settings, enforcePasswordPolicy: checked })}
            />
          </div>

          <div>
            <Label htmlFor="minPassword">Minimum Password Length</Label>
            <Input
              id="minPassword"
              type="number"
              value={settings.minPasswordLength}
              onChange={(e) => setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Multi-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Force MFA for all user accounts</p>
            </div>
            <Switch
              checked={settings.requireMFA}
              onCheckedChange={(checked) => setSettings({ ...settings, requireMFA: checked })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxAttempts">Max Login Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="lockout">Lockout Duration (minutes)</Label>
              <Input
                id="lockout"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Security</CardTitle>
          <CardDescription>Configure API access and rate limiting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable IP Whitelist</Label>
              <p className="text-sm text-muted-foreground">Restrict API access to specific IP addresses</p>
            </div>
            <Switch
              checked={settings.enableIPWhitelist}
              onCheckedChange={(checked) => setSettings({ ...settings, enableIPWhitelist: checked })}
            />
          </div>

          {settings.enableIPWhitelist && (
            <div>
              <Label htmlFor="ipAddresses">Allowed IP Addresses</Label>
              <Textarea
                id="ipAddresses"
                placeholder="Enter IP addresses, one per line"
                value={settings.ipAddresses}
                onChange={(e) => setSettings({ ...settings, ipAddresses: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="rateLimit">API Rate Limit (requests per minute)</Label>
            <Input
              id="rateLimit"
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const NotificationSettings = ({ onSave }: { onSave: (data: any) => void }) => {
  const [settings, setSettings] = useState({
    enableEmailNotifications: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    enableSlackIntegration: false,
    slackWebhook: '',
    criticalAlertEmail: true,
    highAlertEmail: true,
    mediumAlertEmail: false,
    lowAlertEmail: false
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure email server settings for notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send alerts and notifications via email</p>
            </div>
            <Switch
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, enableEmailNotifications: checked })}
            />
          </div>

          {settings.enableEmailNotifications && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
          <CardDescription>Configure which alerts trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Critical Alerts</Label>
              <Switch
                checked={settings.criticalAlertEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, criticalAlertEmail: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>High Priority Alerts</Label>
              <Switch
                checked={settings.highAlertEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, highAlertEmail: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Medium Priority Alerts</Label>
              <Switch
                checked={settings.mediumAlertEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, mediumAlertEmail: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Low Priority Alerts</Label>
              <Switch
                checked={settings.lowAlertEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, lowAlertEmail: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IntegrationSettings = ({ onSave }: { onSave: (data: any) => void }) => {
  const integrations = [
    { name: 'Market Data API', status: 'Connected', lastSync: '5 minutes ago' },
    { name: 'Credit Rating Agency', status: 'Connected', lastSync: '1 hour ago' },
    { name: 'Core Banking System', status: 'Disconnected', lastSync: '2 days ago' },
    { name: 'Regulatory Reporting', status: 'Connected', lastSync: '30 minutes ago' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>External Integrations</CardTitle>
        <CardDescription>Manage connections to external systems and data sources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  integration.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">Last sync: {integration.lastSync}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={integration.status === 'Connected' ? 'default' : 'destructive'}>
                  {integration.status}
                </Badge>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SystemInfo = () => {
  const systemStats = {
    uptime: '15 days, 7 hours',
    version: '2.1.0',
    database: 'MongoDB 5.0.9',
    redis: 'Redis 6.2.7',
    memory: '2.1 GB / 8 GB',
    storage: '45 GB / 100 GB',
    cpu: '23%',
    lastBackup: '2023-12-01 02:00:00'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>View system status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>System Uptime</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="font-medium">{systemStats.uptime}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Application Version</Label>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">{systemStats.version}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Database</Label>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{systemStats.database}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Cache System</Label>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{systemStats.redis}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Memory Usage</Label>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{systemStats.memory}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Storage Usage</Label>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{systemStats.storage}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>CPU Usage</Label>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: systemStats.cpu }}></div>
              </div>
              <span className="text-sm text-muted-foreground">{systemStats.cpu}</span>
            </div>
            
            <div>
              <Label>Last Backup</Label>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">{systemStats.lastBackup}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;