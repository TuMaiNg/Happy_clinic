import axios from 'axios';

// Force use port 3000 for backend (override .env if exists)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Log API URL for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        config: error.config,
      });
      
      // Provide more helpful error message
      const networkError = new Error('Không thể kết nối đến server. Vui lòng kiểm tra:');
      (networkError as any).isNetworkError = true;
      (networkError as any).details = {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
        code: error.code,
      };
      return Promise.reject(networkError);
    }

    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data.tokens;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

