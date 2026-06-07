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
exports.PortfolioController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const portofolio_schema_1 = require("../../common/zod/portofolio.schema");
const portfolio_public_list_schema_1 = require("../../common/zod/portfolio-public-list.schema");
const http_config_1 = require("../../config/http.config");
class PortfolioController {
    constructor(portfolioService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portofolio_schema_1.CreatePortfolioSchema.parse(req.body);
            const result = yield this.portfolioService.create(parsed);
            return response_1.default.success(res, result, `${result === null || result === void 0 ? void 0 : result.title} new portfolio created`, 201);
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.portfolioService.findAll(Object.assign({}, req === null || req === void 0 ? void 0 : req.query));
            return response_1.default.success(res, data, `Find all portolio successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.getOne = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.portfolioService.findById(req.params.id);
            if (!result) {
                return response_1.default.error(res, 'Portfolio not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            return response_1.default.success(res, result, `Get portfolio successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        // Public endpoints (no auth) ------------------------------------------------
        /**
         * Public project list with filters, search, featured, and pagination
         * (Req 2.1–2.8). Query is validated by `PortfolioPublicListQuerySchema`;
         * `tags`/`tech` arrive as CSV strings and are split on comma.
         */
        this.findPublic = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portfolio_public_list_schema_1.PortfolioPublicListQuerySchema.parse(Object.assign({}, req.query));
            const splitCsv = (value) => value
                ? value
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter((entry) => entry.length > 0)
                : undefined;
            const { data, metadata } = yield this.portfolioService.findPublic({
                page: parsed.page,
                limit: parsed.limit,
                category: parsed.category,
                tags: splitCsv(parsed.tags),
                tech: splitCsv(parsed.tech),
                search: parsed.search,
                featured: parsed.featured,
            });
            return response_1.default.success(res, data, `Find public portfolios successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        /**
         * Public project detail by slug (Req 1.2–1.6). The service throws a 404 when
         * the slug is missing or the project is not published.
         */
        this.findPublicBySlug = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.portfolioService.findPublishedBySlug(req.params.slug);
            return response_1.default.success(res, result, `Get public portfolio successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.update = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portofolio_schema_1.UpdatePortfolioSchema.parse(Object.assign(Object.assign({}, req.body), { id: req.params.id }));
            const result = yield this.portfolioService.update(parsed);
            return response_1.default.success(res, result, `Portfolio updated successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.destroy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.portfolioService.delete(req.params.id);
            return response_1.default.success(res, null, `Portfolio deleted successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.portfolioService = portfolioService;
    }
}
exports.PortfolioController = PortfolioController;
