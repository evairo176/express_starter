// src/services/imageService.ts
import { Readable } from 'stream';
import { db } from '../../database/database'; // sesuai permintaan Anda
import cloudinary from '../../cummon/utils/cloudinary';
import { Prisma } from '@prisma/client';

/**
 * DTO types (sesuaikan jika Anda sudah punya Zod DTO)
 */
export type FileInput = { buffer: Buffer; originalname?: string };
export type CreateImageDTO = {
  files?: FileInput[]; // uploaded files via multer mapped to buffer
  imageUrls?: string[]; // remote image urls to upload
  folder?: string;
  name?: string | null; // optional nama/label
  tags?: string[]; // optional tags
};
export type UpdateImageDTO = {
  id: string;
  name?: string | null;
  folder?: string | null;
  tags?: string[] | null;
};

/**
 * Image record shape returned from DB (sesuaikan jika berbeda)
 */
export type ImageRecord = {
  id: string;
  publicId: string;
  url: string;
  secureUrl?: string | null;
  folder?: string | null;
  name?: string | null;
  originalFilename?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  resourceType?: string | null;
  createdAt: Date;
  uploadedAt?: Date | null;
  provider: string;
  tags: string[] | null;
};

export class ImageService {
  /**
   * Upload buffer -> Cloudinary using upload_stream (Readable.from)
   */
  private uploadBufferToCloudinary(buffer: Buffer, folder = 'portfolio') {
    return new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  private uploadUrlToCloudinary(url: string, folder = 'portfolio') {
    return cloudinary.uploader.upload(url, { folder, resource_type: 'image' });
  }

  /**
   * Create images (multiple files and/or urls).
   * Returns created DB records and array of errors (per input index).
   */
  public async create(data: CreateImageDTO) {
    const {
      files = [],
      imageUrls = [],
      folder = 'portfolio',
      name = null,
      tags = [],
    } = data;

    // prepare promises and mapping so we can map errors to input index
    const uploadPromises: Promise<any>[] = [];
    const sourceMap: {
      type: 'file' | 'url';
      originalname?: string;
      inputIndex: number;
    }[] = [];

    let idx = 0;
    for (const f of files) {
      if (!f.buffer) continue;
      uploadPromises.push(this.uploadBufferToCloudinary(f.buffer, folder));
      sourceMap.push({
        type: 'file',
        originalname: f.originalname,
        inputIndex: idx++,
      });
    }
    for (const u of imageUrls) {
      uploadPromises.push(this.uploadUrlToCloudinary(u, folder));
      sourceMap.push({
        type: 'url',
        originalname: undefined,
        inputIndex: idx++,
      });
    }

    if (uploadPromises.length === 0) {
      throw new Error('No files or imageUrls provided');
    }

    const settled = await Promise.allSettled(uploadPromises);

    const createdRecords: ImageRecord[] = [];
    const errors: { index: number; message: string }[] = [];
    const cleanupPublicIds: string[] = [];

    // For each successful upload -> create DB record
    for (let i = 0; i < settled.length; i++) {
      const s = settled[i];
      const src = sourceMap[i];

      if (s.status === 'fulfilled') {
        const res = s.value;
        const dbData: any = {
          publicId: res.public_id,
          url: res.url,
          secureUrl: res.secure_url ?? null,
          folder: res.folder ?? folder,
          name: name ?? res.original_filename ?? null,
          originalFilename: res.original_filename ?? null,
          format: res.format ?? null,
          width: res.width ?? null,
          height: res.height ?? null,
          bytes: res.bytes ?? null,
          resourceType: res.resource_type ?? null,
          uploadedAt: res.created_at ? new Date(res.created_at) : null,
          provider: 'cloudinary',
          tags: Array.isArray(tags) ? tags : (res.tags ?? []),
        };

        try {
          const record = await db.image.create({ data: dbData });
          createdRecords.push(record as unknown as ImageRecord);
        } catch (dbErr: any) {
          // DB failed for this uploaded asset -> schedule cleanup
          cleanupPublicIds.push(res.public_id);
          errors.push({
            index: src.inputIndex,
            message: `DB error: ${dbErr.message ?? String(dbErr)}`,
          });
        }
      } else {
        // Upload failed
        const reason = s.reason ?? s;
        errors.push({
          index: src.inputIndex,
          message: reason && reason.message ? reason.message : String(reason),
        });
      }
    }

    // Attempt best-effort cleanup for uploads that succeeded but DB insert failed
    if (cleanupPublicIds.length > 0) {
      for (const pid of cleanupPublicIds) {
        try {
          await cloudinary.uploader.destroy(pid, { resource_type: 'image' });
        } catch (cleanupErr) {
          // log and continue

          console.error('Failed to cleanup Cloudinary asset', pid, cleanupErr);
        }
      }
    }

    return { created: createdRecords, errors };
  }

  /**
   * Find all images with pagination, sorting, and optional search.
   * Follows your method signature in example (userId optional, page/limit, sortBy, sortDir, search)
   */
  public async findAll({
    userId,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortDir = 'desc',
    search,
  }: {
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'name' | 'uploadedAt'; // extend as needed
    sortDir?: 'asc' | 'desc';
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    // If you have user relationship, uncomment and use:
    // if (userId) where.userId = userId;

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalFilename: { contains: search, mode: 'insensitive' } },
        { publicId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.image.count({ where });

    const images = await db.image.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: Number(skip),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: images,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        sortBy,
        sortDir,
        search: search ?? null,
      },
    };
  }

  public async findById(id: string) {
    return db.image.findUnique({ where: { id } });
  }

  public async update(data: UpdateImageDTO) {
    const { id, tags, ...rest } = data;

    // Build update object secara eksplisit agar sesuai dengan Prisma types
    const updateData: Prisma.ImageUpdateInput = {
      ...rest,
    } as Prisma.ImageUpdateInput;

    if (tags !== undefined) {
      if (tags === null) {
        // jika ingin mengosongkan tags saat null -> set ke empty array
        updateData.tags = { set: [] };
      } else {
        // tags adalah string[] -> set ke array tersebut
        updateData.tags = { set: tags };
      }
    }

    return db.image.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete image by id or publicId.
   * - If id provided: lookup record -> get publicId -> delete Cloudinary -> delete DB record
   * - If publicId provided: delete Cloudinary -> delete DB record by publicId
   */
  public async delete(identifier: { id?: string; publicId?: string }) {
    const { id, publicId } = identifier;

    let targetPublicId = publicId;

    if (!targetPublicId) {
      if (!id) throw new Error('id or publicId required');
      const existing = await db.image.findUnique({ where: { id } });
      if (!existing) return { deleted: null, cloudinaryResult: null };
      targetPublicId = (existing as any).publicId;
    }

    // Setelah guard di atas, pastikan TS tahu ini bukan undefined:
    if (!targetPublicId) {
      // ekstra safety — seharusnya tidak pernah terjadi karena guard sebelumnya
      throw new Error('targetPublicId is undefined');
    }
    const pid: string = targetPublicId; // sekarang pid bertipe string murni

    try {
      const destroyRes = await cloudinary.uploader.destroy(pid, {
        resource_type: 'image',
      });

      if (destroyRes.result === 'ok' || destroyRes.result === 'not_found') {
        const deleted = await db.image.delete({
          where: { publicId: pid },
        });
        return { deleted, cloudinaryResult: destroyRes };
      }

      return { deleted: null, cloudinaryResult: destroyRes };
    } catch (err: any) {
      throw new Error(
        `Cloudinary deletion failed: ${err.message ?? String(err)}`,
      );
    }
  }
}
