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
exports.BlogCommentController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const blog_comment_schema_1 = require("../../common/zod/blog-comment.schema");
class BlogCommentController {
    constructor(blogCommentService) {
        /**
         * Public: submit a comment on a published post identified by slug.
         * Validates name/email/body (invalid email or out-of-range body -> 400 via
         * Zod) and persists the comment, which starts unapproved when moderation is
         * enabled (Req 4.1, 4.3, 4.4, 4.5, 4.7).
         */
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_comment_schema_1.CreateBlogCommentSchema.parse(req.body);
            const result = yield this.blogCommentService.create(req.params.slug, parsed);
            if (!result) {
                return response_1.default.error(res, 'Blog post not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, 'Comment submitted successfully', http_config_1.HTTPSTATUS.CREATED);
        }));
        /**
         * Public: list approved comments for a post (newest first) (Req 4.2).
         */
        this.listApproved = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogCommentService.listApprovedBySlug(req.params.slug);
            if (!result) {
                return response_1.default.error(res, 'Blog post not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, 'Get comments successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Admin: list ALL comments (including pending/unapproved) with pagination and
         * an optional `status` filter (pending | approved | all, default all), newest
         * first. Each comment includes its parent post's id/title/slug.
         */
        this.listAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { page, limit, status } = blog_comment_schema_1.AdminBlogCommentListQuerySchema.parse(Object.assign({}, req.query));
            const { data, metadata } = yield this.blogCommentService.listAllForAdmin({
                page,
                limit,
                status,
            });
            return response_1.default.success(res, data, 'Get comments successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        /**
         * Admin: pending/approved/total comment counts for the moderation dashboard.
         */
        this.count = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogCommentService.countByStatus();
            return response_1.default.success(res, result, 'Get comment counts successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Admin: approve a comment by id (Req 4.7).
         */
        this.approve = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogCommentService.approve(req.params.id);
            return response_1.default.success(res, result, 'Comment approved successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Admin: delete a comment by id. Responds with success only after the
         * deletion resolves (Req 4.6).
         */
        this.destroy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.blogCommentService.delete(req.params.id);
            return response_1.default.success(res, null, 'Comment deleted successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.blogCommentService = blogCommentService;
    }
}
exports.BlogCommentController = BlogCommentController;
