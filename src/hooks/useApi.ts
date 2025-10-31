import { useState, useEffect, useCallback } from 'react';
import { apiService, DashboardMetrics, RiskAlert, AIInsight, ComplianceData } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Generic hook for API calls
export function useApi<T>(apiCall: () => Promise<T>, deps: any[] = []): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'An error occurred',
      });
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return state;
}

// Specific hooks for different API endpoints
export function useDashboardMetrics() {
  return useApi(() => apiService.getDashboardOverview());
}

export function useRealTimeMetrics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metrics = await apiService.getRealTimeMetrics();
        setData(metrics);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

export function useAlerts(params: {
  page?: number;
  limit?: number;
  severity?: string;
  status?: string;
} = {}) {
  const [state, setState] = useState<UseApiState<{
    alerts: RiskAlert[];
    pagination: any;
  }>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAlerts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const data = await apiService.getAlerts(params);
      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message,
      });
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { ...state, refetch: fetchAlerts };
}

export function useAIInsights() {
  const [data, setData] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const insights = await apiService.getAIInsights();
        setData(insights);
        setError(null);
      } catch (err: any) {
        console.warn('AI insights unavailable:', err.message);
        setError(err.message);
        // Use fallback data if API fails
        setData([
          {
            id: 'fallback_1',
            title: 'Portfolio Rebalancing Opportunity',
            description: 'AI analysis suggests reducing exposure to high-volatility assets by 8% to optimize risk-adjusted returns',
            confidence: 94,
            category: 'Optimization',
            severity: 'medium',
            recommendations: [],
            generatedAt: new Date().toISOString()
          },
          {
            id: 'fallback_2',
            title: 'Emerging Credit Risk Pattern',
            description: 'Machine learning models detected early indicators of credit deterioration in SME loan portfolio',
            confidence: 87,
            category: 'Prediction',
            severity: 'high',
            recommendations: [],
            generatedAt: new Date().toISOString()
          },
          {
            id: 'fallback_3',
            title: 'Regulatory Compliance Enhancement',
            description: 'Automated analysis recommends updates to stress testing scenarios based on recent market conditions',
            confidence: 91,
            category: 'Compliance',
            severity: 'medium',
            recommendations: [],
            generatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();

    // Refresh insights every 2 hours
    const interval = setInterval(fetchInsights, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

export function useCompliance() {
  return useApi(() => apiService.getComplianceStatus());
}

export function usePortfolios(limit?: number) {
  return useApi(() => apiService.getPortfolios(limit), [limit]);
}

export function useTrends(days: number = 30) {
  return useApi(() => apiService.getTrends(days), [days]);
}

// Alert management hooks
export function useAlertActions() {
  const [loading, setLoading] = useState(false);

  const acknowledgeAlert = async (alertId: string) => {
    setLoading(true);
    try {
      await apiService.acknowledgeAlert(alertId);
      return true;
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string, resolution?: string) => {
    setLoading(true);
    try {
      await apiService.resolveAlert(alertId, resolution);
      return true;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    acknowledgeAlert,
    resolveAlert,
    loading,
  };
}

// Authentication hooks
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize auth state on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.login({ email, password });
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
  };
}

// Health check hook
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.healthCheck();
        setIsHealthy(true);
      } catch (error) {
        setIsHealthy(false);
        console.warn('Backend health check failed:', error);
      }
      setLastCheck(new Date());
    };

    // Initial check
    checkHealth();

    // Check every 2 minutes
    const interval = setInterval(checkHealth, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, lastCheck };
}

// User management hooks
export function useUsers(params: {
  search?: string;
  role?: string;
  status?: string;
} = {}) {
  return useApi(() => apiService.getUsers(params), [JSON.stringify(params)]);
}

export function useUserActions() {
  const [loading, setLoading] = useState(false);

  const createUser = async (userData: any) => {
    setLoading(true);
    try {
      const result = await apiService.createUser(userData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: any) => {
    setLoading(true);
    try {
      const result = await apiService.updateUser(userId, userData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    try {
      await apiService.deleteUser(userId);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    setLoading(true);
    try {
      const result = await apiService.updateUserStatus(userId, status);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    loading
  };
}

// System settings hook
export function useSystemSettings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await apiService.getSystemSettings();
      setData(settings);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section: string, settings: any) => {
    setLoading(true);
    try {
      const result = await apiService.updateSystemSettings(section, settings);
      setData(prev => ({ ...prev, [section]: settings }));
      return result;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    data,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
}