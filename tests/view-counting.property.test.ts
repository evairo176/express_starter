// Feature: portfolio-upgrade, Property 18: View counting is idempotent within the 24-hour window.
import fc from 'fast-check';

/**
 * View-counting idempotence property-based test (Property 18, Task 9.3).
 *
 * Exercises the real `BlogPostService.recordView` against the shared in-memory
 * Prisma `db` fake from `tests/helpers/blogDbMock.ts`, which models the
 * `blogPost` and `blogPostView` tables (including the compound unique key the
 * service relies on for idempotent counting).
 *
 * Property 18 (design): for any published post and any single visitor session,
 * any number of repeated views within a 24-hour window increment the post's
 * view count by exactly one.
 *
 * Validates: Requirements 5b.1, 5b.2, 5b.3
 */

jest.mock('../src/database/database', () =>
  require('./helpers/blogDbMock').createBlogDbMock(),
);

import { db } from '../src/database/database';
import { BlogPostService } from '../src/modules/blogPost/blogPost.service';

const mockDb = db as any;
const service = new BlogPostService();

const VIEW_WINDOW_MS = 24 * 60 * 60 * 1000;

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

function getPost() {
  return mockDb.__store.posts.find((p: any) => p.id === 'post-1');
}

describe('View-counting idempotence property-based tests', () => {
  // Feature: portfolio-upgrade, Property 18: View counting is idempotent within the 24-hour window.
  // Validates: Requirements 5b.1, 5b.2, 5b.3
  it('Property 18: repeated views from one session within 24h increment the count by exactly one', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 12 }),
        fc.integer({ min: 1, max: 20 }),
        async (sessionId, repeats) => {
          seedSinglePost();

          let lastCount = 0;
          for (let i = 0; i < repeats; i++) {
            const res = await service.recordView('post-1', sessionId);
            lastCount = res.totalViews;
          }

          // A single session contributes exactly one view regardless of how
          // many times it views within the window (Req 5b.1, 5b.2).
          expect(getPost().totalViews).toBe(1);
          // The returned count equals the stored count (Req 5b.3).
          expect(lastCount).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Distinct sessions each count once; the total equals the number of sessions.
  // Validates: Requirements 5b.1, 5b.2, 5b.3
  it('Property 18: each distinct session within 24h increments the count by exactly one', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), {
          minLength: 1,
          maxLength: 6,
        }),
        fc.integer({ min: 1, max: 8 }),
        async (sessions, repeats) => {
          seedSinglePost();

          for (const sessionId of sessions) {
            for (let i = 0; i < repeats; i++) {
              await service.recordView('post-1', sessionId);
            }
          }

          // Each distinct session contributes exactly one view (Req 5b.1, 5b.2).
          expect(getPost().totalViews).toBe(sessions.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  // A view older than the 24h window counts again exactly once for that session.
  // Validates: Requirements 5b.1, 5b.2, 5b.3
  it('Property 18: a session counts again once the 24-hour window has elapsed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 12 }),
        fc.integer({ min: 1, max: 10 }),
        async (sessionId, repeats) => {
          seedSinglePost();

          // First view inside the window: counts once no matter how many hits.
          for (let i = 0; i < repeats; i++) {
            await service.recordView('post-1', sessionId);
          }
          expect(getPost().totalViews).toBe(1);

          // Age the existing view row past the 24h window.
          const view = mockDb.__store.views.find(
            (v: any) => v.blogPostId === 'post-1' && v.sessionId === sessionId,
          );
          view.createdAt = new Date(
            Date.now() - (VIEW_WINDOW_MS + 60_000),
          ).toISOString();

          // Repeated views after the window elapsed count exactly once more.
          for (let i = 0; i < repeats; i++) {
            await service.recordView('post-1', sessionId);
          }
          expect(getPost().totalViews).toBe(2);
        },
      ),
      { numRuns: 100 },
    );
  });
});
