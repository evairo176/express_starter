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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostService = void 0;
const database_1 = require("../../database/database");
const catch_errors_1 = require("../../common/utils/catch-errors");
const pagination_1 = require("../../common/utils/pagination");
const reading_time_1 = require("../../common/utils/reading-time");
const cache_1 = require("../../common/cache/cache");
// 24h window for accurate session-based view counting (Req 5b.1, 5b.2).
const VIEW_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Cache tag for all public blog responses (Req 14.3). */
const BLOG_CACHE_TAG = 'blog';
class BlogPostService {
    /**
     * Create a blog post. Folds optional category/tag assignment into the create
     * flow (Req 3.1, 3.2, 3.3). A non-existent category throws a 400 (Req 3.7).
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { categoryId, tagIds } = data, rest = __rest(data, ["categoryId", "tagIds"]);
            if (categoryId) {
                yield this.assertCategoryExists(categoryId);
            }
            const post = yield database_1.db.blogPost.create({
                data: Object.assign(Object.assign({}, rest), { isPublished: (_a = data.isPublished) !== null && _a !== void 0 ? _a : false, categoryId: categoryId !== null && categoryId !== void 0 ? categoryId : null }),
            });
            if (tagIds && tagIds.length) {
                yield this.syncTags(post.id, tagIds);
            }
            // Invalidate cached public blog responses (Req 14.3).
            cache_1.cacheStore.delByTag(BLOG_CACHE_TAG);
            return this.findById(post.id);
        });
    }
    findAllAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, isPublished, }) {
            const skip = (page - 1) * limit;
            const where = {};
            if (typeof isPublished === 'boolean') {
                where.isPublished = isPublished;
            }
            if (typeof isPublished === 'string' && isPublished.trim() !== '') {
                if (isPublished === 'true')
                    where.isPublished = true;
                if (isPublished === 'false')
                    where.isPublished = false;
            }
            if (search && search.trim() !== '') {
                where.OR = [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        slug: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ];
            }
            const total = yield database_1.db.blogPost.count({ where });
            const posts = yield database_1.db.blogPost.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: posts,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    sortBy,
                    sortDir,
                    search: search !== null && search !== void 0 ? search : null,
                },
            };
        });
    }
    /**
     * Public blog list (Req 3.4, 3.5, 3.6). Returns only published posts and
     * supports filtering by category slug and tag slug, plus search and
     * pagination. An empty filter result returns an empty list with metadata.
     */
    findAllPublic(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, category, tag, search, }) {
            const skip = (page - 1) * limit;
            // Only published posts are ever returned (Req 3.4, 3.5).
            const where = {
                isPublished: true,
            };
            // Category filter by slug (Req 3.4).
            if (category && category.trim() !== '') {
                where.category = { slug: category };
            }
            // Tag filter by slug (Req 3.5).
            if (tag && tag.trim() !== '') {
                where.tags = { some: { tag: { slug: tag } } };
            }
            // Case-insensitive title/excerpt/slug search (Req 3.6).
            if (search && search.trim() !== '') {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { excerpt: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ];
            }
            const total = yield database_1.db.blogPost.count({ where });
            const posts = yield database_1.db.blogPost.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: Number(skip),
                take: Number(limit),
                include: {
                    category: true,
                    tags: { include: { tag: true } },
                },
            });
            return {
                data: posts,
                metadata: (0, pagination_1.buildPaginationMetadata)(total, page, limit),
            };
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.findUnique({
                where: { id },
                include: {
                    category: true,
                    tags: { include: { tag: true } },
                },
            });
        });
    }
    findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.findUnique({
                where: { slug },
                include: {
                    category: true,
                    tags: { include: { tag: true } },
                },
            });
        });
    }
    /**
     * Public blog detail by slug (Req 5.2, 5b.3, 6.1, 6.2, 6.3).
     *
     * Returns the published post with its category, tags, reaction count, view
     * count, reading time, and up to 3 related published posts. When a
     * `sessionId` is supplied, the accurate view counter is triggered (Req 9.1)
     * so the returned view count reflects the recorded visit.
     */
    findPublicDetailBySlug(slug, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const post = yield database_1.db.blogPost.findUnique({
                where: { slug },
                include: {
                    category: true,
                    tags: { include: { tag: true } },
                },
            });
            if (!post || !post.isPublished) {
                return null;
            }
            // Trigger accurate, idempotent view counting for this session (Req 5b.1).
            if (sessionId) {
                yield this.recordView(post.id, sessionId);
            }
            const [reactionCount, fresh, relatedPosts] = yield Promise.all([
                // Reaction count queried directly against BlogReaction (Req 5.2).
                database_1.db.blogReaction.count({ where: { blogPostId: post.id } }),
                // Re-read totalViews so the response reflects the just-recorded view.
                database_1.db.blogPost.findUnique({
                    where: { id: post.id },
                    select: { totalViews: true },
                }),
                this.findRelatedPosts(post),
            ]);
            return Object.assign(Object.assign({}, post), { totalViews: (_a = fresh === null || fresh === void 0 ? void 0 : fresh.totalViews) !== null && _a !== void 0 ? _a : post.totalViews, reactionCount, readingTime: (0, reading_time_1.calculateReadingTime)(post.content), relatedPosts });
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, categoryId, tagIds } = data, rest = __rest(data, ["id", "categoryId", "tagIds"]);
            if (categoryId) {
                yield this.assertCategoryExists(categoryId);
            }
            yield database_1.db.blogPost.update({
                where: { id },
                data: Object.assign(Object.assign({}, rest), (categoryId !== undefined ? { categoryId } : {})),
            });
            // Replace tag associations when tagIds is provided (Req 3.3).
            if (tagIds !== undefined) {
                yield this.resetTags(id, tagIds);
            }
            // Invalidate cached public blog responses (Req 14.3).
            cache_1.cacheStore.delByTag(BLOG_CACHE_TAG);
            return this.findById(id);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield database_1.db.blogPost.delete({
                where: { id },
            });
            // Invalidate cached public blog responses (Req 14.3).
            cache_1.cacheStore.delByTag(BLOG_CACHE_TAG);
            return deleted;
        });
    }
    /**
     * Assign at most one category and zero or more tags to a post, persisting the
     * associations and returning the updated post including its category and tags
     * (Req 3.1, 3.2, 3.3). A non-existent category throws a 400 (Req 3.7).
     */
    assignTaxonomy(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield database_1.db.blogPost.findUnique({ where: { id } });
            if (!post) {
                throw new catch_errors_1.BadRequestException('Blog post not found');
            }
            if (data.categoryId) {
                yield this.assertCategoryExists(data.categoryId);
            }
            if (data.categoryId !== undefined) {
                yield database_1.db.blogPost.update({
                    where: { id },
                    data: { categoryId: data.categoryId },
                });
            }
            if (data.tagIds !== undefined) {
                yield this.resetTags(id, data.tagIds);
            }
            return this.findById(id);
        });
    }
    /**
     * Accurate session-based view counting (Req 5b.1, 5b.2, 5b.3).
     *
     * Increments `totalViews` at most once per `(postId, sessionId)` within a 24h
     * window using the `BlogPostView` unique constraint. When an existing view
     * row is older than 24h, its timestamp is refreshed and the count increments;
     * within 24h nothing changes.
     */
    recordView(postId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield database_1.db.blogPostView.findUnique({
                where: { blogPostId_sessionId: { blogPostId: postId, sessionId } },
            });
            const now = Date.now();
            if (!existing) {
                // First view for this session: create the row and increment.
                try {
                    yield database_1.db.blogPostView.create({
                        data: { blogPostId: postId, sessionId },
                    });
                }
                catch (_a) {
                    // Concurrent create for the same (postId, sessionId) lost the race;
                    // the other request already counted this view, so do nothing.
                    return this.getViewCount(postId);
                }
                yield database_1.db.blogPost.update({
                    where: { id: postId },
                    data: { totalViews: { increment: 1 } },
                });
                return this.getViewCount(postId);
            }
            const age = now - new Date(existing.createdAt).getTime();
            if (age > VIEW_WINDOW_MS) {
                // The 24h window has elapsed: refresh the row and count again.
                yield database_1.db.blogPostView.update({
                    where: { blogPostId_sessionId: { blogPostId: postId, sessionId } },
                    data: { createdAt: new Date() },
                });
                yield database_1.db.blogPost.update({
                    where: { id: postId },
                    data: { totalViews: { increment: 1 } },
                });
            }
            // Within the window: leave the count unchanged (Req 5b.2).
            return this.getViewCount(postId);
        });
    }
    /**
     * Up to 3 related published posts (Req 6.2, 6.3). Selected by shared category
     * or shared tags, excluding the requested post. Falls back to the most recent
     * published posts when the post has no category and no tags.
     */
    findRelatedPosts(post) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const tagIds = ((_a = post.tags) !== null && _a !== void 0 ? _a : []).map((t) => t.tagId);
            const hasCategory = Boolean(post.categoryId);
            const hasTags = tagIds.length > 0;
            if (!hasCategory && !hasTags) {
                // Fallback: most recent published posts, excluding the requested post.
                return database_1.db.blogPost.findMany({
                    where: { isPublished: true, id: { not: post.id } },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                    include: {
                        category: true,
                        tags: { include: { tag: true } },
                    },
                });
            }
            const or = [];
            if (hasCategory) {
                or.push({ categoryId: post.categoryId });
            }
            if (hasTags) {
                or.push({ tags: { some: { tagId: { in: tagIds } } } });
            }
            return database_1.db.blogPost.findMany({
                where: {
                    isPublished: true,
                    id: { not: post.id },
                    OR: or,
                },
                orderBy: { createdAt: 'desc' },
                take: 3,
                include: {
                    category: true,
                    tags: { include: { tag: true } },
                },
            });
        });
    }
    getViewCount(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fresh = yield database_1.db.blogPost.findUnique({
                where: { id: postId },
                select: { id: true, totalViews: true },
            });
            return { id: postId, totalViews: (_a = fresh === null || fresh === void 0 ? void 0 : fresh.totalViews) !== null && _a !== void 0 ? _a : 0 };
        });
    }
    assertCategoryExists(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield database_1.db.blogCategory.findUnique({
                where: { id: categoryId },
            });
            if (!category) {
                throw new catch_errors_1.BadRequestException(`Blog category "${categoryId}" does not exist`);
            }
        });
    }
    syncTags(blogPostId, tagIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tagIds.length)
                return;
            yield database_1.db.blogTagOnBlogPost.createMany({
                data: tagIds.map((tagId) => ({ blogPostId, tagId })),
                skipDuplicates: true,
            });
        });
    }
    resetTags(blogPostId, tagIds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.db.blogTagOnBlogPost.deleteMany({ where: { blogPostId } });
            yield this.syncTags(blogPostId, tagIds);
        });
    }
    incrementView(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.update({
                where: { id },
                data: {
                    totalViews: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    totalViews: true,
                },
            });
        });
    }
    incrementLike(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.update({
                where: { id },
                data: {
                    totalLikes: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    totalLikes: true,
                },
            });
        });
    }
}
exports.BlogPostService = BlogPostService;
