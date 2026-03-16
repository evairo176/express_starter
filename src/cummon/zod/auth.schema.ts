import { z } from 'zod';
import { Role } from '../enums/role.enum';

export const emailSchema = z.string().trim().email().min(1).max(255);
export const passwordSchema = z.string().trim().min(6).max(255);
export const verificationCodeSchema = z.string().trim().min(1).max(25);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    role: z.enum([Role.USER, Role.APPROVER, Role.VERIFIER]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional().nullable(),
});

export const verificationEmailSchema = z.object({
  code: verificationCodeSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  verificationCode: verificationCodeSchema,
});
