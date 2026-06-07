"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStore = exports.InMemoryCacheStore = exports.getMaxCacheTtlMs = void 0;
const get_env_1 = require("../utils/get-env");
/**
 * Default maximum time-to-live (in milliseconds) applied to any cache entry.
 * Effective TTLs are bounded by this value so a single entry can never live
 * longer than the configured ceiling (Req 14.1).
 */
const DEFAULT_MAX_TTL_MS = 60000;
/**
 * Reads the configured maximum cache TTL in milliseconds from the environment,
 * falling back to {@link DEFAULT_MAX_TTL_MS} when unset or invalid.
 */
const getMaxCacheTtlMs = () => {
    const raw = (0, get_env_1.getEnv)('CACHE_MAX_TTL_MS', String(DEFAULT_MAX_TTL_MS));
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_MAX_TTL_MS;
    }
    return Math.floor(parsed);
};
exports.getMaxCacheTtlMs = getMaxCacheTtlMs;
/**
 * In-process {@link CacheStore} backed by a `Map`. Suitable for a single-node
 * deployment; the interface keeps it Redis-compatible for future extension.
 */
class InMemoryCacheStore {
    constructor(maxTtlMs = (0, exports.getMaxCacheTtlMs)()) {
        this.maxTtlMs = maxTtlMs;
        this.store = new Map();
        /** key -> tags is captured per entry; tag -> keys index speeds invalidation. */
        this.tagIndex = new Map();
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return undefined;
        }
        if (entry.expiresAt <= Date.now()) {
            // Expired entries are misses; evict so they don't linger.
            this.del(key);
            return undefined;
        }
        return { value: entry.value, expiresAt: entry.expiresAt };
    }
    set(key, value, ttlMs, tags = []) {
        // Bound the effective TTL to the configured maximum (Req 14.1).
        const safeTtl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : this.maxTtlMs;
        const effectiveTtl = Math.min(safeTtl, this.maxTtlMs);
        const expiresAt = Date.now() + effectiveTtl;
        // Replacing an existing key: detach it from its previous tags first.
        this.removeFromTagIndex(key);
        const uniqueTags = Array.from(new Set(tags));
        this.store.set(key, { value, expiresAt, tags: uniqueTags });
        for (const tag of uniqueTags) {
            let keys = this.tagIndex.get(tag);
            if (!keys) {
                keys = new Set();
                this.tagIndex.set(tag, keys);
            }
            keys.add(key);
        }
    }
    del(key) {
        this.removeFromTagIndex(key);
        this.store.delete(key);
    }
    delByTag(tag) {
        var _a;
        const keys = this.tagIndex.get(tag);
        if (!keys) {
            return;
        }
        for (const key of keys) {
            const entry = this.store.get(key);
            this.store.delete(key);
            // Detach this key from any other tags it carried.
            if (entry) {
                for (const otherTag of entry.tags) {
                    if (otherTag === tag) {
                        continue;
                    }
                    (_a = this.tagIndex.get(otherTag)) === null || _a === void 0 ? void 0 : _a.delete(key);
                }
            }
        }
        this.tagIndex.delete(tag);
    }
    clear() {
        this.store.clear();
        this.tagIndex.clear();
    }
    removeFromTagIndex(key) {
        const existing = this.store.get(key);
        if (!existing) {
            return;
        }
        for (const tag of existing.tags) {
            const keys = this.tagIndex.get(tag);
            if (keys) {
                keys.delete(key);
                if (keys.size === 0) {
                    this.tagIndex.delete(tag);
                }
            }
        }
    }
}
exports.InMemoryCacheStore = InMemoryCacheStore;
/**
 * Shared application-wide cache instance.
 */
exports.cacheStore = new InMemoryCacheStore();
