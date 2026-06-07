"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQuerySchema = exports.limitSchema = exports.pageSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared page/limit coercion reused by module list schemas.
 * Mirrors `PaginationQuerySchema` in `../utils/pagination`.
 */
exports.pageSchema = zod_1.z.coerce.number().int().positive().default(1);
exports.limitSchema = zod_1.z.coerce.number().int().positive().default(10);
exports.PaginationQuerySchema = zod_1.z.object({
    page: exports.pageSchema,
    limit: exports.limitSchema,
});
