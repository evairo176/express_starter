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
const catch_errors_1 = require("../../common/utils/catch-errors");
const pagination_1 = require("../../common/utils/pagination");
const database_1 = require("../../database/database");
const cache_1 = require("../../common/cache/cache");
/** Cache tag for all public portfolio responses (Req 14.3). */
const PORTFOLIO_CACHE_TAG = 'portfolio';
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
                    problem: data.problem,
                    solution: data.solution,
                    results: data.results,
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
            // Invalidate cached public portfolio responses (Req 14.3).
            cache_1.cacheStore.delByTag(PORTFOLIO_CACHE_TAG);
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
                    problem: data.problem,
                    solution: data.solution,
                    results: data.results,
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
            // Invalidate cached public portfolio responses (Req 14.3).
            cache_1.cacheStore.delByTag(PORTFOLIO_CACHE_TAG);
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
    /**
     * Public project detail by slug (Req 1.2, 1.3, 1.4, 1.5, 1.6).
     *
     * Returns problem/solution/results, the image gallery ordered by `position`
     * ascending, liveUrl, repoUrl, category, tags, and tech stack (name + icon).
     * Throws `NotFoundException` (404) when the slug does not exist or the
     * project is not published.
     */
    findPublishedBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const portfolio = yield database_1.db.portfolio.findUnique({
                where: { slug },
                include: {
                    category: true,
                    // Gallery ordered by ascending position (Req 1.6).
                    images: { orderBy: { position: 'asc' } },
                    tags: { include: { tag: true } },
                    // Tech stack entries include name + icon (Req 1.3).
                    techStacks: { include: { tech: true } },
                },
            });
            // 404 when slug missing OR the project is not published (Req 1.4, 1.5).
            if (!portfolio || !portfolio.isPublished) {
                throw new catch_errors_1.NotFoundException(`Portfolio with slug "${slug}" not found`, "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            }
            return portfolio;
        });
    }
    /**
     * Public project list with filters, search, featured, and pagination
     * (Req 2.1–2.8).
     *
     * - Always constrains `isPublished = true` (Req 2.5).
     * - Category filter matches `category.slug` (Req 2.1).
     * - Tag and tech filters use AND semantics: every requested slug must be
     *   present (Req 2.2, 2.3).
     * - Search matches `title` OR `shortDesc`, case-insensitively (Req 2.4).
     * - `featured=true` constrains `featured = true` (Req 2.6).
     * - Returns `Pagination_Metadata` in every response (Req 2.7).
     */
    findPublic(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const page = (_a = params.page) !== null && _a !== void 0 ? _a : 1;
            const limit = (_b = params.limit) !== null && _b !== void 0 ? _b : 10;
            const skip = (page - 1) * limit;
            // Only published projects are ever returned (Req 2.5).
            const where = {
                isPublished: true,
            };
            // Category filter by slug (Req 2.1).
            if (params.category) {
                where.category = { slug: params.category };
            }
            // Featured filter (Req 2.6).
            if (params.featured === true) {
                where.featured = true;
            }
            // Case-insensitive title/shortDesc search (Req 2.4).
            if (params.search && params.search.trim() !== '') {
                where.OR = [
                    { title: { contains: params.search, mode: 'insensitive' } },
                    { shortDesc: { contains: params.search, mode: 'insensitive' } },
                ];
            }
            // AND-semantics tag filter: every requested tag slug must be present (Req 2.2).
            if (params.tags && params.tags.length) {
                where.AND = [
                    ...((_c = where.AND) !== null && _c !== void 0 ? _c : []),
                    ...params.tags.map((slug) => ({
                        tags: { some: { tag: { slug } } },
                    })),
                ];
            }
            // AND-semantics tech filter: every requested tech must be present (Req 2.3).
            // NOTE: TechStack has no `slug` field in the schema; its unique identifier
            // is `name`, so tech filters match by `name`.
            if (params.tech && params.tech.length) {
                where.AND = [
                    ...((_d = where.AND) !== null && _d !== void 0 ? _d : []),
                    ...params.tech.map((name) => ({
                        techStacks: { some: { tech: { name } } },
                    })),
                ];
            }
            const total = yield database_1.db.portfolio.count({ where });
            const data = yield database_1.db.portfolio.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    category: true,
                    images: { orderBy: { position: 'asc' } },
                    tags: { include: { tag: true } },
                    techStacks: { include: { tech: true } },
                },
            });
            return {
                data,
                metadata: (0, pagination_1.buildPaginationMetadata)(total, page, limit),
            };
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield database_1.db.portfolio.delete({
                where: { id },
            });
            // Invalidate cached public portfolio responses (Req 14.3).
            cache_1.cacheStore.delByTag(PORTFOLIO_CACHE_TAG);
            return deleted;
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
            const records = yield Promise.all(tags.map((value) => __awaiter(this, void 0, void 0, function* () {
                // The admin form submits existing tag IDs; only fall back to
                // create-by-name when the value is not an existing tag id.
                const byId = yield database_1.db.portfolioTag.findUnique({ where: { id: value } });
                if (byId)
                    return byId;
                const name = value;
                const slug = name.toLowerCase().replace(/\s+/g, '-');
                return database_1.db.portfolioTag.upsert({
                    where: { slug },
                    update: {},
                    create: { name, slug },
                });
            })));
            yield database_1.db.portfolioTagOnPortfolio.createMany({
                data: records.map((tag) => ({
                    portfolioId,
                    tagId: tag.id,
                })),
                skipDuplicates: true,
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
            const records = yield Promise.all(techs.map((value) => __awaiter(this, void 0, void 0, function* () {
                // The admin form submits existing tech-stack IDs; only fall back to
                // create-by-name when the value is not an existing tech id.
                const byId = yield database_1.db.techStack.findUnique({ where: { id: value } });
                if (byId)
                    return byId;
                return database_1.db.techStack.upsert({
                    where: { name: value },
                    update: {},
                    create: { name: value },
                });
            })));
            yield database_1.db.techStackOnPortfolio.createMany({
                data: records.map((tech) => ({
                    portfolioId,
                    techId: tech.id,
                })),
                skipDuplicates: true,
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
