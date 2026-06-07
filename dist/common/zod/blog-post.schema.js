"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignBlogTaxonomySchema = exports.UpdateBlogPostSchema = exports.CreateBlogPostSchema = void 0;
const zod_1 = require("zod");
exports.CreateBlogPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    excerpt: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().optional(),
    isPublished: zod_1.z.boolean().optional(),
    // Taxonomy (Req 3.1, 3.2, 3.3): at most one category, zero or more tags.
    categoryId: zod_1.z.string().optional().nullable(),
    tagIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.UpdateBlogPostSchema = exports.CreateBlogPostSchema.extend({
    id: zod_1.z.string().uuid(),
});
/**
 * Dedicated category/tag assignment payload for the admin assignment endpoint
 * (Req 3.2, 3.3, 3.7). `categoryId` may be set to null to clear the category.
 */
exports.AssignBlogTaxonomySchema = zod_1.z.object({
    categoryId: zod_1.z.string().optional().nullable(),
    tagIds: zod_1.z.array(zod_1.z.string()).optional(),
});
