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
exports.DashboardService = void 0;
const database_1 = require("../../database/database");
const portfolio_service_1 = require("../portfolio/portfolio.service");
const blogPost_service_1 = require("../blogPost/blogPost.service");
const catch_errors_1 = require("../../common/utils/catch-errors");
/**
 * The `dashboard` module aggregates authenticated admin CRUD over portfolio
 * projects and blog posts (Req 10). It delegates the existing domain logic to
 * `PortfolioService` and `BlogPostService` rather than duplicating it, and adds
 * the admin-only publish-toggle operations (Req 10.6).
 */
class DashboardService {
    constructor(portfolioService = new portfolio_service_1.PortfolioService(), blogPostService = new blogPost_service_1.BlogPostService()) {
        this.portfolioService = portfolioService;
        this.blogPostService = blogPostService;
    }
    // --- Portfolio admin CRUD (Req 10.1, 10.4) --------------------------------
    /**
     * Admin project list: returns BOTH published and unpublished projects with
     * Pagination_Metadata (Req 10.4). Delegates to `PortfolioService.findAll`,
     * which applies no `isPublished` filter.
     */
    listProjects(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.portfolioService.findAll(params);
        });
    }
    getProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = yield this.portfolioService.findById(id);
            if (!project) {
                throw new catch_errors_1.NotFoundException(`Portfolio with id "${id}" not found`, "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            }
            return project;
        });
    }
    createProject(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.portfolioService.create(data);
        });
    }
    updateProject(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.portfolioService.update(data);
        });
    }
    deleteProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.portfolioService.delete(id);
        });
    }
    /**
     * Toggle (or set) a project's published state, persist it, and return the
     * updated record (Req 10.6). When `isPublished` is omitted, the current
     * state is flipped.
     */
    toggleProjectPublished(id, isPublished) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield database_1.db.portfolio.findUnique({ where: { id } });
            if (!existing) {
                throw new catch_errors_1.NotFoundException(`Portfolio with id "${id}" not found`, "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            }
            const nextState = typeof isPublished === 'boolean' ? isPublished : !existing.isPublished;
            return database_1.db.portfolio.update({
                where: { id },
                data: { isPublished: nextState },
            });
        });
    }
    // --- Blog post admin CRUD (Req 10.2, 10.5) --------------------------------
    /**
     * Admin blog list: returns BOTH published and unpublished posts with
     * Pagination_Metadata (Req 10.5). Delegates to `BlogPostService.findAllAdmin`.
     */
    listPosts(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.blogPostService.findAllAdmin(params);
        });
    }
    getPost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield this.blogPostService.findById(id);
            if (!post) {
                throw new catch_errors_1.NotFoundException(`Blog post with id "${id}" not found`, "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            }
            return post;
        });
    }
    createPost(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.blogPostService.create(data);
        });
    }
    updatePost(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.blogPostService.update(data);
        });
    }
    deletePost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.blogPostService.delete(id);
        });
    }
    /**
     * Toggle (or set) a post's published state, persist it, and return the
     * updated record (Req 10.6). When `isPublished` is omitted, the current
     * state is flipped.
     */
    togglePostPublished(id, isPublished) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield database_1.db.blogPost.findUnique({ where: { id } });
            if (!existing) {
                throw new catch_errors_1.NotFoundException(`Blog post with id "${id}" not found`, "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            }
            const nextState = typeof isPublished === 'boolean' ? isPublished : !existing.isPublished;
            yield database_1.db.blogPost.update({
                where: { id },
                data: { isPublished: nextState },
            });
            return this.blogPostService.findById(id);
        });
    }
    getAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Top Tags
            const topTags = yield database_1.db.portfolioTag.findMany({
                include: {
                    _count: {
                        select: { portfolios: true },
                    },
                },
                orderBy: {
                    portfolios: {
                        _count: 'desc',
                    },
                },
                take: 5,
            });
            // 2. Top Tech Stacks
            const topTechStacks = yield database_1.db.techStack.findMany({
                include: {
                    _count: {
                        select: { portfolios: true },
                    },
                },
                orderBy: {
                    portfolios: {
                        _count: 'desc',
                    },
                },
                take: 5,
            });
            // 3. Favorite Categories
            const topCategories = yield database_1.db.portfolioCategory.findMany({
                include: {
                    _count: {
                        select: { portfolios: true },
                    },
                },
                orderBy: {
                    portfolios: {
                        _count: 'desc',
                    },
                },
                take: 5,
            });
            return {
                topTags: topTags.map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                    count: tag._count.portfolios,
                })),
                topTechStacks: topTechStacks.map((tech) => ({
                    id: tech.id,
                    name: tech.name,
                    count: tech._count.portfolios,
                })),
                topCategories: topCategories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    count: cat._count.portfolios,
                })),
            };
        });
    }
}
exports.DashboardService = DashboardService;
