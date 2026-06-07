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
exports.DashboardController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const portofolio_schema_1 = require("../../common/zod/portofolio.schema");
const blog_post_schema_1 = require("../../common/zod/blog-post.schema");
const publish_toggle_schema_1 = require("../../common/zod/publish-toggle.schema");
class DashboardController {
    constructor(dashboardService) {
        this.getAnalytics = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = yield this.dashboardService.getAnalytics();
            res.status(200).json({
                status: 'success',
                data,
            });
        }));
        // --- Portfolio project admin CRUD (Req 10.1, 10.4) ------------------------
        /**
         * Admin project list with both published and unpublished items plus
         * Pagination_Metadata (Req 10.4).
         */
        this.listProjects = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.dashboardService.listProjects(Object.assign({}, req.query));
            return response_1.default.success(res, data, 'Find all portfolio projects successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getProject = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.dashboardService.getProject(req.params.id);
            return response_1.default.success(res, result, 'Get portfolio project successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.createProject = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portofolio_schema_1.CreatePortfolioSchema.parse(req.body);
            const result = yield this.dashboardService.createProject(parsed);
            return response_1.default.success(res, result, `${result === null || result === void 0 ? void 0 : result.title} new portfolio created`, http_config_1.HTTPSTATUS.CREATED);
        }));
        this.updateProject = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portofolio_schema_1.UpdatePortfolioSchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.dashboardService.updateProject(parsed);
            return response_1.default.success(res, result, 'Portfolio project updated successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.deleteProject = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.dashboardService.deleteProject(req.params.id);
            return response_1.default.success(res, null, 'Portfolio project deleted successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Toggle (or set) a project's published state and return the updated record
         * (Req 10.6).
         */
        this.toggleProjectPublished = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { isPublished } = publish_toggle_schema_1.PublishToggleSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
            const result = yield this.dashboardService.toggleProjectPublished(req.params.id, isPublished);
            return response_1.default.success(res, result, 'Portfolio project published state updated successfully', http_config_1.HTTPSTATUS.OK);
        }));
        // --- Blog post admin CRUD (Req 10.2, 10.5) --------------------------------
        /**
         * Admin blog list with both published and unpublished items plus
         * Pagination_Metadata (Req 10.5).
         */
        this.listPosts = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.dashboardService.listPosts(Object.assign({}, req.query));
            return response_1.default.success(res, data, 'Find all blog posts successfully', http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getPost = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.dashboardService.getPost(req.params.id);
            return response_1.default.success(res, result, 'Get blog post successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.createPost = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_post_schema_1.CreateBlogPostSchema.parse(req.body);
            const result = yield this.dashboardService.createPost(parsed);
            return response_1.default.success(res, result, 'Blog post created successfully', http_config_1.HTTPSTATUS.CREATED);
        }));
        this.updatePost = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_post_schema_1.UpdateBlogPostSchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.dashboardService.updatePost(parsed);
            return response_1.default.success(res, result, 'Blog post updated successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.deletePost = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.dashboardService.deletePost(req.params.id);
            return response_1.default.success(res, null, 'Blog post deleted successfully', http_config_1.HTTPSTATUS.OK);
        }));
        /**
         * Toggle (or set) a post's published state and return the updated record
         * (Req 10.6).
         */
        this.togglePostPublished = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { isPublished } = publish_toggle_schema_1.PublishToggleSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
            const result = yield this.dashboardService.togglePostPublished(req.params.id, isPublished);
            return response_1.default.success(res, result, 'Blog post published state updated successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.dashboardService = dashboardService;
    }
}
exports.DashboardController = DashboardController;
