"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTestimonialSchema = exports.CreateTestimonialSchema = void 0;
const zod_1 = require("zod");
/**
 * Testimonial creation.
 * - `authorName`, `authorRole`, `quote`: required
 * - `isPublished`: optional boolean
 * Validates: Requirements 9.4
 */
exports.CreateTestimonialSchema = zod_1.z.object({
    authorName: zod_1.z.string().min(1),
    authorRole: zod_1.z.string().min(1),
    quote: zod_1.z.string().min(1),
    isPublished: zod_1.z.boolean().optional(),
});
exports.UpdateTestimonialSchema = exports.CreateTestimonialSchema.extend({
    id: zod_1.z.string().uuid(),
});
