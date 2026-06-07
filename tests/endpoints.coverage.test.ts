/**
 * Endpoint coverage tests (Req 16.1, 16.2).
 *
 * Supertest-based tests that exercise the REAL Express app (imported from
 * `../src/index`) end-to-end through the routing + middleware + controller +
 * service pipeline, covering BOTH the success and the validation-error (400)
 * paths for the public-facing feature endpoints added across this spec:
 *
 *   - Contact submit            POST /api/v1/contact
 *   - Newsletter subscribe      POST /api/v1/newsletter/subscribe
 *   - Testimonial (public)      GET  /api/v1/testimonial/public        (success)
 *                               POST /api/v1/testimonial                (401, admin-guarded)
 *   - Blog comment              POST /api/v1/blog-posts/public/:slug/comments
 *   - Blog reaction             POST /api/v1/blog-posts/public/:slug/reactions
 *   - Portfolio filtering       GET  /api/v1/portfolio/public
 *
 * To avoid hitting a real database the Prisma `db` (`src/database/database`) is
 * mocked with only the minimal methods each endpoint touches, and the mailer
 * (`src/mailers/mailer`) is mocked so no real email is sent. Each endpoint gets
 * 1–2 representative success cases plus one validation-error case. A few
 * requests per endpoint stays well under the writeLimiter default (30/window).
 */

// ---------------------------------------------------------------------------
// Mocks: Prisma db (minimal surface) + mailer. Declared before importing app.
// ---------------------------------------------------------------------------

jest.mock('../src/database/database', () => {
  return {
    db: {
      // Contact submit -> create
      contactMessage: {
        create: jest.fn(async ({ data }: any) => ({
          id: 'contact-1',
          ...data,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        })),
      },
      // Newsletter subscribe -> findUnique (none) then create
      newsletterSubscription: {
        findUnique: jest.fn(async () => null),
        create: jest.fn(async ({ data }: any) => ({
          id: 'sub-1',
          email: data.email,
          unsubscribeToken: data.unsubscribeToken,
          isActive: true,
        })),
      },
      // Testimonial public list -> findMany
      testimonial: {
        findMany: jest.fn(async () => [
          {
            id: 'tst-1',
            authorName: 'Ada Lovelace',
            authorRole: 'Engineer',
            quote: 'Great work',
            isPublished: true,
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ]),
      },
      // Blog comment + reaction resolve the post by slug first.
      blogPost: {
        findUnique: jest.fn(async () => ({ id: 'post-1' })),
      },
      blogComment: {
        create: jest.fn(async ({ data }: any) => ({
          id: 'cmt-1',
          ...data,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        })),
      },
      blogReaction: {
        create: jest.fn(async ({ data }: any) => ({ id: 'rct-1', ...data })),
        count: jest.fn(async () => 1),
      },
      // Portfolio public filtering -> count + findMany
      portfolio: {
        count: jest.fn(async () => 1),
        findMany: jest.fn(async () => [
          {
            id: 'pf-1',
            title: 'Demo Project',
            slug: 'demo-project',
            shortDesc: 'A demo',
            isPublished: true,
            featured: true,
            category: { slug: 'web' },
            images: [],
            tags: [],
            techStacks: [],
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ]),
      },
    },
  };
});

const sendEmailMock = jest.fn((..._args: any[]) =>
  Promise.resolve({ id: 'email-id' }),
);
jest.mock('../src/mailers/mailer', () => ({
  sendEmail: (...args: any[]) => sendEmailMock(...args),
}));

import app, { server } from '../src/index';
import { db } from '../src/database/database';
const request = require('supertest');

const mockDb = db as unknown as {
  contactMessage: { create: jest.Mock };
  newsletterSubscription: { findUnique: jest.Mock; create: jest.Mock };
  testimonial: { findMany: jest.Mock };
  blogPost: { findUnique: jest.Mock };
  blogComment: { create: jest.Mock };
  blogReaction: { create: jest.Mock; count: jest.Mock };
  portfolio: { count: jest.Mock; findMany: jest.Mock };
};

const BASE = '/api/v1';

afterAll(() => {
  // Close the server (started only outside the test env, but guard anyway) to
  // avoid open-handle warnings from Jest.
  server?.close();
});

describe('Endpoint coverage — contact (POST /contact)', () => {
  it('success: persists the message and returns 201', async () => {
    const res = await request(app).post(`${BASE}/contact`).send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Hello',
      body: 'A message body',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBeDefined();
    expect(mockDb.contactMessage.create).toHaveBeenCalledTimes(1);
  });

  it('validation error: missing required field -> 400 and nothing persisted', async () => {
    mockDb.contactMessage.create.mockClear();

    const res = await request(app).post(`${BASE}/contact`).send({
      // name omitted
      email: 'ada@example.com',
      subject: 'Hello',
      body: 'A message body',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(mockDb.contactMessage.create).not.toHaveBeenCalled();
  });
});

describe('Endpoint coverage — newsletter (POST /newsletter/subscribe)', () => {
  it('success: subscribes a new email and returns 200', async () => {
    const res = await request(app)
      .post(`${BASE}/newsletter/subscribe`)
      .send({ email: 'subscriber@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(mockDb.newsletterSubscription.create).toHaveBeenCalledTimes(1);
  });

  it('validation error: invalid email -> 400', async () => {
    mockDb.newsletterSubscription.create.mockClear();

    const res = await request(app)
      .post(`${BASE}/newsletter/subscribe`)
      .send({ email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(mockDb.newsletterSubscription.create).not.toHaveBeenCalled();
  });
});

describe('Endpoint coverage — testimonial', () => {
  it('success: public list returns 200 with published testimonials', async () => {
    const res = await request(app).get(`${BASE}/testimonial/public`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(mockDb.testimonial.findMany).toHaveBeenCalled();
  });

  it('auth error: admin create without a token -> 401', async () => {
    const res = await request(app).post(`${BASE}/testimonial`).send({
      authorName: 'Ada',
      authorRole: 'Engineer',
      quote: 'Nice',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

describe('Endpoint coverage — blog comment (POST /blog-posts/public/:slug/comments)', () => {
  it('success: submits a comment and returns 201', async () => {
    const res = await request(app)
      .post(`${BASE}/blog-posts/public/my-post/comments`)
      .send({
        name: 'Reader',
        email: 'reader@example.com',
        body: 'Insightful article!',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(mockDb.blogComment.create).toHaveBeenCalledTimes(1);
  });

  it('validation error: invalid email -> 400 and nothing persisted', async () => {
    mockDb.blogComment.create.mockClear();

    const res = await request(app)
      .post(`${BASE}/blog-posts/public/my-post/comments`)
      .send({
        name: 'Reader',
        email: 'bad-email',
        body: 'Insightful article!',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(mockDb.blogComment.create).not.toHaveBeenCalled();
  });
});

describe('Endpoint coverage — blog reaction (POST /blog-posts/public/:slug/reactions)', () => {
  it('success: adds a reaction and returns 201 with the updated count', async () => {
    const res = await request(app)
      .post(`${BASE}/blog-posts/public/my-post/reactions`)
      .send({ type: 'like' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.count).toBe(1);
    expect(mockDb.blogReaction.create).toHaveBeenCalledTimes(1);
  });

  it('validation error: empty reaction type -> 400 and nothing persisted', async () => {
    mockDb.blogReaction.create.mockClear();

    const res = await request(app)
      .post(`${BASE}/blog-posts/public/my-post/reactions`)
      .send({ type: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(mockDb.blogReaction.create).not.toHaveBeenCalled();
  });
});

describe('Endpoint coverage — portfolio filtering (GET /portfolio/public)', () => {
  it('success: returns published portfolios with pagination metadata', async () => {
    const res = await request(app)
      .get(`${BASE}/portfolio/public`)
      .query({ category: 'web', featured: 'true', page: 1, limit: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.metadata).toMatchObject({ page: 1, limit: 10 });
    expect(mockDb.portfolio.findMany).toHaveBeenCalled();
  });

  it('validation error: non-positive page -> 400', async () => {
    const res = await request(app)
      .get(`${BASE}/portfolio/public`)
      .query({ page: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
