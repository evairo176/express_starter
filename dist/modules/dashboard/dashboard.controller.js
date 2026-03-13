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
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
class DashboardController {
    constructor(dashboardService) {
        this.getAnalytics = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const data = yield this.dashboardService.getAnalytics();
            res.status(200).json({
                status: 'success',
                data,
            });
        }));
        this.getTicketSummary = (0, middlewares_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const [ticketSummary, categoryStats, picPerformance] = yield Promise.all([
                this.dashboardService.getTicketSummary(),
                this.dashboardService.getCategoryStats(),
                this.dashboardService.getPicPerformance(),
            ]);
            return response_1.default.success(res, { ticketSummary, categoryStats, picPerformance }, `Get ticket summary successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.dashboardService = dashboardService;
    }
}
exports.DashboardController = DashboardController;
