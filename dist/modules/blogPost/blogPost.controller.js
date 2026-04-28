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
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
const blog_post_schema_1 = require("../../cummon/zod/blog-post.schema");
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
            const { data, metadata } = yield this.blogPostService.findAllPublic(Object.assign({}, req.query));
            return response_1.default.success(res, data, 'Find all blog posts successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getOne = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogPostService.findById(req.params.id);
            if (!result) {
                return response_1.default.error(res, 'Blog post not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, 'Get blog post successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.getPublicBySlug = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogPostService.findBySlug(req.params.slug);
            if (!result || !result.isPublished) {
                return response_1.default.error(res, 'Blog post not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, 'Get blog post successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.update = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_post_schema_1.UpdateBlogPostSchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.blogPostService.update(parsed);
            return response_1.default.success(res, result, 'Blog post updated successfully', http_config_1.HTTPSTATUS.OK);
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
}
exports.BlogPostController = BlogPostController;
