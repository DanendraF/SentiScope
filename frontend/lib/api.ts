const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry: boolean = true
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && retry && endpoint !== '/auth/refresh') {
        const newToken = await this.handleTokenRefresh();
        if (newToken) {
          // Retry request with new token
          return this.request<T>(endpoint, options, false);
        }
      }

      if (!response.ok) {
        const error: any = new Error(data.message || 'An error occurred');
        error.errors = data.errors;
        error.statusCode = response.status;
        throw error;
      }

      return data;
    } catch (error: any) {
      // If error has errors array from validation, preserve it
      if (error.errors) {
        throw error;
      }
      throw new Error(error.message || 'Network error');
    }
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      // Wait for the refresh to complete
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.removeToken();
        return null;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.removeToken();
        return null;
      }

      const newAccessToken = data.data?.accessToken;
      const newRefreshToken = data.data?.refreshToken;

      if (newAccessToken) {
        this.setToken(newAccessToken);
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }

        // Notify all subscribers
        this.refreshSubscribers.forEach((callback) => callback(newAccessToken));
        this.refreshSubscribers = [];

        return newAccessToken;
      }

      return null;
    } catch (error) {
      this.removeToken();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    // Also set as cookie for middleware
    document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`; // 24 hours
  }

  private setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', token);
    // Also set as cookie
    document.cookie = `refreshToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Also remove cookies
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Auth methods
  async register(data: {
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  }) {
    const response = await this.request<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        this.setRefreshToken(response.data.refreshToken);
      }
      if (response.data.user) {
        this.setUser(response.data.user);
      }
    }

    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        this.setRefreshToken(response.data.refreshToken);
      }
      if (response.data.user) {
        this.setUser(response.data.user);
      }
    }

    return response;
  }

  async logout() {
    try {
      // Try to call backend logout endpoint
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if request fails
      // This handles cases where:
      // - Backend is not available
      // - Token is expired/invalid
      // - Network issues
      console.log('Backend logout failed, continuing with local cleanup');
    } finally {
      // Always remove tokens locally
      this.removeToken();
    }
  }

  async getCurrentUser() {
    const response = await this.request<{ user: User }>('/auth/me', {
      method: 'GET',
    });

    if (response.data?.user) {
      this.setUser(response.data.user);
    }

    return response;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail() {
    return this.request('/auth/verify-email', {
      method: 'POST',
    });
  }

  // User storage helpers
  private setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  }

  public getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Generic methods
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

export const apiClient = new ApiClient(API_URL);

