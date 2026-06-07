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
exports.BlogTagController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const blog_tag_schema_1 = require("../../common/zod/blog-tag.schema");
const http_config_1 = require("../../config/http.config");
class BlogTagController {
    constructor(blogTagService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_tag_schema_1.CreateBlogTagSchema.parse(req.body);
            const result = yield this.blogTagService.create(parsed);
            return response_1.default.success(res, result, `${result === null || result === void 0 ? void 0 : result.name} created`, http_config_1.HTTPSTATUS.CREATED);
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.blogTagService.findAll(Object.assign({}, req === null || req === void 0 ? void 0 : req.query));
            return response_1.default.success(res, data, `Find all blog tag successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getOne = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.blogTagService.findById(req.params.id);
            if (!result) {
                return response_1.default.error(res, 'Tag not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, `Get tag successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.update = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = blog_tag_schema_1.UpdateBlogTagSchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.blogTagService.update(parsed);
            return response_1.default.success(res, result, `Tag updated successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.destroy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.blogTagService.delete(req.params.id);
            return response_1.default.success(res, null, `Tag deleted successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.blogTagService = blogTagService;
    }
}
exports.BlogTagController = BlogTagController;
