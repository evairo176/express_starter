import { z } from 'zod';

/**
 * Newsletter subscription.
 * - `email`: valid email format
 * Validates: Requirements 8.3
 */
export const SubscribeNewsletterSchema = z.object({
  email: z.string().email(),
});

export type SubscribeNewsletterDTO = z.infer<typeof SubscribeNewsletterSchema>;
