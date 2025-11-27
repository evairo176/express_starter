import { z } from 'zod';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
  userAgent?: string | null;
}
export interface ResetPasswordDto {
  password: string;
  verificationCode: string;
}
