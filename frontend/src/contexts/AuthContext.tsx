import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Decode token to get user info (basic implementation)
      try {
        // Validate token format (should have 3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Validate payload has required fields
        if (!payload.userId || !payload.email || !payload.role) {
          throw new Error('Invalid token payload');
        }
        
        setUser({
          id: payload.userId,
          email: payload.email,
          role: payload.role,
        });
      } catch (err) {
        // Invalid token - clear storage
        console.error('Error decoding token:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if (response.success) {
      setUser(response.data.user);
    } else {
      throw new Error(response.message || 'Đăng nhập thất bại');
    }
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    if (response.success) {
      setUser(response.data.user);
    } else {
      throw new Error(response.message || 'Đăng ký thất bại');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

