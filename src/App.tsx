import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import RiskManagerDashboard from "./pages/RiskManagerDashboard";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import UserManagement from "./pages/UserManagement";
import SystemSettings from "./pages/SystemSettings";
import ProfilePage from "./pages/ProfilePage";
import AIChat from "./pages/AIChat";
import DataSources from "./pages/DataSources";
import Reports from "./pages/Reports";

// Hooks
import { useAuth } from "./hooks/useApi";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Index />} />
        <Route path="admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="risk" element={
          <ProtectedRoute requiredRoles={["risk_manager", "admin", "analyst"]}>
            <RiskManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="compliance" element={
          <ProtectedRoute requiredRoles={["auditor", "admin"]}>
            <ComplianceDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute requiredRole="admin">
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="admin/settings" element={
          <ProtectedRoute requiredRole="admin">
            <SystemSettings />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="ai-chat" element={
          <ProtectedRoute>
            <AIChat />
          </ProtectedRoute>
        } />
        <Route path="data-sources" element={
          <ProtectedRoute requiredRole="admin">
            <DataSources />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
