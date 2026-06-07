"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogCommentService = void 0;
const app_config_1 = require("../../config/app.config");
const database_1 = require("../../database/database");
class BlogCommentService {
    /**
     * Resolve a published-or-not post by slug and return its id, or null when
     * no post matches the slug.
     */
    resolvePostIdBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const post = yield database_1.db.blogPost.findUnique({
                where: { slug },
                select: { id: true },
            });
            return (_a = post === null || post === void 0 ? void 0 : post.id) !== null && _a !== void 0 ? _a : null;
        });
    }
    /**
     * Create a comment for the post identified by `slug`.
     *
     * Comments begin in an unapproved state (`isApproved = false`) when comment
     * moderation is enabled (configurable via the `COMMENT_MODERATION` env var,
     * defaulting to enabled). The created comment is persisted and returned
     * (Req 4.1, 4.7).
     *
     * Returns `null` when no post matches the slug so the controller can respond
     * with a 404.
     */
    create(slug, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const blogPostId = yield this.resolvePostIdBySlug(slug);
            if (!blogPostId) {
                return null;
            }
            // When moderation is enabled, comments start unapproved and are hidden
            // from public reads until an admin approves them. When disabled, comments
            // are immediately approved/visible.
            const isApproved = !app_config_1.config.COMMENT_MODERATION;
            return database_1.db.blogComment.create({
                data: {
                    blogPostId,
                    name: data.name,
                    email: data.email,
                    body: data.body,
                    isApproved,
                },
            });
        });
    }
    /**
     * Return the APPROVED comments for the post identified by `slug`, ordered by
     * creation time descending (newest first) (Req 4.2, 4.7).
     *
     * Returns `null` when no post matches the slug so the controller can respond
     * with a 404.
     */
    listApprovedBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const blogPostId = yield this.resolvePostIdBySlug(slug);
            if (!blogPostId) {
                return null;
            }
            return database_1.db.blogComment.findMany({
                where: {
                    blogPostId,
                    isApproved: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    }
    /**
     * Admin: list ALL comments (including pending/unapproved) with pagination and
     * an optional status filter, newest first. Includes the parent post's
     * id/title/slug so the admin UI can show which post each comment belongs to.
     *
     * - status `pending`  -> isApproved: false
     * - status `approved` -> isApproved: true
     * - status `all`      -> no isApproved filter (default)
     */
    listAllForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, status = 'all', }) {
            const skip = (page - 1) * limit;
            const where = {};
            if (status === 'pending') {
                where.isApproved = false;
            }
            else if (status === 'approved') {
                where.isApproved = true;
            }
            const total = yield database_1.db.blogComment.count({ where });
            const comments = yield database_1.db.blogComment.findMany({
                where,
                include: {
                    post: {
                        select: { id: true, title: true, slug: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: comments,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    status,
                },
            };
        });
    }
    /**
     * Admin: pending/approved/total comment counts for the moderation dashboard.
     */
    countByStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const [pending, approved, total] = yield Promise.all([
                database_1.db.blogComment.count({ where: { isApproved: false } }),
                database_1.db.blogComment.count({ where: { isApproved: true } }),
                database_1.db.blogComment.count(),
            ]);
            return { pending, approved, total };
        });
    }
    /**
     * Approve an existing comment by id (Req 4.7).
     */
    approve(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogComment.update({
                where: { id },
                data: { isApproved: true },
            });
        });
    }
    /**
     * Delete an existing comment by id. The promise resolves only after the
     * deletion succeeds, so the controller awaits this before responding with
     * success (Req 4.6).
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogComment.delete({
                where: { id },
            });
        });
    }
}
exports.BlogCommentService = BlogCommentService;
