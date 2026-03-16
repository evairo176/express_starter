import { z } from 'zod';

export const rejectClaimSchema = z.object({
  note: z.string(),
});

export const createClaimSchema = z.object({
  name: z.string(),
  desc: z.string(),
});

export type rejectClaimDTO = z.infer<typeof rejectClaimSchema>;
export type createClaimDTO = z.infer<typeof createClaimSchema>;
