"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductSchema = exports.CreateProductSchema = void 0;
const zod_1 = require("zod");
exports.CreateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    sku: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    stock: zod_1.z.number().int().nonnegative(),
    createdById: zod_1.z.string().uuid(),
});
exports.UpdateProductSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    sku: zod_1.z.string().optional(),
    price: zod_1.z.number().positive().optional(),
    stock: zod_1.z.number().int().nonnegative().optional(),
});
