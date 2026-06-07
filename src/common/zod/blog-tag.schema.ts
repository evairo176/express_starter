import { z } from 'zod';

/**
 * Blog tag. Follows portfolio-tag.schema.ts style.
 * - `name`: required
 * - `slug`: optional (may be derived from name when omitted)
 * Validates: Requirements 3.7
 */
export const CreateBlogTagSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
});

export const UpdateBlogTagSchema = CreateBlogTagSchema.extend({
  id: z.string().uuid(),
});

export type CreateBlogTagDTO = z.infer<typeof CreateBlogTagSchema>;
export type UpdateBlogTagDTO = z.infer<typeof UpdateBlogTagSchema>;
