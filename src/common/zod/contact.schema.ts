import { z } from 'zod';

/**
 * Contact message creation.
 * - `name`, `subject`, `body`: required (non-empty)
 * - `email`: valid email format
 * Validates: Requirements 7.4
 */
export const CreateContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type CreateContactDTO = z.infer<typeof CreateContactSchema>;
