"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAchievementSchema = exports.CreateAchievementSchema = void 0;
const zod_1 = require("zod");
/**
 * Achievement creation (awards / certifications / milestones).
 * - `title`: required, non-empty
 * - `issuer` / `description` / `url` / `icon` / `category`: optional strings
 * - `date`: required ISO string coerced to a Date (when achieved)
 * - `position`: optional int (ordering, default 0 applied at DB level)
 * - `isPublished`: optional boolean
 */
exports.CreateAchievementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    issuer: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    date: zod_1.z.coerce.date(),
    url: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    position: zod_1.z.coerce.number().int().optional(),
    isPublished: zod_1.z.boolean().optional(),
});
exports.UpdateAchievementSchema = exports.CreateAchievementSchema.partial();
