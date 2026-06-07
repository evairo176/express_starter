import { z } from 'zod';

/**
 * Achievement creation (awards / certifications / milestones).
 * - `title`: required, non-empty
 * - `issuer` / `description` / `url` / `icon` / `category`: optional strings
 * - `date`: required ISO string coerced to a Date (when achieved)
 * - `position`: optional int (ordering, default 0 applied at DB level)
 * - `isPublished`: optional boolean
 */
export const CreateAchievementSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().optional(),
  description: z.string().optional(),
  date: z.coerce.date(),
  url: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  position: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export const UpdateAchievementSchema = CreateAchievementSchema.partial();

export type CreateAchievementDTO = z.infer<typeof CreateAchievementSchema>;
export type UpdateAchievementDTO = z.infer<typeof UpdateAchievementSchema>;
