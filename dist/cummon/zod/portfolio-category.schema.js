"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePortfolioCategorySchema = exports.CreatePortfolioCategorySchema = void 0;
const zod_1 = require("zod");
exports.CreatePortfolioCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
});
exports.UpdatePortfolioCategorySchema = exports.CreatePortfolioCategorySchema.extend({
    id: zod_1.z.string().uuid(),
});
