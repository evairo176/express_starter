"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMiddleware = exports.buildCacheKey = void 0;
const cache_1 = require("../../common/cache/cache");
/**
 * Builds a cache key from method + path + sorted query so that identical public
 * GET requests collide regardless of query parameter ordering.
 */
const buildCacheKey = (req) => {
    const query = req.query;
    const sortedQuery = Object.keys(query)
        .sort()
        .map((key) => `${key}=${JSON.stringify(query[key])}`)
        .join('&');
    return `${req.method}:${req.path}?${sortedQuery}`;
};
exports.buildCacheKey = buildCacheKey;
/**
 * Express middleware that caches public GET responses.
 *
 * - Keys entries on method + path + query (Req 14.2).
 * - Serves a valid cached entry directly, bypassing the downstream
 *   service/DB (Req 14.2).
 * - Stores fresh responses with a bounded TTL and the provided tags so they can
 *   be invalidated on content changes (Req 14.1, 14.3).
 */
const cacheMiddleware = (options = {}) => {
    var _a, _b, _c;
    const store = (_a = options.store) !== null && _a !== void 0 ? _a : cache_1.cacheStore;
    const tags = (_b = options.tags) !== null && _b !== void 0 ? _b : [];
    const keyBuilder = (_c = options.keyBuilder) !== null && _c !== void 0 ? _c : exports.buildCacheKey;
    return (req, res, next) => {
        var _a;
        // Only cache safe, idempotent reads.
        if (req.method !== 'GET') {
            next();
            return;
        }
        const key = keyBuilder(req);
        const cached = store.get(key);
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
        const ttlMs = Math.min((_a = options.ttlMs) !== null && _a !== void 0 ? _a : (0, cache_1.getMaxCacheTtlMs)(), (0, cache_1.getMaxCacheTtlMs)());
        // Intercept the response payload so we can persist it on the way out.
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        let stored = false;
        const storeResponse = (body) => {
            var _a;
            if (stored) {
                return;
            }
            stored = true;
            // Only cache successful responses.
            if (res.statusCode >= 200 && res.statusCode < 300) {
                store.set(key, {
                    statusCode: res.statusCode,
                    body,
                    contentType: (_a = res.getHeader('Content-Type')) === null || _a === void 0 ? void 0 : _a.toString(),
                }, ttlMs, tags);
            }
        };
        res.json = (body) => {
            storeResponse(body);
            return originalJson(body);
        };
        res.send = (body) => {
            storeResponse(body);
            return originalSend(body);
        };
        next();
    };
};
exports.cacheMiddleware = cacheMiddleware;
exports.default = exports.cacheMiddleware;
