"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleSchema = exports.PurchaseSchema = void 0;
const zod_1 = require("zod");
exports.PurchaseSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    qty: zod_1.z.number().int().positive(),
    userId: zod_1.z.string().uuid(),
});
exports.SaleSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    qty: zod_1.z.number().int().positive(),
    userId: zod_1.z.string().uuid(),
});
