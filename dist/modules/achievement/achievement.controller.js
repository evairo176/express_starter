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
exports.AchievementController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../common/utils/response"));
const http_config_1 = require("../../config/http.config");
const achievement_schema_1 = require("../../common/zod/achievement.schema");
class AchievementController {
    constructor(achievementService) {
        this.publicList = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.achievementService.getPublic();
            return response_1.default.success(res, result, `Get published achievements successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.list = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const { data, metadata } = yield this.achievementService.findAll({
                page,
                limit,
            });
            return response_1.default.success(res, data, `Find all achievements successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = achievement_schema_1.CreateAchievementSchema.parse(req.body);
            const result = yield this.achievementService.create(parsed);
            return response_1.default.success(res, result, `Achievement created successfully`, http_config_1.HTTPSTATUS.CREATED);
        }));
        this.update = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.achievementService.findOne(req.params.id);
            if (!existing) {
                return response_1.default.error(res, 'Achievement not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            const parsed = achievement_schema_1.UpdateAchievementSchema.parse(req.body);
            const result = yield this.achievementService.update(req.params.id, parsed);
            return response_1.default.success(res, result, `Achievement updated successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.destroy = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.achievementService.findOne(req.params.id);
            if (!existing) {
                return response_1.default.error(res, 'Achievement not found', http_config_1.HTTPSTATUS.NOT_FOUND);
            }
            yield this.achievementService.delete(req.params.id);
            return response_1.default.success(res, null, `Achievement deleted successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.achievementService = achievementService;
    }
}
exports.AchievementController = AchievementController;
