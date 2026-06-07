"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBlogReactionSchema = void 0;
const zod_1 = require("zod");
/**
 * Blog reaction creation.
 * - `type`: optional, defaults to "like"
 * Validates: Requirements 5b (blog reactions)
 */
exports.CreateBlogReactionSchema = zod_1.z.object({
    type: zod_1.z.string().min(1).optional().default('like'),
});
