"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBlogPostSchema = exports.CreateBlogPostSchema = void 0;
const zod_1 = require("zod");
exports.CreateBlogPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    excerpt: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().optional(),
    isPublished: zod_1.z.boolean().optional(),
});
exports.UpdateBlogPostSchema = exports.CreateBlogPostSchema.extend({
    id: zod_1.z.string().uuid(),
});
