import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import fc from 'fast-check';
import { validate } from '../src/middlewares/validate';
import { AppError } from '../src/common/utils/app-error';
const request = require('supertest');

/**
 * Representative Zod schema for a write endpoint. It requires a non-empty
 * string `name`, a valid `email`, and an integer `age` in [0, 150]. Any body
 * that fails these constraints (or is entirely absent) must be rejected before
 * the downstream handler runs.
 */
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});

// Build a tiny app that mirrors the real pipeline: express.json() body parsing,
// the validate(schema) guard, then a handler that records that it ran. A
// terminal error middleware translates the forwarded error into a status code
// the way the production errorHandler does (ZodError / AppError => 400).
const buildApp = () => {
  const app = express();
  app.use(express.json());

  const state = { handlerInvoked: false };

  app.post(
    '/t',
    validate(schema),
    (_req: Request, res: Response) => {
      state.handlerInvoked = true;
      res.status(200).json({ ok: true });
    },
  );

  // Minimal error handler: ZodError and BadRequestException (AppError with a
  // 400 status) both map to HTTP 400, matching the real errorHandler.
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed' });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    },
  );

  return { app, state };
};

// Feature: portfolio-upgrade, Property 32: Invalid request bodies are rejected before processing.
// For any write endpoint and any body that violates its Zod schema (including an entirely absent
// body), the backend responds with a 400 validation error and the downstream handler is never
// invoked (no processing/side effect occurs).
// Validates: Requirements 12.5, 12.6
describe('Property 32: Invalid request bodies are rejected before processing', () => {
  // Generator for bodies that VIOLATE the schema in at least one way: a missing
  // required field, a wrong-typed field, an out-of-range age, an empty string
  // name, a malformed email, or an entirely empty/absent body.
  const invalidBody = fc.oneof(
    // Entirely empty body (absent body guard, Req 12.6).
    fc.constant({}),
    // Wrong types for one or more fields.
    fc.record({
      name: fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
      email: fc.string(),
      age: fc.integer(),
    }),
    // Empty name (fails min(1)).
    fc.record({
      name: fc.constant(''),
      email: fc.emailAddress(),
      age: fc.integer({ min: 0, max: 150 }),
    }),
    // Malformed email.
    fc.record({
      name: fc.string({ minLength: 1 }),
      email: fc
        .string()
        .filter((s) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)),
      age: fc.integer({ min: 0, max: 150 }),
    }),
    // Out-of-range / non-integer age.
    fc.record({
      name: fc.string({ minLength: 1 }),
      email: fc.emailAddress(),
      age: fc.oneof(
        fc.integer({ min: 151, max: 100_000 }),
        fc.integer({ min: -100_000, max: -1 }),
        fc.double({ min: 0.1, max: 149.9, noInteger: true, noNaN: true }),
      ),
    }),
    // Missing required fields (only some keys present).
    fc.record(
      {
        name: fc.string({ minLength: 1 }),
        email: fc.emailAddress(),
        age: fc.integer({ min: 0, max: 150 }),
      },
      { requiredKeys: [] },
    ).filter((b) => Object.keys(b).length < 3),
  );

  it('rejects any schema-violating body with 400 and never runs the handler', async () => {
    await fc.assert(
      fc.asyncProperty(invalidBody, async (body) => {
        // Guard: the generated body must actually be invalid per the schema.
        // (Skips the rare case where a generator produced a valid record.)
        fc.pre(!schema.safeParse(body).success);

        const { app, state } = buildApp();

        const res = await request(app).post('/t').send(body);

        // Rejected with a 400-style validation error.
        expect(res.status).toBe(400);
        // The downstream handler must never have been invoked.
        expect(state.handlerInvoked).toBe(false);
      }),
      { numRuns: 100 },
    );
    // This property runs 100 supertest round-trips, each booting a fresh app.
    // Under the full parallel suite (workers contending while other heavy PBT
    // suites run) it can exceed Jest's default 5s timeout even though it
    // completes in well under 1s in isolation. Give it generous headroom so it
    // stays reliable under load.
  }, 30000);
});
