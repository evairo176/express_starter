import { exec } from 'child_process';
import { createReadStream } from 'fs';
import { mkdir, stat, unlink } from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

import axios from 'axios';
import FormData from 'form-data';

import { config } from '../../config/app.config';
import { getEnv } from '../../common/utils/get-env';
import Logger from '../../libs/logger';

const execAsync = promisify(exec);

/**
 * Database backup service.
 *
 * Produces a compressed PostgreSQL dump via `pg_dump` and delivers it to a
 * Telegram chat using the Bot API `sendDocument` endpoint. Used by the
 * scheduled cron job (see `backup.scheduler.ts`) which runs daily at 00:00.
 *
 * Credentials (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) are read from the
 * environment and filled in by the operator; when absent the run is skipped.
 */
export class BackupService {
  /** Build a timestamped backup filename, e.g. `backup-2024-06-07_00-00-00.sql.gz`. */
  private buildFileName(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `backup-${stamp}.sql.gz`;
  }

  /**
   * Run `pg_dump` against `DATABASE_URL` and write a gzip-compressed SQL dump
   * to a temp directory. Returns the absolute path to the created file.
   */
  public async createDump(): Promise<{ filePath: string; fileName: string }> {
    const databaseUrl = getEnv('DATABASE_URL');

    const dir = path.join(os.tmpdir(), 'db-backups');
    await mkdir(dir, { recursive: true });

    const fileName = this.buildFileName();
    const filePath = path.join(dir, fileName);

    // `pg_dump` honors the connection string directly. `--no-owner`/`--no-acl`
    // keep the dump portable; gzip compresses the output stream.
    const command = `pg_dump "${databaseUrl}" --no-owner --no-acl | gzip > "${filePath}"`;

    Logger.info('[backup] running pg_dump...');
    await execAsync(command, {
      maxBuffer: 1024 * 1024 * 64,
      shell: '/bin/bash',
    });

    const { size } = await stat(filePath);
    if (size === 0) {
      throw new Error('pg_dump produced an empty file');
    }

    Logger.info(`[backup] dump created: ${fileName} (${size} bytes)`);
    return { filePath, fileName };
  }

  /**
   * Send a file to the configured Telegram chat via the Bot API. Throws when
   * credentials are missing or the API responds with an error.
   */
  public async sendToTelegram(
    filePath: string,
    fileName: string,
    caption: string,
  ): Promise<void> {
    const token = config.BACKUP.TELEGRAM_BOT_TOKEN;
    const chatId = config.BACKUP.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      throw new Error(
        'Telegram credentials are not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)',
      );
    }

    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption);
    form.append('document', createReadStream(filePath), { filename: fileName });

    const url = `https://api.telegram.org/bot${token}/sendDocument`;

    Logger.info('[backup] uploading backup to Telegram...');
    await axios.post(url, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    });
    Logger.info('[backup] backup sent to Telegram successfully');
  }

  /**
   * Full backup flow: dump the database, deliver it to Telegram, then clean up
   * the temp file. Returns the file name on success.
   */
  public async runBackup(): Promise<string> {
    let filePath: string | undefined;
    try {
      const dump = await this.createDump();
      filePath = dump.filePath;

      const caption =
        `🗄️ Database backup\n` +
        `📅 ${new Date().toISOString()}\n` +
        `📦 ${dump.fileName}`;

      await this.sendToTelegram(dump.filePath, dump.fileName, caption);
      return dump.fileName;
    } finally {
      if (filePath) {
        await unlink(filePath).catch(() => {
          // Best-effort cleanup; ignore failures.
        });
      }
    }
  }
}

export const backupService = new BackupService();
