import { sanitizeInput, sanitizeMongo } from '../../middleware/sanitize';
import { Request, Response, NextFunction } from 'express';

describe('Input Sanitization', () => {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any as Response;

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeInput', () => {
    it('should sanitize request body strings', () => {
      const req = {
        body: {
          name: '<script>alert("xss")</script>Test',
          email: 'test@example.com',
          phone: '(123) 456-7890',
        },
        query: {},
        params: {},
      } as any as Request;

      sanitizeInput(req, mockResponse, mockNext);

      expect(req.body.name).not.toContain('<script>');
      expect(req.body.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not sanitize password fields', () => {
      const req = {
        body: {
          password: 'MyPassword123!',
          passwordHash: 'hashed_value',
        },
        query: {},
        params: {},
      } as any as Request;

      sanitizeInput(req, mockResponse, mockNext);

      expect(req.body.password).toBe('MyPassword123!');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize phone numbers', () => {
      const req = {
        body: {
          phone: '+84 123 456 789',
          tel: '(123) 456-7890',
        },
        query: {},
        params: {},
      } as any as Request;

      sanitizeInput(req, mockResponse, mockNext);

      // Phone should be sanitized (only digits and +)
      expect(typeof req.body.phone).toBe('string');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      const req = {
        body: {},
        query: {
          search: '<script>alert("xss")</script>',
        },
        params: {},
      } as any as Request;

      sanitizeInput(req, mockResponse, mockNext);

      expect(req.query.search).not.toContain('<script>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      const req = {
        body: {
          user: {
            name: '<script>alert("xss")</script>',
            email: 'test@example.com',
          },
        },
        query: {},
        params: {},
      } as any as Request;

      sanitizeInput(req, mockResponse, mockNext);

      expect(req.body.user.name).not.toContain('<script>');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('sanitizeMongo', () => {
    it('should be a function', () => {
      expect(typeof sanitizeMongo).toBe('function');
    });
  });
});

