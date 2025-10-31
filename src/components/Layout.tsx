import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Shield, 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Database,
  Bell,
  Menu,
  LogOut,
  User,
  Wifi,
  WifiOff,
  Bot
} from 'lucide-react';
import { useAuth, useHealthCheck, useRealTimeMetrics } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import AIFloatingWidget from './AIFloatingWidget';

const Layout = () => {
  const { user, logout } = useAuth();
  const { isHealthy } = useHealthCheck();
  const { data: realTimeData } = useRealTimeMetrics();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: BarChart3, current: location.pathname === '/' }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Admin Dashboard', href: '/admin', icon: Settings, current: location.pathname === '/admin' },
        { name: 'User Management', href: '/admin/users', icon: Users, current: location.pathname === '/admin/users' },
        { name: 'Data Sources', href: '/data-sources', icon: Database, current: location.pathname === '/data-sources' },
        { name: 'AI Chat', href: '/ai-chat', icon: Bot, current: location.pathname === '/ai-chat' },
        { name: 'System Settings', href: '/admin/settings', icon: Database, current: location.pathname === '/admin/settings' }
      ];
    }

    if (user?.role === 'risk_manager') {
      return [
        ...baseItems,
        { name: 'Risk Management', href: '/risk', icon: TrendingUp, current: location.pathname === '/risk' },
        { name: 'Portfolio Analysis', href: '/portfolios', icon: BarChart3, current: location.pathname === '/portfolios' },
        { name: 'Risk Reports', href: '/reports', icon: FileText, current: location.pathname === '/reports' }
      ];
    }

    if (user?.role === 'auditor') {
      return [
        ...baseItems,
        { name: 'Compliance', href: '/compliance', icon: Shield, current: location.pathname === '/compliance' },
        { name: 'SECZ Compliance', href: '/secz-compliance', icon: Shield, current: location.pathname === '/secz-compliance' },
        { name: 'Audit Reports', href: '/audit', icon: FileText, current: location.pathname === '/audit' }
      ];
    }

    // Default navigation for analysts and viewers
    return [
      ...baseItems,
      { name: 'Risk Analysis', href: '/risk', icon: TrendingUp, current: location.pathname === '/risk' },
      { name: 'Reports', href: '/reports', icon: FileText, current: location.pathname === '/reports' }
    ];
  };

  const navigation = getNavigationItems();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">Risk Management</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    item.current ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Navigation */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav navigation={navigation} />
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <Badge variant={isHealthy ? "default" : "destructive"} className="hidden sm:flex">
                {isHealthy ? (
                  <>
                    <Wifi className="mr-1 h-3 w-3" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="mr-1 h-3 w-3" />
                    Offline
                  </>
                )}
              </Badge>
              
              {/* Active Alerts */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => navigate('/risk')}
              >
                <Bell className="h-4 w-4" />
                {realTimeData?.alerts?.critical > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {realTimeData.alerts.critical}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`} alt={user?.firstName} />
                    <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="w-fit text-xs">{user?.role?.replace('_', ' ')}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* AI Floating Widget */}
      <AIFloatingWidget />
      

    </div>
  );
};

// Mobile Navigation Component
const MobileNav = ({ navigation }: { navigation: any[] }) => {
  return (
    <div className="px-6 pb-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6" />
        <span className="font-bold">Risk Management</span>
      </div>
      <div className="flex flex-col space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              item.current
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Layout;