import { z } from 'zod';

export const PortfolioImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  position: z.number().optional(),
});

export const CreatePortfolioSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),

  categoryId: z.string().uuid().optional().nullable(),

  liveUrl: z.string().url().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),

  featured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),

  images: z.array(PortfolioImageSchema).optional().default([]),
  tagIds: z.array(z.string().min(1)).min(1, 'Minimal 1 tag'),
  techIds: z.array(z.string().min(1)).min(1, 'Minimal 1 tech'),
});

export const UpdatePortfolioSchema = CreatePortfolioSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreatePortfolioDTO = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioDTO = z.infer<typeof UpdatePortfolioSchema>;
