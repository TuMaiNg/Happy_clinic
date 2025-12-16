import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter (more lenient for public endpoints)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 for better UX (public endpoints are cached)
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
    });
  },
  // Skip rate limiting for public GET endpoints (they are cached)
  skip: (req: Request) => {
    // Skip rate limiting for public GET requests to doctors and services (cached)
    if (req.method === 'GET' && (req.path.startsWith('/doctors') || req.path.startsWith('/services'))) {
      return true;
    }
    return false;
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.',
    });
  },
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ.',
    });
  },
});

// Rate limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    success: false,
    message: 'Quá nhiều lần đăng ký, vui lòng thử lại sau 1 giờ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Quá nhiều lần đăng ký, vui lòng thử lại sau 1 giờ.',
    });
  },
});

// Rate limiter for OTP requests
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per 15 minutes
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu OTP, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu OTP, vui lòng thử lại sau 15 phút.',
    });
  },
});







