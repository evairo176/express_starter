"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminBlogCommentListQuerySchema = exports.CreateBlogCommentSchema = void 0;
const zod_1 = require("zod");
/**
 * Blog comment creation.
 * - `name`: non-empty
 * - `email`: valid email format
 * - `body`: length 1..2000 (NOT trimmed before length check; whitespace-only allowed)
 * Validates: Requirements 4.3, 4.4, 4.5
 */
exports.CreateBlogCommentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    body: zod_1.z.string().min(1).max(2000),
});
/**
 * Admin comment moderation list query.
 * - `page` / `limit`: coerced positive ints with defaults
 * - `status`: pending | approved | all (default all)
 */
exports.AdminBlogCommentListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(10),
    status: zod_1.z.enum(['pending', 'approved', 'all']).default('all'),
});
