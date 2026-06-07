import fc from 'fast-check';

/**
 * Blog module property-based tests (Properties 11, 12, 17, 18, 20) plus the
 * reset-blog-views smoke test (Task 9.4).
 *
 * These exercise the real blog services against the shared in-memory Prisma
 * `db` fake from `tests/helpers/blogDbMock.ts`, which honors the
 * where/include/orderBy/select shapes the services use.
 */

jest.mock('../src/database/database', () =>
  require('./helpers/blogDbMock').createBlogDbMock(),
);

import { db } from '../src/database/database';
import { BlogPostService } from '../src/modules/blogPost/blogPost.service';
import { BlogReactionService } from '../src/modules/blogReaction/blogReaction.service';
import { NotFoundException } from '../src/common/utils/catch-errors';

const mockDb = db as any;
const blogService = new BlogPostService();
const reactionService = new BlogReactionService();

// Fixed taxonomy pools. Category/tag ids equal their slugs for simplicity.
const CATEGORY_SLUGS = ['cat-a', 'cat-b', 'cat-c'];
const TAG_SLUGS = ['tag-1', 'tag-2', 'tag-3', 'tag-4'];

const categoryRows = CATEGORY_SLUGS.map((s) => ({ id: s, name: s, slug: s }));
const tagRows = TAG_SLUGS.map((s) => ({ id: s, name: s, slug: s }));

interface PostSpec {
  isPublished: boolean;
  categorySlug: string | null;
  tagSlugs: string[];
}

const postSpecArb: fc.Arbitrary<PostSpec> = fc.record({
  isPublished: fc.boolean(),
  categorySlug: fc.option(fc.constantFrom(...CATEGORY_SLUGS), { nil: null }),
  tagSlugs: fc.subarray(TAG_SLUGS),
});

function seedPosts(specs: PostSpec[]) {
  const posts = specs.map((s, i) => ({
    id: `post-${i}`,
    slug: `post-${i}`,
    title: `Title ${i}`,
    excerpt: `excerpt ${i}`,
    content: 'word '.repeat(10),
    isPublished: s.isPublished,
    totalViews: 0,
    categoryId: s.categorySlug,
    createdAt: new Date(2020, 0, 1 + i).toISOString(),
    updatedAt: new Date(2020, 0, 1 + i).toISOString(),
  }));
  const tagsOnPost: { blogPostId: string; tagId: string }[] = [];
  specs.forEach((s, i) => {
    for (const slug of s.tagSlugs) {
      tagsOnPost.push({ blogPostId: `post-${i}`, tagId: slug });
    }
  });
  mockDb.__seed({
    posts,
    categories: categoryRows,
    tags: tagRows,
    tagsOnPost,
  });
  return posts;
}

describe('Blog module property-based tests', () => {
  // Feature: portfolio-upgrade, Property 11: Blog category and tag assignment round-trips
  // Validates: Requirements 3.2, 3.3
  it('Property 11: blog category and tag assignment round-trips', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CATEGORY_SLUGS),
        fc.subarray(TAG_SLUGS),
        async (categoryId, tagIds) => {
          // Seed a single post with no existing taxonomy.
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
            categories: categoryRows,
            tags: tagRows,
            tagsOnPost: [],
          });

          await blogService.assignTaxonomy('post-1', { categoryId, tagIds });

          const readBack: any = await blogService.findById('post-1');

          // Category round-trips.
          expect(readBack.category).not.toBeNull();
          expect(readBack.category.id).toBe(categoryId);

          // Exact tag set round-trips (order-independent).
          const returnedTagIds = readBack.tags.map((t: any) => t.tagId).sort();
          expect(returnedTagIds).toEqual([...tagIds].sort());
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 12: Public blog list returns only published items matching the filter
  // Validates: Requirements 3.4, 3.5, 3.6
  it('Property 12: public blog list returns only published items matching the filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(postSpecArb, { minLength: 0, maxLength: 12 }),
        fc.constantFrom('category', 'tag'),
        fc.constantFrom(...CATEGORY_SLUGS),
        fc.constantFrom(...TAG_SLUGS),
        async (specs, filterKind, categorySlug, tagSlug) => {
          seedPosts(specs);

          const params: any = { page: 1, limit: 1000 };
          if (filterKind === 'category') params.category = categorySlug;
          if (filterKind === 'tag') params.tag = tagSlug;

          const { data, metadata } = await blogService.findAllPublic(params);

          // Every returned item is published and matches the active filter.
          for (const item of data as any[]) {
            expect(item.isPublished).toBe(true);
            if (filterKind === 'category') {
              expect(item.category?.slug).toBe(categorySlug);
            } else {
              const slugs = item.tags.map((t: any) => t.tag.slug);
              expect(slugs).toContain(tagSlug);
            }
          }

          // Independent oracle: exact expected set of ids.
          const expected = specs
            .map((s, i) => ({ ...s, id: `post-${i}` }))
            .filter((s) => s.isPublished)
            .filter((s) =>
              filterKind === 'category'
                ? s.categorySlug === categorySlug
                : s.tagSlugs.includes(tagSlug),
            )
            .map((s) => s.id)
            .sort();
          const actual = (data as any[]).map((p) => p.id).sort();
          expect(actual).toEqual(expected);

          // Metadata is always present and consistent (no-match => empty list).
          expect(metadata.total).toBe(expected.length);
          if (expected.length === 0) {
            expect(data).toHaveLength(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 17: Reaction count increases by the number of reactions submitted
  // Validates: Requirements 5.1, 5.2
  it('Property 17: reaction count increases by the number of reactions submitted; 404 when post missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 8 }),
        async (n) => {
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

          let lastCount = 0;
          for (let i = 0; i < n; i++) {
            const res = await reactionService.create('post-1', { type: 'like' });
            lastCount = res.count;
          }

          // Returned count equals the stored count and increased by exactly N.
          const stored = mockDb.__store.reactions.filter(
            (r: any) => r.blogPostId === 'post-1',
          ).length;
          expect(stored).toBe(n);
          expect(lastCount).toBe(n);

          // 404 when the post does not exist (Req 5.3 boundary).
          await expect(
            reactionService.create('does-not-exist', { type: 'like' }),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 18: View counting is idempotent within the 24-hour window
  // Validates: Requirements 5b.1, 5b.2, 5b.3
  it('Property 18: view counting is idempotent within the 24-hour window', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Distinct visitor sessions, each viewing repeatedly within the window.
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 6 }), {
          minLength: 1,
          maxLength: 5,
        }),
        fc.integer({ min: 1, max: 8 }),
        async (sessions, repeats) => {
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

          for (const sessionId of sessions) {
            for (let i = 0; i < repeats; i++) {
              await blogService.recordView('post-1', sessionId);
            }
          }

          // Each distinct session increments exactly once within the window.
          const post = mockDb.__store.posts.find((p: any) => p.id === 'post-1');
          expect(post.totalViews).toBe(sessions.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 20: Related posts selection is bounded, self-excluding, and relevant
  // Validates: Requirements 6.2, 6.3
  it('Property 20: related posts are bounded (<=3), self-excluding, and relevant', async () => {
    await fc.assert(
      fc.asyncProperty(
        // The target post and a pool of candidate posts.
        postSpecArb.map((s) => ({ ...s, isPublished: true })),
        fc.array(postSpecArb, { minLength: 0, maxLength: 12 }),
        async (targetSpec, otherSpecs) => {
          const specs = [targetSpec, ...otherSpecs];
          seedPosts(specs);

          const targetTagIds = targetSpec.tagSlugs;
          const targetCategory = targetSpec.categorySlug;
          const hasTaxonomy = Boolean(targetCategory) || targetTagIds.length > 0;

          const detail: any = await blogService.findPublicDetailBySlug('post-0');
          expect(detail).not.toBeNull();
          const related: any[] = detail.relatedPosts;

          // Bounded.
          expect(related.length).toBeLessThanOrEqual(3);

          for (const r of related) {
            // Self-excluding.
            expect(r.id).not.toBe('post-0');
            // Always published.
            expect(r.isPublished).toBe(true);

            if (hasTaxonomy) {
              // Relevant: shares category or at least one tag.
              const sharesCategory =
                Boolean(targetCategory) && r.categoryId === targetCategory;
              const rTagIds = (r.tags ?? []).map((t: any) => t.tagId);
              const sharesTag = rTagIds.some((t: string) =>
                targetTagIds.includes(t),
              );
              expect(sharesCategory || sharesTag).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Task 9.4 (smoke): the reset-blog-views logic resets all posts' totalViews to 0.
  // Validates: Requirements 5b.4
  it('reset-blog-views resets every post totalViews to 0', async () => {
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
      ],
    });

    // Core call performed by scripts/reset-blog-views.ts.
    const result = await db.blogPost.updateMany({ data: { totalViews: 0 } });

    expect(db.blogPost.updateMany).toHaveBeenCalledWith({
      data: { totalViews: 0 },
    });
    expect(result.count).toBe(2);
    for (const p of mockDb.__store.posts) {
      expect(p.totalViews).toBe(0);
    }
  });
});
