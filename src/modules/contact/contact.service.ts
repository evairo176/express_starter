import { db } from '../../database/database';
import { CreateContactDTO } from '../../common/zod/contact.schema';
import { sendEmail } from '../../mailers/mailer';
import { config } from '../../config/app.config';
import Logger from '../../libs/logger';
import {
  buildPaginationMetadata,
  PaginationQuery,
} from '../../common/utils/pagination';

// The owner notification recipient. Falls back to MAILER_SENDER when
// CONTACT_OWNER_EMAIL is not configured.
const ownerEmail = config.CONTACT_OWNER_EMAIL || config.MAILER_SENDER;

export class ContactService {
  /**
   * Persist a contact message, then attempt to notify the owner via email.
   * The email send is wrapped in try/catch so that an email failure is logged
   * and swallowed — the message stays persisted and the caller still receives
   * a success result (Req 7.1, 7.2, 7.3).
   */
  public async create(data: CreateContactDTO) {
    const message = await db.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        body: data.body,
      },
    });

    try {
      await sendEmail({
        to: ownerEmail,
        subject: `New contact message: ${data.subject}`,
        text: `You received a new contact message from ${data.name} <${data.email}>.\n\nSubject: ${data.subject}\n\n${data.body}`,
        html: `<p>You received a new contact message from <strong>${data.name}</strong> &lt;${data.email}&gt;.</p>
<p><strong>Subject:</strong> ${data.subject}</p>
<p>${data.body}</p>`,
      });
    } catch (error) {
      Logger.error(
        `Failed to send contact notification email for message ${message.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return message;
  }

  /**
   * Return persisted contact messages ordered by creation time descending
   * (newest-first) with pagination metadata (Req 7.5).
   */
  public async findAll({ page = 1, limit = 10 }: PaginationQuery) {
    const skip = (page - 1) * limit;

    const [total, messages] = await Promise.all([
      db.contactMessage.count(),
      db.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit),
      }),
    ]);

    return {
      data: messages,
      metadata: buildPaginationMetadata(total, page, limit),
    };
  }
}
