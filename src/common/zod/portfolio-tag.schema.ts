import { z } from 'zod';

export const CreatePortfolioTagSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const UpdatePortfolioTagSchema = CreatePortfolioTagSchema.extend({
  id: z.string().uuid(),
});

export type CreatePortfolioTagDTO = z.infer<typeof CreatePortfolioTagSchema>;
export type UpdatePortfolioTagDTO = z.infer<typeof UpdatePortfolioTagSchema>;
