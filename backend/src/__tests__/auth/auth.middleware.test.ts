import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { generateTokens } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';

// Mock database pool
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

import pool from '../../config/database';

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should reject request without authorization header', async () => {
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Không có token xác thực');
      expect(error.statusCode).toBe(401);
    });

    it('should reject request with invalid authorization format', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token123' };
      
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Token không hợp lệ');
    });

    it('should authenticate valid token with active user', async () => {
      const tokens = generateTokens({
        userId: 1,
        email: 'test@example.com',
        role: 'patient',
      });
      
      mockReq.headers = { authorization: `Bearer ${tokens.accessToken}` };
      
      (pool.query as jest.Mock).mockResolvedValueOnce([
        [{ id: 1, email: 'test@example.com', role: 'patient', status: 'active' }]
      ]);
      
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'patient',
      });
    });

    it('should reject token for inactive user', async () => {
      const tokens = generateTokens({
        userId: 1,
        email: 'test@example.com',
        role: 'patient',
      });
      
      mockReq.headers = { authorization: `Bearer ${tokens.accessToken}` };
      
      // Mock user not found (inactive or deleted)
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);
      
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Người dùng không tồn tại hoặc đã bị khóa');
    });
  });

  describe('authorize', () => {
    it('should allow access for user with correct role', () => {
      mockReq.user = { id: 1, email: 'test@example.com', role: 'admin' };
      
      const authorizeMiddleware = authorize('admin', 'staff');
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for user without required role', () => {
      mockReq.user = { id: 1, email: 'test@example.com', role: 'patient' };
      
      const authorizeMiddleware = authorize('admin', 'staff');
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Không đủ quyền để thực hiện hành động này');
      expect(error.statusCode).toBe(403);
    });

    it('should deny access when user is not set', () => {
      mockReq.user = undefined;
      
      const authorizeMiddleware = authorize('admin');
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Không có quyền truy cập');
      expect(error.statusCode).toBe(403);
    });

    it('should allow patient role for patient-only routes', () => {
      mockReq.user = { id: 1, email: 'patient@example.com', role: 'patient' };
      
      const authorizeMiddleware = authorize('patient');
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow doctor role for doctor-only routes', () => {
      mockReq.user = { id: 1, email: 'doctor@example.com', role: 'doctor' };
      
      const authorizeMiddleware = authorize('doctor');
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow multiple roles', () => {
      mockReq.user = { id: 1, email: 'staff@example.com', role: 'staff' };
      
      const authorizeMiddleware = authorize('staff', 'admin');
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});

describe('Role-Based Access Control', () => {
  const roles = ['patient', 'doctor', 'staff', 'admin'];
  
  describe('Role hierarchy tests', () => {
    it.each(roles)('should correctly identify %s role', (role) => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: `${role}@example.com`, role },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      const authorizeMiddleware = authorize(role);
      authorizeMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Admin access', () => {
    it('admin should access admin-only routes', () => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      authorize('admin')(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('non-admin should NOT access admin-only routes', () => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      authorize('admin')(mockReq as AuthRequest, mockRes as Response, mockNext);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('Staff access', () => {
    it('staff should access staff routes', () => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: 'staff@example.com', role: 'staff' },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      authorize('staff', 'admin')(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('admin should also access staff routes', () => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      authorize('staff', 'admin')(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Doctor access', () => {
    it('doctor should access doctor-only routes', () => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      authorize('doctor')(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('patient should NOT access doctor-only routes', () => {
      const mockReq: Partial<AuthRequest> = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
      };
      const mockRes: Partial<Response> = {};
      const mockNext: NextFunction = jest.fn();
      
      authorize('doctor')(mockReq as AuthRequest, mockRes as Response, mockNext);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
    });
  });
});
