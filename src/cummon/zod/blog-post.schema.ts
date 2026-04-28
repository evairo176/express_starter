import { z } from 'zod';

export const CreateBlogPostSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const UpdateBlogPostSchema = CreateBlogPostSchema.extend({
  id: z.string().uuid(),
});

export type CreateBlogPostDTO = z.infer<typeof CreateBlogPostSchema>;
export type UpdateBlogPostDTO = z.infer<typeof UpdateBlogPostSchema>;
