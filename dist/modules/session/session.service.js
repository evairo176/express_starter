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
exports.SessionService = void 0;
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const database_1 = require("../../database/database");
class SessionService {
    getSessionByUser(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            // Filter dasar
            const where = {
                userId,
                expiredAt: {
                    gt: new Date(),
                },
            };
            // Opsional: search pada userAgent
            if (search && search.trim() !== '') {
                where.userAgent = {
                    contains: search,
                    mode: 'insensitive',
                };
            }
            // Hitung total (without pagination)
            const total = yield database_1.db.session.count({
                where,
            });
            // Query data
            const sessions = yield database_1.db.session.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
                select: {
                    id: true,
                    userId: true,
                    userAgent: true,
                    isRevoke: true,
                    createdAt: true,
                    expiredAt: true,
                },
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: sessions,
                metadata: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    sortBy,
                    sortDir,
                    search: search !== null && search !== void 0 ? search : null,
                },
            };
        });
    }
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield database_1.db.session.findFirst({
                where: {
                    id: sessionId,
                },
                select: {
                    id: true,
                    userId: true,
                    userAgent: true,
                    createdAt: true,
                    expiredAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            isEmailVerified: true,
                            createdAt: true,
                            updatedAt: true,
                            userPreferences: {
                                select: {
                                    enable2FA: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!session) {
                throw new catch_errors_1.NotFoundException('Session not found');
            }
            return {
                user: session.user,
            };
        });
    }
    revokeSession(sessionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const revokeSession = yield database_1.db.session.delete({
                where: {
                    id: sessionId,
                    userId,
                },
            });
            if (!revokeSession) {
                throw new catch_errors_1.NotFoundException('Session not found');
            }
            return revokeSession;
        });
    }
}
exports.SessionService = SessionService;
