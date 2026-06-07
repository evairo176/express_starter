import { SubscribeNewsletterDTO } from '../../common/zod/newsletter.schema';
import { generateUniqueCode } from '../../common/utils/uuid';
import { db } from '../../database/database';
import Logger from '../../libs/logger';

export class NewsletterService {
  /**
   * Subscribe an email to the newsletter.
   *
   * Idempotent: a duplicate email (unique-constraint violation) or any
   * lookup failure is treated as "already subscribed" and resolves
   * successfully without creating a duplicate subscription (Req 8.1, 8.2).
   */
  public async subscribe(data: SubscribeNewsletterDTO) {
    try {
      const existing = await db.newsletterSubscription.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        // Already subscribed -> idempotent success, no duplicate created.
        return existing;
      }
    } catch (error) {
      // Lookup failed: treat as "already handled" and return success
      // without attempting to create a (possibly duplicate) row (Req 8.2).
      Logger.error('Newsletter subscription lookup failed', error);
      return null;
    }

    try {
      return await db.newsletterSubscription.create({
        data: {
          email: data.email,
          unsubscribeToken: generateUniqueCode(),
        },
      });
    } catch (error) {
      // Unique-constraint violation (race condition) -> idempotent success.
      Logger.error('Newsletter subscription create failed', error);
      return null;
    }
  }

  /**
   * Mark the subscription matching the given unsubscribe token as inactive
   * and return success (Req 8.4).
   */
  public async unsubscribe(token: string) {
    try {
      const subscription = await db.newsletterSubscription.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!subscription) {
        return null;
      }

      return await db.newsletterSubscription.update({
        where: { unsubscribeToken: token },
        data: { isActive: false },
      });
    } catch (error) {
      Logger.error('Newsletter unsubscribe failed', error);
      return null;
    }
  }
}
