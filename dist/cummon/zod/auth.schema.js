"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.verificationEmailSchema = exports.loginSchema = exports.registerSchema = exports.verificationCodeSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().trim().email().min(1).max(255);
exports.passwordSchema = zod_1.z.string().trim().min(6).max(255);
exports.verificationCodeSchema = zod_1.z.string().trim().min(1).max(25);
exports.registerSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(255),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    confirmPassword: exports.passwordSchema,
})
    .refine((value) => value.password === value.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    userAgent: zod_1.z.string().optional().nullable(),
});
exports.verificationEmailSchema = zod_1.z.object({
    code: exports.verificationCodeSchema,
});
exports.resetPasswordSchema = zod_1.z.object({
    password: exports.passwordSchema,
    verificationCode: exports.verificationCodeSchema,
});
