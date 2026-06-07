import { z } from 'zod';

/**
 * Testimonial creation.
 * - `authorName`, `authorRole`, `quote`: required
 * - `isPublished`: optional boolean
 * Validates: Requirements 9.4
 */
export const CreateTestimonialSchema = z.object({
  authorName: z.string().min(1),
  authorRole: z.string().min(1),
  quote: z.string().min(1),
  isPublished: z.boolean().optional(),
});

export const UpdateTestimonialSchema = CreateTestimonialSchema.extend({
  id: z.string().uuid(),
});

export type CreateTestimonialDTO = z.infer<typeof CreateTestimonialSchema>;
export type UpdateTestimonialDTO = z.infer<typeof UpdateTestimonialSchema>;
