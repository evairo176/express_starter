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
exports.MfaService = void 0;
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = require("../../database/database");
const date_time_1 = require("../../cummon/utils/date-time");
const jwt_1 = require("../../cummon/utils/jwt");
class MfaService {
    generateMFASetup(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req === null || req === void 0 ? void 0 : req.user;
            if (!user) {
                throw new catch_errors_1.UnauthorizedException('User not authorized');
            }
            if (user.userPreferences.enable2FA) {
                return {
                    message: 'MFA already enabled',
                };
            }
            let secretKey = user.userPreferences.twoFactorSecret;
            if (!secretKey) {
                const secret = speakeasy_1.default.generateSecret({ name: 'Squeezy' });
                secretKey = secret.base32;
                user.userPreferences.twoFactorSecret = secretKey;
                yield database_1.db.userPreferences.update({
                    where: {
                        id: user.userPreferences.id,
                        userId: user.id,
                    },
                    data: {
                        twoFactorSecret: secretKey,
                    },
                });
            }
            const url = speakeasy_1.default.otpauthURL({
                secret: secretKey,
                label: `${user.name}`,
                issuer: 'squeezy.com',
                encoding: 'base32',
            });
            const qrImageUrl = yield qrcode_1.default.toDataURL(url);
            return {
                message: 'Scan the QR code or use the setup key.',
                secret: secretKey,
                qrImageUrl,
            };
        });
    }
    verifyMFASetup(req, code, secretKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req === null || req === void 0 ? void 0 : req.user;
            if (!user) {
                throw new catch_errors_1.UnauthorizedException('User not authorized');
            }
            if (user.userPreferences.enable2FA) {
                return {
                    message: 'MFA is already enabled',
                    userPreferences: {
                        enable2FA: user.userPreferences.enable2FA,
                    },
                };
            }
            const isValid = speakeasy_1.default.totp.verify({
                secret: secretKey,
                encoding: 'base32',
                token: code,
            });
            if (!isValid) {
                throw new catch_errors_1.BadRequestException('Invalid MFA code, Please try again.');
            }
            user.userPreferences.enable2FA = true;
            yield database_1.db.userPreferences.update({
                where: {
                    id: user.userPreferences.id,
                    userId: user.id,
                },
                data: {
                    enable2FA: user.userPreferences.enable2FA,
                },
            });
            return {
                message: 'MFA setup completed successfully',
                userPreferences: {
                    enable2FA: user.userPreferences.enable2FA,
                },
            };
        });
    }
    revokeMFASetup(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req === null || req === void 0 ? void 0 : req.user;
            if (!user) {
                throw new catch_errors_1.UnauthorizedException('User not authorized');
            }
            if (!user.userPreferences.enable2FA) {
                return {
                    message: 'MFA is not enable',
                    userPreferences: {
                        enable2FA: user.userPreferences.enable2FA,
                    },
                };
            }
            user.userPreferences.twoFactorSecret = null;
            user.userPreferences.enable2FA = false;
            yield database_1.db.userPreferences.update({
                where: {
                    id: user.userPreferences.id,
                    userId: user.id,
                },
                data: {
                    twoFactorSecret: user.userPreferences.twoFactorSecret,
                    enable2FA: user.userPreferences.enable2FA,
                },
            });
            return {
                message: 'MFA revoke successfully',
                userPreferences: {
                    enable2FA: user.userPreferences.enable2FA,
                },
            };
        });
    }
    verifyMFAForLogin(code, email, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const user = yield database_1.db.user.findFirst({
                where: {
                    email,
                },
                include: {
                    userPreferences: true,
                },
            });
            if (!user) {
                throw new catch_errors_1.NotFoundException('User not found');
            }
            if (!((_a = user === null || user === void 0 ? void 0 : user.userPreferences) === null || _a === void 0 ? void 0 : _a.enable2FA) &&
                !((_b = user === null || user === void 0 ? void 0 : user.userPreferences) === null || _b === void 0 ? void 0 : _b.enable2FA)) {
                throw new catch_errors_1.UnauthorizedException('MFA not enable for this user');
            }
            const twoFactorSecret = ((_c = user.userPreferences) === null || _c === void 0 ? void 0 : _c.twoFactorSecret) || '';
            const isValid = speakeasy_1.default.totp.verify({
                secret: twoFactorSecret,
                encoding: 'base32', // default encoding jika secret disimpan dalam base32
                token: code,
            });
            if (!isValid) {
                throw new catch_errors_1.BadRequestException('Invalid MFA code, Please try again');
            }
            const session = yield database_1.db.session.create({
                data: {
                    userId: user.id,
                    userAgent: userAgent !== null && userAgent !== void 0 ? userAgent : null,
                    expiredAt: (0, date_time_1.oneDaysFromNow)(),
                },
            });
            const accessToken = (0, jwt_1.signJwtToken)({
                userId: user.id,
                sessionId: session.id,
            });
            const refreshToken = (0, jwt_1.signJwtToken)({
                sessionId: session.id,
            }, jwt_1.refreshTokenSignOptions);
            const showUser = yield database_1.db.user.findFirst({
                where: {
                    id: user.id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isEmailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    userPreferences: true,
                },
            });
            return {
                user: showUser,
                accessToken,
                refreshToken,
            };
        });
    }
}
exports.MfaService = MfaService;
