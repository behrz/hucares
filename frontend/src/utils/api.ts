// API client for HuCares backend
const API_BASE_URL = 'https://hucares.onrender.com/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  accessCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  maxMembers: number;
}

export interface CheckIn {
  id: string;
  userId: string;
  groupId: string;
  weekStartDate: string;
  productiveScore: number;
  satisfiedScore: number;
  bodyScore: number;
  careScore: number;
  huCaresScore: number;
  submittedAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

// Token management
class TokenManager {
  private static TOKEN_KEY = 'hucares_token';
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Simple JWT expiration check (decode payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

// HTTP client with authentication
class HttpClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        
        // Handle 401 - token expired
        if (response.status === 401) {
          TokenManager.removeToken();
          window.location.reload(); // Force re-login
        }
        
        return {
          success: false,
          error: errorData.error || errorData.message || 'Request failed',
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Initialize HTTP client
const httpClient = new HttpClient(API_BASE_URL);

// API service classes
export class AuthAPI {
  static async register(username: string, password: string, email?: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await httpClient.post<{ user: User; tokens: AuthTokens }>('/auth/register', {
      username,
      password,
      email,
    });
    
    if (response.success && response.data?.tokens?.accessToken) {
      TokenManager.setToken(response.data.tokens.accessToken);
    }
    
    return response;
  }
  
  static async login(username: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await httpClient.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
      username,
      password,
    });
    
    if (response.success && response.data?.tokens?.accessToken) {
      TokenManager.setToken(response.data.tokens.accessToken);
    }
    
    return response;
  }
  
  static async logout(): Promise<ApiResponse> {
    const response = await httpClient.post('/auth/logout');
    TokenManager.removeToken();
    return response;
  }
  
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    return httpClient.get('/auth/me');
  }
  
  static async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return httpClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
  
  static isAuthenticated(): boolean {
    return TokenManager.isTokenValid();
  }
}

export class GroupAPI {
  static async createGroup(name: string, description?: string): Promise<ApiResponse<Group>> {
    return httpClient.post('/groups', {
      name,
      description,
    });
  }
  
  static async getUserGroups(): Promise<ApiResponse<Group[]>> {
    return httpClient.get('/groups');
  }
  
  static async getGroup(groupId: string): Promise<ApiResponse<Group>> {
    return httpClient.get(`/groups/${groupId}`);
  }
  
  static async joinGroup(accessCode: string): Promise<ApiResponse<Group>> {
    return httpClient.post('/groups/join', {
      accessCode,
    });
  }
  
  static async leaveGroup(groupId: string): Promise<ApiResponse> {
    return httpClient.delete(`/groups/${groupId}/leave`);
  }
  
  static async updateGroup(groupId: string, updates: Partial<Pick<Group, 'name' | 'description'>>): Promise<ApiResponse<Group>> {
    return httpClient.put(`/groups/${groupId}`, updates);
  }
}

export class CheckInAPI {
  static async submitCheckIn(data: {
    groupId: string;
    productiveScore: number;
    satisfiedScore: number;
    bodyScore: number;
    careScore: number;
  }): Promise<ApiResponse<CheckIn>> {
    return httpClient.post('/checkins', data);
  }
  
  static async getUserCheckIns(): Promise<ApiResponse<CheckIn[]>> {
    return httpClient.get('/checkins');
  }
  
  static async getGroupCheckIns(groupId: string): Promise<ApiResponse<CheckIn[]>> {
    return httpClient.get(`/checkins/group/${groupId}`);
  }
  
  static async getCurrentWeekCheckIns(): Promise<ApiResponse<CheckIn[]>> {
    return httpClient.get('/checkins/current');
  }
  
  static async getCheckInHistory(limit?: number): Promise<ApiResponse<CheckIn[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return httpClient.get(`/checkins/history${params}`);
  }
}

export class AnalyticsAPI {
  static async getPersonalAnalytics(): Promise<ApiResponse<any>> {
    return httpClient.get('/analytics/personal');
  }
  
  static async getGroupAnalytics(groupId: string): Promise<ApiResponse<any>> {
    return httpClient.get(`/analytics/group/${groupId}`);
  }
  
  static async getComparisonAnalytics(): Promise<ApiResponse<any>> {
    return httpClient.get('/analytics/comparison');
  }
}

// Utility functions
export const api = {
  auth: AuthAPI,
  groups: GroupAPI,
  checkins: CheckInAPI,
  analytics: AnalyticsAPI,
  
  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return httpClient.get('/health');
  },
  
  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://hucares.onrender.com/health');
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default api; 