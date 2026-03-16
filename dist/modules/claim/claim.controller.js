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
exports.ClaimController = void 0;
const middlewares_1 = require("../../middlewares");
const response_1 = __importDefault(require("../../cummon/utils/response"));
const http_config_1 = require("../../config/http.config");
const claim_schema_1 = require("../../cummon/zod/claim.schema");
class ClaimController {
    constructor(claimService) {
        this.createClaim = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            const body = claim_schema_1.createClaimSchema.parse(Object.assign({}, req === null || req === void 0 ? void 0 : req.body));
            const { name, desc } = body;
            const result = yield this.claimService.createClaim({
                name,
                desc,
                userId: userId,
            });
            return response_1.default.success(res, result, `Claim created successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.submitClaim = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            const result = yield this.claimService.submitClaim(id, userId);
            return response_1.default.success(res, result, `Claim submitted successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.findAll = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { data, metadata } = yield this.claimService.findAll(Object.assign({}, req === null || req === void 0 ? void 0 : req.query));
            return response_1.default.success(res, data, `Find all claims successfully`, http_config_1.HTTPSTATUS.OK, metadata);
        }));
        this.findOne = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const result = yield this.claimService.getClaimDetail(id);
            return response_1.default.success(res, result, `Find one successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.reviewClaim = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            yield this.claimService.reviewClaim(id, userId);
            return response_1.default.success(res, null, `Claim reviewed successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.approveClaim = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            yield this.claimService.approveClaim(id, userId);
            return response_1.default.success(res, null, `Claim approved successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.rejectClaim = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            const body = claim_schema_1.rejectClaimSchema.parse(Object.assign({}, req === null || req === void 0 ? void 0 : req.body));
            yield this.claimService.rejectClaim(id, userId, body === null || body === void 0 ? void 0 : body.note);
            return response_1.default.success(res, null, `Claim rejected successfully`, http_config_1.HTTPSTATUS.OK);
        }));
        this.claimService = claimService;
    }
}
exports.ClaimController = ClaimController;
