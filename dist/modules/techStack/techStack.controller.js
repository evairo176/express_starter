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
exports.TechStackController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
const tech_stack_schema_1 = require("../../cummon/zod/tech-stack.schema");
class TechStackController {
    constructor(TechStackService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = tech_stack_schema_1.CreateTechStackSchema.parse(req.body);
            const result = yield this.TechStackService.create(parsed);
            return response_1.default.success(res, result, `${result === null || result === void 0 ? void 0 : result.name} (${result === null || result === void 0 ? void 0 : result.name} created)`, http_config_1.HTTPSTATUS.CREATED);
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.TechStackService.findAll(Object.assign({}, req === null || req === void 0 ? void 0 : req.query));
            return response_1.default.success(res, data, `Find all Tech Stack successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.TechStackService = TechStackService;
    }
}
exports.TechStackController = TechStackController;
