"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePortfolioSchema = exports.CreatePortfolioSchema = exports.PortfolioImageSchema = void 0;
const zod_1 = require("zod");
exports.PortfolioImageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    alt: zod_1.z.string().optional().nullable(),
    position: zod_1.z.number().optional(),
});
exports.CreatePortfolioSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    slug: zod_1.z.string().min(3),
    description: zod_1.z.string().optional().nullable(),
    shortDesc: zod_1.z.string().optional().nullable(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    liveUrl: zod_1.z.string().url().optional().nullable(),
    repoUrl: zod_1.z.string().url().optional().nullable(),
    featured: zod_1.z.boolean().optional().default(false),
    isPublished: zod_1.z.boolean().optional().default(true),
    images: zod_1.z.array(exports.PortfolioImageSchema).optional().default([]),
    tagIds: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
    techIds: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
});
exports.UpdatePortfolioSchema = exports.CreatePortfolioSchema.partial().extend({
    id: zod_1.z.string().uuid(),
});
