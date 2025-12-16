import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { config } from '../config/env';

/**
 * Enhanced Helmet configuration with Content Security Policy
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.frontend.url],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.env === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
});

/**
 * Request size limiting middleware
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    res.status(413).json({
      success: false,
      message: 'Request body quá lớn. Kích thước tối đa là 10MB.',
    });
    return;
  }

  next();
};

/**
 * IP address extractor (handles proxies)
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Log suspicious activities
  if (method === 'POST' && (url.includes('/auth/login') || url.includes('/auth/register'))) {
    console.log(`[SECURITY] ${method} ${url} from IP: ${ip}, User-Agent: ${userAgent}`);
  }

  // Log 4xx and 5xx errors
  const originalSend = res.send;
  res.send = function (body) {
    if (res.statusCode >= 400) {
      console.log(`[SECURITY] ${res.statusCode} ${method} ${url} from IP: ${ip}`);
    }
    return originalSend.call(this, body);
  };

  next();
};

