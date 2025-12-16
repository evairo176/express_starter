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
exports.dashboardService = exports.DashboardService = void 0;
const database_1 = require("../../database/database");
class DashboardService {
    static getAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Top Tags
            const topTags = yield database_1.db.portfolioTag.findMany({
                include: {
                    _count: {
                        select: { portfolios: true },
                    },
                },
                orderBy: {
                    portfolios: {
                        _count: 'desc',
                    },
                },
                take: 5,
            });
            // 2. Top Tech Stacks
            const topTechStacks = yield database_1.db.techStack.findMany({
                include: {
                    _count: {
                        select: { portfolios: true },
                    },
                },
                orderBy: {
                    portfolios: {
                        _count: 'desc',
                    },
                },
                take: 5,
            });
            // 3. Favorite Categories
            const topCategories = yield database_1.db.portfolioCategory.findMany({
                include: {
                    _count: {
                        select: { portfolios: true },
                    },
                },
                orderBy: {
                    portfolios: {
                        _count: 'desc',
                    },
                },
                take: 5,
            });
            return {
                topTags: topTags.map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                    count: tag._count.portfolios,
                })),
                topTechStacks: topTechStacks.map((tech) => ({
                    id: tech.id,
                    name: tech.name,
                    count: tech._count.portfolios,
                })),
                topCategories: topCategories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    count: cat._count.portfolios,
                })),
            };
        });
    }
}
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
