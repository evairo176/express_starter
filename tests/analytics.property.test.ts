import fc from 'fast-check';

/**
 * Analytics module property-based tests (Properties 30-31).
 *
 * These tests exercise the real `AnalyticsService` (`recordVisit`,
 * `getSummary`, `getAggregations`) against an in-memory fake of the Prisma
 * `db` methods the service uses:
 *   - visitEvent.create / count / findMany
 *   - blogPost.findMany (orderBy totalViews desc, take 5)
 *   - portfolioView.groupBy (by portfolioId, _count, orderBy desc, take 5)
 *   - portfolio.groupBy (by categoryId, _count._all)
 *   - portfolioTagOnPortfolio.groupBy (by tagId, _count.tagId)
 *   - techStackOnPortfolio.groupBy (by techId, _count.techId)
 *   - portfolio / portfolioCategory / portfolioTag / techStack findMany
 *     (name resolution via { where: { id: { in: [...] } } })
 *
 * The fakes mirror Prisma grouping/ordering semantics over the supplied
 * fixtures so each property asserts the SERVICE's observable contract.
 *
 * Fixtures are installed via the `__setData` accessor exposed on the mocked db.
 */

interface FakeData {
  visitEvents: { id: string; path: string; createdAt: Date }[];
  blogPosts: { id: string; title: string; slug: string; totalViews: number }[];
  portfolioViews: { id: string; portfolioId: string }[];
  portfolios: { id: string; title: string; slug: string; categoryId: string | null }[];
  tagRelations: { portfolioId: string; tagId: string }[];
  techRelations: { portfolioId: string; techId: string }[];
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  techs: { id: string; name: string }[];
}

jest.mock('../src/database/database', () => {
  const store: { data: FakeData } = {
    data: {
      visitEvents: [],
      blogPosts: [],
      portfolioViews: [],
      portfolios: [],
      tagRelations: [],
      techRelations: [],
      categories: [],
      tags: [],
      techs: [],
    },
  };

  let visitSeq = 0;

  // Generic groupBy mirroring Prisma: group rows by the `by` keys, and emit a
  // `_count` object whose shape matches the requested `_count` argument.
  function groupBy(rows: any[], by: string[], countArg: any): any[] {
    const groups = new Map<string, { keyValues: any; rows: any[] }>();
    for (const row of rows) {
      const keyValues: Record<string, any> = {};
      for (const k of by) keyValues[k] = row[k];
      const mapKey = JSON.stringify(by.map((k) => row[k]));
      if (!groups.has(mapKey)) groups.set(mapKey, { keyValues, rows: [] });
      groups.get(mapKey)!.rows.push(row);
    }
    return Array.from(groups.values()).map(({ keyValues, rows: groupRows }) => {
      const _count: Record<string, number> = {};
      for (const ck of Object.keys(countArg)) {
        if (ck === '_all') {
          _count._all = groupRows.length;
        } else {
          // Prisma counts non-null values of the named field within the group.
          _count[ck] = groupRows.filter((r) => r[ck] != null).length;
        }
      }
      return { ...keyValues, _count };
    });
  }

  function filterByIdIn(rows: any[], where: any): any[] {
    const ids: any[] = where?.id?.in ?? [];
    const set = new Set(ids);
    return rows.filter((r) => set.has(r.id));
  }

  return {
    db: {
      __setData: (data: Partial<FakeData>) => {
        store.data = {
          visitEvents: [],
          blogPosts: [],
          portfolioViews: [],
          portfolios: [],
          tagRelations: [],
          techRelations: [],
          categories: [],
          tags: [],
          techs: [],
          ...data,
        };
        visitSeq = 0;
      },
      visitEvent: {
        create: jest.fn(async ({ data }: any) => {
          const event = {
            id: `visit-${visitSeq++}`,
            path: data.path,
            createdAt: new Date(),
          };
          store.data.visitEvents.push(event);
          return event;
        }),
        count: jest.fn(async (args?: any) => {
          const gte = args?.where?.createdAt?.gte as Date | undefined;
          if (gte) {
            return store.data.visitEvents.filter(
              (e) => e.createdAt.getTime() >= gte.getTime(),
            ).length;
          }
          return store.data.visitEvents.length;
        }),
        findMany: jest.fn(async (args?: any) => {
          let rows = [...store.data.visitEvents];
          const path = args?.where?.path;
          if (path !== undefined) rows = rows.filter((e) => e.path === path);
          return rows;
        }),
      },
      blogPost: {
        findMany: jest.fn(async ({ orderBy, take, select }: any) => {
          let rows = [...store.data.blogPosts];
          if (orderBy?.totalViews === 'desc') {
            rows.sort((a, b) => b.totalViews - a.totalViews);
          }
          if (take !== undefined) rows = rows.slice(0, take);
          if (select) {
            return rows.map((r) => {
              const out: any = {};
              for (const k of Object.keys(select)) if (select[k]) out[k] = (r as any)[k];
              return out;
            });
          }
          return rows;
        }),
      },
      portfolioView: {
        groupBy: jest.fn(async ({ by, _count, orderBy, take }: any) => {
          let groups = groupBy(store.data.portfolioViews, by, _count);
          if (orderBy?._count?.portfolioId === 'desc') {
            groups.sort((a, b) => b._count.portfolioId - a._count.portfolioId);
          }
          if (take !== undefined) groups = groups.slice(0, take);
          return groups;
        }),
      },
      portfolio: {
        groupBy: jest.fn(async ({ by, _count }: any) =>
          groupBy(store.data.portfolios, by, _count),
        ),
        findMany: jest.fn(async ({ where, select }: any) => {
          const rows = filterByIdIn(store.data.portfolios, where);
          if (select) {
            return rows.map((r) => {
              const out: any = {};
              for (const k of Object.keys(select)) if (select[k]) out[k] = (r as any)[k];
              return out;
            });
          }
          return rows;
        }),
      },
      portfolioTagOnPortfolio: {
        groupBy: jest.fn(async ({ by, _count }: any) =>
          groupBy(store.data.tagRelations, by, _count),
        ),
      },
      techStackOnPortfolio: {
        groupBy: jest.fn(async ({ by, _count }: any) =>
          groupBy(store.data.techRelations, by, _count),
        ),
      },
      portfolioCategory: {
        findMany: jest.fn(async ({ where }: any) =>
          filterByIdIn(store.data.categories, where),
        ),
      },
      portfolioTag: {
        findMany: jest.fn(async ({ where }: any) =>
          filterByIdIn(store.data.tags, where),
        ),
      },
      techStack: {
        findMany: jest.fn(async ({ where }: any) =>
          filterByIdIn(store.data.techs, where),
        ),
      },
    },
  };
});

import { db } from '../src/database/database';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';

const mockDb = db as unknown as {
  __setData: (data: Partial<FakeData>) => void;
};
const service = new AnalyticsService();

// ---------------------------------------------------------------------------
// Fixture generation helpers
// ---------------------------------------------------------------------------

const CATEGORY_IDS = ['cat-1', 'cat-2', 'cat-3'];
const TAG_IDS = ['tag-1', 'tag-2', 'tag-3', 'tag-4'];
const TECH_IDS = ['tech-1', 'tech-2', 'tech-3'];

// A project spec carrying its category and (deduped) tag/tech relations.
const projectSpecArb = fc.record({
  categoryId: fc.option(fc.constantFrom(...CATEGORY_IDS), { nil: null }),
  tagIds: fc.uniqueArray(fc.constantFrom(...TAG_IDS)),
  techIds: fc.uniqueArray(fc.constantFrom(...TECH_IDS)),
  viewCount: fc.integer({ min: 0, max: 5 }),
});

const aggregationDatasetArb = fc
  .array(projectSpecArb, { minLength: 0, maxLength: 12 })
  .chain((specs) =>
    fc
      .array(fc.integer({ min: 0, max: 1000 }), {
        minLength: 0,
        maxLength: 8,
      })
      .map((postViews) => ({ specs, postViews })),
  );

function buildData(
  specs: {
    categoryId: string | null;
    tagIds: string[];
    techIds: string[];
    viewCount: number;
  }[],
  postViews: number[],
): FakeData {
  const portfolios = specs.map((s, i) => ({
    id: `proj-${i}`,
    title: `Project ${i}`,
    slug: `project-${i}`,
    categoryId: s.categoryId,
  }));

  const tagRelations: { portfolioId: string; tagId: string }[] = [];
  const techRelations: { portfolioId: string; techId: string }[] = [];
  const portfolioViews: { id: string; portfolioId: string }[] = [];

  specs.forEach((s, i) => {
    for (const tagId of s.tagIds) tagRelations.push({ portfolioId: `proj-${i}`, tagId });
    for (const techId of s.techIds)
      techRelations.push({ portfolioId: `proj-${i}`, techId });
    for (let v = 0; v < s.viewCount; v++)
      portfolioViews.push({ id: `view-${i}-${v}`, portfolioId: `proj-${i}` });
  });

  const blogPosts = postViews.map((totalViews, i) => ({
    id: `post-${i}`,
    title: `Post ${i}`,
    slug: `post-${i}`,
    totalViews,
  }));

  return {
    visitEvents: [],
    blogPosts,
    portfolioViews,
    portfolios,
    tagRelations,
    techRelations,
    categories: CATEGORY_IDS.map((id) => ({ id, name: id, slug: id })),
    tags: TAG_IDS.map((id) => ({ id, name: id, slug: id })),
    techs: TECH_IDS.map((id) => ({ id, name: id })),
  };
}

describe('Analytics module property-based tests', () => {
  // Feature: portfolio-upgrade, Property 30: Visit events round-trip. For any tracked path, recording a visit and then querying produces a visit event carrying that path and a timestamp.
  // Validates: Requirements 11.1
  it('Property 30: visit events round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (path) => {
          mockDb.__setData({});

          const before = Date.now();
          const created = await service.recordVisit({ path });
          const after = Date.now();

          // The created event carries the path and a timestamp.
          expect(created.path).toBe(path);
          expect(created.createdAt).toBeInstanceOf(Date);
          expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(before);
          expect(created.createdAt.getTime()).toBeLessThanOrEqual(after);

          // Querying back produces an event with that path and a timestamp.
          const found = await db.visitEvent.findMany({ where: { path } });
          expect(found.length).toBeGreaterThanOrEqual(1);
          const match = found.find((e: any) => e.id === created.id);
          expect(match).toBeDefined();
          expect(match!.path).toBe(path);
          expect(match!.createdAt).toBeInstanceOf(Date);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 31: Analytics aggregations match naive recomputation. getAggregations counts equal a naive recomputation over the same fixtures; and getSummary top-5 lists are sorted by view count descending with length at most 5.
  // Validates: Requirements 11.2, 11.3
  it('Property 31: analytics aggregations match naive recomputation', async () => {
    await fc.assert(
      fc.asyncProperty(aggregationDatasetArb, async ({ specs, postViews }) => {
        const data = buildData(specs, postViews);
        mockDb.__setData(data);

        // ---- getAggregations vs naive recomputation (Req 11.3) ----
        const aggregations = await service.getAggregations();

        // Naive category counts (grouped by categoryId, including null).
        const naiveCategory = new Map<string | null, number>();
        for (const p of data.portfolios)
          naiveCategory.set(p.categoryId, (naiveCategory.get(p.categoryId) ?? 0) + 1);
        const actualCategory = new Map<string | null, number>();
        for (const row of aggregations.byCategory)
          actualCategory.set(row.categoryId, row.count);
        expect(actualCategory).toEqual(naiveCategory);

        // Naive tag counts.
        const naiveTag = new Map<string, number>();
        for (const r of data.tagRelations)
          naiveTag.set(r.tagId, (naiveTag.get(r.tagId) ?? 0) + 1);
        const actualTag = new Map<string, number>();
        for (const row of aggregations.byTag) actualTag.set(row.tagId, row.count);
        expect(actualTag).toEqual(naiveTag);

        // Naive tech counts.
        const naiveTech = new Map<string, number>();
        for (const r of data.techRelations)
          naiveTech.set(r.techId, (naiveTech.get(r.techId) ?? 0) + 1);
        const actualTech = new Map<string, number>();
        for (const row of aggregations.byTech) actualTech.set(row.techId, row.count);
        expect(actualTech).toEqual(naiveTech);

        // ---- getSummary top-5 ordering and length (Req 11.2) ----
        const summary = await service.getSummary();

        // Top posts: length <= 5 and sorted by totalViews desc.
        expect(summary.topPosts.length).toBeLessThanOrEqual(5);
        for (let i = 1; i < summary.topPosts.length; i++) {
          expect(summary.topPosts[i - 1].totalViews).toBeGreaterThanOrEqual(
            summary.topPosts[i].totalViews,
          );
        }

        // Top projects: length <= 5 and sorted by view count desc.
        expect(summary.topProjects.length).toBeLessThanOrEqual(5);
        for (let i = 1; i < summary.topProjects.length; i++) {
          expect(summary.topProjects[i - 1].views).toBeGreaterThanOrEqual(
            summary.topProjects[i].views,
          );
        }
      }),
      { numRuns: 100 },
    );
  });
});
