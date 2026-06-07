import { z } from 'zod';

/**
 * Publish-toggle payload for admin dashboard endpoints (Req 10.6).
 *
 * `isPublished` is optional: when provided, the new state is set explicitly;
 * when omitted, the dashboard service flips the current published state.
 */
export const PublishToggleSchema = z.object({
  isPublished: z.boolean().optional(),
});

export type PublishToggleDTO = z.infer<typeof PublishToggleSchema>;
