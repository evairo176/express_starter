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
exports.DashboardService = void 0;
const database_1 = require("../../database/database");
class DashboardService {
    getAnalytics() {
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
    getTicketSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const total = yield database_1.db.ticket.count();
            const done = yield database_1.db.ticket.count({
                where: { status: 'DONE' },
            });
            const pending = yield database_1.db.ticket.count({
                where: { status: { not: 'DONE' } },
            });
            const over48 = yield database_1.db.ticket.count({
                where: {
                    createdAt: {
                        lt: new Date(Date.now() - 48 * 60 * 60 * 1000),
                    },
                    status: { not: 'DONE' },
                },
            });
            return {
                total,
                done,
                pending,
                over48,
            };
        });
    }
    getCategoryStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.ticket.groupBy({
                by: ['requestType'],
                _count: true,
            });
        });
    }
    getPicPerformance() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield database_1.db.user.findMany({
                where: {
                    role: 'pic_it',
                },
                select: {
                    id: true,
                    name: true,
                    assignedTickets: {
                        select: {
                            status: true,
                            durationMin: true,
                            createdAt: true,
                            finishedAt: true,
                        },
                    },
                },
            });
            const result = users.map((user) => {
                const tickets = user.assignedTickets;
                const doneTickets = tickets.filter((t) => t.status === 'DONE');
                const unfinishedTickets = tickets.filter((t) => t.status !== 'DONE');
                const totalMinutes = doneTickets.reduce((acc, t) => acc + (t.durationMin || 0), 0);
                const totalJobs = doneTickets.length;
                const avgMinutesPerJob = totalJobs > 0 ? Math.round(totalMinutes / totalJobs) : 0;
                const over48Hours = tickets.filter((t) => {
                    var _a;
                    if (!t.createdAt)
                        return false;
                    const end = (_a = t.finishedAt) !== null && _a !== void 0 ? _a : new Date();
                    const diffHours = (end.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
                    return diffHours > 48;
                }).length;
                return {
                    pic: user.name,
                    totalJobs,
                    totalMinutes,
                    avgMinutesPerJob,
                    over48Hours,
                    unfinishedJobs: unfinishedTickets.length,
                };
            });
            return result;
        });
    }
}
exports.DashboardService = DashboardService;
