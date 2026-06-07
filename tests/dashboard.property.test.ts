import fc from 'fast-check';

/**
 * Admin dashboard module property-based tests (Properties 27, 28, 29).
 *
 * Properties 27 and 29 exercise the real `DashboardService`
 * (`toggleProjectPublished`, `togglePostPublished`, `listProjects`,
 * `listPosts`) against an in-memory fake of the Prisma `db.portfolio` and
 * `db.blogPost` methods those code paths use (`findUnique`, `update`,
 * `findMany`, `count`). The fake mirrors the documented Prisma semantics the
 * services rely on (id lookup, mutation persistence, ordering, skip/take).
 *
 * Property 28 is integration-style: it drives the real Express app via
 * supertest, hitting representative protected dashboard + analytics endpoints
 * WITHOUT an Authorization header and asserting a 401. `authenticateJWT`
 * rejects before any DB access, so the mocked DB is never consulted there.
 */

jest.mock('../src/database/database', () => {
  // Separate in-memory stores per model.
  const stores: Record<string, any[]> = {
    portfolio: [],
    blogPost: [],
    testimonial: [],
  };

  function matchWhere(item: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      const val = where[key];
      if (key === 'id') {
        if (item.id !== val) return false;
      } else if (key === 'slug') {
        if (item.slug !== val) return false;
      } else if (key === 'isPublished') {
        if (item.isPublished !== val) return false;
      } else if (key === 'OR') {
        if (!val.some((c: any) => matchWhere(item, c))) return false;
      } else if (key === 'AND') {
        if (!val.every((c: any) => matchWhere(item, c))) return false;
      } else if (key === 'title' || key === 'slug') {
        const text: string = item[key] ?? '';
        const needle: string = val.contains ?? '';
        if (val.mode === 'insensitive') {
          if (!text.toLowerCase().includes(needle.toLowerCase())) return false;
        } else if (!text.includes(needle)) {
          return false;
        }
      }
    }
    return true;
  }

  function makeModel(name: string) {
    return {
      findUnique: jest.fn(async ({ where }: any) => {
        const found = stores[name].find((it) => matchWhere(it, where));
        return found ? { ...found } : null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = stores[name].findIndex((it) => matchWhere(it, where));
        if (idx === -1) {
          throw new Error(`Record to update not found in ${name}`);
        }
        stores[name][idx] = { ...stores[name][idx], ...data };
        return { ...stores[name][idx] };
      }),
      findMany: jest.fn(async ({ where, orderBy, skip = 0, take }: any) => {
        let rows = stores[name].filter((it) => matchWhere(it, where));
        if (orderBy) {
          const [field, dir] = Object.entries(orderBy)[0] as [string, string];
          rows = [...rows].sort((a, b) => {
            const av = a[field];
            const bv = b[field];
            const cmp =
              av instanceof Date || typeof av === 'string'
                ? new Date(av).getTime() - new Date(bv).getTime()
                : av - bv;
            return dir === 'desc' ? -cmp : cmp;
          });
        }
        if (skip) rows = rows.slice(skip);
        if (take !== undefined) rows = rows.slice(0, take);
        return rows.map((r) => ({ ...r }));
      }),
      count: jest.fn(
        async ({ where }: any) =>
          stores[name].filter((it) => matchWhere(it, where)).length,
      ),
    };
  }

  return {
    db: {
      __setData: (model: string, items: any[]) => {
        stores[model] = items;
      },
      portfolio: makeModel('portfolio'),
      blogPost: makeModel('blogPost'),
      testimonial: makeModel('testimonial'),
    },
  };
});

import { db } from '../src/database/database';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { TestimonialService } from '../src/modules/testimonial/testimonial.service';

const mockDb = db as unknown as {
  __setData: (model: string, items: any[]) => void;
};
const service = new DashboardService();
const testimonialService = new TestimonialService();

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function buildProject(i: number, isPublished: boolean) {
  return {
    id: `proj-${i}`,
    slug: `proj-${i}`,
    title: `Project ${i}`,
    shortDesc: null,
    description: 'desc',
    isPublished,
    featured: false,
    updatedAt: new Date(2020, 0, 1 + i).toISOString(),
    // Relations the admin list `include` expects.
    category: null,
    images: [],
    tags: [],
    techStacks: [],
  };
}

function buildPost(i: number, isPublished: boolean) {
  return {
    id: `post-${i}`,
    slug: `post-${i}`,
    title: `Post ${i}`,
    isPublished,
    updatedAt: new Date(2020, 0, 1 + i).toISOString(),
    createdAt: new Date(2020, 0, 1 + i).toISOString(),
    // Relations the findById `include` expects.
    category: null,
    tags: [],
  };
}

function buildTestimonial(i: number, isPublished: boolean) {
  return {
    id: `testimonial-${i}`,
    authorName: `Author ${i}`,
    authorRole: `Role ${i}`,
    quote: `Quote ${i}`,
    isPublished,
    createdAt: new Date(2020, 0, 1 + i).toISOString(),
  };
}

describe('Admin dashboard property-based tests', () => {
  // Feature: portfolio-upgrade, Property 27: Published-state toggle round-trips
  // Validates: Requirements 9.3, 10.6
  it('Property 27: published-state toggle round-trips for projects and posts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // initial published state
        fc.option(fc.boolean(), { nil: undefined }), // target state (undefined => flip)
        fc.constantFrom('project', 'post', 'testimonial'),
        async (initial, target, kind) => {
          if (kind === 'project') {
            const fixture = buildProject(0, initial);
            mockDb.__setData('portfolio', [fixture]);

            const expected = typeof target === 'boolean' ? target : !initial;

            const toggled = await service.toggleProjectPublished(
              fixture.id,
              target,
            );
            // Toggle persists and returns the new state.
            expect(toggled.isPublished).toBe(expected);

            // A subsequent read returns the persisted state.
            const read = await service.getProject(fixture.id);
            expect(read.isPublished).toBe(expected);
          } else if (kind === 'post') {
            const fixture = buildPost(0, initial);
            mockDb.__setData('blogPost', [fixture]);

            const expected = typeof target === 'boolean' ? target : !initial;

            const toggled = await service.togglePostPublished(
              fixture.id,
              target,
            );
            expect(toggled?.isPublished).toBe(expected);

            const read = await service.getPost(fixture.id);
            expect(read?.isPublished).toBe(expected);
          } else {
            const fixture = buildTestimonial(0, initial);
            mockDb.__setData('testimonial', [fixture]);

            // TestimonialService.setPublished requires an explicit boolean;
            // when the generated target is undefined, flip the current state.
            const expected = typeof target === 'boolean' ? target : !initial;

            const toggled = await testimonialService.setPublished(
              fixture.id,
              expected,
            );
            expect(toggled.isPublished).toBe(expected);

            const read = await testimonialService.findById(fixture.id);
            expect(read?.isPublished).toBe(expected);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 29: Admin lists include both published and unpublished items
  // Validates: Requirements 10.4, 10.5
  it('Property 29: admin lists include both published and unpublished items with metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Arbitrary mix of published flags; ensure at least one of each below.
        fc.array(fc.boolean(), { minLength: 0, maxLength: 12 }),
        fc.constantFrom('project', 'post'),
        async (flagsRaw, kind) => {
          // Guarantee a mix containing both states (per the property statement).
          const flags = [true, false, ...flagsRaw];

          if (kind === 'project') {
            const fixtures = flags.map((f, i) => buildProject(i, f));
            mockDb.__setData('portfolio', fixtures);

            // Big limit so every item lands on a single page for set comparison.
            const { data, metadata } = await service.listProjects({
              page: 1,
              limit: 1000,
            });

            const ids = data.map((p: any) => p.id).sort();
            expect(ids).toEqual(fixtures.map((p) => p.id).sort());
            // Both states present in the returned list.
            expect(data.some((p: any) => p.isPublished === true)).toBe(true);
            expect(data.some((p: any) => p.isPublished === false)).toBe(true);
            // Valid Pagination_Metadata.
            expect(metadata.total).toBe(fixtures.length);
            expect(metadata.page).toBe(1);
            expect(metadata.limit).toBe(1000);
            expect(metadata.totalPages).toBe(
              Math.ceil(fixtures.length / 1000),
            );
            expect(metadata.hasPrev).toBe(false);
          } else {
            const fixtures = flags.map((f, i) => buildPost(i, f));
            mockDb.__setData('blogPost', fixtures);

            const { data, metadata } = await service.listPosts({
              page: 1,
              limit: 1000,
            });

            const ids = data.map((p: any) => p.id).sort();
            expect(ids).toEqual(fixtures.map((p) => p.id).sort());
            expect(data.some((p: any) => p.isPublished === true)).toBe(true);
            expect(data.some((p: any) => p.isPublished === false)).toBe(true);
            expect(metadata.total).toBe(fixtures.length);
            expect(metadata.page).toBe(1);
            expect(metadata.limit).toBe(1000);
            expect(metadata.totalPages).toBe(
              Math.ceil(fixtures.length / 1000),
            );
            expect(metadata.hasPrev).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 28: integration via supertest against the real app.
// ---------------------------------------------------------------------------

import app, { server } from '../src/index';
import { config } from '../src/config/app.config';
const request = require('supertest');

const BASE = config.BASE_PATH; // default /api/v1

// Representative protected admin/analytics endpoints (require authenticateJWT).
const PROTECTED_ENDPOINTS = [
  `${BASE}/dashboard/projects`,
  `${BASE}/dashboard/posts`,
  `${BASE}/dashboard/analytics`,
  `${BASE}/analytics/summary`,
  `${BASE}/analytics/aggregations`,
];

describe('Property 28: protected admin endpoints reject unauthenticated requests', () => {
  afterAll(() => {
    // No-op in the test env where the server is not started; guards open handles.
    server?.close();
  });

  // Feature: portfolio-upgrade, Property 28: Protected admin endpoints reject unauthenticated requests
  // Validates: Requirements 10.3, 11.4
  it('returns 401 for every protected endpoint when no Authorization header is sent', async () => {
    for (const endpoint of PROTECTED_ENDPOINTS) {
      const res = await request(app).get(endpoint);
      expect(res.statusCode).toBe(401);
    }
  });
});
