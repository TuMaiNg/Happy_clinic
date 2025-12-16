import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { AppError } from './errorHandler';
import { getClientIp } from './security';

interface LoginAttempt {
  email: string;
  ip: string;
  attempts: number;
  lockUntil?: Date;
}

// In-memory store for login attempts (in production, use Redis)
const loginAttempts = new Map<string, LoginAttempt>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Get key for storing login attempts
 */
const getAttemptKey = (email: string, ip: string): string => {
  return `${email}:${ip}`;
};

/**
 * Check if account is locked
 */
export const checkAccountLockout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  if (!email) {
    return next();
  }

  const ip = getClientIp(req);
  const key = getAttemptKey(email, ip);
  const attempt = loginAttempts.get(key);

  if (attempt && attempt.lockUntil && attempt.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil((attempt.lockUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      `Tài khoản đã bị khóa do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      423 // 423 Locked
    );
  }

  // Clear lock if expired
  if (attempt && attempt.lockUntil && attempt.lockUntil <= new Date()) {
    loginAttempts.delete(key);
  }

  next();
};

/**
 * Record failed login attempt
 */
export const recordFailedLogin = (email: string, ip: string): void => {
  const key = getAttemptKey(email, ip);
  const attempt = loginAttempts.get(key);

  if (!attempt) {
    loginAttempts.set(key, {
      email,
      ip,
      attempts: 1,
    });
    return;
  }

  // If lock expired, reset attempts
  if (attempt.lockUntil && attempt.lockUntil <= new Date()) {
    attempt.attempts = 1;
    attempt.lockUntil = undefined;
    loginAttempts.set(key, attempt);
    return;
  }

  attempt.attempts += 1;

  // Lock account after max attempts
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS && !attempt.lockUntil) {
    attempt.lockUntil = new Date(Date.now() + LOCK_TIME);
    console.log(`[SECURITY] Account locked: ${email} from IP: ${ip}`);
    
    // Log to database
    pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, ip_address, created_at) 
       VALUES (NULL, 'account_locked', 'users', ?, NOW())`,
      [ip]
    ).catch(err => console.error('Failed to log account lockout:', err));
  }

  loginAttempts.set(key, attempt);
};

/**
 * Clear login attempts on successful login
 */
export const clearLoginAttempts = (email: string, ip: string): void => {
  const key = getAttemptKey(email, ip);
  loginAttempts.delete(key);
};

/**
 * Cleanup old attempts (run periodically)
 */
export const cleanupLoginAttempts = (): void => {
  const now = new Date();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.lockUntil && attempt.lockUntil <= now) {
      loginAttempts.delete(key);
    }
  }
};

// Cleanup every hour
setInterval(cleanupLoginAttempts, 60 * 60 * 1000);











