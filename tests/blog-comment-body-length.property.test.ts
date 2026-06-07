import fc from 'fast-check';

import { CreateBlogCommentSchema } from '../src/common/zod/blog-comment.schema';

/**
 * Blog comment body length validation property-based test (Property 15).
 *
 * Comment body validation is enforced by `CreateBlogCommentSchema`
 * (`body: z.string().min(1).max(2000)`), which the `validate(schema)`
 * middleware runs before any side effects; a failed parse causes the request
 * to be rejected with a 400 validation error, while a successful parse lets the
 * request proceed (acceptance).
 *
 * This test exercises the schema directly (the source of truth for the 400
 * decision):
 *   - Any body that is empty OR exceeds 2000 characters is rejected.
 *   - Any whitespace-only body whose length is between 1 and 2000 characters
 *     is accepted (the body is NOT trimmed before the length check).
 *
 * Name and email are held to fixed valid values so the only variable under
 * test is the body.
 */

// A valid name/email pair so the schema's success/failure is driven solely by
// the body field under test.
const VALID_NAME = 'Jane Doe';
const VALID_EMAIL = 'jane@example.com';

const parseBody = (body: string) =>
  CreateBlogCommentSchema.safeParse({
    name: VALID_NAME,
    email: VALID_EMAIL,
    body,
  });

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

// Whitespace characters used to build whitespace-only bodies.
const whitespaceCharArb = fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v');

// Whitespace-only body of length 1..2000 (inclusive boundaries exercised).
const whitespaceBodyArb = fc
  .array(whitespaceCharArb, { minLength: 1, maxLength: 2000 })
  .map((chars) => chars.join(''));

// Invalid body: empty string, OR any string longer than 2000 characters.
const emptyBodyArb = fc.constant('');
const tooLongBodyArb = fc
  .string({ minLength: 2001, maxLength: 2600 })
  .filter((s) => s.length > 2000);
const invalidBodyArb = fc.oneof(emptyBodyArb, tooLongBodyArb);

describe('Blog comment body length validation property-based tests', () => {
  // Feature: portfolio-upgrade, Property 15: Comment body length validation.
  // For any comment body that is empty or exceeds 2000 characters, submission
  // is rejected with a 400 validation error.
  // Validates: Requirements 4.3, 4.4
  it('Property 15: empty or over-length comment bodies are rejected', () => {
    fc.assert(
      fc.property(invalidBodyArb, (body) => {
        const result = parseBody(body);
        expect(result.success).toBe(false);
        // The failure is attributable to the body field's length constraint.
        if (!result.success) {
          const bodyIssue = result.error.issues.some((issue) =>
            issue.path.includes('body'),
          );
          expect(bodyIssue).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 15: Comment body length validation.
  // For any whitespace-only body whose length is between 1 and 2000 characters,
  // submission is accepted (the body is not trimmed before the length check).
  // Validates: Requirements 4.3, 4.4
  it('Property 15: whitespace-only bodies of length 1..2000 are accepted', () => {
    fc.assert(
      fc.property(whitespaceBodyArb, (body) => {
        expect(body.length).toBeGreaterThanOrEqual(1);
        expect(body.length).toBeLessThanOrEqual(2000);

        const result = parseBody(body);
        expect(result.success).toBe(true);
        if (result.success) {
          // The whitespace body round-trips unchanged (not trimmed).
          expect(result.data.body).toBe(body);
        }
      }),
      { numRuns: 100 },
    );
  });
});
