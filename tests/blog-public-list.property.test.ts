// Feature: portfolio-upgrade, Property 12: Public blog list returns only published items matching the filter.
import fc from 'fast-check';

/**
 * Blog public list property-based test (Property 12).
 *
 * Exercises the real `BlogPostService.findAllPublic` against an in-memory fake
 * of the Prisma `db.blogPost` methods the service uses (`findMany`, `count`).
 * The fake implements a small where-matcher that mirrors the documented Prisma
 * filtering semantics the service relies on (isPublished flag, category by
 * slug, tag by slug via `tags.some.tag.slug`, and case-insensitive
 * title/excerpt/slug search), and honors the `orderBy`/`skip`/`take`/`include`
 * the service passes. The property then asserts the SERVICE's observable
 * contract end-to-end: only published items, all matching the active filter,
 * and an empty list with valid pagination metadata when nothing matches.
 *
 * The fake is installed via jest.mock and fed fixtures through the
 * `__setPosts` accessor exposed on the mocked `db`.
 */

jest.mock('../src/database/database', () => {
  const store: { items: any[] } = { items: [] };

  // Recursive matcher mirroring the Prisma `where` shapes the service builds.
  function matchCondition(p: any, cond: any): boolean {
    for (const key of Object.keys(cond)) {
      const val = cond[key];
      if (key === 'isPublished') {
        if (p.isPublished !== val) return false;
      } else if (key === 'category') {
        // val = { slug: x }
        if (!p.category || p.category.slug !== val.slug) return false;
      } else if (key === 'tags') {
        // val = { some: { tag: { slug } } }
        const slug = val.some.tag.slug;
        if (!(p.tags ?? []).some((t: any) => t.tag.slug === slug)) return false;
      } else if (key === 'title' || key === 'excerpt' || key === 'slug') {
        // Either a `{ contains, mode }` filter (search) or a direct equality.
        if (val && typeof val === 'object' && 'contains' in val) {
          const text: string = p[key] ?? '';
          const needle: string = val.contains ?? '';
          if (val.mode === 'insensitive') {
            if (!text.toLowerCase().includes(needle.toLowerCase()))
              return false;
          } else if (!text.includes(needle)) {
            return false;
          }
        } else if (p[key] !== val) {
          return false;
        }
      } else if (key === 'OR') {
        if (!val.some((c: any) => matchCondition(p, c))) return false;
      } else if (key === 'AND') {
        if (!val.every((c: any) => matchCondition(p, c))) return false;
      } else if (key === 'id') {
        if (p.id !== val) return false;
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
        findMany: jest.fn(
          async ({ where, orderBy, skip = 0, take }: any) => {
            let rows = store.items.filter((p) => matchCondition(p, where));
            if (orderBy?.updatedAt === 'desc') {
              rows = [...rows].sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              );
            }
            if (skip) rows = rows.slice(skip);
            if (take !== undefined) rows = rows.slice(0, take);
            return rows;
          },
        ),
        count: jest.fn(
          async ({ where }: any) =>
            store.items.filter((p) => matchCondition(p, where)).length,
        ),
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

const CATEGORY_SLUGS = ['cat-1', 'cat-2', 'cat-3'];
const TAG_SLUGS = ['tag-a', 'tag-b', 'tag-c', 'tag-d'];

interface RawSpec {
  isPublished: boolean;
  categorySlug: string | null;
  tagSlugs: string[];
  title: string;
  excerpt: string | null;
}

const rawSpecArb: fc.Arbitrary<RawSpec> = fc.record({
  isPublished: fc.boolean(),
  categorySlug: fc.option(fc.constantFrom(...CATEGORY_SLUGS), { nil: null }),
  tagSlugs: fc.subarray(TAG_SLUGS),
  title: fc.string(),
  excerpt: fc.option(fc.string(), { nil: null }),
});

function buildFixture(spec: RawSpec, i: number) {
  return {
    id: `id-${i}`,
    slug: `post-${i}`,
    title: spec.title,
    excerpt: spec.excerpt,
    content: 'content',
    isPublished: spec.isPublished,
    updatedAt: new Date(2020, 0, 1 + i).toISOString(),
    category: spec.categorySlug
      ? {
          id: spec.categorySlug,
          slug: spec.categorySlug,
          name: spec.categorySlug,
        }
      : null,
    categoryId: spec.categorySlug ?? null,
    tags: spec.tagSlugs.map((s) => ({ tag: { id: s, slug: s, name: s } })),
  };
}

// Large limit so the list returns all matches in one page for set comparison.
const BIG_LIMIT = 1000;

describe('Blog public list property-based tests', () => {
  // Feature: portfolio-upgrade, Property 12: Public blog list returns only published items matching the filter.
  // Validates: Requirements 3.4, 3.5, 3.6
  it('Property 12: public blog list returns only published items matching the filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(rawSpecArb, { minLength: 0, maxLength: 12 }),
        fc.constantFrom('category', 'tag', 'none'),
        fc.constantFrom(...CATEGORY_SLUGS),
        fc.constantFrom(...TAG_SLUGS),
        async (specs, filterKind, categorySlug, tagSlug) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPosts(fixtures);

          const params: any = { page: 1, limit: BIG_LIMIT };
          if (filterKind === 'category') params.category = categorySlug;
          if (filterKind === 'tag') params.tag = tagSlug;

          const { data, metadata } = await service.findAllPublic(params);

          // Every returned item is published (Req 3.4, 3.5) and matches filter.
          for (const item of data) {
            expect(item.isPublished).toBe(true);
            if (filterKind === 'category') {
              expect(item.category?.slug).toBe(categorySlug);
            }
            if (filterKind === 'tag') {
              const slugs = item.tags.map((t: any) => t.tag.slug);
              expect(slugs).toContain(tagSlug);
            }
          }

          // Independent oracle: exact set of expected ids.
          const expected = fixtures
            .filter((p) => p.isPublished)
            .filter((p) =>
              filterKind === 'category'
                ? p.category?.slug === categorySlug
                : true,
            )
            .filter((p) =>
              filterKind === 'tag'
                ? p.tags.some((t: any) => t.tag.slug === tagSlug)
                : true,
            )
            .map((p) => p.id)
            .sort();
          const actual = data.map((p: any) => p.id).sort();
          expect(actual).toEqual(expected);

          // Pagination metadata is always present and consistent (Req 3.6).
          expect(metadata.total).toBe(expected.length);
          expect(metadata.page).toBe(1);
          expect(metadata.limit).toBe(BIG_LIMIT);
          expect(metadata.totalPages).toBe(
            Math.ceil(expected.length / BIG_LIMIT),
          );
          expect(metadata.hasPrev).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // A filter with no matches yields an empty list with valid metadata (Req 3.6).
  it('Property 12: a filter with no matches yields an empty list with valid metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(rawSpecArb, { minLength: 0, maxLength: 12 }),
        async (specs) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPosts(fixtures);

          // A category slug that no fixture uses guarantees zero matches.
          const { data, metadata } = await service.findAllPublic({
            page: 1,
            limit: BIG_LIMIT,
            category: 'definitely-absent-category',
          });

          expect(data).toEqual([]);
          expect(metadata.total).toBe(0);
          expect(metadata.totalPages).toBe(0);
          expect(metadata.hasNext).toBe(false);
          expect(metadata.hasPrev).toBe(false);
          expect(metadata.page).toBe(1);
          expect(metadata.limit).toBe(BIG_LIMIT);
        },
      ),
      { numRuns: 100 },
    );
  });
});
