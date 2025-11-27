// src/schemas/image.schema.ts
import { z } from 'zod';

export const CreateImageSchema = z.object({
  folder: z.string().min(1).default('portfolio').optional(),

  // image URLs untuk remote upload (opsional, bisa multiple)
  imageUrls: z.array(z.string().url()).optional().default([]),

  // catatan:
  // files (buffer) tidak divalidasi Zod karena datang dari Multer (req.files)
  // kita validasi di service saja bila perlu (size, mimetype, etc.)
});

export type CreateImageDTO = z.infer<typeof CreateImageSchema>;
