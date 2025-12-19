import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: any; expiresAt: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
}

/**
 * Middleware to cache GET responses
 * @param options Cache options
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const ttl = options.ttl || 60; // Default 60 seconds
  const keyGenerator = options.keyGenerator || ((req: Request) => `${req.method}:${req.originalUrl}`);

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cached = cache.get(cacheKey);

    // Check if cache is valid
    if (cached && cached.expiresAt > Date.now()) {
      res.set('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data: body,
          expiresAt: Date.now() + ttl * 1000,
        });
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for a specific key pattern
 */
export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

/**
 * Clean expired cache entries (should be called periodically)
 */
export const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }
};

// Clean expired cache every 5 minutes
setInterval(cleanExpiredCache, 5 * 60 * 1000);







