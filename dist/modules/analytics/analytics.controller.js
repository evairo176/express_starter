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
exports.AnalyticsController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const analytics_schema_1 = require("../../common/zod/analytics.schema");
const http_config_1 = require("../../config/http.config");
class AnalyticsController {
    constructor(analyticsService) {
        this.recordVisit = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = analytics_schema_1.RecordVisitSchema.parse(req.body);
            const result = yield this.analyticsService.recordVisit(parsed);
            return response_1.default.success(res, result, 'Visit recorded successfully', http_config_1.HTTPSTATUS.CREATED);
        }));
        this.summary = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.analyticsService.getSummary();
            return response_1.default.success(res, result, 'Analytics summary retrieved successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.aggregations = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.analyticsService.getAggregations();
            return response_1.default.success(res, result, 'Analytics aggregations retrieved successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.analyticsService = analyticsService;
    }
}
exports.AnalyticsController = AnalyticsController;
