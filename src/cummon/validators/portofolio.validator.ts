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
  tagIds: z.array(z.string().uuid()).optional().default([]),
  techIds: z.array(z.string().uuid()).optional().default([]),
});

export const UpdatePortfolioSchema = CreatePortfolioSchema.partial().extend({
  id: z.string().uuid(),
});
