import { z } from 'zod';
import { PaginationQuerySchema } from './pagination.schema';

/**
 * Coerces a query-string boolean ("true"/"false") into an optional boolean.
 * Leaves the value undefined when the param is absent.
 */
const optionalQueryBoolean = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) =>
    value === true || value === 'true'
      ? true
      : value === false || value === 'false'
        ? false
        : undefined,
  );

/**
 * Public portfolio list filters (merged with shared pagination).
 * - `category`: category slug (Req 2.1)
 * - `tags`: CSV of tag slugs, AND semantics applied in service (Req 2.2)
 * - `tech`: CSV of tech slugs, AND semantics applied in service (Req 2.3)
 * - `search`: matches title/shortDesc (Req 2.4)
 * - `featured`: boolean filter (Req 2.6)
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6
 */
export const PortfolioPublicListQuerySchema = PaginationQuerySchema.extend({
  category: z.string().min(1).optional(),
  tags: z.string().min(1).optional(),
  tech: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  featured: optionalQueryBoolean,
  // Result ordering (Req: user-selectable sort). Defaults to newest first.
  // - `newest`   : most recently created first
  // - `oldest`   : earliest created first
  // - `recently-updated` : most recently updated first
  // - `featured` : featured projects first, then newest
  sort: z
    .enum(['newest', 'oldest', 'recently-updated', 'featured'])
    .optional()
    .default('newest'),
});

export type PortfolioPublicListQueryDTO = z.infer<
  typeof PortfolioPublicListQuerySchema
>;
