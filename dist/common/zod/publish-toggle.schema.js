"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishToggleSchema = void 0;
const zod_1 = require("zod");
/**
 * Publish-toggle payload for admin dashboard endpoints (Req 10.6).
 *
 * `isPublished` is optional: when provided, the new state is set explicitly;
 * when omitted, the dashboard service flips the current published state.
 */
exports.PublishToggleSchema = zod_1.z.object({
    isPublished: zod_1.z.boolean().optional(),
});
