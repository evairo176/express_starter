import { z } from 'zod';

/**
 * Blog reaction creation.
 * - `type`: optional, defaults to "like"
 * Validates: Requirements 5b (blog reactions)
 */
export const CreateBlogReactionSchema = z.object({
  type: z.string().min(1).optional().default('like'),
});

export type CreateBlogReactionDTO = z.infer<typeof CreateBlogReactionSchema>;
