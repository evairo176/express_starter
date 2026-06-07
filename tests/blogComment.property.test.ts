import fc from 'fast-check';

/**
 * Blog comment module property-based tests (Property 14).
 *
 * This test exercises the real `BlogCommentService.listApprovedBySlug` against
 * an in-memory fake of the Prisma `db` methods the service uses
 * (`blogPost.findUnique`, `blogComment.findMany`). The fake mirrors the
 * documented Prisma semantics the service relies on: `findUnique` resolves a
 * post id by slug, and `findMany` honors the
 * `where: { blogPostId, isApproved: true }` filter and
 * `orderBy: { createdAt: 'desc' }` (newest-first).
 */

jest.mock('../src/database/database', () => {
  const store: { posts: any[]; comments: any[] } = { posts: [], comments: [] };

  return {
    db: {
      __setData: (posts: any[], comments: any[]) => {
        store.posts = posts;
        store.comments = comments;
      },
      __reset: () => {
        store.posts = [];
        store.comments = [];
      },
      blogPost: {
        findUnique: jest.fn(async ({ where }: any) => {
          const post = store.posts.find((p) => p.slug === where.slug);
          return post ? { id: post.id } : null;
        }),
      },
      blogComment: {
        findMany: jest.fn(async ({ where, orderBy }: any) => {
          let rows = store.comments.filter((c) => {
            if (where?.blogPostId !== undefined && c.blogPostId !== where.blogPostId)
              return false;
            if (where?.isApproved !== undefined && c.isApproved !== where.isApproved)
              return false;
            return true;
          });
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
import { BlogCommentService } from '../src/modules/blogComment/blogComment.service';

const mockDb = db as unknown as {
  __setData: (posts: any[], comments: any[]) => void;
  __reset: () => void;
};
const service = new BlogCommentService();

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const nonEmptyArb = fc.oneof(
  fc.string({ minLength: 1 }).filter((s) => s.length >= 1),
  fc.constantFrom('Alice', 'Bob', 'José', '日本語', '  spaced  '),
);

// A comment spec for a single post: approval flag + a distinct creation time.
const commentSpecArb = fc.record({
  name: nonEmptyArb,
  email: fc.emailAddress(),
  body: fc.string({ minLength: 1, maxLength: 2000 }),
  isApproved: fc.boolean(),
});

describe('Blog comment module property-based tests', () => {
  beforeEach(() => {
    mockDb.__reset();
  });

  // Feature: portfolio-upgrade, Property 14: Public comments are exactly the approved set, newest-first.
  // For any post with a mix of approved and unapproved comments, the public comments
  // response contains exactly the approved comments for that post, ordered by creation
  // time in descending order.
  // Validates: Requirements 4.2, 4.7
  it('Property 14: public comments are exactly the approved set, newest-first', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(commentSpecArb, { minLength: 0, maxLength: 20 }),
        // Distinct timestamps for the post's comments and a couple of
        // "other post" comments to confirm cross-post isolation.
        fc.array(commentSpecArb, { minLength: 0, maxLength: 5 }),
        async (specs, otherSpecs) => {
          mockDb.__reset();

          const slug = 'target-post';
          const postId = 'post-target';
          const otherPostId = 'post-other';

          // Build comments for the target post with strictly distinct
          // creation times so descending order is unambiguous.
          const targetComments = specs.map((s, i) => ({
            id: `c-${i}`,
            blogPostId: postId,
            name: s.name,
            email: s.email,
            body: s.body,
            isApproved: s.isApproved,
            createdAt: new Date(2020, 0, 1, 0, 0, i),
          }));

          // Comments belonging to a different post must never appear.
          const otherComments = otherSpecs.map((s, i) => ({
            id: `o-${i}`,
            blogPostId: otherPostId,
            name: s.name,
            email: s.email,
            body: s.body,
            // Always approved to ensure they would surface if filtering by
            // post were broken.
            isApproved: true,
            createdAt: new Date(2021, 0, 1, 0, 0, i),
          }));

          mockDb.__setData(
            [
              { id: postId, slug },
              { id: otherPostId, slug: 'other-post' },
            ],
            [...targetComments, ...otherComments],
          );

          const result = await service.listApprovedBySlug(slug);
          expect(result).not.toBeNull();
          const returned = result as any[];

          // Independent oracle: exactly the approved comments for this post.
          const expectedApproved = targetComments.filter((c) => c.isApproved);

          // 1. Same set of ids.
          const expectedIds = expectedApproved.map((c) => c.id).sort();
          const actualIds = returned.map((c) => c.id).sort();
          expect(actualIds).toEqual(expectedIds);

          // 2. Every returned comment is approved and belongs to the post.
          for (const c of returned) {
            expect(c.isApproved).toBe(true);
            expect(c.blogPostId).toBe(postId);
          }

          // 3. Ordered by creation time descending (newest first).
          for (let i = 1; i < returned.length; i++) {
            const prev = new Date(returned[i - 1].createdAt).getTime();
            const curr = new Date(returned[i].createdAt).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // A missing slug yields null (404 at the controller); no comments leak.
  it('returns null for an unknown post slug', async () => {
    mockDb.__reset();
    mockDb.__setData([], []);
    const result = await service.listApprovedBySlug('does-not-exist');
    expect(result).toBeNull();
  });
});
