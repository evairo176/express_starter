import { z } from 'zod';

export const CreatePortfolioCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const UpdatePortfolioCategorySchema =
  CreatePortfolioCategorySchema.extend({
    id: z.string().uuid(),
  });

export type CreatePortfolioCategoryDTO = z.infer<
  typeof CreatePortfolioCategorySchema
>;
export type UpdatePortfolioCategoryDTO = z.infer<
  typeof UpdatePortfolioCategorySchema
>;
