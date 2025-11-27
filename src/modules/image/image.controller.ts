// src/controllers/image.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares';
import response from '../../cummon/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import { CreateImageSchema } from '../../cummon/zod/image.schema';
import { CreateImageDTO, ImageService } from './image.service';

export class ImageController {
  private ImageService: ImageService;

  constructor(ImageService: ImageService) {
    this.ImageService = ImageService;
  }

  /**
   * Helper: collect files from req.files in both shapes:
   * - MulterFile[] (upload.array)
   * - { [fieldname]: MulterFile[] } (upload.fields)
   */
  private collectFiles(req: Request): any[] {
    const filesRaw = (req as any).files;
    if (!filesRaw) return [];

    // Case 1: array (upload.array)
    if (Array.isArray(filesRaw)) {
      return filesRaw as any[];
    }

    // Case 2: object (upload.fields) -> flatten all arrays
    if (typeof filesRaw === 'object') {
      const flattened: any[] = [];
      for (const key of Object.keys(filesRaw)) {
        const entry = filesRaw[key];
        if (Array.isArray(entry)) flattened.push(...entry);
      }
      return flattened;
    }

    return [];
  }

  /**
   * POST /images
   * - multer upload.fields(fileFields) expected to be used on route
   * - body validated by CreateImageSchema (folder, imageUrls, name, tags, etc)
   */
  public create = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Validate body
      const parsed = CreateImageSchema.parse(req.body);

      // Collect files from req (support both array and fields)
      const multerFiles = this.collectFiles(req);
      const fileInputs: any[] = multerFiles
        .filter((f) => !!f.buffer)
        .map((f) => ({ buffer: f.buffer, originalname: f.originalname }));

      const dto: CreateImageDTO = {
        files: fileInputs,
        imageUrls: parsed.imageUrls ?? [],
        folder: parsed.folder,
        name: (parsed as any).name ?? undefined,
        tags: (parsed as any).tags ?? undefined,
      };

      const result = await this.ImageService.create(dto);
      const createdCount = Array.isArray(result.created)
        ? result.created.length
        : 0;
      const errorCount = Array.isArray(result.errors)
        ? result.errors.length
        : 0;

      const msg =
        createdCount > 0
          ? `${createdCount} image(s) uploaded${errorCount ? `, ${errorCount} failed` : ''}`
          : `No images uploaded${errorCount ? `, ${errorCount} errors` : ''}`;

      const payload = {
        created: result.created,
        errors: result.errors,
      };

      return response.success(res, payload, msg, HTTPSTATUS.CREATED, {
        createdCount,
        errorCount,
      });
    },
  );

  public findAll = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Ambil semua query dari req.query (semua value dari express selalu string)
      const { page, limit, sortBy, sortDir, search, userId } = req.query as {
        page?: string;
        limit?: string;
        sortBy?: string;
        sortDir?: string;
        search?: string;
        userId?: string;
      };

      // Normalisasi query params
      const normalized = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: (sortBy as any) ?? 'createdAt',
        sortDir: (sortDir as 'asc' | 'desc') ?? 'desc',
        search: search ?? undefined,
        userId: userId ?? undefined,
      };

      // Panggil service
      const { data, metadata } = await this.ImageService.findAll(normalized);

      return response.success(
        res,
        data,
        `Find all images successfully`,
        HTTPSTATUS.OK,
        metadata,
      );
    },
  );
}
