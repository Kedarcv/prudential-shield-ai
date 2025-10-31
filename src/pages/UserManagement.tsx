import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Users,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useUsers, useUserActions } from '@/hooks/useApi';
import { toast } from '@/components/ui/use-toast';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const { data: users, loading: usersLoading } = useUsers({
    search: searchTerm,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const { createUser, updateUser, deleteUser, updateUserStatus } = useUserActions();

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData);
      toast({
        title: "User Created",
        description: "New user has been successfully created.",
      });
      setIsAddUserOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(userId, newStatus);
      toast({
        title: "Status Updated",
        description: `User has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
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
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </Button>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <AddUserDialog onSubmit={handleCreateUser} />
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UsersTab 
              users={users || []}
              loading={usersLoading}
              searchTerm={searchTerm}
              roleFilter={roleFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onRoleFilterChange={setRoleFilter}
              onStatusFilterChange={setStatusFilter}
              onToggleUserStatus={handleToggleUserStatus}
            />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <RolesTab />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <SessionsTab />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const UsersTab = ({ 
  users, 
  loading, 
  searchTerm, 
  roleFilter, 
  statusFilter, 
  onSearchChange, 
  onRoleFilterChange, 
  onStatusFilterChange,
  onToggleUserStatus 
}: any) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="risk_manager">Risk Manager</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                    <TableCell>Loading...</TableCell>
                  </TableRow>
                ))
              ) : (
                users.map((user: any) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onToggleUserStatus(user._id, user.status)}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const RolesTab = () => {
  const roles = [
    {
      name: 'Admin',
      description: 'Full system access and user management',
      userCount: 2,
      permissions: ['User Management', 'System Settings', 'All Dashboards', 'Data Export']
    },
    {
      name: 'Risk Manager',
      description: 'Risk assessment and management functions',
      userCount: 5,
      permissions: ['Risk Dashboard', 'Portfolio Management', 'Risk Assessments', 'Alerts']
    },
    {
      name: 'Analyst',
      description: 'Analysis and reporting capabilities',
      userCount: 8,
      permissions: ['Analytics Dashboard', 'Reports', 'Data Analysis']
    },
    {
      name: 'Auditor',
      description: 'Compliance monitoring and audit functions',
      userCount: 3,
      permissions: ['Compliance Dashboard', 'Audit Logs', 'Compliance Reports']
    },
    {
      name: 'Viewer',
      description: 'Read-only access to dashboards',
      userCount: 12,
      permissions: ['Dashboard View', 'Basic Reports']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {role.name}
              </CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Users</span>
                  <Badge variant="secondary">{role.userCount}</Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Permissions</span>
                  <div className="mt-2 space-y-1">
                    {role.permissions.map((permission) => (
                      <div key={permission} className="text-xs text-muted-foreground">
                        • {permission}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Role
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SessionsTab = () => {
  const activeSessions = [
    {
      user: 'John Doe',
      email: 'john.doe@prudential.com',
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0',
      location: 'New York, USA'
    },
    {
      user: 'Jane Smith',
      email: 'jane.smith@prudential.com',
      loginTime: new Date(Date.now() - 30 * 60 * 1000),
      ipAddress: '192.168.1.105',
      userAgent: 'Firefox 121.0.0.0',
      location: 'London, UK'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active User Sessions</CardTitle>
        <CardDescription>Monitor and manage active user sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Login Time</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeSessions.map((session, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div>
                    <p className="font-medium">{session.user}</p>
                    <p className="text-sm text-muted-foreground">{session.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{session.loginTime.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>{session.ipAddress}</TableCell>
                <TableCell>{session.userAgent}</TableCell>
                <TableCell>{session.location}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm">
                    Terminate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AuditLogTab = () => {
  const auditLogs = [
    {
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      user: 'admin@prudential.com',
      action: 'User Created',
      resource: 'User Management',
      details: 'Created new user: john.doe@prudential.com'
    },
    {
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: 'jane.smith@prudential.com',
      action: 'Alert Acknowledged',
      resource: 'Risk Management',
      details: 'Acknowledged high-severity credit risk alert'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Track system activities and user actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span className="text-sm">{log.timestamp.toLocaleString()}</span>
                </TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell>{log.resource}</TableCell>
                <TableCell className="max-w-xs truncate">{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AddUserDialog = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ firstName: '', lastName: '', email: '', role: '', department: '' });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New User</DialogTitle>
        <DialogDescription>
          Create a new user account with appropriate role and permissions.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="risk_manager">Risk Manager</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
              <SelectItem value="auditor">Auditor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button type="submit">Create User</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default UserManagement;