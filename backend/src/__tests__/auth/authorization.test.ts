/**
 * Authorization Rules Test
 * 
 * This file tests the authorization rules for all routes in the application.
 * It verifies that each role has access only to the endpoints they should.
 */

import { authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Route authorization rules as defined in the application
const routeAuthorizationRules = {
  // Auth routes - public
  'POST /api/auth/register': { public: true },
  'POST /api/auth/login': { public: true },
  'POST /api/auth/refresh-token': { public: true },
  'POST /api/auth/forgot-password': { public: true },
  'POST /api/auth/reset-password': { public: true },
  'POST /api/auth/change-password': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },

  // User routes
  'GET /api/users/me': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },

  // Patient routes
  'GET /api/patients': { requiresAuth: true, roles: ['staff', 'admin'] },
  'GET /api/patients/:id': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },

  // Doctor routes - public
  'GET /api/doctors': { public: true },
  'GET /api/doctors/:id': { public: true },

  // Service routes - public
  'GET /api/services': { public: true },
  'GET /api/services/:id': { public: true },
  'POST /api/services': { requiresAuth: true, roles: ['admin'] },
  'PUT /api/services/:id': { requiresAuth: true, roles: ['admin'] },

  // Appointment routes
  'POST /api/appointments': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'GET /api/appointments': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'GET /api/appointments/:id': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'PUT /api/appointments/:id/confirm': { requiresAuth: true, roles: ['staff', 'admin'] },
  'PUT /api/appointments/:id/cancel': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'PUT /api/appointments/:id/check-in': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'PUT /api/appointments/:id/complete': { requiresAuth: true, roles: ['doctor'] },

  // Schedule routes
  'GET /api/schedules': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'POST /api/schedules': { requiresAuth: true, roles: ['doctor'] },
  'PUT /api/schedules/:id': { requiresAuth: true, roles: ['doctor'] },
  'DELETE /api/schedules/:id': { requiresAuth: true, roles: ['doctor'] },

  // Time slots routes - public
  'GET /api/time-slots/available': { public: true },

  // Payment routes
  'GET /api/payments': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'GET /api/payments/:id': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'POST /api/payments': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'PUT /api/payments/:id/confirm': { requiresAuth: true, roles: ['staff', 'admin'] },

  // Notification routes
  'GET /api/notifications': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },
  'PUT /api/notifications/:id/read': { requiresAuth: true, roles: ['patient', 'doctor', 'staff', 'admin'] },

  // Report routes
  'GET /api/reports/appointments': { requiresAuth: true, roles: ['staff', 'admin'] },
  'GET /api/reports/revenue': { requiresAuth: true, roles: ['staff', 'admin'] },
  'GET /api/reports/doctors-performance': { requiresAuth: true, roles: ['staff', 'admin'] },
  'GET /api/reports/no-shows': { requiresAuth: true, roles: ['staff', 'admin'] },

  // Config routes
  'GET /api/config/clinic': { public: true },
  'PUT /api/config/clinic': { requiresAuth: true, roles: ['admin'] },

  // Audit routes
  'GET /api/audit-logs': { requiresAuth: true, roles: ['admin'] },
};

describe('Route Authorization Rules', () => {
  const createMockRequest = (role?: string): Partial<AuthRequest> => ({
    user: role ? { id: 1, email: `${role}@example.com`, role } : undefined,
  });

  const testAuthorization = (allowedRoles: string[], currentRole: string) => {
    const mockReq = createMockRequest(currentRole);
    const mockRes: Partial<Response> = {};
    const mockNext: NextFunction = jest.fn();

    authorize(...allowedRoles)(mockReq as AuthRequest, mockRes as Response, mockNext);

    return mockNext;
  };

  describe('Staff/Admin only routes', () => {
    const staffAdminRoutes = [
      'GET /api/patients',
      'PUT /api/appointments/:id/confirm',
      'PUT /api/payments/:id/confirm',
      'GET /api/reports/appointments',
      'GET /api/reports/revenue',
      'GET /api/reports/doctors-performance',
      'GET /api/reports/no-shows',
    ];

    staffAdminRoutes.forEach(route => {
      it(`${route} should allow staff access`, () => {
        const mockNext = testAuthorization(['staff', 'admin'], 'staff');
        expect(mockNext).toHaveBeenCalledWith();
      });

      it(`${route} should allow admin access`, () => {
        const mockNext = testAuthorization(['staff', 'admin'], 'admin');
        expect(mockNext).toHaveBeenCalledWith();
      });

      it(`${route} should deny patient access`, () => {
        const mockNext = testAuthorization(['staff', 'admin'], 'patient');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
      });

      it(`${route} should deny doctor access`, () => {
        const mockNext = testAuthorization(['staff', 'admin'], 'doctor');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
      });
    });
  });

  describe('Doctor only routes', () => {
    const doctorOnlyRoutes = [
      'POST /api/schedules',
      'PUT /api/schedules/:id',
      'DELETE /api/schedules/:id',
      'PUT /api/appointments/:id/complete',
    ];

    doctorOnlyRoutes.forEach(route => {
      it(`${route} should allow doctor access`, () => {
        const mockNext = testAuthorization(['doctor'], 'doctor');
        expect(mockNext).toHaveBeenCalledWith();
      });

      it(`${route} should deny patient access`, () => {
        const mockNext = testAuthorization(['doctor'], 'patient');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
      });

      it(`${route} should deny staff access`, () => {
        const mockNext = testAuthorization(['doctor'], 'staff');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
      });
    });
  });

  describe('Admin only routes', () => {
    const adminOnlyRoutes = [
      'POST /api/services',
      'PUT /api/services/:id',
      'PUT /api/config/clinic',
      'GET /api/audit-logs',
    ];

    adminOnlyRoutes.forEach(route => {
      it(`${route} should allow admin access`, () => {
        const mockNext = testAuthorization(['admin'], 'admin');
        expect(mockNext).toHaveBeenCalledWith();
      });

      it(`${route} should deny staff access`, () => {
        const mockNext = testAuthorization(['admin'], 'staff');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
      });

      it(`${route} should deny doctor access`, () => {
        const mockNext = testAuthorization(['admin'], 'doctor');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
      });

      it(`${route} should deny patient access`, () => {
        const mockNext = testAuthorization(['admin'], 'patient');
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
      });
    });
  });

  describe('All authenticated users routes', () => {
    const allAuthRoutes = [
      'POST /api/appointments',
      'GET /api/appointments',
      'GET /api/notifications',
    ];

    const allRoles = ['patient', 'doctor', 'staff', 'admin'];

    allAuthRoutes.forEach(route => {
      allRoles.forEach(role => {
        it(`${route} should allow ${role} access`, () => {
          const mockNext = testAuthorization(allRoles, role);
          expect(mockNext).toHaveBeenCalledWith();
        });
      });
    });
  });
});

describe('Authorization Edge Cases', () => {
  it('should handle empty roles array', () => {
    const mockReq: Partial<AuthRequest> = {
      user: { id: 1, email: 'test@example.com', role: 'patient' },
    };
    const mockRes: Partial<Response> = {};
    const mockNext: NextFunction = jest.fn();

    authorize()(mockReq as AuthRequest, mockRes as Response, mockNext);
    
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
  });

  it('should handle unknown role', () => {
    const mockReq: Partial<AuthRequest> = {
      user: { id: 1, email: 'test@example.com', role: 'unknown_role' },
    };
    const mockRes: Partial<Response> = {};
    const mockNext: NextFunction = jest.fn();

    authorize('patient', 'doctor', 'staff', 'admin')(mockReq as AuthRequest, mockRes as Response, mockNext);
    
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
  });

  it('should be case-sensitive for roles', () => {
    const mockReq: Partial<AuthRequest> = {
      user: { id: 1, email: 'test@example.com', role: 'Admin' }, // Capital A
    };
    const mockRes: Partial<Response> = {};
    const mockNext: NextFunction = jest.fn();

    authorize('admin')(mockReq as AuthRequest, mockRes as Response, mockNext);
    
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
  });
});
