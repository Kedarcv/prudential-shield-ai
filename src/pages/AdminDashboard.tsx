import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Database, 
  Settings, 
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Server,
  BarChart3,
  FileText,
  RefreshCw,
  Plus,
  Edit
} from 'lucide-react';
import { useAuth, useDashboardMetrics, useRealTimeMetrics } from '@/hooks/useApi';
import { apiService } from '@/services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: dashboardData, loading } = useDashboardMetrics();
  const { data: realTimeData } = useRealTimeMetrics();
  
  const [activeTab, setActiveTab] = useState('overview');

  // System status data
  const systemStatus = {
    database: { status: 'healthy', responseTime: '12ms', connections: 8 },
    api: { status: 'healthy', responseTime: '45ms', requests: 1247 },
    cache: { status: 'warning', responseTime: 'N/A', hitRate: 0 },
    scheduler: { status: 'healthy', jobsRunning: 9, lastRun: '2 minutes ago' }
  };

  const recentActivity = [
    { action: 'User login', user: 'risk.manager@riskwise.com', timestamp: '2 minutes ago', type: 'info' },
    { action: 'Risk calculation completed', user: 'system', timestamp: '5 minutes ago', type: 'success' },
    { action: 'Alert acknowledged', user: 'compliance@riskwise.com', timestamp: '8 minutes ago', type: 'warning' },
    { action: 'Report generated', user: 'admin@riskwise.com', timestamp: '15 minutes ago', type: 'info' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">System Administration & Management</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                System Healthy
              </Badge>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Integration
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">+3 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">98.9%</div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Real-time system component health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(systemStatus).map(([component, status]) => (
                    <div key={component} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          status.status === 'healthy' ? 'bg-green-500' : 
                          status.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium capitalize">{component}</p>
                          <p className="text-sm text-muted-foreground">
                            {('responseTime' in status) && `Response: ${(status as any).responseTime}`}
                            {('connections' in status) && ` | Connections: ${(status as any).connections}`}
                            {('requests' in status) && ` | Requests: ${(status as any).requests}`}
                            {('jobsRunning' in status) && ` | Jobs: ${(status as any).jobsRunning}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'}>
                        {status.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>System events and user actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border-l-2 border-l-muted pl-4">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user} • {activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemConfiguration />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <DatabaseManagement />
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <SystemIntegration />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <SystemReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getUsers({
        page,
        limit: 10,
        search: searchTerm
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await apiService.deleteUser(userId);
        loadUsers(); // Reload the list
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their permissions</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear
              </Button>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialogs - Would be implemented as modal components */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add User</h3>
            <p className="text-sm text-muted-foreground">User creation form would go here</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Edit User</h3>
            <p className="text-sm text-muted-foreground">
              Editing: {editingUser.firstName} {editingUser.lastName}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => setEditingUser(null)}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// System Configuration Component
const SystemConfiguration = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>External API integrations and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">NVIDIA AI API</p>
                <p className="text-sm text-muted-foreground">Llama 3.1 70B Instruct</p>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Market Data Feed</p>
                <p className="text-sm text-muted-foreground">Real-time market prices</p>
              </div>
              <Badge variant="destructive">Disconnected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Credit Bureau API</p>
                <p className="text-sm text-muted-foreground">Credit scoring data</p>
              </div>
              <Badge variant="secondary">Not Configured</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Core system configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Auto Risk Assessment</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Real-time Monitoring</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>AI Insights Generation</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Automated Reporting</span>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
          <Button className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Configure Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Database Management Component
const DatabaseManagement = () => {
  const collections = [
    { name: 'users', documents: 24, size: '2.4 MB', lastUpdated: '5 minutes ago' },
    { name: 'riskAssessments', documents: 1247, size: '15.3 MB', lastUpdated: '2 minutes ago' },
    { name: 'portfolios', documents: 45, size: '8.7 MB', lastUpdated: '1 hour ago' },
    { name: 'transactions', documents: 12450, size: '145.2 MB', lastUpdated: '30 seconds ago' },
    { name: 'alerts', documents: 89, size: '1.2 MB', lastUpdated: '3 minutes ago' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>Monitor database performance and manage data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collections.map((collection) => (
            <div key={collection.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {collection.documents.toLocaleString()} documents • {collection.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{collection.lastUpdated}</span>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Backup
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// System Integration Component
const SystemIntegration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External System Integration</CardTitle>
          <CardDescription>Connect to external banking and risk systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Core Banking System</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Connect to your core banking system for real-time customer and account data
              </p>
              <Button variant="outline" className="w-full">Configure Integration</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Market Data Providers</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Bloomberg, Reuters, or other market data feeds for real-time pricing
              </p>
              <Button variant="outline" className="w-full">Configure Integration</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Credit Bureaus</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Experian, Equifax, or local credit bureaus for credit scoring
              </p>
              <Button variant="outline" className="w-full">Configure Integration</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Regulatory Reporting</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Direct submission to regulatory authorities (RBZ, etc.)
              </p>
              <Button variant="outline" className="w-full">Configure Integration</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// System Reports Component
const SystemReports = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Reports</CardTitle>
        <CardDescription>Generate and schedule system reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-medium mb-2">User Activity Report</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Detailed user activity and system usage statistics
            </p>
            <Button variant="outline" size="sm">Generate Report</Button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <BarChart3 className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-medium mb-2">System Performance</h4>
            <p className="text-sm text-muted-foreground mb-3">
              API response times, database performance metrics
            </p>
            <Button variant="outline" size="sm">Generate Report</Button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <AlertTriangle className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-medium mb-2">Security Audit</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Security events, failed logins, and system access
            </p>
            <Button variant="outline" size="sm">Generate Report</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;