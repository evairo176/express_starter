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
exports.PortfolioTagService = void 0;
const database_1 = require("../../database/database");
class PortfolioTagService {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolioTag.create({ data });
        });
    }
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page = 1, limit = 10, sortBy = 'name', sortDir = 'asc', search, }) {
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
            const total = yield database_1.db.portfolioTag.count({
                where,
            });
            // Query data
            const PortfolioTags = yield database_1.db.portfolioTag.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: PortfolioTags,
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
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolioTag.findUnique({ where: { id } });
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolioTag.update({
                where: { id: data.id },
                data,
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolioTag.delete({ where: { id } });
        });
    }
}
exports.PortfolioTagService = PortfolioTagService;
