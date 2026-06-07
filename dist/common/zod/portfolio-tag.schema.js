"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePortfolioTagSchema = exports.CreatePortfolioTagSchema = void 0;
const zod_1 = require("zod");
exports.CreatePortfolioTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
});
exports.UpdatePortfolioTagSchema = exports.CreatePortfolioTagSchema.extend({
    id: zod_1.z.string().uuid(),
});
