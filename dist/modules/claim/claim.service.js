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
exports.ClaimService = void 0;
const database_1 = require("../../database/database");
const catch_errors_1 = require("../../cummon/utils/catch-errors");
class ClaimService {
    createClaim(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, desc, userId } = payload;
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const claim = yield tx.claim.create({
                    data: {
                        name,
                        desc,
                        createdById: userId,
                        status: 'DRAFT',
                    },
                });
                yield tx.claimApprovalLog.create({
                    data: {
                        claimId: claim.id,
                        actorId: userId,
                        fromStatus: 'DRAFT',
                        toStatus: 'DRAFT',
                    },
                });
                return claim;
            }));
        });
    }
    submitClaim(claimId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const claim = yield tx.claim.findUniqueOrThrow({
                    where: { id: claimId },
                });
                if (claim.status !== 'DRAFT') {
                    throw new catch_errors_1.BadRequestException('Status not in DRAFT', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                yield tx.claim.update({
                    where: { id: claimId },
                    data: {
                        status: 'SUBMITTED',
                    },
                });
                yield tx.claimApprovalLog.create({
                    data: {
                        claimId,
                        actorId: userId,
                        fromStatus: claim.status,
                        toStatus: 'SUBMITTED',
                    },
                });
                return { message: 'Claim submitted' };
            }));
        });
    }
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            // Filter dasar
            const where = {
            // userId,
            // expiredAt: {
            //   gt: new Date(),
            // },
            };
            // Opsional: search pada userAgent
            if (search && search.trim() !== '') {
                where.name = {
                    contains: search,
                    mode: 'insensitive',
                };
            }
            // Hitung total (without pagination)
            const total = yield database_1.db.claim.count({
                where,
            });
            // Query data
            const claims = yield database_1.db.claim.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    logs: {
                        include: {
                            actor: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: claims,
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
    reviewClaim(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const claim = yield tx.claim.findUnique({
                    where: { id },
                });
                if (!claim) {
                    throw new catch_errors_1.BadRequestException('Claim not found', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                if (claim.status !== 'SUBMITTED') {
                    throw new catch_errors_1.BadRequestException('Claim is not in SUBMITTED status', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                yield tx.claim.update({
                    where: { id },
                    data: {
                        status: 'REVIEWED',
                    },
                });
                yield tx.claimApprovalLog.create({
                    data: {
                        claimId: id,
                        actorId: userId,
                        fromStatus: claim === null || claim === void 0 ? void 0 : claim.status,
                        toStatus: 'REVIEWED',
                    },
                });
                return { message: 'Claim reviewed' };
            }));
        });
    }
    approveClaim(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const claim = yield tx.claim.findUnique({
                    where: { id },
                });
                if (!claim) {
                    throw new catch_errors_1.BadRequestException('Claim not found', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                if (claim.status !== 'REVIEWED') {
                    throw new catch_errors_1.BadRequestException('Claim is not in REVIEWED status', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                yield tx.claim.update({
                    where: { id },
                    data: {
                        status: 'APPROVED',
                    },
                });
                yield tx.claimApprovalLog.create({
                    data: {
                        claimId: id,
                        actorId: userId,
                        fromStatus: claim === null || claim === void 0 ? void 0 : claim.status,
                        toStatus: 'APPROVED',
                    },
                });
                return { message: 'Claim approved' };
            }));
        });
    }
    rejectClaim(id, userId, note) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const claim = yield tx.claim.findUnique({
                    where: { id },
                });
                if (!claim) {
                    throw new catch_errors_1.BadRequestException('Claim not found', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                if (claim.status !== 'REVIEWED') {
                    throw new catch_errors_1.BadRequestException('Claim is not in REVIEWED status', "VALIDATION_ERROR" /* ErrorCode.VALIDATION_ERROR */);
                }
                yield tx.claim.update({
                    where: { id },
                    data: {
                        status: 'REJECTED',
                    },
                });
                yield tx.claimApprovalLog.create({
                    data: {
                        claimId: id,
                        actorId: userId,
                        fromStatus: claim === null || claim === void 0 ? void 0 : claim.status,
                        toStatus: 'REJECTED',
                        note,
                    },
                });
                return { message: 'Claim rejected' };
            }));
        });
    }
    getClaimDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const claim = yield database_1.db.claim.findUnique({
                where: { id },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    logs: {
                        include: {
                            actor: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            });
            return claim;
        });
    }
}
exports.ClaimService = ClaimService;
