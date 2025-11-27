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
exports.MfaController = void 0;
const http_config_1 = require("../../config/http.config");
const middlewares_1 = require("../../middlewares");
const mfa_schema_1 = require("../../cummon/zod/mfa.schema");
const cookies_1 = require("../../cummon/utils/cookies");
const response_1 = __importDefault(require("../../cummon/utils/response"));
class MfaController {
    constructor(mfaService) {
        this.generateMFASetup = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { secret, qrImageUrl, message } = yield this.mfaService.generateMFASetup(req);
            return response_1.default.success(res, {
                secret,
                qrImageUrl,
            }, message, http_config_1.HTTPSTATUS.OK);
        }));
        this.verifyMFASetup = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { code, secretKey } = mfa_schema_1.verifyMfaSchema.parse(Object.assign({}, req === null || req === void 0 ? void 0 : req.body));
            const { message, userPreferences } = yield this.mfaService.verifyMFASetup(req, code, secretKey);
            return response_1.default.success(res, userPreferences, message, http_config_1.HTTPSTATUS.OK);
        }));
        this.revokeMFASetup = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { message, userPreferences } = yield this.mfaService.revokeMFASetup(req);
            return response_1.default.success(res, userPreferences, message, http_config_1.HTTPSTATUS.OK);
        }));
        this.verifyMFAForLogin = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { code, email, userAgent } = mfa_schema_1.verifyMFAForLoginSchema.parse(Object.assign(Object.assign({}, req === null || req === void 0 ? void 0 : req.body), { userAgent: req.headers['user-agent'] }));
            const { user, accessToken, refreshToken } = yield this.mfaService.verifyMFAForLogin(code, email, userAgent);
            (0, cookies_1.setAuthenticationCookies)({ res, accessToken, refreshToken });
            return response_1.default.success(res, user, 'Verified & login successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.mfaService = mfaService;
    }
}
exports.MfaController = MfaController;
