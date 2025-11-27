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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const uuid_1 = require("../../cummon/utils/uuid");
const database_1 = require("../../database/database");
const date_time_1 = require("../../cummon/utils/date-time");
const bcrypt_1 = require("../../cummon/utils/bcrypt");
const app_config_1 = require("../../config/app.config");
const jwt_1 = require("../../cummon/utils/jwt");
const mailer_1 = require("../../mailers/mailer");
const template_1 = require("../../mailers/templates/template");
const http_config_1 = require("../../config/http.config");
class AuthService {
    register(registerData) {
        return __awaiter(this, void 0, void 0, function* () {
            //   public async register(register: RegisterDto) {
            const { name, email, password } = registerData;
            const existingUser = yield database_1.db.user.findFirst({
                where: {
                    email,
                },
            });
            if (existingUser) {
                throw new catch_errors_1.BadRequestException('User already exists with this email', "AUTH_EMAIL_ALREADY_EXISTS" /* ErrorCode.AUTH_EMAIL_ALREADY_EXISTS */);
            }
            const hashPassword = yield (0, bcrypt_1.hashValue)(password);
            const newUser = yield database_1.db.user.create({
                data: {
                    name,
                    email,
                    password: hashPassword,
                },
            });
            const userId = newUser.id;
            const verification = yield database_1.db.verificationCode.create({
                data: {
                    userId,
                    code: (0, uuid_1.generateUniqueCode)(),
                    type: client_1.VerificationType.EMAIL_VERIFICATION,
                    expiresAt: (0, date_time_1.fortyFiveMinutesFromNow)(),
                },
            });
            // send email
            const verificationUrl = `${app_config_1.config.APP_ORIGIN}/confirm-account?code=${verification.code}`;
            const emailResult = yield (0, mailer_1.sendEmail)(Object.assign({ to: newUser.email }, (0, template_1.verifyEmailTemplate)(verificationUrl)));
            yield database_1.db.userPreferences.create({
                data: {
                    userId,
                    enable2FA: false,
                    emailNotification: true,
                },
            });
            const showNewUser = yield database_1.db.user.findFirst({
                where: {
                    id: userId,
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
                user: showNewUser,
            };
        });
    }
    login(loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { email, password, userAgent } = loginData;
            const user = yield database_1.db.user.findFirst({
                where: {
                    email,
                },
                include: {
                    userPreferences: true,
                },
            });
            if (!user) {
                throw new catch_errors_1.BadRequestException('Invalid email provided', "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            const isPasswordValid = yield (0, bcrypt_1.compareValue)(password, user.password);
            if (!isPasswordValid) {
                throw new catch_errors_1.BadRequestException('Invalid password provided', "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            if ((_a = user.userPreferences) === null || _a === void 0 ? void 0 : _a.enable2FA) {
                return {
                    user: null,
                    mfaRequired: true,
                    refreshToken: '',
                    accessToken: '',
                };
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
                mfaRequired: false,
            };
        });
    }
    // public async refreshToken(refreshTokenData: string) {
    //   const { payload } = verifyJwtToken<RefreshTPayload>(refreshTokenData, {
    //     secret: refreshTokenSignOptions.secret,
    //   });
    //   if (!payload) {
    //     throw new UnauthorizedException('Invalid refresh token');
    //   }
    //   // 1. Ambil session yang lama
    //   const oldSession = await db.session.findFirst({
    //     where: { id: payload.sessionId },
    //   });
    //   const now = Date.now();
    //   if (!oldSession) {
    //     throw new UnauthorizedException('Session does not exist');
    //   }
    //   if (oldSession.isRevoke) {
    //     throw new UnauthorizedException('Session has been revoked');
    //   }
    //   if (oldSession.expiredAt.getTime() <= now) {
    //     throw new UnauthorizedException('Session expired or invalid');
    //   }
    //   // 2. ROTATE SESSION: buat session baru
    //   const newSession = await db.session.create({
    //     data: {
    //       userId: oldSession.userId,
    //       userAgent: oldSession.userAgent,
    //       expiredAt: calculateExpirationDate(config.JWT.REFRESH_EXPIRES_IN),
    //       isRevoke: false,
    //     },
    //   });
    //   // 3. Revoke session lama
    //   await db.session.update({
    //     where: { id: oldSession.id },
    //     data: { isRevoke: true },
    //   });
    //   // 4. Generate token baru untuk session baru
    //   const accessToken = signJwtToken({
    //     userId: newSession.userId,
    //     sessionId: newSession.id,
    //   });
    //   const newRefreshToken = signJwtToken(
    //     { sessionId: newSession.id },
    //     refreshTokenSignOptions,
    //   );
    //   // 5. Ambil user
    //   const user = await db.user.findUnique({
    //     where: { id: newSession.userId },
    //     select: {
    //       id: true,
    //       name: true,
    //       email: true,
    //       isEmailVerified: true,
    //       createdAt: true,
    //       updatedAt: true,
    //       userPreferences: true,
    //     },
    //   });
    //   return {
    //     accessToken,
    //     newRefreshToken,
    //     user,
    //   };
    // }
    refreshToken(refreshTokenData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { payload } = (0, jwt_1.verifyJwtToken)(refreshTokenData, {
                secret: jwt_1.refreshTokenSignOptions.secret,
            });
            if (!payload) {
                throw new catch_errors_1.UnauthorizedException('Invalid refresh token');
            }
            const session = yield database_1.db.session.findFirst({
                where: { id: payload.sessionId },
            });
            const now = Date.now();
            if (!session) {
                throw new catch_errors_1.UnauthorizedException('Session does not exist');
            }
            if (session.isRevoke) {
                throw new catch_errors_1.UnauthorizedException('Session has been revoked');
            }
            if (session.expiredAt.getTime() <= now) {
                throw new catch_errors_1.UnauthorizedException('Session expired');
            }
            // // extend session expiry
            // const newExpiredAt = calculateExpirationDate(config.JWT.REFRESH_EXPIRES_IN);
            // await db.session.update({
            //   where: { id: session.id },
            //   data: { expiredAt: newExpiredAt },
            // });
            // tokens still use the same session
            const accessToken = (0, jwt_1.signJwtToken)({
                userId: session.userId,
                sessionId: session.id,
            });
            // hitung sisa waktu session
            const remainingMs = session.expiredAt.getTime() - Date.now();
            if (remainingMs <= 0) {
                throw new catch_errors_1.UnauthorizedException('Session expired');
            }
            const refreshTokenExpiresAt = Math.floor(remainingMs / 1000);
            // buat refresh token baru, tetapi expired mengikuti session.expiredAt
            const newRefreshToken = (0, jwt_1.signJwtToken)({ sessionId: session.id }, {
                secret: jwt_1.refreshTokenSignOptions.secret,
                expiresIn: refreshTokenExpiresAt, // dalam detik
            });
            // console.log({
            //   accessToken,
            //   newRefreshToken,
            //   expiresIn: Math.floor(remainingMs / 1000),
            // });
            const user = yield database_1.db.user.findUnique({
                where: { id: session.userId },
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
                accessToken,
                newRefreshToken,
                user,
                // tambahkan expiry token refresh agar controller bisa set cookie dengan maxAge yang tepat
                refreshTokenExpiresAt: session.expiredAt, // <------------
            };
        });
    }
    verifyEmail(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const validCode = yield database_1.db.verificationCode.findFirst({
                where: {
                    code,
                    type: "EMAIL_VERIFICATION" /* VerificationEnum.EMAIL_VERIFICATION */,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!validCode) {
                throw new catch_errors_1.BadRequestException('Invalid or expired verification code');
            }
            const updateUser = yield database_1.db.user.update({
                where: {
                    id: validCode.userId,
                },
                data: {
                    isEmailVerified: true,
                },
            });
            if (!updateUser) {
                throw new catch_errors_1.BadRequestException('Unable to verify email address', "VERIFICATION_ERROR" /* ErrorCode.VERIFICATION_ERROR */);
            }
            yield database_1.db.verificationCode.delete({
                where: {
                    id: validCode.id,
                },
            });
            return {
                user: updateUser,
            };
        });
    }
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield database_1.db.user.findFirst({
                where: {
                    email,
                },
            });
            if (!user) {
                throw new catch_errors_1.NotFoundException('User not found');
            }
            // check mail rate limit is 2 emails per 3 or 10 min
            const timeAgo = (0, date_time_1.threeMinutesAgo)();
            const maxAttempts = 2;
            const count = yield database_1.db.verificationCode.count({
                where: {
                    userId: user.id,
                    type: "PASSWORD_RESET" /* VerificationEnum.PASSWORD_RESET */,
                    createdAt: {
                        gt: timeAgo,
                    },
                },
            });
            if (count >= maxAttempts) {
                throw new catch_errors_1.HttpException('To many request, try again later', http_config_1.HTTPSTATUS.TOO_MANY_REQUESTS, "AUTH_TOO_MANY_ATTEMPTS" /* ErrorCode.AUTH_TOO_MANY_ATTEMPTS */);
            }
            const expiresAt = (0, date_time_1.anHourFromNow)();
            const validCode = yield database_1.db.verificationCode.create({
                data: {
                    userId: user.id,
                    type: "PASSWORD_RESET" /* VerificationEnum.PASSWORD_RESET */,
                    expiresAt,
                    code: (0, uuid_1.generateUniqueCode)(),
                },
            });
            const resetLink = `${app_config_1.config.APP_ORIGIN}/reset-password?code=${validCode.code}&exp=${expiresAt.getTime()}`;
            const { data, error } = yield (0, mailer_1.sendEmail)(Object.assign({ to: user.email }, (0, template_1.passwordResetTemplate)(resetLink)));
            if (!(data === null || data === void 0 ? void 0 : data.id)) {
                throw new catch_errors_1.InternalServerException(`${error === null || error === void 0 ? void 0 : error.name} ${error === null || error === void 0 ? void 0 : error.message}`);
            }
            return {
                url: resetLink,
                emailId: data.id,
            };
        });
    }
    resetPassword(_a) {
        return __awaiter(this, arguments, void 0, function* ({ password, verificationCode }) {
            const validCode = yield database_1.db.verificationCode.findFirst({
                where: {
                    code: verificationCode,
                    type: "PASSWORD_RESET" /* VerificationEnum.PASSWORD_RESET */,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!validCode) {
                throw new catch_errors_1.NotFoundException('Invalid or expred verification code');
            }
            const hashPassword = yield (0, bcrypt_1.hashValue)(password);
            const updateUser = yield database_1.db.user.update({
                where: {
                    id: validCode.userId,
                },
                data: {
                    password: hashPassword,
                },
            });
            if (!updateUser) {
                throw new catch_errors_1.BadRequestException('Failed to reset password');
            }
            yield database_1.db.verificationCode.delete({
                where: {
                    id: validCode.id,
                },
            });
            yield database_1.db.session.deleteMany({
                where: {
                    userId: updateUser.id,
                },
            });
            const showUser = yield database_1.db.user.findFirst({
                where: {
                    id: updateUser.id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isEmailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    userPreferences: true,
                    sessions: true,
                },
            });
            return {
                user: showUser,
            };
        });
    }
    logout(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield database_1.db.session.update({
                where: {
                    id: sessionId,
                },
                data: {
                    isRevoke: true,
                },
            });
        });
    }
    getProfile(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield database_1.db.user.findFirst({
                where: {
                    OR: [
                        {
                            email: identifier,
                        },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isEmailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    userPreferences: true,
                    password: true, // Include password for validation
                },
            });
            if (!user) {
                throw new catch_errors_1.BadRequestException('Invalid username or email provided', "AUTH_USER_NOT_FOUND" /* ErrorCode.AUTH_USER_NOT_FOUND */);
            }
            // if (user.role === 'company_owner' && user.status !== 'APPROVE') {
            //   throw new BadRequestException(
            //     'Your current status is Pending approval',
            //     ErrorCode.PENDING_APPROVAL,
            //   );
            // }
            const mfaRequired = (_a = user === null || user === void 0 ? void 0 : user.userPreferences) === null || _a === void 0 ? void 0 : _a.enable2FA;
            return {
                user: user,
                mfaRequired: mfaRequired,
                refreshToken: '',
                accessToken: '',
            };
        });
    }
}
exports.AuthService = AuthService;
