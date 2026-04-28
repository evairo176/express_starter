import { z } from 'zod';

export const PurchaseSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive(),
  userId: z.string().uuid(),
});

export const SaleSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive(),
  userId: z.string().uuid(),
});

export type PurchaseDTO = z.infer<typeof PurchaseSchema>;
export type SaleDTO = z.infer<typeof SaleSchema>;
