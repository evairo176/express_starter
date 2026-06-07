import fc from 'fast-check';

/**
 * Testimonial module property-based tests (Properties 25-26).
 *
 * These tests exercise the real `TestimonialService` (`create`,
 * `findPublished`) against an in-memory fake of the Prisma `db.testimonial`
 * methods the service uses (`create`, `findMany`). The fake mirrors the
 * documented Prisma semantics the service relies on: `create` assigns an id /
 * timestamps and persists the row, `findMany` honors the
 * `where: { isPublished: true }` filter and `orderBy: { createdAt: 'desc' }`.
 *
 * Validation (Property 25, second clause) is asserted directly against
 * `CreateTestimonialSchema`, which is the contract the route uses to reject
 * payloads with a missing required field (400) before the service is reached.
 */

jest.mock('../src/database/database', () => {
  const store: { items: any[] } = { items: [] };
  let seq = 0;

  function matchWhere(row: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      if (row[key] !== where[key]) return false;
    }
    return true;
  }

  return {
    db: {
      __setTestimonials: (items: any[]) => {
        store.items = items;
      },
      __reset: () => {
        store.items = [];
        seq = 0;
      },
      testimonial: {
        create: jest.fn(async ({ data }: any) => {
          const row = {
            id: `t-${seq++}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          store.items.push(row);
          return row;
        }),
        findMany: jest.fn(async ({ where, orderBy }: any) => {
          let rows = store.items.filter((r) => matchWhere(r, where));
          if (orderBy?.createdAt === 'desc') {
            rows = [...rows].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          }
          return rows;
        }),
      },
    },
  };
});

import { db } from '../src/database/database';
import { TestimonialService } from '../src/modules/testimonial/testimonial.service';
import { CreateTestimonialSchema } from '../src/common/zod/testimonial.schema';

const mockDb = db as unknown as {
  __setTestimonials: (items: any[]) => void;
  __reset: () => void;
};
const service = new TestimonialService();

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

// Non-empty string (schema requires min(1)); exercise non-ASCII + whitespace.
const nonEmptyArb = fc.oneof(
  fc.string({ minLength: 1 }).filter((s) => s.length >= 1),
  fc.constantFrom('Jane Doe', 'CTO', 'Great product', 'José', '日本語', '  x  '),
);

const validPayloadArb = fc.record({
  authorName: nonEmptyArb,
  authorRole: nonEmptyArb,
  quote: nonEmptyArb,
  isPublished: fc.option(fc.boolean(), { nil: undefined }),
});

describe('Testimonial module property-based tests', () => {
  beforeEach(() => {
    mockDb.__reset();
  });

  // Feature: portfolio-upgrade, Property 25: For any testimonial with author name, author role, and quote, creation persists and returns the record; for any testimonial payload missing a required field, the service responds with 400.
  // Validates: Requirements 9.1, 9.4
  it('Property 25: testimonial create round-trip and validation', async () => {
    // Clause 1: valid create persists and returns the record.
    await fc.assert(
      fc.asyncProperty(validPayloadArb, async (payload) => {
        mockDb.__reset();

        const created = await service.create(payload as any);

        expect(created.authorName).toBe(payload.authorName);
        expect(created.authorRole).toBe(payload.authorRole);
        expect(created.quote).toBe(payload.quote);
        expect(created.isPublished).toBe(payload.isPublished ?? false);
        expect(created.id).toBeDefined();
      }),
      { numRuns: 100 },
    );

    // Clause 2: payload missing a required field is rejected (-> 400).
    await fc.assert(
      fc.property(
        validPayloadArb,
        fc.constantFrom('authorName', 'authorRole', 'quote'),
        (payload, missingField) => {
          const incomplete: Record<string, unknown> = { ...payload };
          delete incomplete[missingField];

          const result = CreateTestimonialSchema.safeParse(incomplete);
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 26: For any set of testimonials, the public testimonial list contains only published testimonials.
  // Validates: Requirements 9.2
  it('Property 26: public testimonials are only published ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            authorName: nonEmptyArb,
            authorRole: nonEmptyArb,
            quote: nonEmptyArb,
            isPublished: fc.boolean(),
          }),
          { minLength: 0, maxLength: 15 },
        ),
        async (specs) => {
          mockDb.__reset();
          const fixtures = specs.map((s, i) => ({
            id: `t-${i}`,
            authorName: s.authorName,
            authorRole: s.authorRole,
            quote: s.quote,
            isPublished: s.isPublished,
            createdAt: new Date(2020, 0, 1 + i),
            updatedAt: new Date(2020, 0, 1 + i),
          }));
          mockDb.__setTestimonials(fixtures);

          const published = await service.findPublished();

          // Every returned testimonial is published.
          for (const t of published) {
            expect(t.isPublished).toBe(true);
          }

          // Independent oracle: exact set of published ids.
          const expected = fixtures
            .filter((t) => t.isPublished)
            .map((t) => t.id)
            .sort();
          const actual = published.map((t: any) => t.id).sort();
          expect(actual).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});
