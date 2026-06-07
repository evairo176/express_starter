import { NextFunction, Request, Response } from 'express';

import {
  cacheStore,
  CacheStore,
  getMaxCacheTtlMs,
} from '../../common/cache/cache';

/**
 * A captured HTTP response ready to be replayed from the cache without
 * re-running the downstream handler (Req 14.2).
 */
interface CachedResponse {
  statusCode: number;
  body: unknown;
  contentType?: string;
}

export interface CacheMiddlewareOptions {
  /** Effective TTL for stored entries (bounded by the configured max). */
  ttlMs?: number;
  /** Tags assigned to stored entries for later invalidation (Req 14.3). */
  tags?: string[];
  /** Override the backing store (primarily for tests). */
  store?: CacheStore;
  /** Override the cache key builder. */
  keyBuilder?: (req: Request) => string;
}

/**
 * Builds a cache key from method + path + sorted query so that identical public
 * GET requests collide regardless of query parameter ordering.
 */
export const buildCacheKey = (req: Request): string => {
  const query = req.query as Record<string, unknown>;
  const sortedQuery = Object.keys(query)
    .sort()
    .map((key) => `${key}=${JSON.stringify(query[key])}`)
    .join('&');
  return `${req.method}:${req.path}?${sortedQuery}`;
};

/**
 * Express middleware that caches public GET responses.
 *
 * - Keys entries on method + path + query (Req 14.2).
 * - Serves a valid cached entry directly, bypassing the downstream
 *   service/DB (Req 14.2).
 * - Stores fresh responses with a bounded TTL and the provided tags so they can
 *   be invalidated on content changes (Req 14.1, 14.3).
 */
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  const store = options.store ?? cacheStore;
  const tags = options.tags ?? [];
  const keyBuilder = options.keyBuilder ?? buildCacheKey;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache safe, idempotent reads.
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = keyBuilder(req);
    const cached = store.get<CachedResponse>(key);

    if (cached) {
      // Serve straight from cache without touching the downstream handler/DB.
      const { value } = cached;
      if (value.contentType) {
        res.setHeader('Content-Type', value.contentType);
      }
      res.setHeader('X-Cache', 'HIT');
      res.status(value.statusCode).send(value.body);
      return;
    }

    res.setHeader('X-Cache', 'MISS');

    // The TTL is bounded again inside the store; clamp here for clarity.
    const ttlMs = Math.min(
      options.ttlMs ?? getMaxCacheTtlMs(),
      getMaxCacheTtlMs(),
    );

    // Intercept the response payload so we can persist it on the way out.
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let stored = false;
    const storeResponse = (body: unknown): void => {
      if (stored) {
        return;
      }
      stored = true;
      // Only cache successful responses.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set<CachedResponse>(
          key,
          {
            statusCode: res.statusCode,
            body,
            contentType: res.getHeader('Content-Type')?.toString(),
          },
          ttlMs,
          tags,
        );
      }
    };

    res.json = (body: unknown): Response => {
      storeResponse(body);
      return originalJson(body);
    };

    res.send = (body: unknown): Response => {
      storeResponse(body);
      return originalSend(body);
    };

    next();
  };
};

export default cacheMiddleware;
