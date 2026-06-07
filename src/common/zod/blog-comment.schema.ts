import { z } from 'zod';

/**
 * Blog comment creation.
 * - `name`: non-empty
 * - `email`: valid email format
 * - `body`: length 1..2000 (NOT trimmed before length check; whitespace-only allowed)
 * Validates: Requirements 4.3, 4.4, 4.5
 */
export const CreateBlogCommentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  body: z.string().min(1).max(2000),
});

export type CreateBlogCommentDTO = z.infer<typeof CreateBlogCommentSchema>;

/**
 * Admin comment moderation list query.
 * - `page` / `limit`: coerced positive ints with defaults
 * - `status`: pending | approved | all (default all)
 */
export const AdminBlogCommentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.enum(['pending', 'approved', 'all']).default('all'),
});

export type AdminBlogCommentListQueryDTO = z.infer<
  typeof AdminBlogCommentListQuerySchema
>;
