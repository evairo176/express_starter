"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBlogCategorySchema = exports.CreateBlogCategorySchema = void 0;
const zod_1 = require("zod");
/**
 * Blog category. Follows portfolio-category.schema.ts style.
 * - `name`: required
 * - `slug`: optional (may be derived from name when omitted)
 * Validates: Requirements 3.7
 */
exports.CreateBlogCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2).optional(),
});
exports.UpdateBlogCategorySchema = exports.CreateBlogCategorySchema.extend({
    id: zod_1.z.string().uuid(),
});
