// Feature: portfolio-upgrade, Property 20: Related posts selection is bounded, self-excluding, and relevant.
import fc from 'fast-check';

/**
 * Related-posts property-based test (Property 20).
 *
 * Exercises the real `BlogPostService.findPublicDetailBySlug` (which delegates
 * to the private `findRelatedPosts`) against an in-memory fake of the Prisma
 * `db` methods the service touches: `blogPost.findUnique`, `blogPost.findMany`,
 * and `blogReaction.count`. The fake's `findMany` implements a small
 * where-matcher mirroring the documented Prisma semantics the service relies
 * on for related selection (isPublished flag, `id: { not }`, `categoryId`
 * equality, `tags.some.tagId.in`, and `OR` composition) plus `orderBy
 * createdAt desc` and `take`.
 *
 * The property then asserts the service's observable contract for the
 * `relatedPosts` field:
 *   - When the requested post has a category or tags: related posts are at most
 *     3 published posts, never include the requested post, and each shares the
 *     post's category or at least one tag.
 *   - When the requested post has no category and no tags: related posts are
 *     the most recent published posts (createdAt desc) excluding the requested
 *     post, capped at 3.
 *
 * Fixtures are fed through the `__setPosts` accessor on the mocked `db`.
 *
 * Validates: Requirements 6.2, 6.3
 */

jest.mock('../src/database/database', () => {
  const store: { items: any[] } = { items: [] };

  // Recursive matcher mirroring the Prisma `where` shapes `findRelatedPosts`
  // builds.
  function matchCondition(p: any, cond: any): boolean {
    for (const key of Object.keys(cond)) {
      const val = cond[key];
      if (key === 'isPublished') {
        if (p.isPublished !== val) return false;
      } else if (key === 'id') {
        // val = string (findUnique) or { not: id } (findMany exclusion)
        if (val && typeof val === 'object' && 'not' in val) {
          if (p.id === val.not) return false;
        } else if (p.id !== val) {
          return false;
        }
      } else if (key === 'categoryId') {
        if (p.categoryId !== val) return false;
      } else if (key === 'tags') {
        // val = { some: { tagId: { in: [...] } } }
        const inIds: string[] = val.some.tagId.in;
        const tagIds = (p.tags ?? []).map((t: any) => t.tagId);
        if (!tagIds.some((t: string) => inIds.includes(t))) return false;
      } else if (key === 'OR') {
        if (!val.some((c: any) => matchCondition(p, c))) return false;
      }
    }
    return true;
  }

  return {
    db: {
      __setPosts: (items: any[]) => {
        store.items = items;
      },
      blogPost: {
        findUnique: jest.fn(async ({ where }: any) => {
          if (where.slug !== undefined) {
            return store.items.find((p) => p.slug === where.slug) ?? null;
          }
          if (where.id !== undefined) {
            return store.items.find((p) => p.id === where.id) ?? null;
          }
          return null;
        }),
        findMany: jest.fn(async ({ where, orderBy, take }: any) => {
          let rows = store.items.filter((p) => matchCondition(p, where));
          if (orderBy?.createdAt === 'desc') {
            rows = [...rows].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          }
          if (take !== undefined) rows = rows.slice(0, take);
          return rows;
        }),
      },
      blogReaction: {
        count: jest.fn(async () => 0),
      },
    },
  };
});

import { db } from '../src/database/database';
import { BlogPostService } from '../src/modules/blogPost/blogPost.service';

const mockDb = db as unknown as { __setPosts: (items: any[]) => void };
const service = new BlogPostService();

// ---------------------------------------------------------------------------
// Fixture generation helpers
// ---------------------------------------------------------------------------

const CATEGORY_IDS = ['cat-1', 'cat-2', 'cat-3'];
const TAG_IDS = ['tag-a', 'tag-b', 'tag-c', 'tag-d'];

interface RawSpec {
  isPublished: boolean;
  categoryId: string | null;
  tagIds: string[];
}

const rawSpecArb: fc.Arbitrary<RawSpec> = fc.record({
  isPublished: fc.boolean(),
  categoryId: fc.option(fc.constantFrom(...CATEGORY_IDS), { nil: null }),
  tagIds: fc.subarray(TAG_IDS),
});

function buildFixture(spec: RawSpec, i: number) {
  return {
    id: `id-${i}`,
    slug: `post-${i}`,
    title: `Post ${i}`,
    excerpt: null,
    content: 'word '.repeat(10),
    isPublished: spec.isPublished,
    totalViews: 0,
    createdAt: new Date(2020, 0, 1 + i).toISOString(),
    updatedAt: new Date(2020, 0, 1 + i).toISOString(),
    category: spec.categoryId
      ? { id: spec.categoryId, slug: spec.categoryId, name: spec.categoryId }
      : null,
    categoryId: spec.categoryId,
    tags: spec.tagIds.map((t) => ({
      tagId: t,
      tag: { id: t, slug: t, name: t },
    })),
  };
}

describe('Related posts property-based tests', () => {
  // Feature: portfolio-upgrade, Property 20: Related posts selection is bounded, self-excluding, and relevant.
  // Validates: Requirements 6.2, 6.3
  it('Property 20: related posts are bounded, self-excluding, and relevant', async () => {
    await fc.assert(
      fc.asyncProperty(
        // At least one fixture so there is a post to request.
        fc.array(rawSpecArb, { minLength: 1, maxLength: 14 }),
        fc.nat(),
        async (specs, idx) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPosts(fixtures);

          // Pick a published post to request; skip the run if none exist.
          const published = fixtures.filter((p) => p.isPublished);
          if (published.length === 0) return;
          const requested = published[idx % published.length];

          const result = await service.findPublicDetailBySlug(requested.slug);
          expect(result).not.toBeNull();
          const related = result!.relatedPosts as any[];

          const requestedTagIds = requested.tags.map((t: any) => t.tagId);
          const hasCategory = Boolean(requested.categoryId);
          const hasTags = requestedTagIds.length > 0;

          // Universal invariants (Req 6.2): bounded, self-excluding, published.
          expect(related.length).toBeLessThanOrEqual(3);
          for (const r of related) {
            expect(r.id).not.toBe(requested.id);
            expect(r.isPublished).toBe(true);
          }

          if (hasCategory || hasTags) {
            // Each related post shares the category or at least one tag.
            for (const r of related) {
              const sharesCategory =
                hasCategory && r.categoryId === requested.categoryId;
              const rTagIds = (r.tags ?? []).map((t: any) => t.tagId);
              const sharesTag = rTagIds.some((t: string) =>
                requestedTagIds.includes(t),
              );
              expect(sharesCategory || sharesTag).toBe(true);
            }

            // Independent oracle: the relevant set, ordered newest-first,
            // capped at 3.
            const expected = fixtures
              .filter((p) => p.isPublished && p.id !== requested.id)
              .filter((p) => {
                const sharesCategory =
                  hasCategory && p.categoryId === requested.categoryId;
                const pTagIds = p.tags.map((t: any) => t.tagId);
                const sharesTag = pTagIds.some((t: string) =>
                  requestedTagIds.includes(t),
                );
                return sharesCategory || sharesTag;
              })
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, 3)
              .map((p) => p.id);

            expect(related.map((r) => r.id)).toEqual(expected);
          } else {
            // Fallback (Req 6.3): most recent published posts excluding self.
            const expected = fixtures
              .filter((p) => p.isPublished && p.id !== requested.id)
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, 3)
              .map((p) => p.id);

            expect(related.map((r) => r.id)).toEqual(expected);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
