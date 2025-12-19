import axios from 'axios';

// API Base URL - check environment variable first
// Note: Backend might be running on port 5000 (check .env file)
// Set REACT_APP_API_URL in frontend/.env to override
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API Base URL is logged only in development mode (already handled above)

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
      // Provide more helpful error message
      const networkError = new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
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

          // Validate response structure
          if (response?.data?.success && response?.data?.data?.tokens?.accessToken) {
            const { accessToken } = response.data.data.tokens;
            localStorage.setItem('accessToken', accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            return api(originalRequest);
          } else {
            throw new Error('Invalid refresh token response');
          }
        }
      } catch (refreshError) {
        // Refresh failed
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Không redirect nếu đang ở trang payment (PayOS redirect về)
        const isPaymentPage = window.location.pathname.startsWith('/payment/');
        if (!isPaymentPage) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

