"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMFAForLoginSchema = exports.verifyMfaSchema = void 0;
const zod_1 = require("zod");
exports.verifyMfaSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1).max(6),
    secretKey: zod_1.z.string().trim().min(1),
});
exports.verifyMFAForLoginSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1).max(6),
    email: zod_1.z.string().trim().min(1).email(),
    userAgent: zod_1.z.string().optional(),
});
