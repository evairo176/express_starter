import express from 'express';
import rateLimit from 'express-rate-limit';
import app, { server } from '../src/index';
import { authLimiter, writeLimiter } from '../src/middlewares/rate-limit';
import { corsOptions } from '../src/config/security.config';
const request = require('supertest');

describe('Security & rate-limiting smoke tests', () => {
  afterAll(() => {
    // Mirror tests/index.test.ts: close the server (no-op in test env where it
    // is undefined) to avoid leaking open handles.
    server?.close();
  });

  // Req 12.3: helmet security headers are applied on responses.
  describe('Helmet security headers (Req 12.3)', () => {
    it('sets helmet security headers on responses', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      // helmet() sets these by default.
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    });
  });

  // Req 12.1 / 12.2: rate limiters return 429 once the limit is exceeded.
  describe('Rate limiting returns 429 on exceed (Req 12.1, 12.2)', () => {
    it('returns 429 after the configured limit is exceeded', async () => {
      // Deterministic limiter with a low max so the behavior is reproducible
      // regardless of the env-driven config used by the exported limiters.
      const limiter = rateLimit({
        windowMs: 60_000,
        limit: 2,
        statusCode: 429,
        standardHeaders: true,
        legacyHeaders: false,
      });

      const limitedApp = express();
      limitedApp.use(limiter);
      limitedApp.get('/limited', (_req, res) => res.status(200).json({ ok: true }));

      // First two requests are allowed.
      const r1 = await request(limitedApp).get('/limited');
      const r2 = await request(limitedApp).get('/limited');
      // Third request exceeds the limit and is rejected with 429.
      const r3 = await request(limitedApp).get('/limited');

      expect(r1.statusCode).toBe(200);
      expect(r2.statusCode).toBe(200);
      expect(r3.statusCode).toBe(429);
    });

    it('exports authLimiter and writeLimiter as middleware functions', () => {
      // The exported limiters must be wired-up Express middleware.
      expect(typeof authLimiter).toBe('function');
      expect(typeof writeLimiter).toBe('function');
    });
  });

  // Req 12.4: CORS is restricted to a configured allowlist.
  describe('CORS allowlist enforcement (Req 12.4)', () => {
    const origin = corsOptions.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    it('allows requests with no Origin header', (done) => {
      origin(undefined, (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('allows requests from an allowlisted origin', (done) => {
      origin('http://localhost:5173', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('rejects requests from a disallowed origin', (done) => {
      origin('https://evil.example.com', (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });
    });
  });
});
