/**
 * Response caching middleware
 * Caches GET requests for a specified duration
 */

import { Request, Response, NextFunction } from 'express';
// Simple in-memory cache implementation (no external dependency needed)
interface CacheEntry {
  data: any;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private checkInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.checkInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  set(key: string, value: any, ttl: number): void {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  flushAll(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
}

/**
 * Middleware to cache GET responses
 * @param options Cache options
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const ttl = options.ttl || 300; // Default 5 minutes
  const keyGenerator = options.keyGenerator || ((req: Request) => {
    // Generate cache key from URL and query params
    return `${req.originalUrl || req.url}`;
  });

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for authenticated requests that might have user-specific data
    // You can customize this logic based on your needs
    if (req.headers.authorization) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(cacheKey, body, ttl);
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
    cache.flushAll();
    return;
  }

  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

export default cache;

