import { z } from 'zod';

export const verifyMfaSchema = z.object({
  code: z.string().trim().min(1).max(6),
  secretKey: z.string().trim().min(1),
});

export const verifyMFAForLoginSchema = z.object({
  code: z.string().trim().min(1).max(6),
  email: z.string().trim().min(1).email(),
  userAgent: z.string().optional(),
});
