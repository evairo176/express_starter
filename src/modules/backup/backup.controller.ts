import { Request, Response } from 'express';

import { asyncHandler } from '../../middlewares';
import response from '../../common/utils/response';
import { HTTPSTATUS } from '../../config/http.config';
import Logger from '../../libs/logger';
import { BackupService } from './backup.service';

/**
 * Admin-only backup/restore endpoints. All routes are mounted behind
 * `authenticateJWT` (see `backup.routes.ts`); the import path is destructive
 * (it drops and recreates the database from the uploaded dump), so the upload
 * is always validated for schema compatibility + non-empty data before any
 * restore runs.
 */
export class BackupController {
  private backupService: BackupService;

  constructor(backupService: BackupService) {
    this.backupService = backupService;
  }

  /** Pull the uploaded file off the multer single-file request. */
  private getUploadedFile(req: Request): Express.Multer.File {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new Error('No backup file uploaded (expected field "file")');
    }
    return file;
  }

  /**
   * POST /backup/validate — validate an uploaded dump without touching the DB.
   * Returns the structured validation report (schema match + has-data).
   */
  public validate = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const file = this.getUploadedFile(req);
      const validation = await this.backupService.validateBuffer(
        file.buffer,
        file.originalname,
      );

      return response.success(
        res,
        validation,
        validation.ok
          ? 'Dump is valid and ready to restore'
          : 'Dump failed validation',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * POST /backup/import — validate then restore an uploaded dump into the
   * live database. Destructive and atomic. Requires `confirm=true` in the body
   * as an explicit safety acknowledgement.
   */
  public import = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const confirm = req.body?.confirm;
      const confirmed = confirm === true || confirm === 'true';
      if (!confirmed) {
        return response.error(
          res,
          'Restore not confirmed. Send confirm=true to proceed (this overwrites the database).',
          HTTPSTATUS.BAD_REQUEST,
        );
      }

      const file = this.getUploadedFile(req);
      Logger.warn(
        `[backup] admin-triggered restore from upload: ${file.originalname} (${file.size} bytes)`,
      );

      const result = await this.backupService.importBuffer(
        file.buffer,
        file.originalname,
      );

      return response.success(
        res,
        result,
        'Database restored successfully',
        HTTPSTATUS.OK,
      );
    },
  );

  /**
   * POST /backup/now — trigger an on-demand backup that is dumped and
   * delivered to the configured Telegram chat (same flow as the daily cron).
   */
  public runNow = asyncHandler(
    async (_req: Request, res: Response): Promise<any> => {
      const fileName = await this.backupService.runBackup();
      return response.success(
        res,
        { fileName },
        'Backup created and sent to Telegram',
        HTTPSTATUS.OK,
      );
    },
  );
}
