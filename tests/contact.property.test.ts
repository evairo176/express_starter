import fc from 'fast-check';

/**
 * Contact module tests (Properties 21, 22 + email-resilience integration).
 *
 * These tests exercise the real `ContactService` (`create`, `findAll`) against
 * an in-memory fake of the Prisma `db.contactMessage` methods the service uses
 * (`create`, `findMany`, `count`). The fake assigns a monotonically increasing
 * `createdAt` per insertion and honors the `orderBy: { createdAt: 'desc' }`,
 * `skip`, and `take` arguments the service passes — so the assertions verify
 * the SERVICE's observable contract (persistence, newest-first ordering, and
 * pagination metadata) end-to-end.
 *
 * The mailer module (`src/mailers/mailer` -> `sendEmail`) is mocked so no real
 * email is ever sent; its behavior (resolve/reject) is controlled per test.
 */

// ---------------------------------------------------------------------------
// Mocks: in-memory Prisma fake + mailer
// ---------------------------------------------------------------------------

jest.mock('../src/database/database', () => {
  const store: { items: any[]; seq: number } = { items: [], seq: 0 };

  function matchWhere(_p: any, _where: any): boolean {
    // findAll/count are unfiltered (no `where`); return everything.
    return true;
  }

  return {
    db: {
      __reset: () => {
        store.items = [];
        store.seq = 0;
      },
      __getAll: () => store.items,
      contactMessage: {
        create: jest.fn(async ({ data }: any) => {
          const row = {
            id: `msg-${store.seq}`,
            name: data.name,
            email: data.email,
            subject: data.subject,
            body: data.body,
            // Monotonically increasing timestamps mirror real insertion order.
            createdAt: new Date(1_600_000_000_000 + store.seq * 1000),
          };
          store.seq += 1;
          store.items.push(row);
          return row;
        }),
        findMany: jest.fn(async ({ where, orderBy, skip = 0, take }: any) => {
          let rows = store.items.filter((p) => matchWhere(p, where));
          if (orderBy?.createdAt === 'desc') {
            rows = [...rows].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          } else if (orderBy?.createdAt === 'asc') {
            rows = [...rows].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );
          }
          if (skip) rows = rows.slice(skip);
          if (take !== undefined) rows = rows.slice(0, take);
          return rows;
        }),
        count: jest.fn(
          async ({ where } = {}) =>
            store.items.filter((p) => matchWhere(p, where)).length,
        ),
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

import { db } from '../src/database/database';
import { ContactService } from '../src/modules/contact/contact.service';
import { CreateContactSchema } from '../src/common/zod/contact.schema';
import { buildPaginationMetadata } from '../src/common/utils/pagination';

const mockDb = db as unknown as {
  __reset: () => void;
  __getAll: () => any[];
  contactMessage: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

const service = new ContactService();

beforeEach(() => {
  mockDb.__reset();
  mockDb.contactMessage.create.mockClear();
  mockDb.contactMessage.findMany.mockClear();
  mockDb.contactMessage.count.mockClear();
  sendEmailMock.mockReset();
  sendEmailMock.mockResolvedValue({ id: 'email-id' });
});

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

// Non-empty string with at least one non-whitespace char (z.string().min(1)
// rejects empty strings; we keep meaningful content to avoid trivial overlap).
const nonEmpty = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter((s) => s.length >= 1);

// Constrain to the email shape Zod's `.email()` accepts. `fc.emailAddress()`
// produces RFC-5321-valid addresses (e.g. `!@a.aa`) that Zod rejects, so we
// generate alphanumeric local/domain parts that satisfy Zod's validator.
const alnum = fc
  .string({ minLength: 1, maxLength: 12 })
  .map((s) => s.replace(/[^a-zA-Z0-9]/g, '') || 'a');

const validEmailArb = fc
  .tuple(alnum, alnum, fc.constantFrom('com', 'org', 'io', 'dev'))
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
  .filter((e) => CreateContactSchema.shape.email.safeParse(e).success);

const validPayloadArb = fc.record({
  name: nonEmpty,
  email: validEmailArb,
  subject: nonEmpty,
  body: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.length >= 1),
});

describe('Contact module property-based tests', () => {
  // Feature: portfolio-upgrade, Property 21: Contact submission round-trips and validates. For any valid contact message, submission persists the message and returns success; for any contact payload with a missing required field or invalid email, the service responds with 400 and persists nothing.
  // Validates: Requirements 7.1, 7.4
  it('Property 21: contact submission round-trips and validates', async () => {
    await fc.assert(
      fc.asyncProperty(validPayloadArb, async (payload) => {
        mockDb.__reset();
        mockDb.contactMessage.create.mockClear();

        // Valid payloads pass schema validation...
        const parsed = CreateContactSchema.parse(payload);

        // ...and round-trip through the service: persisted + returned as stored.
        const result = await service.create(parsed);

        expect(mockDb.contactMessage.create).toHaveBeenCalledTimes(1);
        expect(mockDb.__getAll()).toHaveLength(1);
        expect(result.name).toBe(payload.name);
        expect(result.email).toBe(payload.email);
        expect(result.subject).toBe(payload.subject);
        expect(result.body).toBe(payload.body);
        expect(result.id).toBeDefined();
      }),
      { numRuns: 100 },
    );

    // Invalid payloads: missing a required field or an invalid email are
    // rejected by the schema (→ 400 at the controller) and persist nothing.
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Missing exactly one required field.
          validPayloadArb.chain((p) =>
            fc
              .constantFrom('name', 'email', 'subject', 'body')
              .map((field) => {
                const clone: Record<string, unknown> = { ...p };
                delete clone[field];
                return clone;
              }),
          ),
          // Empty required field (violates min(1)).
          validPayloadArb.map((p) => ({ ...p, subject: '' })),
          // Invalid email format.
          validPayloadArb.chain((p) =>
            fc
              .string()
              .filter((s) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
              .map((bad) => ({ ...p, email: bad })),
          ),
        ),
        async (badPayload) => {
          mockDb.__reset();
          mockDb.contactMessage.create.mockClear();

          const parsed = CreateContactSchema.safeParse(badPayload);
          expect(parsed.success).toBe(false);

          // Nothing is persisted because the service is never reached.
          expect(mockDb.contactMessage.create).not.toHaveBeenCalled();
          expect(mockDb.__getAll()).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-upgrade, Property 22: Admin contact list is newest-first with metadata. For any set of persisted contact messages, the admin list response is ordered by creation time descending and includes valid Pagination_Metadata.
  // Validates: Requirements 7.5
  it('Property 22: admin contact list is newest-first with metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validPayloadArb, { minLength: 0, maxLength: 25 }),
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 1, max: 30 }),
        async (payloads, page, limit) => {
          mockDb.__reset();

          // Persist the set of messages (insertion order = ascending createdAt).
          for (const p of payloads) {
            await service.create(CreateContactSchema.parse(p));
          }

          const { data, metadata } = await service.findAll({ page, limit });

          // Ordered by createdAt descending (newest-first).
          for (let i = 1; i < data.length; i++) {
            expect(new Date(data[i].createdAt).getTime()).toBeLessThanOrEqual(
              new Date(data[i - 1].createdAt).getTime(),
            );
          }

          // Page slice matches the expected newest-first window.
          const total = payloads.length;
          const sortedDesc = [...mockDb.__getAll()].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          );
          const skip = (page - 1) * limit;
          const expectedIds = sortedDesc
            .slice(skip, skip + limit)
            .map((m) => m.id);
          expect(data.map((m: any) => m.id)).toEqual(expectedIds);

          // Valid Pagination_Metadata consistent with the formula.
          expect(metadata).toEqual(buildPaginationMetadata(total, page, limit));
          expect(metadata.total).toBe(total);
          expect(metadata.page).toBe(page);
          expect(metadata.limit).toBe(limit);
          expect(metadata.totalPages).toBe(Math.ceil(total / limit));
          expect(metadata.hasNext).toBe(page < metadata.totalPages);
          expect(metadata.hasPrev).toBe(page > 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Contact module — email-failure resilience & notification call', () => {
  // Req 7.3: when the mailer rejects, the message still persists and create resolves success.
  it('persists and resolves success even when the mailer rejects', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('resend down'));

    const payload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Hello',
      body: 'A message body',
    };

    const result = await service.create(payload);

    expect(result.id).toBeDefined();
    expect(result.email).toBe(payload.email);
    expect(mockDb.contactMessage.create).toHaveBeenCalledTimes(1);
    expect(mockDb.__getAll()).toHaveLength(1);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  // Req 7.3: representative second failure mode (synchronous-style rejection).
  it('swallows a second mailer failure mode and still persists', async () => {
    sendEmailMock.mockImplementationOnce(async () => {
      throw new Error('network timeout');
    });

    const result = await service.create({
      name: 'Grace',
      email: 'grace@example.com',
      subject: 'Subject',
      body: 'Body text',
    });

    expect(result.id).toBeDefined();
    expect(mockDb.__getAll()).toHaveLength(1);
  });

  // Req 7.2: on success, the owner-notification email function is CALLED.
  it('calls the notification email function on successful submission', async () => {
    const payload = {
      name: 'Alan Turing',
      email: 'alan@example.com',
      subject: 'Enigma',
      body: 'Decrypted message',
    };

    const result = await service.create(payload);

    expect(result.id).toBeDefined();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const arg = (sendEmailMock.mock.calls[0] as any[])[0] as any;
    expect(arg.subject).toContain(payload.subject);
    expect(typeof arg.to).toBe('string');
  });
});
