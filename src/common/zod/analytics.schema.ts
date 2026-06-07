import { z } from 'zod';

export const RecordVisitSchema = z.object({
  path: z.string().min(1),
});

export type RecordVisitDTO = z.infer<typeof RecordVisitSchema>;
