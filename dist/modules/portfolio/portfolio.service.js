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
            var _a, _b, _c;
            // 1️⃣ Fail fast: cek slug
            const existing = yield database_1.db.portfolio.findFirst({
                where: { slug: data.slug },
            });
            if (existing) {
                throw new catch_errors_1.BadRequestException(`${existing.slug} - ${existing.title} slug already`, "SLUG_ALREADY_EXISTS" /* ErrorCode.SLUG_ALREADY_EXISTS */);
            }
            // 2️⃣ TRANSACTION RINGAN (inti saja)
            const portfolio = yield database_1.db.portfolio.create({
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
            // 3️⃣ RELASI BERAT (DI LUAR TRANSACTION)
            yield Promise.all([
                ((_a = data.images) === null || _a === void 0 ? void 0 : _a.length)
                    ? this.syncImages(portfolio.id, data.images)
                    : Promise.resolve(),
                ((_b = data.tagIds) === null || _b === void 0 ? void 0 : _b.length)
                    ? this.syncTags(portfolio.id, data.tagIds)
                    : Promise.resolve(),
                ((_c = data.techIds) === null || _c === void 0 ? void 0 : _c.length)
                    ? this.syncTechs(portfolio.id, data.techIds)
                    : Promise.resolve(),
            ]);
            return portfolio;
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // 1️⃣ TRANSACTION RINGAN (update inti)
            const updated = yield database_1.db.portfolio.update({
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
            // 2️⃣ RELASI BERAT (DI LUAR TRANSACTION)
            yield Promise.all([
                ((_a = data.images) === null || _a === void 0 ? void 0 : _a.length)
                    ? this.resetImages(updated.id, data.images)
                    : Promise.resolve(),
                ((_b = data.tagIds) === null || _b === void 0 ? void 0 : _b.length)
                    ? this.resetTags(updated.id, data.tagIds)
                    : Promise.resolve(),
                ((_c = data.techIds) === null || _c === void 0 ? void 0 : _c.length)
                    ? this.resetTechs(updated.id, data.techIds)
                    : Promise.resolve(),
            ]);
            return updated;
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
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.portfolio.delete({
                where: { id },
            });
        });
    }
    syncImages(portfolioId, images) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.db.portfolioImage.createMany({
                data: images.map((img) => {
                    var _a;
                    return ({
                        portfolioId,
                        url: img.url,
                        alt: img.alt,
                        position: (_a = img.position) !== null && _a !== void 0 ? _a : 0,
                    });
                }),
            });
        });
    }
    resetImages(portfolioId, images) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.db.portfolioImage.deleteMany({ where: { portfolioId } });
            yield this.syncImages(portfolioId, images);
        });
    }
    syncTags(portfolioId, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield Promise.all(tags.map((name) => {
                const slug = name.toLowerCase().replace(/\s+/g, '-');
                return database_1.db.portfolioTag.upsert({
                    where: { slug },
                    update: {},
                    create: { name, slug },
                });
            }));
            yield database_1.db.portfolioTagOnPortfolio.createMany({
                data: records.map((tag) => ({
                    portfolioId,
                    tagId: tag.id,
                })),
            });
        });
    }
    resetTags(portfolioId, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.db.portfolioTagOnPortfolio.deleteMany({
                where: { portfolioId },
            });
            yield this.syncTags(portfolioId, tags);
        });
    }
    syncTechs(portfolioId, techs) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield Promise.all(techs.map((name) => database_1.db.techStack.upsert({
                where: { name },
                update: {},
                create: { name },
            })));
            yield database_1.db.techStackOnPortfolio.createMany({
                data: records.map((tech) => ({
                    portfolioId,
                    techId: tech.id,
                })),
            });
        });
    }
    resetTechs(portfolioId, techs) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.db.techStackOnPortfolio.deleteMany({
                where: { portfolioId },
            });
            yield this.syncTechs(portfolioId, techs);
        });
    }
}
exports.PortfolioService = PortfolioService;
