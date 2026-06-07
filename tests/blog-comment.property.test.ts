import fc from 'fast-check';

/**
 * Blog comment property-based tests (Properties 13, 14, 15, 16) plus the
 * comment-deletion ordering unit test (Task 8.6).
 *
 * Service-level properties (13, 14, 16) and the deletion ordering test use the
 * shared in-memory Prisma `db` fake. The Zod schema properties (15, 16) test
 * `CreateBlogCommentSchema` directly and need no DB.
 *
 * Note: comment moderation defaults to enabled (COMMENT_MODERATION env, default
 * "true"), so created comments start unapproved.
 */

jest.mock('../src/database/database', () =>
  require('./helpers/blogDbMock').createBlogDbMock(),
);

import { db } from '../src/database/database';
import { BlogCommentService } from '../src/modules/blogComment/blogComment.service';
import { CreateBlogCommentSchema } from '../src/common/zod/blog-comment.schema';
import { config } from '../src/config/app.config';

const mockDb = db as any;
const commentService = new BlogCommentService();

function seedSinglePost() {
  mockDb.__seed({
    posts: [
      {
        id: 'post-1',
        slug: 'post-1',
        title: 'T',
        excerpt: null,
        content: 'c',
        isPublished: true,
        totalViews: 0,
        categoryId: null,
        createdAt: new Date(2020, 0, 1).toISOString(),
        updatedAt: new Date(2020, 0, 1).toISOString(),
      },
    ],
  });
}

// Generators constrained to the valid input space. The email generator builds
// simple alphanumeric local/domain parts so the value is always accepted by
// Zod's stricter `.email()` (fast-check's emailAddress() can yield RFC-valid
// but Zod-rejected addresses, which is irrelevant to the body-length property).
const validNameArb = fc.string({ minLength: 1, maxLength: 40 });
const alnum = fc.stringMatching(/^[a-z0-9]{1,12}$/);
const validEmailArb = fc
  .tuple(alnum, alnum, fc.constantFrom('com', 'org', 'io'))
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
const validBodyArb = fc.string({ minLength: 1, maxLength: 2000 });

describe('Blog comment property-based tests', () => {
  // Feature: portfolio-upgrade, Property 13: Valid comments round-trip and start unapproved
  // Validates: Requirements 4.1, 4.7
  it('Property 13: valid comments round-trip and start unapproved (moderation enabled)', async () => {
    // This property assumes moderation is enabled.
    expect(config.COMMENT_MODERATION).toBe(true);

    await fc.assert(
      fc.asyncProperty(
        validNameArb,
        validEmailArb,
        validBodyArb,
        async (name, email, body) => {
          seedSinglePost();

          const created: any = await commentService.create('post-1', {
            name,
            email,
            body,
          });

          // Persisted, returned, associated with the post, and unapproved.
          expect(created).not.toBeNull();
          expect(created.blogPostId).toBe('post-1');
          expect(created.name).toBe(name);
          expect(created.email).toBe(email);
          expect(created.body).toBe(body);
          expect(created.isApproved).toBe(false);

          const stored = mockDb.__store.comments.find(
            (c: any) => c.id === created.id,
          );
          expect(stored).toBeDefined();
          expect(stored.isApproved).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 14: Public comments are exactly the approved set, newest-first
  // Validates: Requirements 4.2, 4.7
  it('Property 14: public comments are exactly the approved set, newest-first', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            isApproved: fc.boolean(),
            // Distinct day offsets to give deterministic createdAt ordering.
            dayOffset: fc.integer({ min: 0, max: 365 }),
          }),
          { minLength: 0, maxLength: 15 },
        ),
        async (commentSpecs) => {
          const comments = commentSpecs.map((s, i) => ({
            id: `comment-${i}`,
            blogPostId: 'post-1',
            name: `n-${i}`,
            email: `e${i}@example.com`,
            body: `b-${i}`,
            isApproved: s.isApproved,
            createdAt: new Date(2020, 0, 1, 0, 0, i, s.dayOffset).toISOString(),
          }));
          // Add some noise belonging to another post to ensure scoping.
          comments.push({
            id: 'other',
            blogPostId: 'post-2',
            name: 'x',
            email: 'x@example.com',
            body: 'x',
            isApproved: true,
            createdAt: new Date(2021, 0, 1).toISOString(),
          });

          mockDb.__seed({
            posts: [
              {
                id: 'post-1',
                slug: 'post-1',
                isPublished: true,
                totalViews: 0,
                categoryId: null,
                createdAt: new Date(2020, 0, 1).toISOString(),
                updatedAt: new Date(2020, 0, 1).toISOString(),
              },
            ],
            comments,
          });

          const result: any[] = (await commentService.listApprovedBySlug(
            'post-1',
          )) as any[];

          // Exactly the approved comments for post-1.
          const expectedIds = comments
            .filter((c) => c.blogPostId === 'post-1' && c.isApproved)
            .map((c) => c.id)
            .sort();
          const actualIds = result.map((c) => c.id).sort();
          expect(actualIds).toEqual(expectedIds);

          // Newest-first ordering by createdAt descending.
          for (let i = 1; i < result.length; i++) {
            const prev = new Date(result[i - 1].createdAt).getTime();
            const cur = new Date(result[i].createdAt).getTime();
            expect(prev).toBeGreaterThanOrEqual(cur);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 15: Comment body length validation
  // Validates: Requirements 4.3, 4.4
  it('Property 15: empty or >2000 body rejected; whitespace-only 1..2000 accepted', () => {
    // Empty body is rejected.
    fc.assert(
      fc.property(validNameArb, validEmailArb, (name, email) => {
        const res = CreateBlogCommentSchema.safeParse({ name, email, body: '' });
        expect(res.success).toBe(false);
      }),
      { numRuns: 100 },
    );

    // Body longer than 2000 chars is rejected.
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        fc.integer({ min: 2001, max: 4000 }),
        (name, email, len) => {
          const body = 'a'.repeat(len);
          const res = CreateBlogCommentSchema.safeParse({ name, email, body });
          expect(res.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );

    // Whitespace-only body of length 1..2000 is accepted (not trimmed).
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        fc.integer({ min: 1, max: 2000 }),
        fc.constantFrom(' ', '\t', '\n'),
        (name, email, len, ws) => {
          const body = ws.repeat(len);
          const res = CreateBlogCommentSchema.safeParse({ name, email, body });
          expect(res.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 16: Invalid email is rejected
  // Validates: Requirements 4.5, 8.3
  it('Property 16: malformed email is rejected by CreateBlogCommentSchema', () => {
    fc.assert(
      fc.property(
        validNameArb,
        // Strings without an "@" are guaranteed invalid emails.
        fc.string().filter((s) => !s.includes('@')),
        validBodyArb,
        (name, email, body) => {
          const res = CreateBlogCommentSchema.safeParse({ name, email, body });
          expect(res.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Task 8.6 (unit): comment deletion returns success only after deletion resolves.
  // Validates: Requirements 4.6
  it('delete awaits db.blogComment.delete before resolving', async () => {
    seedSinglePost();
    mockDb.__store.comments.push({
      id: 'comment-1',
      blogPostId: 'post-1',
      name: 'n',
      email: 'e@example.com',
      body: 'b',
      isApproved: true,
      createdAt: new Date(2020, 0, 1).toISOString(),
    });

    const order: string[] = [];

    // Make the underlying delete resolve only after a tick, recording order.
    (db.blogComment.delete as jest.Mock).mockImplementationOnce(
      ({ where }: any) =>
        new Promise((resolve) => {
          setTimeout(() => {
            order.push('db-delete-resolved');
            const idx = mockDb.__store.comments.findIndex(
              (c: any) => c.id === where.id,
            );
            const [removed] = mockDb.__store.comments.splice(idx, 1);
            resolve(removed);
          }, 10);
        }),
    );

    await commentService.delete('comment-1');
    order.push('service-delete-returned');

    // The service must not return before the db delete resolved.
    expect(order).toEqual(['db-delete-resolved', 'service-delete-returned']);
    expect(
      mockDb.__store.comments.find((c: any) => c.id === 'comment-1'),
    ).toBeUndefined();
  });
});
