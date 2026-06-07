import { getEnv } from '../utils/get-env';

/**
 * Default maximum time-to-live (in milliseconds) applied to any cache entry.
 * Effective TTLs are bounded by this value so a single entry can never live
 * longer than the configured ceiling (Req 14.1).
 */
const DEFAULT_MAX_TTL_MS = 60_000;

/**
 * Reads the configured maximum cache TTL in milliseconds from the environment,
 * falling back to {@link DEFAULT_MAX_TTL_MS} when unset or invalid.
 */
export const getMaxCacheTtlMs = (): number => {
  const raw = getEnv('CACHE_MAX_TTL_MS', String(DEFAULT_MAX_TTL_MS));
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_TTL_MS;
  }
  return Math.floor(parsed);
};

/**
 * A single cached value together with its absolute expiry timestamp (epoch ms).
 */
export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

/**
 * TTL-based cache abstraction. The interface mirrors the small surface of a
 * Redis-style store (get/set with expiry + tag invalidation) so the in-process
 * implementation below can be swapped for a distributed backend later without
 * touching callers.
 */
export interface CacheStore {
  /**
   * Returns the live entry for `key`, or `undefined` when the key is absent or
   * its entry has expired. Expired entries are treated as misses and evicted.
   */
  get<T = unknown>(key: string): CacheEntry<T> | undefined;

  /**
   * Stores `value` under `key` for `ttlMs` milliseconds. The effective TTL is
   * bounded to the configured maximum (Req 14.1). Optional `tags` associate the
   * entry with one or more invalidation groups (Req 14.3).
   */
  set<T = unknown>(key: string, value: T, ttlMs: number, tags?: string[]): void;

  /**
   * Removes a single entry by key.
   */
  del(key: string): void;

  /**
   * Removes every entry associated with `tag` (Req 14.3).
   */
  delByTag(tag: string): void;

  /**
   * Removes all entries.
   */
  clear(): void;
}

interface StoredEntry {
  value: unknown;
  expiresAt: number;
  tags: string[];
}

/**
 * In-process {@link CacheStore} backed by a `Map`. Suitable for a single-node
 * deployment; the interface keeps it Redis-compatible for future extension.
 */
export class InMemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, StoredEntry>();

  /** key -> tags is captured per entry; tag -> keys index speeds invalidation. */
  private readonly tagIndex = new Map<string, Set<string>>();

  constructor(private readonly maxTtlMs: number = getMaxCacheTtlMs()) {}

  get<T = unknown>(key: string): CacheEntry<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      // Expired entries are misses; evict so they don't linger.
      this.del(key);
      return undefined;
    }
    return { value: entry.value as T, expiresAt: entry.expiresAt };
  }

  set<T = unknown>(
    key: string,
    value: T,
    ttlMs: number,
    tags: string[] = [],
  ): void {
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
        keys = new Set<string>();
        this.tagIndex.set(tag, keys);
      }
      keys.add(key);
    }
  }

  del(key: string): void {
    this.removeFromTagIndex(key);
    this.store.delete(key);
  }

  delByTag(tag: string): void {
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
          this.tagIndex.get(otherTag)?.delete(key);
        }
      }
    }
    this.tagIndex.delete(tag);
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }

  private removeFromTagIndex(key: string): void {
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

/**
 * Shared application-wide cache instance.
 */
export const cacheStore: CacheStore = new InMemoryCacheStore();
