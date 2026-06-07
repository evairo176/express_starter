import fc from 'fast-check';

/**
 * Newsletter module property-based tests (Properties 23-24).
 *
 * These tests exercise the real `NewsletterService` (`subscribe` and
 * `unsubscribe`) against an in-memory fake of the Prisma
 * `db.newsletterSubscription` methods the service uses (`findUnique`,
 * `create`, `update`). The fake mirrors the documented Prisma semantics the
 * service relies on:
 *   - `findUnique` resolves a row matching `where.email` or
 *     `where.unsubscribeToken`, else null. It can be configured to THROW on a
 *     given call to simulate a lookup failure (Req 8.2).
 *   - `create` enforces email uniqueness, throwing on a duplicate email to
 *     mirror a unique-constraint violation (race condition).
 *   - `update` mutates the row matched by `where.unsubscribeToken`.
 *
 * The fake is installed via jest.mock and is driven through accessors exposed
 * on the mocked `db` (`__reset`, `__all`, `__setThrowOnFind`).
 *
 * The logger is mocked to keep test output clean and avoid filesystem writes.
 */

jest.mock('../src/libs/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../src/database/database', () => {
  interface Row {
    id: string;
    email: string;
    unsubscribeToken: string;
    isActive: boolean;
  }

  const store: { rows: Row[]; throwOnFind: boolean; seq: number } = {
    rows: [],
    throwOnFind: false,
    seq: 0,
  };

  return {
    db: {
      __reset: () => {
        store.rows = [];
        store.throwOnFind = false;
        store.seq = 0;
      },
      __all: () => store.rows,
      __setThrowOnFind: (v: boolean) => {
        store.throwOnFind = v;
      },
      newsletterSubscription: {
        findUnique: jest.fn(async ({ where }: any) => {
          if (store.throwOnFind) {
            throw new Error('simulated lookup failure');
          }
          const found = store.rows.find(
            (r) =>
              (where.email !== undefined && r.email === where.email) ||
              (where.unsubscribeToken !== undefined &&
                r.unsubscribeToken === where.unsubscribeToken),
          );
          return found ?? null;
        }),
        create: jest.fn(async ({ data }: any) => {
          // Enforce email uniqueness like the DB's unique constraint.
          if (store.rows.some((r) => r.email === data.email)) {
            throw new Error('Unique constraint failed on the fields: (email)');
          }
          const row: Row = {
            id: `nl-${store.seq++}`,
            email: data.email,
            unsubscribeToken: data.unsubscribeToken,
            isActive: data.isActive ?? true,
          };
          store.rows.push(row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = store.rows.find(
            (r) => r.unsubscribeToken === where.unsubscribeToken,
          );
          if (!row) {
            throw new Error('Record to update not found');
          }
          Object.assign(row, data);
          return row;
        }),
      },
    },
  };
});

import { db } from '../src/database/database';
import { NewsletterService } from '../src/modules/newsletter/newsletter.service';

const mockDb = db as unknown as {
  __reset: () => void;
  __all: () => Array<{ email: string; unsubscribeToken: string; isActive: boolean }>;
  __setThrowOnFind: (v: boolean) => void;
};
const service = new NewsletterService();

describe('Newsletter module property-based tests', () => {
  beforeEach(() => {
    mockDb.__reset();
  });

  // Feature: portfolio-upgrade, Property 23: Newsletter subscription is idempotent.
  // For any valid email subscribed any number of times, exactly one active
  // subscription exists and every submission returns success, including when
  // the existing-subscription lookup fails.
  // Validates: Requirements 8.1, 8.2
  it('Property 23: subscription is idempotent (incl. lookup failures)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        // One boolean per subscribe attempt: whether findUnique throws.
        fc.array(fc.boolean(), { minLength: 1, maxLength: 8 }),
        async (email, throwFlags) => {
          mockDb.__reset();

          // Guarantee at least one attempt whose lookup succeeds so the
          // subscription can actually be created; remaining attempts may throw
          // on lookup to exercise the idempotent failure path (Req 8.2).
          const flags = [...throwFlags];
          flags[0] = false;

          for (const shouldThrow of flags) {
            mockDb.__setThrowOnFind(shouldThrow);
            // Every submission resolves success (must not reject). If it
            // rejected, this await would throw and fail the property.
            await service.subscribe({ email });
          }

          mockDb.__setThrowOnFind(false);

          // Exactly one subscription exists for the email, and it is active.
          const matches = mockDb.__all().filter((r) => r.email === email);
          expect(matches).toHaveLength(1);
          expect(matches[0].isActive).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 24: Newsletter unsubscribe round-trip.
  // For any subscription, unsubscribing with its valid token marks the
  // subscription inactive and returns success.
  // Validates: Requirements 8.4
  it('Property 24: unsubscribe round-trip marks subscription inactive', async () => {
    await fc.assert(
      fc.asyncProperty(fc.emailAddress(), async (email) => {
        mockDb.__reset();
        mockDb.__setThrowOnFind(false);

        const created = await service.subscribe({ email });
        expect(created).not.toBeNull();
        const token = (created as { unsubscribeToken: string }).unsubscribeToken;

        const result = await service.unsubscribe(token);

        // Returns success (a non-null updated record).
        expect(result).not.toBeNull();
        expect((result as { isActive: boolean }).isActive).toBe(false);

        // Persisted state reflects the inactive subscription.
        const stored = mockDb
          .__all()
          .find((r) => r.unsubscribeToken === token);
        expect(stored).toBeDefined();
        expect(stored!.isActive).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
