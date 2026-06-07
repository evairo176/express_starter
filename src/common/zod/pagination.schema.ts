import { z } from 'zod';

/**
 * Shared page/limit coercion reused by module list schemas.
 * Mirrors `PaginationQuerySchema` in `../utils/pagination`.
 */
export const pageSchema = z.coerce.number().int().positive().default(1);
export const limitSchema = z.coerce.number().int().positive().default(10);

export const PaginationQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
});

export type PaginationQueryDTO = z.infer<typeof PaginationQuerySchema>;
