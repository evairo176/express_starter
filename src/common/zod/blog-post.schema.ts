import { z } from 'zod';

export const CreateBlogPostSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
  // Taxonomy (Req 3.1, 3.2, 3.3): at most one category, zero or more tags.
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const UpdateBlogPostSchema = CreateBlogPostSchema.extend({
  id: z.string().uuid(),
});

/**
 * Dedicated category/tag assignment payload for the admin assignment endpoint
 * (Req 3.2, 3.3, 3.7). `categoryId` may be set to null to clear the category.
 */
export const AssignBlogTaxonomySchema = z.object({
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export type CreateBlogPostDTO = z.infer<typeof CreateBlogPostSchema>;
export type UpdateBlogPostDTO = z.infer<typeof UpdateBlogPostSchema>;
export type AssignBlogTaxonomyDTO = z.infer<typeof AssignBlogTaxonomySchema>;
