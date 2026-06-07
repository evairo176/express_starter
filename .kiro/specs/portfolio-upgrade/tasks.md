# Implementation Plan: Portfolio Upgrade

## Overview

This plan implements the portfolio upgrade across the Express + TypeScript + Prisma backend and the React + Vite frontend. Work proceeds bottom-up: first the Prisma schema and migration, then the `src/cummon` -> `src/common` rename, then cross-cutting utilities (pagination, cache, rate limiters, security, validation, SEO), then the feature modules (portfolio, blog and its sub-modules, contact, newsletter, testimonial, analytics, seo, dashboard), then the frontend TanStack Router migration, and finally the test suites where they are not co-located.

Property-based tests use **fast-check** and are tagged `Feature: portfolio-upgrade, Property {number}: {property_text}`. Each of the 36 design properties maps to exactly one property-test sub-task. Test sub-tasks are marked optional with `*`.

## Tasks

- [x] 1. Schema, migration, and folder rename foundation
  - [x] 1.1 Extend Prisma schema with all new models and fields
    - In `prisma/schema.prisma`, add `problem`, `solution`, `results` (`String? @db.Text`) and a `views PortfolioView[]` relation to `Portfolio`.
    - Add `BlogCategory`, `BlogTag`, `BlogTagOnBlogPost`, `BlogComment`, `BlogReaction`, `BlogPostView` models, and add `categoryId`/`category`, `tags`, `comments`, `reactions`, `views` relations to `BlogPost`.
    - Add `ContactMessage`, `NewsletterSubscription`, `Testimonial`, `VisitEvent`, and `PortfolioView` models exactly as specified in the design Data Models section (indexes and `@@unique` constraints included).
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 5b.1, 7.1, 8.1, 9.1, 11.1_

  - [x] 1.2 Generate and apply the Prisma migration and regenerate the client
    - Run `npx prisma migrate dev` to create the migration for all new models/fields and run `npx prisma generate`.
    - Verify the migration compiles against the existing database schema with no conflicts.
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 5b.1, 7.1, 8.1, 9.1, 11.1_

  - [x] 1.3 Rename `src/cummon` to `src/common` with import updates
    - Move `src/cummon` to `src/common` (enums, interface, strategies, utils, zod) using import-aware relocation so every `cummon` import path is rewritten to `common`.
    - Ensure `src/cummon` no longer exists and no source file references `cummon`.
    - _Requirements: 17.1, 17.2_

  - [x]* 1.4 Add smoke test for the common rename
    - Assert `src/cummon` does not exist, `src/common` exists, and a grep finds no `cummon` references in `src/`.
    - Verify `npx tsc --noEmit` reports no module-resolution errors caused by the rename.
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 2. Pagination utility
  - [x] 2.1 Implement pagination util and schema
    - Create `src/common/utils/pagination.ts` with `PaginationMetadata`, `PaginationQuerySchema` (`page`/`limit` coerced positive ints, defaults 1 and 10), and `buildPaginationMetadata(total, page, limit)` computing `totalPages = ceil(total/limit)`, `hasNext = page < totalPages`, `hasPrev = page > 1`.
    - Create `src/common/zod/pagination.schema.ts` re-exporting the shared page/limit coercion for module schemas.
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 2.7, 2.8_

  - [x]* 2.2 Write property test for pagination metadata
    - **Property 8: Pagination metadata is correct and consistent**
    - **Validates: Requirements 2.7, 15.1, 15.2**

  - [x]* 2.3 Write property test for out-of-range page handling
    - **Property 9: Out-of-range page yields empty data, not an error**
    - **Validates: Requirements 15.4**

  - [x]* 2.4 Write property test for invalid pagination input
    - **Property 10: Invalid pagination input is rejected**
    - **Validates: Requirements 2.8, 15.3**

- [x] 3. Cross-cutting middleware: cache, rate limiting, security, validation
  - [x] 3.1 Implement the cache layer and cache middleware
    - Create `src/common/cache/cache.ts` with a TTL `CacheStore` (`get`, `set(key, value, ttlMs)`, `delByTag(tag)`) bounding effective TTL to a configured max.
    - Create `src/middlewares/cache/index.ts` that keys public GET responses on method + path + query and serves valid entries without hitting the service/DB, with tag assignment for later invalidation.
    - _Requirements: 14.1, 14.2, 14.3_

  - [x]* 3.2 Write property test for cache TTL bounding and serve-without-DB
    - **Property 35: Cache TTL is bounded and serves without the database**
    - **Validates: Requirements 14.1, 14.2**

  - [x]* 3.3 Write property test for cache invalidation by tag
    - **Property 36: Cache invalidation by tag**
    - **Validates: Requirements 14.3**

  - [x] 3.4 Implement rate limiters
    - Create `src/middlewares/rate-limit/index.ts` exporting `authLimiter` and `writeLimiter` via `express-rate-limit`, both returning 429 on exceed.
    - _Requirements: 12.1, 12.2_

  - [x] 3.5 Implement security config and validation middleware
    - Create `src/config/security.config.ts` with the CORS allowlist parsed from env, and wire `helmet()` + `cors()` allowlist in `src/index.ts`.
    - Create `src/middlewares/validate/index.ts` providing a `validate(schema)` wrapper and an empty-body guard that returns 400 before processing.
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

  - [x]* 3.6 Write property test for body validation before side effects
    - **Property 32: Invalid request bodies are rejected before processing**
    - **Validates: Requirements 12.5, 12.6**

  - [x]* 3.7 Write smoke/integration tests for security and rate limiting
    - Assert helmet headers are present on responses (Req 12.3) and CORS allowlist enforcement (Req 12.4).
    - Assert `authLimiter` and `writeLimiter` return 429 when limits are exceeded using a few representative requests.
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 4. Shared Zod schemas and pure utilities
  - [x] 4.1 Add new Zod schemas under `src/common/zod`
    - Create `blog-comment.schema.ts` (name non-empty, email format, body min 1 max 2000), `blog-reaction.schema.ts` (type optional default "like"), `blog-category.schema.ts`, `blog-tag.schema.ts`, `contact.schema.ts` (name/email/subject/body required), `newsletter.schema.ts` (email), `testimonial.schema.ts` (authorName/authorRole/quote required, isPublished optional), and the public portfolio/blog list filter schemas (category, tags, tech, search, featured).
    - _Requirements: 3.7, 4.3, 4.4, 4.5, 7.4, 8.3, 9.4, 12.5, 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 4.2 Implement reading-time utility
    - Create `src/common/utils/reading-time.ts` computing `max(1, ceil(wordCount / 200))` from post content word count.
    - _Requirements: 6.1_

  - [x]* 4.3 Write property test for reading-time formula
    - **Property 19: Reading time formula**
    - **Validates: Requirements 6.1**

- [x] 5. Portfolio module: rich detail, filtering, search
  - [x] 5.1 Implement portfolio public detail by slug
    - In `src/modules/portfolio/`, add `findPublishedBySlug(slug)` returning problem/solution/results, gallery ordered by `position` asc, liveUrl, repoUrl, category, tags, and tech stack with `name` + `icon`; throw `NotFoundException` (404) when slug is missing or `isPublished = false`.
    - Add `GET /portfolio/public/:slug` route (cached, no auth).
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x]* 5.2 Write property test for case-study fields round-trip
    - **Property 1: Case-study fields round-trip**
    - **Validates: Requirements 1.1**

  - [x]* 5.3 Write property test for published detail completeness
    - **Property 2: Published project detail contains all required fields**
    - **Validates: Requirements 1.2, 1.3**

  - [x]* 5.4 Write property test for gallery ordering
    - **Property 3: Gallery is ordered by ascending position**
    - **Validates: Requirements 1.6**

  - [x]* 5.5 Write property test for unpublished lookup protection
    - **Property 4: Lookups never return unpublished projects**
    - **Validates: Requirements 1.5**

  - [x] 5.6 Implement portfolio public list with filters, search, featured, pagination
    - Add `findPublic(params)` constraining `isPublished = true`, category by slug, AND-semantics tag and tech filters, case-insensitive title/shortDesc search, `featured` filter, with `Pagination_Metadata`; add `GET /portfolio/public` route (cached).
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x]* 5.7 Write property test for published+filter list invariant
    - **Property 5: Public project list returns only published items matching all active filters**
    - **Validates: Requirements 2.1, 2.5, 2.6**

  - [x]* 5.8 Write property test for AND-semantics tag/tech filters
    - **Property 6: Tag and tech filters use AND semantics**
    - **Validates: Requirements 2.2, 2.3**

  - [x]* 5.9 Write property test for case-insensitive search
    - **Property 7: Search returns exactly the case-insensitive matches**
    - **Validates: Requirements 2.4**

- [x] 6. Checkpoint - foundation and portfolio
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Blog categories and tags modules
  - [x] 7.1 Implement blogCategory and blogTag modules
    - Create `src/modules/blogCategory/` and `src/modules/blogTag/` with controller/service/routes/module CRUD following the established convention.
    - _Requirements: 3.1_

  - [x] 7.2 Implement category/tag assignment on blog posts
    - In `src/modules/blogPost/`, add category (at most one) and tag (zero or more) assignment that persists associations and returns the updated post including category and tags; assigning a nonexistent category throws `BadRequestException` (400).
    - _Requirements: 3.1, 3.2, 3.3, 3.7_

  - [x]* 7.3 Write property test for category/tag assignment round-trip
    - **Property 11: Blog category and tag assignment round-trips**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 7.4 Implement public blog list filtered by category/tag slug
    - Add `GET /blog-posts/public` returning only published posts, filterable by category slug and tag slug, with search and pagination; empty filter results return empty list with metadata.
    - _Requirements: 3.4, 3.5, 3.6_

  - [x]* 7.5 Write property test for public blog list filter invariant
    - **Property 12: Public blog list returns only published items matching the filter**
    - **Validates: Requirements 3.4, 3.5, 3.6**

- [x] 8. Blog comments and reactions modules
  - [x] 8.1 Implement blogComment module
    - Create `src/modules/blogComment/` with create (validated name/email/body, starts unapproved when moderation enabled), public list of approved comments newest-first, and admin delete returning success only after deletion resolves.
    - Add public routes `GET`/`POST /blog-posts/public/:slug/comments` (POST rate-limited) and admin approve/delete routes.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]* 8.2 Write property test for valid comment round-trip + unapproved start
    - **Property 13: Valid comments round-trip and start unapproved**
    - **Validates: Requirements 4.1, 4.7**

  - [x]* 8.3 Write property test for public approved-comments ordering
    - **Property 14: Public comments are exactly the approved set, newest-first**
    - **Validates: Requirements 4.2, 4.7**

  - [x]* 8.4 Write property test for comment body length validation
    - **Property 15: Comment body length validation**
    - **Validates: Requirements 4.3, 4.4**

  - [x]* 8.5 Write property test for invalid email rejection
    - **Property 16: Invalid email is rejected**
    - **Validates: Requirements 4.5, 8.3**

  - [x]* 8.6 Write unit test for comment deletion sequencing
    - Verify admin delete returns success only after the deletion resolves.
    - _Requirements: 4.6_

  - [x] 8.7 Implement blogReaction module
    - Create `src/modules/blogReaction/` with `POST /blog-posts/public/:slug/reactions` (rate-limited) inserting a reaction row and returning the updated count; 404 when the post does not exist.
    - _Requirements: 5.1, 5.2, 5.3_

  - [x]* 8.8 Write property test for reaction count increment
    - **Property 17: Reaction count increases by the number of reactions submitted**
    - **Validates: Requirements 5.1, 5.2**

- [x] 9. Blog post enrichment: views, reading time, related posts
  - [x] 9.1 Implement accurate session-based view counting
    - In `src/modules/blogPost/`, increment view count at most once per `(postId, sessionId)` within 24h using `BlogPostView` `@@unique`, refreshing the row and incrementing when older than 24h; include current view count in public responses.
    - _Requirements: 5b.1, 5b.2, 5b.3_

  - [x] 9.2 Implement view-count reset migration
    - Add a one-time migration/script that resets every existing post's `totalViews` to 0 for the new tracking system.
    - _Requirements: 5b.4_

  - [x]* 9.3 Write property test for view-counting idempotence
    - **Property 18: View counting is idempotent within the 24-hour window**
    - **Validates: Requirements 5b.1, 5b.2, 5b.3**

  - [x]* 9.4 Write smoke test for the view-count reset migration
    - Verify running the migration sets all existing posts' view counts to 0.
    - _Requirements: 5b.4_

  - [x] 9.5 Implement public blog detail with reading time, reaction/view counts, related posts
    - Add `GET /blog-posts/public/:slug` returning category, tags, reaction count, view count, reading time, and up to 3 related published posts by shared category or tags (excluding the requested post), falling back to most-recent published posts when the post has no category and no tags.
    - _Requirements: 5.2, 5b.3, 6.1, 6.2, 6.3_

  - [x]* 9.6 Write property test for related-posts selection
    - **Property 20: Related posts selection is bounded, self-excluding, and relevant**
    - **Validates: Requirements 6.2, 6.3**

- [x] 10. Checkpoint - blog features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Contact module
  - [x] 11.1 Implement contact module
    - Create `src/modules/contact/` with `POST /contact` (rate-limited) validating name/email/subject/body, persisting `ContactMessage`, and attempting a Resend owner notification wrapped in try/catch so email failure still returns success; validation failure returns 400 and persists nothing.
    - Add `GET /contact` (admin) returning messages newest-first with pagination.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x]* 11.2 Write property test for contact submission round-trip + validation
    - **Property 21: Contact submission round-trips and validates**
    - **Validates: Requirements 7.1, 7.4**

  - [x]* 11.3 Write property test for admin contact list ordering
    - **Property 22: Admin contact list is newest-first with metadata**
    - **Validates: Requirements 7.5**

  - [x]* 11.4 Write integration test for email-failure resilience and notification call
    - Verify persistence + success when the mocked Resend client fails (Req 7.3) and that a notification email call is made on success (Req 7.2).
    - _Requirements: 7.2, 7.3_

- [x] 12. Newsletter module
  - [x] 12.1 Implement newsletter module
    - Create `src/modules/newsletter/` with `POST /newsletter/subscribe` persisting a subscription with a generated `unsubscribeToken`, treating duplicate email and lookup failures as idempotent success without duplicates, and rejecting invalid email with 400.
    - Add `GET /newsletter/unsubscribe?token=...` marking the subscription inactive and returning success.
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x]* 12.2 Write property test for subscription idempotence
    - **Property 23: Newsletter subscription is idempotent**
    - **Validates: Requirements 8.1, 8.2**

  - [x]* 12.3 Write property test for unsubscribe round-trip
    - **Property 24: Newsletter unsubscribe round-trip**
    - **Validates: Requirements 8.4**

- [x] 13. Testimonial module
  - [x] 13.1 Implement testimonial module
    - Create `src/modules/testimonial/` with `POST /testimonial` (admin) creating with authorName/authorRole/quote (missing field -> 400), `GET /testimonial/public` returning only published testimonials, and `PATCH /testimonial/:id/publish` (admin) persisting and returning the updated record.
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x]* 13.2 Write property test for testimonial create round-trip + validation
    - **Property 25: Testimonial create round-trip and validation**
    - **Validates: Requirements 9.1, 9.4**

  - [x]* 13.3 Write property test for public testimonials being published-only
    - **Property 26: Public testimonials are only published ones**
    - **Validates: Requirements 9.2**

- [x] 14. Admin dashboard module
  - [x] 14.1 Implement admin portfolio and blog CRUD with publish toggles
    - In `src/modules/dashboard/`, provide authenticated CRUD for portfolio projects and blog posts, admin lists returning both published and unpublished items with pagination, and publish-toggle endpoints persisting and returning the updated record; all endpoints require `authenticateJWT` (401 when unauthenticated).
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x]* 14.2 Write property test for published-state toggle round-trip
    - **Property 27: Published-state toggle round-trips**
    - **Validates: Requirements 9.3, 10.6**

  - [x]* 14.3 Write property test for unauthenticated rejection
    - **Property 28: Protected admin endpoints reject unauthenticated requests**
    - **Validates: Requirements 10.3, 11.4**

  - [x]* 14.4 Write property test for admin lists including both states
    - **Property 29: Admin lists include both published and unpublished items**
    - **Validates: Requirements 10.4, 10.5**

- [x] 15. Analytics module
  - [x] 15.1 Implement analytics module
    - Create `src/modules/analytics/` with `POST /analytics/visit` recording `VisitEvent { path, createdAt }`, `GET /analytics/summary` (admin) returning total visits, last-30-days visits, top 5 posts by `totalViews`, and top 5 projects by view metric, and `GET /analytics/aggregations` (admin) returning project counts grouped by category, tag, and tech via Prisma groupBy/count; admin endpoints return 401 when unauthenticated.
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x]* 15.2 Write property test for visit events round-trip
    - **Property 30: Visit events round-trip**
    - **Validates: Requirements 11.1**

  - [x]* 15.3 Write property test for analytics aggregations vs naive recomputation
    - **Property 31: Analytics aggregations match naive recomputation**
    - **Validates: Requirements 11.2, 11.3**

- [x] 16. SEO module
  - [x] 16.1 Implement SEO service and routes
    - Create `src/modules/seo/seo.service.ts` with `buildSitemap(items)`, `parseSitemap(xml)`, and `buildMeta(item)` (title, description, OG; metaImage always wins as OG image; derive metaDesc from shortDesc/excerpt when absent), and add `GET /sitemap.xml` returning canonical URLs of every published project and post.
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x]* 16.2 Write property test for sitemap completeness and round-trip
    - **Property 33: Sitemap completeness and round-trip**
    - **Validates: Requirements 13.1, 16.3**

  - [x]* 16.3 Write property test for meta and Open Graph derivation
    - **Property 34: Meta and Open Graph derivation**
    - **Validates: Requirements 13.2, 13.3, 13.4**

- [x] 17. Wire all modules into the Express app
  - [x] 17.1 Register routers, middleware order, and invalidation hooks
    - In `src/index.ts`, register all new module routers under `BASE_PATH`, apply the middleware pipeline order (body parsing, helmet, CORS allowlist, cookie/passport, morgan, per-router rate limiters, cache on public GET, authenticateJWT on protected, errorHandler + notFound last), and wire cache tag invalidation on portfolio/blog create/update/delete.
    - _Requirements: 12.3, 12.4, 14.3, 10.3, 11.4_

- [x] 18. Checkpoint - backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Frontend TanStack Router migration
  - [x] 19.1 Install TanStack Router and build the route tree
    - In `react-vite-starter`, add `@tanstack/react-router`, create `createRootRoute` + `createRoute` definitions preserving every existing path (public and protected) and compose them with `createRouter`.
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 19.2 Implement protected route guards and not-found handling
    - Add a protected pathless route using `beforeLoad` against `useAuthStore` (redirect unauthenticated to `/login`, render dashboard when authenticated, preserve hydration gating) and a single `notFoundComponent` rendering the existing NotFound view.
    - _Requirements: 18.5, 18.6, 18.7_

  - [x] 19.3 Swap RouterProvider and remove react-router-dom
    - Update `main.tsx` to use the TanStack `RouterProvider`, remove `react-router-dom` from `package.json`, and eliminate all `react-router-dom` imports.
    - _Requirements: 18.1, 18.8, 18.9_

  - [x]* 19.4 Write router migration example tests
    - Verify each public and protected path renders the expected component at the same URL, unauthenticated access to a protected route redirects to `/login`, authenticated access renders, and an unknown path renders not-found.
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [x]* 19.5 Write static + build checks for router migration
    - Grep + `package.json` inspection to confirm no `react-router-dom` references remain, and verify the Vite build completes without routing import errors.
    - _Requirements: 18.8, 18.9_

- [x] 20. Final test coverage and checkpoint
  - [x]* 20.1 Add endpoint coverage tests for new features
    - Add supertest tests covering success and validation-error paths for contact, newsletter, testimonial, blog comment, blog reaction, and portfolio filtering endpoints, ensuring the suite runs to completion with passing results.
    - _Requirements: 16.1, 16.2_

  - [x] 20.2 Final checkpoint - ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.
    - _Requirements: 16.2, 17.4_

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation sub-tasks are never optional.
- Each property test is a single fast-check test with a minimum of 100 iterations, tagged `Feature: portfolio-upgrade, Property {number}: {property_text}`.
- Service-level property tests run against an in-memory/mocked Prisma layer with a mocked Resend client; pure utilities (pagination, reading time, sitemap, meta, cache) are tested directly.
- Generators should exercise edge cases: whitespace-only and boundary-length comment bodies, non-ASCII content, empty filter results, out-of-range pages, and malformed emails.
- Each task references specific requirement sub-clauses for traceability, and checkpoints provide incremental validation.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4", "2.1", "3.1", "3.4", "4.2", "16.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.5", "3.6", "4.1", "4.3", "16.2", "16.3"] },
    { "id": 5, "tasks": ["5.1", "5.6", "7.1", "11.1", "12.1", "13.1", "15.1", "3.7"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.7", "5.8", "5.9", "7.2", "7.4", "8.7", "11.2", "11.3", "11.4", "12.2", "12.3", "13.2", "13.3", "15.2", "15.3"] },
    { "id": 7, "tasks": ["7.3", "7.5", "8.1", "9.1", "9.2", "14.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6", "8.8", "9.3", "9.4", "9.5", "14.2", "14.3", "14.4"] },
    { "id": 9, "tasks": ["9.6", "17.1"] },
    { "id": 10, "tasks": ["20.1"] },
    { "id": 11, "tasks": ["19.1"] },
    { "id": 12, "tasks": ["19.2", "19.3"] },
    { "id": 13, "tasks": ["19.4", "19.5"] }
  ]
}
```
