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
exports.BlogPostService = void 0;
const database_1 = require("../../database/database");
class BlogPostService {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return database_1.db.blogPost.create({
                data: Object.assign(Object.assign({}, data), { isPublished: (_a = data.isPublished) !== null && _a !== void 0 ? _a : false }),
            });
        });
    }
    findAllAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, isPublished, }) {
            const skip = (page - 1) * limit;
            const where = {};
            if (typeof isPublished === 'boolean') {
                where.isPublished = isPublished;
            }
            if (typeof isPublished === 'string' && isPublished.trim() !== '') {
                if (isPublished === 'true')
                    where.isPublished = true;
                if (isPublished === 'false')
                    where.isPublished = false;
            }
            if (search && search.trim() !== '') {
                where.OR = [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        slug: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ];
            }
            const total = yield database_1.db.blogPost.count({ where });
            const posts = yield database_1.db.blogPost.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: posts,
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
    findAllPublic(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            const where = {
                isPublished: true,
            };
            if (search && search.trim() !== '') {
                where.OR = [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        slug: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ];
            }
            const total = yield database_1.db.blogPost.count({ where });
            const posts = yield database_1.db.blogPost.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: posts,
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
            return database_1.db.blogPost.findUnique({
                where: { id },
            });
        });
    }
    findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.findUnique({
                where: { slug },
            });
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.update({
                where: { id: data.id },
                data: Object.assign({}, data),
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.delete({
                where: { id },
            });
        });
    }
    incrementView(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.update({
                where: { id },
                data: {
                    totalViews: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    totalViews: true,
                },
            });
        });
    }
    incrementLike(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogPost.update({
                where: { id },
                data: {
                    totalLikes: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    totalLikes: true,
                },
            });
        });
    }
}
exports.BlogPostService = BlogPostService;
