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
exports.PortfolioService = void 0;
const catch_errors_1 = require("../../cummon/utils/catch-errors");
const database_1 = require("../../database/database");
class PortfolioService {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const portfolio = yield database_1.db.portfolio.findFirst({
                where: {
                    slug: data === null || data === void 0 ? void 0 : data.slug,
                },
            });
            if (portfolio) {
                throw new catch_errors_1.BadRequestException(`${portfolio === null || portfolio === void 0 ? void 0 : portfolio.slug} - ${portfolio.title} slug already`, "SLUG_ALREADY_EXISTS" /* ErrorCode.SLUG_ALREADY_EXISTS */);
            }
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                const portfolio = yield tx.portfolio.create({
                    data: {
                        title: data.title,
                        slug: data.slug,
                        description: data.description,
                        shortDesc: data.shortDesc,
                        categoryId: data.categoryId,
                        liveUrl: data.liveUrl,
                        repoUrl: data.repoUrl,
                        featured: data.featured,
                        isPublished: data.isPublished,
                    },
                });
                if ((_a = data.images) === null || _a === void 0 ? void 0 : _a.length) {
                    yield tx.portfolioImage.createMany({
                        data: data.images.map((i) => {
                            var _a;
                            return ({
                                portfolioId: portfolio.id,
                                url: i.url,
                                alt: i.alt,
                                position: (_a = i.position) !== null && _a !== void 0 ? _a : 0,
                            });
                        }),
                    });
                }
                if ((_b = data.tagIds) === null || _b === void 0 ? void 0 : _b.length) {
                    const tags = data.tagIds.map((tag) => ({
                        name: tag,
                        slug: tag.toLowerCase().replace(/\s+/g, '-'),
                    }));
                    for (const tag of tags) {
                        const existingTag = yield tx.portfolioTag.upsert({
                            where: { slug: tag.slug },
                            update: {},
                            create: tag,
                        });
                        yield tx.portfolioTagOnPortfolio.create({
                            data: {
                                portfolioId: portfolio.id,
                                tagId: existingTag.id,
                            },
                        });
                    }
                }
                if ((_c = data.techIds) === null || _c === void 0 ? void 0 : _c.length) {
                    const techs = data.techIds.map((tech) => ({
                        name: tech,
                    }));
                    for (const tech of techs) {
                        const existingTech = yield tx.techStack.upsert({
                            where: { name: tech.name },
                            update: {},
                            create: tech,
                        });
                        yield tx.techStackOnPortfolio.create({
                            data: {
                                portfolioId: portfolio.id,
                                techId: existingTech.id,
                            },
                        });
                    }
                }
                return portfolio;
            }));
        });
    }
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, }) {
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
                where.title = {
                    contains: search,
                    mode: 'insensitive',
                };
            }
            // Hitung total (without pagination)
            const total = yield database_1.db.portfolio.count({
                where,
            });
            // Query data
            const Portfolios = yield database_1.db.portfolio.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
                include: {
                    category: true,
                    images: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    techStacks: {
                        include: {
                            tech: true,
                        },
                    },
                },
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: Portfolios,
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
            return database_1.db.portfolio.findUnique({
                where: { id },
                include: {
                    category: true,
                    images: true,
                    tags: { include: { tag: true } },
                    techStacks: { include: { tech: true } },
                },
            });
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const updated = yield tx.portfolio.update({
                    where: { id: data.id },
                    data: {
                        title: data.title,
                        slug: data.slug,
                        description: data.description,
                        shortDesc: data.shortDesc,
                        categoryId: data.categoryId,
                        isPublished: data.isPublished,
                        featured: data.featured,
                        liveUrl: data.liveUrl,
                        repoUrl: data.repoUrl,
                    },
                });
                // Reset images
                if (data.images) {
                    yield tx.portfolioImage.deleteMany({
                        where: { portfolioId: data.id },
                    });
                    yield tx.portfolioImage.createMany({
                        data: data.images.map((i) => {
                            var _a;
                            return ({
                                portfolioId: data.id,
                                url: i.url,
                                alt: i.alt,
                                position: (_a = i.position) !== null && _a !== void 0 ? _a : 0,
                            });
                        }),
                    });
                }
                // Reset tags
                if ((_a = data.tagIds) === null || _a === void 0 ? void 0 : _a.length) {
                    yield tx.portfolioTagOnPortfolio.deleteMany({
                        where: { portfolioId: data.id },
                    });
                    const tags = data.tagIds.map((tag) => ({
                        name: tag,
                        slug: tag.toLowerCase().replace(/\s+/g, '-'),
                    }));
                    for (const tag of tags) {
                        const existingTag = yield tx.portfolioTag.upsert({
                            where: { slug: tag.slug },
                            update: {},
                            create: tag,
                        });
                        yield tx.portfolioTagOnPortfolio.create({
                            data: {
                                portfolioId: updated.id,
                                tagId: existingTag.id,
                            },
                        });
                    }
                }
                // Reset tech stacks
                if (data.techIds) {
                    yield tx.techStackOnPortfolio.deleteMany({
                        where: { portfolioId: data.id },
                    });
                    const techs = data.techIds.map((tech) => ({
                        name: tech,
                    }));
                    for (const tech of techs) {
                        const existingTech = yield tx.techStack.upsert({
                            where: { name: tech.name },
                            update: {},
                            create: tech,
                        });
                        yield tx.techStackOnPortfolio.create({
                            data: {
                                portfolioId: updated.id,
                                techId: existingTech.id,
                            },
                        });
                    }
                }
                return updated;
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolio.delete({
                where: { id },
            });
        });
    }
}
exports.PortfolioService = PortfolioService;
