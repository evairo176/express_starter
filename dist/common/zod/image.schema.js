"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateImageSchema = void 0;
// src/schemas/image.schema.ts
const zod_1 = require("zod");
exports.CreateImageSchema = zod_1.z.object({
    folder: zod_1.z.string().min(1).default('portfolio').optional(),
    // image URLs untuk remote upload (opsional, bisa multiple)
    imageUrls: zod_1.z.array(zod_1.z.string().url()).optional().default([]),
    // catatan:
    // files (buffer) tidak divalidasi Zod karena datang dari Multer (req.files)
    // kita validasi di service saja bila perlu (size, mimetype, etc.)
});
