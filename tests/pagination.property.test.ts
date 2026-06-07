import fc from 'fast-check';
import {
  PaginationQuerySchema,
  buildPaginationMetadata,
} from '../src/common/utils/pagination';

describe('Pagination property-based tests', () => {
  // Feature: portfolio-upgrade, Property 8: Pagination metadata is correct and consistent. For any total count, page, and limit, the returned Pagination_Metadata contains total, page, limit, totalPages, hasNext, and hasPrev where totalPages = ceil(total/limit), hasNext = page < totalPages, and hasPrev = page > 1; when page or limit is omitted, defaults of 1 and 10 are applied.
  // Validates: Requirements 2.7, 15.1, 15.2
  it('Property 8: pagination metadata is correct and consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        fc.integer({ min: 1, max: 1_000 }),
        (total, page, limit) => {
          const meta = buildPaginationMetadata(total, page, limit);

          const expectedTotalPages = Math.ceil(total / limit);

          expect(meta.total).toBe(total);
          expect(meta.page).toBe(page);
          expect(meta.limit).toBe(limit);
          expect(meta.totalPages).toBe(expectedTotalPages);
          expect(meta.hasNext).toBe(page < expectedTotalPages);
          expect(meta.hasPrev).toBe(page > 1);
        }
      ),
      { numRuns: 100 }
    );

    // Defaults: when page and/or limit are omitted, defaults of 1 and 10 apply.
    fc.assert(
      fc.property(
        fc.record({
          page: fc.option(fc.integer({ min: 1, max: 10_000 }), {
            nil: undefined,
          }),
          limit: fc.option(fc.integer({ min: 1, max: 1_000 }), {
            nil: undefined,
          }),
        }),
        ({ page, limit }) => {
          const input: Record<string, unknown> = {};
          if (page !== undefined) input.page = page;
          if (limit !== undefined) input.limit = limit;

          const result = PaginationQuerySchema.parse(input);

          expect(result.page).toBe(page === undefined ? 1 : page);
          expect(result.limit).toBe(limit === undefined ? 10 : limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: portfolio-upgrade, Property 9: Out-of-range page yields empty data, not an error. For any list request whose page exceeds totalPages, the response returns an empty data list together with valid Pagination_Metadata rather than an error.
  // Validates: Requirements 15.4
  it('Property 9: out-of-range page yields empty data, not an error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        (total, limit, pageOffset) => {
          const totalPages = Math.ceil(total / limit);
          // Construct a page strictly greater than totalPages (out of range).
          const page = totalPages + pageOffset;

          let meta: ReturnType<typeof buildPaginationMetadata> | undefined;
          expect(() => {
            meta = buildPaginationMetadata(total, page, limit);
          }).not.toThrow();

          // Valid metadata returned with no next page.
          expect(meta).toBeDefined();
          expect(meta!.hasNext).toBe(false);

          // The computed slice is empty: skip >= total means no rows on this page.
          const skip = (page - 1) * limit;
          expect(skip).toBeGreaterThanOrEqual(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: portfolio-upgrade, Property 10: Invalid pagination input is rejected. For any page or limit value that is not a positive integer, the list endpoint responds with a 400 validation error.
  // Validates: Requirements 2.8, 15.3
  it('Property 10: invalid pagination input is rejected', () => {
    const invalidValue = fc.oneof(
      fc.integer({ min: -1_000_000, max: 0 }), // zero and negatives
      fc.double({ min: 0.0001, max: 1000, noInteger: true, noNaN: true }), // non-integers
      fc
        .string()
        .filter((s) => Number.isNaN(Number(s)) || s.trim() === ''), // non-numeric / blank strings
      fc.constantFrom('abc', 'NaN', '1.5e', '--5', 'ten', '')
    );

    fc.assert(
      fc.property(
        invalidValue,
        fc.boolean(),
        (badValue, applyToPage) => {
          // Put the invalid value on page or limit; keep the other one valid.
          const input = applyToPage
            ? { page: badValue, limit: 10 }
            : { page: 1, limit: badValue };

          const result = PaginationQuerySchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
