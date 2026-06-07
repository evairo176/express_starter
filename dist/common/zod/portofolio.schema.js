"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePortfolioSchema = exports.CreatePortfolioSchema = exports.PortfolioImageSchema = void 0;
const zod_1 = require("zod");
/**
 * Optional URL field that also accepts empty string / null. The frontend form
 * submits "" for cleared inputs, which would otherwise fail `.url()`; we
 * normalize blanks to `undefined` so they pass as "not provided".
 */
const optionalUrl = zod_1.z.preprocess((value) => (value === '' || value === null ? undefined : value), zod_1.z.string().url().optional());
exports.PortfolioImageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    alt: zod_1.z.string(),
    position: zod_1.z.number().optional(),
});
exports.CreatePortfolioSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    slug: zod_1.z.string().min(3),
    description: zod_1.z.string().optional().nullable(),
    shortDesc: zod_1.z.string().optional().nullable(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    liveUrl: optionalUrl,
    repoUrl: optionalUrl,
    // Case study (Req: project detail problem/solution/results).
    problem: zod_1.z.string().optional().nullable(),
    solution: zod_1.z.string().optional().nullable(),
    results: zod_1.z.string().optional().nullable(),
    featured: zod_1.z.boolean().optional().default(false),
    isPublished: zod_1.z.boolean().optional().default(true),
    images: zod_1.z.array(exports.PortfolioImageSchema).optional().default([]),
    tagIds: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    techIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'Minimal 1 tech'),
});
exports.UpdatePortfolioSchema = exports.CreatePortfolioSchema.partial().extend({
    id: zod_1.z.string().uuid(),
});
