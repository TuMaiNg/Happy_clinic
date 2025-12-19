import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import pool from '../config/database';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Không có token xác thực', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    const [users] = await pool.query(
      'SELECT id, email, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    ) as any[];

    if (!users || users.length === 0) {
      throw new AppError('Người dùng không tồn tại hoặc đã bị khóa', 401);
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token không hợp lệ', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token đã hết hạn', 401));
    }
    return next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Không có quyền truy cập', 403));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Không đủ quyền để thực hiện hành động này', 403));
    }

    next();
  };
};

