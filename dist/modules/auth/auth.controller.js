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
exports.AuthController = void 0;
const middlewares_1 = require("../../middlewares");
const http_config_1 = require("../../config/http.config");
const auth_schema_1 = require("../../cummon/zod/auth.schema");
const cookies_1 = require("../../cummon/utils/cookies");
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const response_1 = __importDefault(require("../../cummon/utils/response"));
class AuthController {
    constructor(authService, mfaService) {
        this.register = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const body = auth_schema_1.registerSchema.parse(Object.assign({}, req === null || req === void 0 ? void 0 : req.body));
            const result = yield this.authService.register(body);
            return res.status(http_config_1.HTTPSTATUS.CREATED).json({
                message: 'User registered successfully',
                data: result.user,
            });
        }));
        this.login = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // header otomatis:
            const ua = req.headers['user-agent'];
            // header custom jika frontend mengirim:
            const xUa = req.headers['x-user-agent'];
            // atau fallback ke body:
            const bodyUa = (_a = req.body) === null || _a === void 0 ? void 0 : _a.userAgent;
            const userAgent = xUa || ua || bodyUa || 'unknown';
            const body = auth_schema_1.loginSchema.parse(Object.assign(Object.assign({}, req === null || req === void 0 ? void 0 : req.body), { userAgent }));
            const code = (_b = req === null || req === void 0 ? void 0 : req.body) === null || _b === void 0 ? void 0 : _b.code;
            const existingUser = yield this.authService.getProfile(body === null || body === void 0 ? void 0 : body.email);
            if (existingUser.mfaRequired && !code) {
                return response_1.default.success(res, {
                    mfaRequired: existingUser.mfaRequired,
                    user: null,
                }, 'Verify MFA authentication', http_config_1.HTTPSTATUS.OK);
            }
            if (existingUser.mfaRequired && code) {
                const { user, accessToken, refreshToken } = yield this.mfaService.verifyMFAForLogin(code, existingUser.user.email, userAgent);
                (0, cookies_1.setAuthenticationCookies)({
                    res,
                    accessToken,
                    refreshToken,
                });
                return response_1.default.success(res, {
                    user,
                    accessToken,
                    mfaRequired: existingUser.mfaRequired,
                }, 'User login with 2fa successfully', http_config_1.HTTPSTATUS.OK);
            }
            const result = yield this.authService.login(body);
            (0, cookies_1.setAuthenticationCookies)({
                res,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            });
            return response_1.default.success(res, {
                user: result.user,
                accessToken: result.accessToken,
                mfaRequired: result.mfaRequired,
            }, 'User login successfully auooo', http_config_1.HTTPSTATUS.OK);
        }));
        this.refreshToken = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                throw new catch_errors_1.UnauthorizedException('Missing refresh token');
            }
            const { accessToken, newRefreshToken, user, refreshTokenExpiresAt } = yield this.authService.refreshToken(refreshToken);
            if (newRefreshToken) {
                if (refreshTokenExpiresAt) {
                    res.cookie('refreshToken', newRefreshToken, (0, cookies_1.getRefreshTokenCookieOptions)({ expires: refreshTokenExpiresAt }));
                }
                else {
                    res.cookie('refreshToken', newRefreshToken, (0, cookies_1.getRefreshTokenCookieOptions)());
                }
            }
            res.cookie('accessToken', accessToken, (0, cookies_1.getAccessTokenCookieOptions)());
            return response_1.default.success(res, {
                user,
                accessToken,
            }, 'Refresh access token successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.verifyEmail = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { code } = auth_schema_1.verificationEmailSchema.parse(Object.assign({}, req === null || req === void 0 ? void 0 : req.body));
            yield this.authService.verifyEmail(code);
            return response_1.default.success(res, null, 'Email verified successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.forgotPassword = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const email = auth_schema_1.emailSchema.parse(req === null || req === void 0 ? void 0 : req.body.email);
            yield this.authService.forgotPassword(email);
            return response_1.default.success(res, null, 'Password reset email sent', http_config_1.HTTPSTATUS.OK);
        }));
        this.resetPassword = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const body = auth_schema_1.resetPasswordSchema.parse(req === null || req === void 0 ? void 0 : req.body);
            yield this.authService.resetPassword(body);
            (0, cookies_1.clearAuthenticationCookies)(res);
            return response_1.default.success(res, null, 'Reset password successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.logout = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const sessionId = req.sessionId;
            if (!sessionId) {
                throw new catch_errors_1.NotFoundException('Session is invalid');
            }
            yield this.authService.logout(sessionId);
            (0, cookies_1.clearAuthenticationCookies)(res);
            return response_1.default.success(res, null, 'User logout successfully', http_config_1.HTTPSTATUS.OK);
        }));
        this.authService = authService;
        this.mfaService = mfaService;
    }
}
exports.AuthController = AuthController;
