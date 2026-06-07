"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioPublicListQuerySchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
/**
 * Coerces a query-string boolean ("true"/"false") into an optional boolean.
 * Leaves the value undefined when the param is absent.
 */
const optionalQueryBoolean = zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.literal('true'), zod_1.z.literal('false')])
    .optional()
    .transform((value) => value === true || value === 'true'
    ? true
    : value === false || value === 'false'
        ? false
        : undefined);
/**
 * Public portfolio list filters (merged with shared pagination).
 * - `category`: category slug (Req 2.1)
 * - `tags`: CSV of tag slugs, AND semantics applied in service (Req 2.2)
 * - `tech`: CSV of tech slugs, AND semantics applied in service (Req 2.3)
 * - `search`: matches title/shortDesc (Req 2.4)
 * - `featured`: boolean filter (Req 2.6)
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6
 */
exports.PortfolioPublicListQuerySchema = pagination_schema_1.PaginationQuerySchema.extend({
    category: zod_1.z.string().min(1).optional(),
    tags: zod_1.z.string().min(1).optional(),
    tech: zod_1.z.string().min(1).optional(),
    search: zod_1.z.string().min(1).optional(),
    featured: optionalQueryBoolean,
});
