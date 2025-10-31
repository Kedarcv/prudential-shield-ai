import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredRoles, 
  requiredPermission,
  requiredPermissions 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no user data, show loading or redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return <AccessDenied message={`This page requires ${requiredRole} role access.`} />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <AccessDenied message={`This page requires one of the following roles: ${requiredRoles.join(', ')}.`} />;
  }

  // Check permission-based access
  if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
    return <AccessDenied message={`This page requires the '${requiredPermission}' permission.`} />;
  }

  if (requiredPermissions) {
    const hasPermission = requiredPermissions.some(permission => 
      user.permissions?.includes(permission)
    );
    if (!hasPermission) {
      return <AccessDenied message={`This page requires one of the following permissions: ${requiredPermissions.join(', ')}.`} />;
    }
  }

  return <>{children}</>;
};

const AccessDenied = ({ message }: { message: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {message}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button asChild className="w-full">
            <a href="/">Return to Dashboard</a>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;