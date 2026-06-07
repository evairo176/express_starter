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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogCategoryService = void 0;
const slugify_1 = __importDefault(require("slugify"));
const database_1 = require("../../database/database");
class BlogCategoryService {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const slug = data.slug && data.slug.trim() !== ''
                ? data.slug
                : (0, slugify_1.default)(data.name, { lower: true, strict: true });
            return database_1.db.blogCategory.create({
                data: {
                    name: data.name,
                    slug,
                },
            });
        });
    }
    findAll(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page = 1, limit = 10, sortBy = 'createdAt', sortDir = 'desc', search, }) {
            const skip = (page - 1) * limit;
            const where = {};
            if (search && search.trim() !== '') {
                where.name = {
                    contains: search,
                    mode: 'insensitive',
                };
            }
            const total = yield database_1.db.blogCategory.count({ where });
            const blogCategories = yield database_1.db.blogCategory.findMany({
                where,
                orderBy: {
                    [sortBy]: sortDir,
                },
                skip: Number(skip),
                take: Number(limit),
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: blogCategories,
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
            return database_1.db.blogCategory.findUnique({
                where: { id },
            });
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const slug = data.slug && data.slug.trim() !== ''
                ? data.slug
                : (0, slugify_1.default)(data.name, { lower: true, strict: true });
            return database_1.db.blogCategory.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    slug,
                },
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.db.blogCategory.delete({ where: { id } });
        });
    }
}
exports.BlogCategoryService = BlogCategoryService;
