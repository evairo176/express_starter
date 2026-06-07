import { z } from 'zod';

/**
 * Optional URL field that also accepts empty string / null. The frontend form
 * submits "" for cleared inputs, which would otherwise fail `.url()`; we
 * normalize blanks to `undefined` so they pass as "not provided".
 */
const optionalUrl = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().url().optional(),
);

export const PortfolioImageSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  position: z.number().optional(),
});

export const CreatePortfolioSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),

  categoryId: z.string().uuid().optional().nullable(),

  liveUrl: optionalUrl,
  repoUrl: optionalUrl,

  // Case study (Req: project detail problem/solution/results).
  problem: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  results: z.string().optional().nullable(),

  featured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),

  images: z.array(PortfolioImageSchema).optional().default([]),
  tagIds: z.array(z.string().min(1)).optional().default([]),
  techIds: z.array(z.string().min(1)).min(1, 'Minimal 1 tech'),
});

export const UpdatePortfolioSchema = CreatePortfolioSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreatePortfolioDTO = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioDTO = z.infer<typeof UpdatePortfolioSchema>;
