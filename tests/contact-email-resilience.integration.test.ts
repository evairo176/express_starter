/**
 * Contact module — email-failure resilience & notification call (integration).
 *
 * Validates Requirements 7.2 and 7.3 against a MOCKED Resend client:
 *  - Req 7.2: when a contact message is persisted, a notification email is sent
 *    to the configured owner address through the Email_Provider (Resend).
 *  - Req 7.3: if the Email_Provider fails to send, the message is still
 *    persisted and a success result indicating receipt is returned.
 *
 * Unlike `contact.property.test.ts` (which mocks the `sendEmail` wrapper), this
 * integration test mocks the Resend client at the lowest layer
 * (`src/mailers/resendClient`) and exercises the REAL `mailer.sendEmail`
 * wrapper end-to-end through `ContactService`. This proves the full
 * service -> mailer -> Resend call chain works and is resilient to provider
 * failure, as described in the design Testing Strategy (Integration tests:
 * "the contact notification email call against a mocked Resend client").
 */

// ---------------------------------------------------------------------------
// Mocks: in-memory Prisma fake + Resend client (Email_Provider)
// ---------------------------------------------------------------------------

jest.mock('../src/database/database', () => {
  const store: { items: any[]; seq: number } = { items: [], seq: 0 };

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
            createdAt: new Date(1_600_000_000_000 + store.seq * 1000),
          };
          store.seq += 1;
          store.items.push(row);
          return row;
        }),
      },
    },
  };
});

// Mock the Email_Provider (Resend) at the client boundary so the REAL mailer
// wrapper (`src/mailers/mailer`) runs against it.
const resendSendMock = jest.fn((..._args: any[]) =>
  Promise.resolve({ data: { id: 'email-id' }, error: null }),
);
jest.mock('../src/mailers/resendClient', () => ({
  resend: {
    emails: {
      send: (...args: any[]) => resendSendMock(...args),
    },
  },
}));

import { db } from '../src/database/database';
import { ContactService } from '../src/modules/contact/contact.service';
import { config } from '../src/config/app.config';

const mockDb = db as unknown as {
  __reset: () => void;
  __getAll: () => any[];
  contactMessage: { create: jest.Mock };
};

const service = new ContactService();
const ownerEmail = config.CONTACT_OWNER_EMAIL || config.MAILER_SENDER;

beforeEach(() => {
  mockDb.__reset();
  mockDb.contactMessage.create.mockClear();
  resendSendMock.mockReset();
  resendSendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
});

describe('Contact email resilience & notification call (integration)', () => {
  // Req 7.2: on successful submission, a notification email is sent to the
  // configured owner address through the Resend Email_Provider.
  it('sends an owner notification email through Resend on success', async () => {
    const payload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Collaboration',
      body: 'I would like to work together.',
    };

    const result = await service.create(payload);

    // Message was persisted and returned.
    expect(result.id).toBeDefined();
    expect(mockDb.__getAll()).toHaveLength(1);

    // The Email_Provider was called exactly once...
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    // ...with the owner as recipient and the submission subject included.
    const sendArg = (resendSendMock.mock.calls[0] as any[])[0] as any;
    expect(sendArg.to).toContain(ownerEmail);
    expect(sendArg.subject).toContain(payload.subject);
  });

  // Req 7.3: when Resend rejects, the message still persists and create
  // resolves with a success result indicating the message was received.
  it('persists and returns success when Resend rejects (async failure)', async () => {
    resendSendMock.mockRejectedValueOnce(new Error('resend unavailable'));

    const payload = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      subject: 'Bug report',
      body: 'Found a moth in the relay.',
    };

    const result = await service.create(payload);

    // Success result returned despite the email failure.
    expect(result.id).toBeDefined();
    expect(result.email).toBe(payload.email);
    // Message remains persisted.
    expect(mockDb.contactMessage.create).toHaveBeenCalledTimes(1);
    expect(mockDb.__getAll()).toHaveLength(1);
    // The provider was attempted once.
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });

  // Req 7.3: representative second failure mode (thrown synchronously inside
  // the send implementation) is also swallowed and the message persists.
  it('persists and returns success on a second Resend failure mode', async () => {
    resendSendMock.mockImplementationOnce(async () => {
      throw new Error('network timeout');
    });

    const result = await service.create({
      name: 'Alan Turing',
      email: 'alan@example.com',
      subject: 'Enigma',
      body: 'Decrypted message body.',
    });

    expect(result.id).toBeDefined();
    expect(mockDb.__getAll()).toHaveLength(1);
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });
});
