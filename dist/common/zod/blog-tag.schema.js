"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBlogTagSchema = exports.CreateBlogTagSchema = void 0;
const zod_1 = require("zod");
/**
 * Blog tag. Follows portfolio-tag.schema.ts style.
 * - `name`: required
 * - `slug`: optional (may be derived from name when omitted)
 * Validates: Requirements 3.7
 */
exports.CreateBlogTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2).optional(),
});
exports.UpdateBlogTagSchema = exports.CreateBlogTagSchema.extend({
    id: zod_1.z.string().uuid(),
});
