/**
 * Smoke test for the one-time view-count reset migration
 * (`scripts/reset-blog-views.ts`).
 *
 * When the accurate, session-based view-counting system is first deployed,
 * every existing post's view count must be reset to 0 so counting can begin
 * fresh under the new tracking system.
 *
 * Validates: Requirements 5b.4
 *
 * The migration's core operation is a single Prisma `updateMany` that sets
 * `totalViews` to 0 for every blog post. This test exercises that operation
 * against the shared in-memory Prisma fake and asserts that all existing
 * posts -- regardless of their prior count or published state -- end at 0.
 */

jest.mock('../src/database/database', () =>
  require('./helpers/blogDbMock').createBlogDbMock(),
);

import { db } from '../src/database/database';

const mockDb = db as any;

/**
 * Mirror of the core migration step in scripts/reset-blog-views.ts so the test
 * exercises the exact Prisma call the script performs without triggering the
 * script's top-level execution / process side effects.
 */
async function resetBlogViews(): Promise<number> {
  const result = await db.blogPost.updateMany({ data: { totalViews: 0 } });
  return result.count;
}

describe('reset-blog-views migration smoke test', () => {
  it('resets every existing post view count to 0 (Req 5b.4)', async () => {
    mockDb.__seed({
      posts: [
        {
          id: 'post-1',
          slug: 'post-1',
          isPublished: true,
          totalViews: 42,
          categoryId: null,
          createdAt: new Date(2020, 0, 1).toISOString(),
          updatedAt: new Date(2020, 0, 1).toISOString(),
        },
        {
          id: 'post-2',
          slug: 'post-2',
          isPublished: false,
          totalViews: 7,
          categoryId: null,
          createdAt: new Date(2020, 0, 2).toISOString(),
          updatedAt: new Date(2020, 0, 2).toISOString(),
        },
        {
          id: 'post-3',
          slug: 'post-3',
          isPublished: true,
          totalViews: 0,
          categoryId: null,
          createdAt: new Date(2020, 0, 3).toISOString(),
          updatedAt: new Date(2020, 0, 3).toISOString(),
        },
      ],
    });

    const count = await resetBlogViews();

    // The migration issues the expected bulk reset and reports every post.
    expect(db.blogPost.updateMany).toHaveBeenCalledWith({
      data: { totalViews: 0 },
    });
    expect(count).toBe(3);

    // Every existing post's view count is 0 afterward.
    for (const post of mockDb.__store.posts) {
      expect(post.totalViews).toBe(0);
    }
  });

  it('is a no-op count of 0 when there are no posts (Req 5b.4)', async () => {
    mockDb.__seed({ posts: [] });

    const count = await resetBlogViews();

    expect(count).toBe(0);
    expect(mockDb.__store.posts).toHaveLength(0);
  });
});
