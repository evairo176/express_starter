import { z } from 'zod';

export const CreateTechStackSchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional().nullable(),
});

export const UpdateTechStackSchema = CreateTechStackSchema.extend({
  id: z.string().uuid(),
});

export type CreateTechStackDTO = z.infer<typeof CreateTechStackSchema>;
export type UpdateTechStackDTO = z.infer<typeof UpdateTechStackSchema>;
