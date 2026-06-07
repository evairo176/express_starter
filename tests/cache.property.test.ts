import fc from 'fast-check';
import { InMemoryCacheStore } from '../src/common/cache/cache';

// Feature: portfolio-upgrade, Property 35: Cache TTL is bounded and serves without the database.
// For any requested ttlMs (including values exceeding the max) and any value, after set the
// entry's effective expiresAt - now never exceeds the configured max TTL; and while valid, get
// returns the stored value.
// Validates: Requirements 14.1, 14.2
describe('Property 35: Cache TTL is bounded and serves without the database', () => {
  it('bounds effective TTL to the configured max and serves the stored value while valid', () => {
    fc.assert(
      fc.property(
        // A known maxTtlMs so the bound can be asserted deterministically. Kept >= 1000ms so the
        // entry reliably stays valid across the synchronous set/get within a single test run.
        fc.integer({ min: 1000, max: 60_000 }),
        // Requested TTL spanning below, at, and far above the max (plus invalid/zero values).
        fc.oneof(
          fc.integer({ min: -1000, max: 1_000_000 }),
          fc.constant(0),
          fc.constant(Number.POSITIVE_INFINITY),
          fc.constant(Number.NaN),
        ),
        fc.string(),
        // Arbitrary value to store and retrieve.
        fc.anything(),
        (maxTtlMs, requestedTtlMs, key, value) => {
          const store = new InMemoryCacheStore(maxTtlMs);

          store.set(key, value, requestedTtlMs);
          const after = Date.now();

          const entry = store.get(key);

          // Entry must be present (still valid) immediately after set.
          expect(entry).toBeDefined();

          // The effective TTL must never exceed the configured max. expiresAt was computed as
          // setTime + effectiveTtl where setTime <= after and effectiveTtl <= maxTtlMs, so
          // expiresAt - after <= maxTtlMs holds deterministically regardless of clock advance.
          expect(entry!.expiresAt - after).toBeLessThanOrEqual(maxTtlMs);
          // And the entry must not already be expired at the moment of retrieval.
          expect(entry!.expiresAt).toBeGreaterThan(after - 1);

          // While valid, get returns exactly the stored value.
          expect(entry!.value).toBe(value);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// Feature: portfolio-upgrade, Property 36: Cache invalidation by tag.
// For any set of entries each assigned arbitrary tags, calling delByTag(tag) removes exactly the
// entries carrying that tag and leaves entries without it intact.
// Validates: Requirements 14.3
describe('Property 36: Cache invalidation by tag', () => {
  it('removes exactly the entries carrying the invalidated tag and leaves others intact', () => {
    fc.assert(
      fc.property(
        // A set of entries, each with a unique key, a value, and an arbitrary set of tags.
        fc.uniqueArray(
          fc.record({
            key: fc.string({ minLength: 1 }),
            value: fc.anything(),
            tags: fc.uniqueArray(
              fc.constantFrom('a', 'b', 'c', 'd', 'e'),
              { maxLength: 5 },
            ),
          }),
          { selector: (e) => e.key, maxLength: 20 },
        ),
        // The tag to invalidate.
        fc.constantFrom('a', 'b', 'c', 'd', 'e'),
        (entries, tagToDelete) => {
          // Use a large max TTL so nothing expires during the test.
          const store = new InMemoryCacheStore(60_000);

          for (const { key, value, tags } of entries) {
            store.set(key, value, 60_000, tags);
          }

          store.delByTag(tagToDelete);

          for (const { key, value, tags } of entries) {
            const entry = store.get(key);
            if (tags.includes(tagToDelete)) {
              // Entries carrying the tag must be removed.
              expect(entry).toBeUndefined();
            } else {
              // Entries without the tag must remain intact with their original value.
              expect(entry).toBeDefined();
              expect(entry!.value).toBe(value);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
