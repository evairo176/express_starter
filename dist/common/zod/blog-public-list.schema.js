"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPublicListQuerySchema = void 0;
const zod_1 = require("zod");
const pagination_schema_1 = require("./pagination.schema");
/**
 * Public blog list filters (merged with shared pagination).
 * - `category`: category slug (Req 3.4)
 * - `tag`: tag slug (Req 3.5)
 * - `search`: matches title/excerpt (Req 3.6)
 * Validates: Requirements 3.4, 3.5, 3.6
 */
exports.BlogPublicListQuerySchema = pagination_schema_1.PaginationQuerySchema.extend({
    category: zod_1.z.string().min(1).optional(),
    tag: zod_1.z.string().min(1).optional(),
    search: zod_1.z.string().min(1).optional(),
});
