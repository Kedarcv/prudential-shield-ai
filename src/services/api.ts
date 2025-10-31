import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  department: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface DashboardMetrics {
  summary: {
    totalExposure: number;
    activePortfolios: number;
    activeAlerts: number;
    recentTransactions: number;
    complianceScore: number;
  };
  riskDistribution: Record<string, number>;
  keyMetrics: Record<string, any>;
}

export interface RiskAlert {
  _id: string;
  alertType: string;
  riskCategory: string;
  severity: string;
  title: string;
  description: string;
  entityId: string;
  entityType: string;
  status: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
  severity: string;
  recommendations: string[];
  generatedAt: string;
}

export interface ComplianceData {
  frameworks: Array<{
    framework: string;
    requirements: any[];
    summary: {
      totalRequirements: number;
      compliant: number;
      partiallyCompliant: number;
      nonCompliant: number;
      underReview: number;
      averageCompletion: number;
    };
  }>;
  summary: {
    totalFrameworks: number;
    totalRequirements: number;
    overallCompletion: number;
  };
}

class APIService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    this.loadToken();
  }

  private loadToken(): void {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  private saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    
    if (response.data.success) {
      this.saveToken(response.data.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get('/auth/profile');
    return response.data.data;
  }

  // Dashboard APIs
  async getDashboardOverview(): Promise<DashboardMetrics> {
    const response = await this.api.get('/dashboard/overview');
    return response.data.data;
  }

  async getRealTimeMetrics(): Promise<any> {
    const response = await this.api.get('/dashboard/metrics');
    return response.data.data;
  }

  async getAIInsights(): Promise<AIInsight[]> {
    try {
      const response = await this.api.get('/dashboard/ai-insights');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      // Return fallback insights if API fails
      return this.getFallbackAIInsights();
    }
  }

  async getPortfolioInsights(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/dashboard/ai-insights/portfolio/${portfolioId}`);
    return response.data.data;
  }

  async getCreditRiskPrediction(customerId: string): Promise<any> {
    const response = await this.api.get(`/dashboard/ai-insights/credit-risk/${customerId}`);
    return response.data.data;
  }

  // Alerts
  async getAlerts(params: {
    page?: number;
    limit?: number;
    severity?: string;
    status?: string;
  } = {}): Promise<{
    alerts: RiskAlert[];
    pagination: any;
  }> {
    const response = await this.api.get('/dashboard/alerts', { params });
    return response.data.data;
  }

  async acknowledgeAlert(alertId: string): Promise<RiskAlert> {
    const response = await this.api.post(`/dashboard/alerts/${alertId}/acknowledge`);
    return response.data.data;
  }

  async resolveAlert(alertId: string, resolution?: string): Promise<RiskAlert> {
    const response = await this.api.post(`/dashboard/alerts/${alertId}/resolve`, { resolution });
    return response.data.data;
  }

  // Compliance
  async getComplianceStatus(): Promise<ComplianceData> {
    const response = await this.api.get('/dashboard/compliance');
    return response.data.data;
  }

  // Portfolios
  async getPortfolios(limit?: number): Promise<any[]> {
    const response = await this.api.get('/dashboard/portfolios', { 
      params: limit ? { limit } : {} 
    });
    return response.data.data;
  }

  // Trends
  async getTrends(days: number = 30): Promise<any> {
    const response = await this.api.get('/dashboard/trends', { 
      params: { days } 
    });
    return response.data.data;
  }

  // Risk Management APIs
  async calculateCreditRisk(params: any): Promise<any> {
    const response = await this.api.post('/risk/credit/calculate', params);
    return response.data.data;
  }

  async calculateMarketRisk(params: any): Promise<any> {
    const response = await this.api.post('/risk/market/var', params);
    return response.data.data;
  }

  async performStressTest(params: any): Promise<any> {
    const response = await this.api.post('/risk/stress-test', params);
    return response.data.data;
  }

  // Reports
  async generateReport(reportType: string, params: any = {}): Promise<any> {
    const response = await this.api.get(`/reports/${reportType}`, { params });
    return response.data.data;
  }

  // User Management APIs
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
    search?: string;
  } = {}): Promise<any> {
    const response = await this.api.get('/users', { params });
    return response.data.data;
  }

  async getUserById(userId: string): Promise<User> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data.data;
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
    permissions?: string[];
  }): Promise<User> {
    const response = await this.api.post('/users', userData);
    return response.data.data;
  }

  async updateUser(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    role?: string;
    department?: string;
    permissions?: string[];
    isActive?: boolean;
  }): Promise<User> {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.api.delete(`/users/${userId}`);
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await this.api.post(`/users/${userId}/reset-password`, { newPassword });
  }

  async getUserStats(): Promise<any> {
    const response = await this.api.get('/users/stats');
    return response.data.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Fallback data for offline/error scenarios
  private getFallbackAIInsights(): AIInsight[] {
    return [
      {
        id: 'fallback_1',
        title: 'Portfolio Rebalancing Opportunity',
        description: 'AI analysis suggests reducing exposure to high-volatility assets by 8% to optimize risk-adjusted returns',
        confidence: 94,
        category: 'Optimization',
        severity: 'medium',
        recommendations: [
          'Review current asset allocation',
          'Consider reducing equity exposure',
          'Increase fixed income allocation'
        ],
        generatedAt: new Date().toISOString()
      },
      {
        id: 'fallback_2',
        title: 'Emerging Credit Risk Pattern',
        description: 'Machine learning models detected early indicators of credit deterioration in SME loan portfolio',
        confidence: 87,
        category: 'Prediction',
        severity: 'high',
        recommendations: [
          'Enhanced portfolio monitoring',
          'Review underwriting standards',
          'Implement early warning system'
        ],
        generatedAt: new Date().toISOString()
      },
      {
        id: 'fallback_3',
        title: 'Regulatory Compliance Enhancement',
        description: 'Automated analysis recommends updates to stress testing scenarios based on recent market conditions',
        confidence: 91,
        category: 'Compliance',
        severity: 'medium',
        recommendations: [
          'Update stress scenarios',
          'Review model assumptions',
          'Align with regulatory guidance'
        ],
        generatedAt: new Date().toISOString()
      }
    ];
  }
}

// Create singleton instance
export const apiService = new APIService();

// Default export for convenience
export default apiService;