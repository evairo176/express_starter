import { z } from 'zod';
import {
  CreatePortfolioSchema,
  UpdatePortfolioSchema,
} from '../validators/portofolio.validator';

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

export type CreatePortfolioDTO = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioDTO = z.infer<typeof UpdatePortfolioSchema>;
