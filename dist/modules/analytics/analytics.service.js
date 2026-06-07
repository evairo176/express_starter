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
exports.AnalyticsService = void 0;
const database_1 = require("../../database/database");
class AnalyticsService {
    /**
     * Record a visit event with the given path and a timestamp (Req 11.1).
     */
    recordVisit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.visitEvent.create({
                data: {
                    path: data.path,
                },
            });
        });
    }
    /**
     * Return the analytics summary (Req 11.2):
     * - total visit count
     * - visit count for the last 30 days
     * - top 5 most-viewed blog posts (by totalViews)
     * - top 5 most-viewed projects (by PortfolioView counts)
     */
    getSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const [totalVisits, last30DaysVisits, topPosts, topProjectGroups] = yield Promise.all([
                database_1.db.visitEvent.count(),
                database_1.db.visitEvent.count({
                    where: {
                        createdAt: {
                            gte: last30Days,
                        },
                    },
                }),
                database_1.db.blogPost.findMany({
                    orderBy: {
                        totalViews: 'desc',
                    },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        totalViews: true,
                    },
                }),
                database_1.db.portfolioView.groupBy({
                    by: ['portfolioId'],
                    _count: {
                        portfolioId: true,
                    },
                    orderBy: {
                        _count: {
                            portfolioId: 'desc',
                        },
                    },
                    take: 5,
                }),
            ]);
            // Resolve portfolio details for the top project ids while preserving order.
            const topProjectIds = topProjectGroups.map((group) => group.portfolioId);
            const projects = yield database_1.db.portfolio.findMany({
                where: {
                    id: {
                        in: topProjectIds,
                    },
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            });
            const projectById = new Map(projects.map((p) => [p.id, p]));
            const topProjects = topProjectGroups.map((group) => {
                var _a, _b;
                const project = projectById.get(group.portfolioId);
                return {
                    id: group.portfolioId,
                    title: (_a = project === null || project === void 0 ? void 0 : project.title) !== null && _a !== void 0 ? _a : null,
                    slug: (_b = project === null || project === void 0 ? void 0 : project.slug) !== null && _b !== void 0 ? _b : null,
                    views: group._count.portfolioId,
                };
            });
            return {
                totalVisits,
                last30DaysVisits,
                topPosts,
                topProjects,
            };
        });
    }
    /**
     * Return aggregated counts of projects grouped by category, tag, and tech
     * stack (Req 11.3), computed via Prisma groupBy/count over the relation
     * tables.
     */
    getAggregations() {
        return __awaiter(this, void 0, void 0, function* () {
            const [categoryGroups, tagGroups, techGroups] = yield Promise.all([
                database_1.db.portfolio.groupBy({
                    by: ['categoryId'],
                    _count: {
                        _all: true,
                    },
                }),
                database_1.db.portfolioTagOnPortfolio.groupBy({
                    by: ['tagId'],
                    _count: {
                        tagId: true,
                    },
                }),
                database_1.db.techStackOnPortfolio.groupBy({
                    by: ['techId'],
                    _count: {
                        techId: true,
                    },
                }),
            ]);
            // Resolve human-readable names for each grouping.
            const categoryIds = categoryGroups
                .map((group) => group.categoryId)
                .filter((id) => Boolean(id));
            const tagIds = tagGroups.map((group) => group.tagId);
            const techIds = techGroups.map((group) => group.techId);
            const [categories, tags, techs] = yield Promise.all([
                database_1.db.portfolioCategory.findMany({
                    where: { id: { in: categoryIds } },
                    select: { id: true, name: true, slug: true },
                }),
                database_1.db.portfolioTag.findMany({
                    where: { id: { in: tagIds } },
                    select: { id: true, name: true, slug: true },
                }),
                database_1.db.techStack.findMany({
                    where: { id: { in: techIds } },
                    select: { id: true, name: true },
                }),
            ]);
            const categoryById = new Map(categories.map((c) => [c.id, c]));
            const tagById = new Map(tags.map((t) => [t.id, t]));
            const techById = new Map(techs.map((t) => [t.id, t]));
            const byCategory = categoryGroups.map((group) => {
                var _a, _b;
                const category = group.categoryId
                    ? categoryById.get(group.categoryId)
                    : undefined;
                return {
                    categoryId: group.categoryId,
                    name: (_a = category === null || category === void 0 ? void 0 : category.name) !== null && _a !== void 0 ? _a : null,
                    slug: (_b = category === null || category === void 0 ? void 0 : category.slug) !== null && _b !== void 0 ? _b : null,
                    count: group._count._all,
                };
            });
            const byTag = tagGroups.map((group) => {
                var _a, _b;
                const tag = tagById.get(group.tagId);
                return {
                    tagId: group.tagId,
                    name: (_a = tag === null || tag === void 0 ? void 0 : tag.name) !== null && _a !== void 0 ? _a : null,
                    slug: (_b = tag === null || tag === void 0 ? void 0 : tag.slug) !== null && _b !== void 0 ? _b : null,
                    count: group._count.tagId,
                };
            });
            const byTech = techGroups.map((group) => {
                var _a;
                const tech = techById.get(group.techId);
                return {
                    techId: group.techId,
                    name: (_a = tech === null || tech === void 0 ? void 0 : tech.name) !== null && _a !== void 0 ? _a : null,
                    count: group._count.techId,
                };
            });
            return {
                byCategory,
                byTag,
                byTech,
            };
        });
    }
}
exports.AnalyticsService = AnalyticsService;
