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
exports.PortfolioCategoryController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const portfolio_category_schema_1 = require("../../cummon/zod/portfolio-category.schema");
const http_config_1 = require("../../config/http.config");
class PortfolioCategoryController {
    constructor(portfolioCategoryService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portfolio_category_schema_1.CreatePortfolioCategorySchema.parse(req.body);
            const result = yield this.portfolioCategoryService.create(parsed);
            return response_1.default.success(res, result, `${result === null || result === void 0 ? void 0 : result.name} (${result === null || result === void 0 ? void 0 : result.name} created)`, http_config_1.HTTPSTATUS.CREATED);
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.portfolioCategoryService.findAll(Object.assign({}, req === null || req === void 0 ? void 0 : req.query));
            return response_1.default.success(res, data, `Find all category successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getOne = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.portfolioCategoryService.findById(req.params.id);
            if (!result) {
                return response_1.default.error(res, 'Category not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, `Get category successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.update = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portfolio_category_schema_1.UpdatePortfolioCategorySchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.portfolioCategoryService.update(parsed);
            return response_1.default.success(res, result, `Category updated successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.destroy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.portfolioCategoryService.delete(req.params.id);
            return response_1.default.success(res, null, `Category deleted successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.portfolioCategoryService = portfolioCategoryService;
    }
}
exports.PortfolioCategoryController = PortfolioCategoryController;
