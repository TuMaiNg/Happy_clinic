import api from '../config/api';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  birthday?: string;
  gender?: number;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      role: string;
    };
    profile?: any;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      if (response.data.success && response.data.data.tokens) {
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      }
      return response.data;
    } catch (error: any) {
      // Handle axios error response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      if (response.data.success && response.data.data.tokens) {
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle network errors
      if (error.isNetworkError || !error.response) {
        const baseURL = error.details?.baseURL || 'http://localhost:3000/api';
        throw new Error(
          `Không thể kết nối đến server.\n` +
          `URL: ${baseURL}/auth/login\n` +
          `Vui lòng kiểm tra:\n` +
          `1. Backend server có đang chạy không?\n` +
          `2. Port có đúng không? (Backend: 3000, Frontend: 3001 hoặc khác)\n` +
          `3. CORS có được cấu hình đúng không?`
        );
      }
      
      // Handle axios error response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    if (response.data.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      return { accessToken, refreshToken: newRefreshToken };
    }
    throw new Error('Failed to refresh token');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};

