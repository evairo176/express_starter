"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscribeNewsletterSchema = void 0;
const zod_1 = require("zod");
/**
 * Newsletter subscription.
 * - `email`: valid email format
 * Validates: Requirements 8.3
 */
exports.SubscribeNewsletterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
