import { z } from 'zod';
import { PaginationQuerySchema } from './pagination.schema';

/**
 * Public blog list filters (merged with shared pagination).
 * - `category`: category slug (Req 3.4)
 * - `tag`: tag slug (Req 3.5)
 * - `search`: matches title/excerpt (Req 3.6)
 * Validates: Requirements 3.4, 3.5, 3.6
 */
export const BlogPublicListQuerySchema = PaginationQuerySchema.extend({
  category: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

export type BlogPublicListQueryDTO = z.infer<typeof BlogPublicListQuerySchema>;
