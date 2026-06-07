/**
 * Property-based test for Property 28 (unauthenticated rejection).
 *
 * Feature: portfolio-upgrade, Property 28: Protected admin endpoints reject
 * unauthenticated requests.
 *
 * "For any admin management or analytics endpoint, a request without valid
 * authentication receives a 401 response."
 *
 * This is an integration-style property test that drives the REAL Express app
 * (imported from `../src/index`) via supertest. fast-check generates, across
 * >= 100 runs, an arbitrary combination of:
 *   - a protected admin-management or analytics endpoint (path + HTTP method),
 *   - a missing / malformed / invalid Authorization header.
 *
 * `authenticateJWT` rejects before any controller or DB access runs, so each
 * generated request must produce a 401 regardless of the route's downstream
 * behavior. The DB is not mocked because it is never reached on the rejection
 * path.
 *
 * Validates: Requirements 10.3, 11.4
 */

import fc from 'fast-check';
import app, { server } from '../src/index';
import { config } from '../src/config/app.config';
const request = require('supertest');

const BASE = config.BASE_PATH; // default /api/v1

// Protected admin-management (dashboard) + analytics endpoints. Each entry is a
// concrete [method, path] pair guarded by `authenticateJWT`. Path params use a
// throwaway id because the guard runs before the handler ever reads them.
const PROTECTED_ENDPOINTS: ReadonlyArray<{ method: string; path: string }> = [
  // Dashboard analytics + portfolio CRUD / list / publish toggle (Req 10.3).
  { method: 'get', path: `${BASE}/dashboard/analytics` },
  { method: 'get', path: `${BASE}/dashboard/projects` },
  { method: 'post', path: `${BASE}/dashboard/projects` },
  { method: 'get', path: `${BASE}/dashboard/projects/some-id` },
  { method: 'put', path: `${BASE}/dashboard/projects/some-id` },
  { method: 'delete', path: `${BASE}/dashboard/projects/some-id` },
  { method: 'patch', path: `${BASE}/dashboard/projects/some-id/publish` },
  // Dashboard blog-post CRUD / list / publish toggle (Req 10.3).
  { method: 'get', path: `${BASE}/dashboard/posts` },
  { method: 'post', path: `${BASE}/dashboard/posts` },
  { method: 'get', path: `${BASE}/dashboard/posts/some-id` },
  { method: 'put', path: `${BASE}/dashboard/posts/some-id` },
  { method: 'delete', path: `${BASE}/dashboard/posts/some-id` },
  { method: 'patch', path: `${BASE}/dashboard/posts/some-id/publish` },
  // Analytics admin endpoints (Req 11.4).
  { method: 'get', path: `${BASE}/analytics/summary` },
  { method: 'get', path: `${BASE}/analytics/aggregations` },
];

// Arbitrary that yields a request lacking VALID authentication: either no
// Authorization header at all, or a present-but-invalid one (empty bearer,
// malformed scheme, or a bogus/garbage token that cannot verify).
type AuthHeader = string | undefined;

const invalidAuthArb: fc.Arbitrary<AuthHeader> = fc.oneof(
  fc.constant(undefined), // no header
  fc.constant(''), // empty header
  fc.constant('Bearer'), // scheme only, no token
  fc.constant('Bearer '), // scheme + empty token
  fc.string({ minLength: 1, maxLength: 40 }).map((s) => `Bearer ${s}`), // garbage bearer token
  fc.string({ minLength: 1, maxLength: 20 }).map((s) => `Basic ${s}`), // wrong scheme
  // A structurally plausible but unsigned/invalid JWT-looking string.
  fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
    )
    .map(([a, b, c]) => `Bearer ${a}.${b}.${c}`),
);

describe('Property 28: protected admin & analytics endpoints reject unauthenticated requests', () => {
  afterAll(() => {
    // Guard open handles (server is undefined in the test env).
    server?.close();
  });

  // Feature: portfolio-upgrade, Property 28: Protected admin endpoints reject unauthenticated requests
  // Validates: Requirements 10.3, 11.4
  it('returns 401 for any protected endpoint with missing or invalid authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PROTECTED_ENDPOINTS),
        invalidAuthArb,
        async (endpoint, authHeader) => {
          let req = (request(app) as any)[endpoint.method](endpoint.path);
          if (authHeader !== undefined) {
            req = req.set('Authorization', authHeader);
          }
          const res = await req;
          // No valid authentication => 401 from authenticateJWT, before any
          // controller/DB access.
          expect(res.statusCode).toBe(401);
        },
      ),
      { numRuns: 100 },
    );
  });
});
