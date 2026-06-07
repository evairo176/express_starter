import { z } from 'zod';
import { Role } from '../enums/role.enum';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
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
