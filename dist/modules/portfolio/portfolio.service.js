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
const database_1 = require("../../database/database");
class PortfolioService {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    yield tx.portfolioTagOnPortfolio.createMany({
                        data: data.tagIds.map((tagId) => ({
                            portfolioId: portfolio.id,
                            tagId,
                        })),
                    });
                }
                if ((_c = data.techIds) === null || _c === void 0 ? void 0 : _c.length) {
                    yield tx.techStackOnPortfolio.createMany({
                        data: data.techIds.map((techId) => ({
                            portfolioId: portfolio.id,
                            techId,
                        })),
                    });
                }
                return portfolio;
            }));
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolio.findMany({
                include: {
                    category: true,
                    images: true,
                    tags: { include: { tag: true } },
                    techStacks: { include: { tech: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
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
                if (data.tagIds) {
                    yield tx.portfolioTagOnPortfolio.deleteMany({
                        where: { portfolioId: data.id },
                    });
                    yield tx.portfolioTagOnPortfolio.createMany({
                        data: data.tagIds.map((tagId) => ({
                            portfolioId: data.id,
                            tagId,
                        })),
                    });
                }
                // Reset tech stacks
                if (data.techIds) {
                    yield tx.techStackOnPortfolio.deleteMany({
                        where: { portfolioId: data.id },
                    });
                    yield tx.techStackOnPortfolio.createMany({
                        data: data.techIds.map((techId) => ({
                            portfolioId: data.id,
                            techId,
                        })),
                    });
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
