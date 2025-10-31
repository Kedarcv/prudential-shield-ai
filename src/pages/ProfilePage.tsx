import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Settings,
  Bell,
  Lock,
  Activity,
  Save,
  Camera
} from 'lucide-react';
import { useAuth } from '@/hooks/useApi';
import { toast } from '@/components/ui/use-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    department: user?.department || '',
    title: 'Risk Analyst',
    location: 'New York, NY',
    bio: 'Experienced risk management professional with expertise in quantitative analysis and regulatory compliance.'
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    riskAlerts: true,
    theme: 'system',
    language: 'en',
    timezone: 'UTC-5'
  });

  const handleSaveProfile = () => {
    // API call to update profile
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
    setIsEditing(false);
  };

  const handleSavePreferences = () => {
    // API call to update preferences
    toast({
      title: "Preferences Saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`} alt={user?.firstName} />
                <AvatarFallback className="text-lg">{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-muted-foreground">{profileData.title}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline">{user?.role?.replace('_', ' ')}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profileData.location}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileTab 
              data={profileData}
              setData={setProfileData}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <PreferencesTab 
              preferences={preferences}
              setPreferences={setPreferences}
              onSave={handleSavePreferences}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ProfileTab = ({ data, setData, isEditing }: any) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={data.firstName}
                onChange={(e) => setData({ ...data, firstName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={data.lastName}
                onChange={(e) => setData({ ...data, lastName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={data.department}
              onChange={(e) => setData({ ...data, department: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Your role and professional details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PreferencesTab = ({ preferences, setPreferences, onSave }: any) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Risk Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about critical risk events</p>
            </div>
            <Switch
              checked={preferences.riskAlerts}
              onCheckedChange={(checked) => setPreferences({ ...preferences, riskAlerts: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
            </div>
            <Switch
              checked={preferences.weeklyReports}
              onCheckedChange={(checked) => setPreferences({ ...preferences, weeklyReports: checked })}
            />
          </div>
          
          <Button onClick={onSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const SecurityTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password & Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          
          <Button variant="outline" className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            Setup Two-Factor Authentication
          </Button>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Active Sessions</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Current Session</p>
                  <p className="text-xs text-muted-foreground">Chrome on Windows • New York, NY</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ActivityTab = () => {
  const recentActivities = [
    {
      action: 'Logged in',
      timestamp: '2 minutes ago',
      location: 'New York, NY'
    },
    {
      action: 'Acknowledged risk alert',
      timestamp: '1 hour ago',
      location: 'New York, NY'
    },
    {
      action: 'Generated compliance report',
      timestamp: '3 hours ago',
      location: 'New York, NY'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your recent account activity and system interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp} • {activity.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;