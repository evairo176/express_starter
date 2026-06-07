"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContactSchema = void 0;
const zod_1 = require("zod");
/**
 * Contact message creation.
 * - `name`, `subject`, `body`: required (non-empty)
 * - `email`: valid email format
 * Validates: Requirements 7.4
 */
exports.CreateContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    subject: zod_1.z.string().min(1),
    body: zod_1.z.string().min(1),
});
