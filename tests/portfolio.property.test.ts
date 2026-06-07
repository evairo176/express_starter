import fc from 'fast-check';

/**
 * Portfolio module property-based tests (Properties 1-7).
 *
 * These tests exercise the real `PortfolioService` (`findPublishedBySlug` and
 * `findPublic`) against an in-memory fake of the Prisma `db.portfolio` methods
 * the service uses (`findUnique`, `findMany`, `count`). The fake implements a
 * small where-matcher that mirrors the documented Prisma filtering semantics
 * the service relies on, and honors the `include`/`orderBy` the service passes
 * (notably gallery ordering by `position` asc). Each property then asserts the
 * SERVICE's observable contract end-to-end.
 *
 * The fake is installed via jest.mock and is fed fixtures through the
 * `__setPortfolios` accessor exposed on the mocked `db`.
 */

jest.mock('../src/database/database', () => {
  const store: { items: any[] } = { items: [] };

  // Recursive matcher mirroring the Prisma `where` shapes the service builds.
  function matchCondition(p: any, cond: any): boolean {
    for (const key of Object.keys(cond)) {
      const val = cond[key];
      if (key === 'isPublished') {
        if (p.isPublished !== val) return false;
      } else if (key === 'featured') {
        if (p.featured !== val) return false;
      } else if (key === 'category') {
        // val = { slug: x }
        if (!p.category || p.category.slug !== val.slug) return false;
      } else if (key === 'title' || key === 'shortDesc') {
        // val = { contains, mode }
        const text: string = p[key] ?? '';
        const needle: string = val.contains ?? '';
        if (val.mode === 'insensitive') {
          if (!text.toLowerCase().includes(needle.toLowerCase())) return false;
        } else if (!text.includes(needle)) {
          return false;
        }
      } else if (key === 'tags') {
        // val = { some: { tag: { slug } } }
        const slug = val.some.tag.slug;
        if (!(p.tags ?? []).some((t: any) => t.tag.slug === slug)) return false;
      } else if (key === 'techStacks') {
        // val = { some: { tech: { name } } }
        const name = val.some.tech.name;
        if (!(p.techStacks ?? []).some((t: any) => t.tech.name === name))
          return false;
      } else if (key === 'OR') {
        if (!val.some((c: any) => matchCondition(p, c))) return false;
      } else if (key === 'AND') {
        if (!val.every((c: any) => matchCondition(p, c))) return false;
      } else if (key === 'slug') {
        if (p.slug !== val) return false;
      } else if (key === 'id') {
        if (p.id !== val) return false;
      }
    }
    return true;
  }

  function applyInclude(p: any, include: any): any {
    const result = { ...p };
    // Honor gallery ordering by `position` ascending when requested.
    if (include?.images?.orderBy?.position === 'asc') {
      result.images = [...(p.images ?? [])].sort(
        (a: any, b: any) => a.position - b.position,
      );
    }
    return result;
  }

  return {
    db: {
      __setPortfolios: (items: any[]) => {
        store.items = items;
      },
      portfolio: {
        findUnique: jest.fn(async ({ where, include }: any) => {
          const found = store.items.find(
            (p) =>
              (where.slug !== undefined && p.slug === where.slug) ||
              (where.id !== undefined && p.id === where.id),
          );
          if (!found) return null;
          return applyInclude(found, include);
        }),
        findMany: jest.fn(
          async ({ where, orderBy, skip = 0, take, include }: any) => {
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
            return rows.map((p) => applyInclude(p, include));
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
import { PortfolioService } from '../src/modules/portfolio/portfolio.service';
import { NotFoundException } from '../src/common/utils/catch-errors';

const mockDb = db as unknown as { __setPortfolios: (items: any[]) => void };
const service = new PortfolioService();

// ---------------------------------------------------------------------------
// Fixture generation helpers
// ---------------------------------------------------------------------------

const CATEGORY_SLUGS = ['c-1', 'c-2', 'c-3'];
const TAG_SLUGS = ['t-a', 't-b', 't-c', 't-d'];
const TECH_NAMES = ['React', 'Node', 'TypeScript', 'Go'];
const WORD_POOL = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'node', 'React'];

interface RawSpec {
  isPublished: boolean;
  featured: boolean;
  categorySlug: string | null;
  tagSlugs: string[];
  techNames: string[];
  title: string;
  shortDesc: string | null;
  problem: string;
  solution: string;
  results: string;
  liveUrl: string;
  repoUrl: string;
  imagePositions: number[];
}

const rawSpecArb: fc.Arbitrary<RawSpec> = fc.record({
  isPublished: fc.boolean(),
  featured: fc.boolean(),
  categorySlug: fc.option(fc.constantFrom(...CATEGORY_SLUGS), { nil: null }),
  tagSlugs: fc.subarray(TAG_SLUGS),
  techNames: fc.subarray(TECH_NAMES),
  title: fc
    .tuple(fc.constantFrom(...WORD_POOL), fc.constantFrom(...WORD_POOL))
    .map(([a, b]) => `${a} ${b}`),
  shortDesc: fc.option(
    fc
      .tuple(fc.constantFrom(...WORD_POOL), fc.constantFrom(...WORD_POOL))
      .map(([a, b]) => `${a} ${b}`),
    { nil: null },
  ),
  problem: fc.string(),
  solution: fc.string(),
  results: fc.string(),
  liveUrl: fc.webUrl(),
  repoUrl: fc.webUrl(),
  imagePositions: fc.array(fc.integer({ min: -50, max: 50 }), { maxLength: 6 }),
});

function buildFixture(spec: RawSpec, i: number) {
  return {
    id: `id-${i}`,
    slug: `p-${i}`,
    title: spec.title,
    shortDesc: spec.shortDesc,
    description: 'desc',
    isPublished: spec.isPublished,
    featured: spec.featured,
    problem: spec.problem,
    solution: spec.solution,
    results: spec.results,
    liveUrl: spec.liveUrl,
    repoUrl: spec.repoUrl,
    updatedAt: new Date(2020, 0, 1 + i).toISOString(),
    category: spec.categorySlug
      ? { id: spec.categorySlug, slug: spec.categorySlug, name: spec.categorySlug }
      : null,
    images: spec.imagePositions.map((position, idx) => ({
      id: `img-${i}-${idx}`,
      portfolioId: `id-${i}`,
      url: `https://img/${i}/${idx}`,
      alt: null,
      position,
    })),
    tags: spec.tagSlugs.map((s) => ({ tag: { id: s, slug: s, name: s } })),
    techStacks: spec.techNames.map((n) => ({
      tech: { id: n, name: n, icon: `${n}.svg` },
    })),
  };
}

// Large limit so the list returns all matches in one page for set comparison.
const BIG_LIMIT = 1000;

describe('Portfolio module property-based tests', () => {
  // Feature: portfolio-upgrade, Property 1: Case-study fields round-trip (problem/solution/results returned as stored).
  // Validates: Requirements 1.1
  it('Property 1: case-study fields round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          problem: fc.string(),
          solution: fc.string(),
          results: fc.string(),
        }),
        async ({ problem, solution, results }) => {
          const fixture = buildFixture(
            {
              isPublished: true,
              featured: false,
              categorySlug: null,
              tagSlugs: [],
              techNames: [],
              title: 'Title',
              shortDesc: null,
              problem,
              solution,
              results,
              liveUrl: 'https://x',
              repoUrl: 'https://y',
              imagePositions: [],
            },
            0,
          );
          mockDb.__setPortfolios([fixture]);

          const result = await service.findPublishedBySlug(fixture.slug);

          expect(result.problem).toBe(problem);
          expect(result.solution).toBe(solution);
          expect(result.results).toBe(results);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 2: Published project detail contains all required fields (problem, solution, results, gallery, liveUrl, repoUrl, category, tags, tech stack name+icon).
  // Validates: Requirements 1.2, 1.3
  it('Property 2: published project detail contains all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        rawSpecArb.map((s) => ({
          ...s,
          isPublished: true,
          categorySlug: s.categorySlug ?? CATEGORY_SLUGS[0],
          // Ensure at least one tag, tech, and image for completeness checks.
          tagSlugs: s.tagSlugs.length ? s.tagSlugs : [TAG_SLUGS[0]],
          techNames: s.techNames.length ? s.techNames : [TECH_NAMES[0]],
          imagePositions: s.imagePositions.length
            ? s.imagePositions
            : [0],
        })),
        async (spec) => {
          const fixture = buildFixture(spec, 0);
          mockDb.__setPortfolios([fixture]);

          const result = await service.findPublishedBySlug(fixture.slug);

          expect(result.problem).toBe(spec.problem);
          expect(result.solution).toBe(spec.solution);
          expect(result.results).toBe(spec.results);
          expect(result.liveUrl).toBe(spec.liveUrl);
          expect(result.repoUrl).toBe(spec.repoUrl);
          expect(result.category).not.toBeNull();
          expect(Array.isArray(result.images)).toBe(true);
          expect(result.images.length).toBe(spec.imagePositions.length);
          expect(result.tags.length).toBe(spec.tagSlugs.length);
          // Each tech stack entry exposes name + icon (Req 1.3).
          expect(result.techStacks.length).toBe(spec.techNames.length);
          for (const entry of result.techStacks) {
            expect(typeof entry.tech.name).toBe('string');
            expect(entry.tech.name.length).toBeGreaterThan(0);
            expect(entry.tech.icon).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 3: Gallery ordered by ascending position.
  // Validates: Requirements 1.6
  it('Property 3: gallery is ordered by ascending position', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: -100, max: 100 }), {
          minLength: 0,
          maxLength: 10,
        }),
        async (positions) => {
          const fixture = buildFixture(
            {
              isPublished: true,
              featured: false,
              categorySlug: null,
              tagSlugs: [],
              techNames: [],
              title: 'Title',
              shortDesc: null,
              problem: '',
              solution: '',
              results: '',
              liveUrl: 'https://x',
              repoUrl: 'https://y',
              imagePositions: positions,
            },
            0,
          );
          mockDb.__setPortfolios([fixture]);

          const result = await service.findPublishedBySlug(fixture.slug);

          const returned = result.images.map((img: any) => img.position);
          for (let i = 1; i < returned.length; i++) {
            expect(returned[i]).toBeGreaterThanOrEqual(returned[i - 1]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 4: Lookups never return unpublished projects (findPublishedBySlug throws 404 / NotFoundException for unpublished or missing).
  // Validates: Requirements 1.5
  it('Property 4: lookups never return unpublished projects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(rawSpecArb, { minLength: 1, maxLength: 8 }),
        fc.string(),
        async (specs, randomSlug) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPortfolios(fixtures);

          // Unpublished projects must always 404 (Req 1.5).
          for (const f of fixtures.filter((x) => !x.isPublished)) {
            await expect(
              service.findPublishedBySlug(f.slug),
            ).rejects.toBeInstanceOf(NotFoundException);
          }

          // Published projects resolve.
          for (const f of fixtures.filter((x) => x.isPublished)) {
            await expect(
              service.findPublishedBySlug(f.slug),
            ).resolves.toBeDefined();
          }

          // A guaranteed-absent slug 404s (Req 1.4 boundary).
          await expect(
            service.findPublishedBySlug(`absent-${randomSlug}`),
          ).rejects.toBeInstanceOf(NotFoundException);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 5: Public list returns only published items matching all active filters (category, featured, none).
  // Validates: Requirements 2.1, 2.5, 2.6
  it('Property 5: public list returns only published items matching active filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(rawSpecArb, { minLength: 0, maxLength: 10 }),
        fc.constantFrom('category', 'featured', 'none'),
        fc.constantFrom(...CATEGORY_SLUGS),
        async (specs, filterKind, categorySlug) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPortfolios(fixtures);

          const params: any = { page: 1, limit: BIG_LIMIT };
          if (filterKind === 'category') params.category = categorySlug;
          if (filterKind === 'featured') params.featured = true;

          const { data } = await service.findPublic(params);

          // Every returned item is published (Req 2.5).
          for (const item of data) {
            expect(item.isPublished).toBe(true);
            if (filterKind === 'category') {
              expect(item.category?.slug).toBe(categorySlug);
            }
            if (filterKind === 'featured') {
              expect(item.featured).toBe(true);
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
            .filter((p) => (filterKind === 'featured' ? p.featured : true))
            .map((p) => p.id)
            .sort();
          const actual = data.map((p: any) => p.id).sort();
          expect(actual).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 6: Tag and tech filters use AND semantics.
  // Validates: Requirements 2.2, 2.3
  it('Property 6: tag and tech filters use AND semantics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(rawSpecArb, { minLength: 0, maxLength: 10 }),
        fc.subarray(TAG_SLUGS),
        fc.subarray(TECH_NAMES),
        async (specs, requestedTags, requestedTechs) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPortfolios(fixtures);

          const { data } = await service.findPublic({
            page: 1,
            limit: BIG_LIMIT,
            tags: requestedTags.length ? requestedTags : undefined,
            tech: requestedTechs.length ? requestedTechs : undefined,
          });

          // Every returned item is published and carries ALL requested tags/techs.
          for (const item of data) {
            expect(item.isPublished).toBe(true);
            const itemTagSlugs = item.tags.map((t: any) => t.tag.slug);
            for (const t of requestedTags) {
              expect(itemTagSlugs).toContain(t);
            }
            const itemTechNames = item.techStacks.map((t: any) => t.tech.name);
            for (const t of requestedTechs) {
              expect(itemTechNames).toContain(t);
            }
          }

          // Independent oracle: exact set.
          const expected = fixtures
            .filter((p) => p.isPublished)
            .filter((p) => {
              const tagSlugs = p.tags.map((t: any) => t.tag.slug);
              const techNames = p.techStacks.map((t: any) => t.tech.name);
              return (
                requestedTags.every((t) => tagSlugs.includes(t)) &&
                requestedTechs.every((t) => techNames.includes(t))
              );
            })
            .map((p) => p.id)
            .sort();
          const actual = data.map((p: any) => p.id).sort();
          expect(actual).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 7: Search returns exactly the case-insensitive title/shortDesc matches.
  // Validates: Requirements 2.4
  it('Property 7: search returns exactly the case-insensitive matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        // All published per the property statement ("set of published projects").
        fc.array(
          rawSpecArb.map((s) => ({ ...s, isPublished: true })),
          { minLength: 0, maxLength: 12 },
        ),
        fc
          .tuple(fc.constantFrom(...WORD_POOL), fc.boolean())
          .map(([w, upper]) => (upper ? w.toUpperCase() : w.toLowerCase())),
        async (specs, term) => {
          const fixtures = specs.map((s, i) => buildFixture(s, i));
          mockDb.__setPortfolios(fixtures);

          const { data } = await service.findPublic({
            page: 1,
            limit: BIG_LIMIT,
            search: term,
          });

          const needle = term.toLowerCase();
          const expected = fixtures
            .filter(
              (p) =>
                (p.title ?? '').toLowerCase().includes(needle) ||
                (p.shortDesc ?? '').toLowerCase().includes(needle),
            )
            .map((p) => p.id)
            .sort();
          const actual = data.map((p: any) => p.id).sort();
          expect(actual).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});
