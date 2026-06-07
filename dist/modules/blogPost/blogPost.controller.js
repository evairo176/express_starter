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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostController = void 0;
const crypto_1 = require("crypto");
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const blog_post_schema_1 = require("../../common/zod/blog-post.schema");
const blog_public_list_schema_1 = require("../../common/zod/blog-public-list.schema");
// Cookie/header used to derive a stable visitor session id (Req 9.1).
const SESSION_COOKIE = 'sid';
const SESSION_HEADER = 'x-session-id';
class BlogPostController {
    constructor(blogPostService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_post_schema_1.CreateBlogPostSchema.parse(req.body);
            const result = yield this.blogPostService.create(parsed);
            return response_1.default.success(res, result, 'Blog post created successfully', http_config_1.HTTPSTATUS.CREATED);
        }));
        this.findAllAdmin = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.blogPostService.findAllAdmin(Object.assign({}, req.query));
            return response_1.default.success(res, data, 'Find all blog posts successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.findAllPublic = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_public_list_schema_1.BlogPublicListQuerySchema.parse(Object.assign({}, req.query));
            const { data, metadata } = yield this.blogPostService.findAllPublic({
                page: parsed.page,
                limit: parsed.limit,
                category: parsed.category,
                tag: parsed.tag,
                search: parsed.search,
            });
            return response_1.default.success(res, data, 'Find all blog posts successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getOne = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogPostService.findById(req.params.id);
            if (!result) {
                return response_1.default.error(res, 'Blog post not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, 'Get blog post successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Public blog detail by slug (Req 5.2, 5b.3, 6.1, 6.2, 6.3). Returns the post
         * with category, tags, reaction/view counts, reading time, and related posts.
         * Triggers accurate session-based view counting (Req 9.1).
         */
        this.getPublicBySlug = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const sessionId = this.resolveSessionId(req, res);
            const result = yield this.blogPostService.findPublicDetailBySlug(req.params.slug, sessionId);
            if (!result) {
                return response_1.default.error(res, 'Blog post not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, 'Get blog post successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.update = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_post_schema_1.UpdateBlogPostSchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.blogPostService.update(parsed);
            return response_1.default.success(res, result, 'Blog post updated successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Admin category/tag assignment (Req 3.2, 3.3, 3.7). Persists associations
         * and returns the updated post including category and tags.
         */
        this.assignTaxonomy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_post_schema_1.AssignBlogTaxonomySchema.parse(req.body);
            const result = yield this.blogPostService.assignTaxonomy(req.params.id, parsed);
            return response_1.default.success(res, result, 'Blog post taxonomy updated successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.destroy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.blogPostService.delete(req.params.id);
            return response_1.default.success(res, null, 'Blog post deleted successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.incrementView = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogPostService.incrementView(req.params.id);
            return response_1.default.success(res, result, 'Increment view successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.incrementLike = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogPostService.incrementLike(req.params.id);
            return response_1.default.success(res, result, 'Increment like successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.blogPostService = blogPostService;
    }
    /**
     * Derive the visitor session id from the `sid` cookie or `X-Session-Id`
     * header. Generates a new id (and sets the `sid` cookie) when absent so that
     * accurate, per-session view counting can work (Req 5b.1, 9.1).
     */
    resolveSessionId(req, res) {
        var _a;
        const fromCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE];
        const fromHeader = req.headers[SESSION_HEADER];
        let sessionId = (typeof fromCookie === 'string' && fromCookie) ||
            (typeof fromHeader === 'string' && fromHeader) ||
            (Array.isArray(fromHeader) ? fromHeader[0] : '');
        if (!sessionId) {
            sessionId = (0, crypto_1.randomUUID)();
            res.cookie(SESSION_COOKIE, sessionId, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24 * 365,
            });
        }
        return sessionId;
    }
}
exports.BlogPostController = BlogPostController;
