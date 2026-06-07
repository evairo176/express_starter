import { z } from 'zod';

/**
 * Blog category. Follows portfolio-category.schema.ts style.
 * - `name`: required
 * - `slug`: optional (may be derived from name when omitted)
 * Validates: Requirements 3.7
 */
export const CreateBlogCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
});

export const UpdateBlogCategorySchema = CreateBlogCategorySchema.extend({
  id: z.string().uuid(),
});

export type CreateBlogCategoryDTO = z.infer<typeof CreateBlogCategorySchema>;
export type UpdateBlogCategoryDTO = z.infer<typeof UpdateBlogCategorySchema>;
