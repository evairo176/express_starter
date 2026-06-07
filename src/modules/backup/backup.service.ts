import { exec } from 'child_process';
import { createReadStream } from 'fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { gunzipSync } from 'zlib';
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
    // keep the dump portable; `--clean --if-exists` prepends DROP statements so
    // the dump can be restored onto an existing database idempotently; gzip
    // compresses the output stream.
    const command = `pg_dump "${databaseUrl}" --no-owner --no-acl --clean --if-exists | gzip > "${filePath}"`;

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
   * Core tables expected to be present in a valid dump. These map to the
   * Prisma models that hold the portfolio/blog content; a dump missing any of
   * them is considered structurally incompatible with the current schema.
   */
  private static readonly EXPECTED_TABLES = [
    'User',
    'Portfolio',
    'PortfolioCategory',
    'TechStack',
    'BlogPost',
    'BlogCategory',
    'Achievement',
    'Testimonial',
  ];

  /**
   * Read a gzip-compressed SQL dump back into a plain UTF-8 string. Accepts
   * either a `.gz` file (decompressed in memory) or a raw `.sql` file.
   */
  private async readDumpSql(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    if (filePath.endsWith('.gz')) {
      return gunzipSync(buffer).toString('utf8');
    }
    return buffer.toString('utf8');
  }

  /**
   * Validate a dump file before importing it. Two independent checks:
   *
   *  1. **Schema compatibility** — every core table (see `EXPECTED_TABLES`)
   *     must be referenced by a `CREATE TABLE`/`COPY`/`INSERT` statement, so we
   *     never restore a dump that belongs to a different/older schema.
   *  2. **Has data** — the dump must contain at least one `COPY ... FROM stdin`
   *     block with rows, or at least one `INSERT INTO` statement, so we never
   *     wipe the live database with an empty backup.
   *
   * Returns a structured report; `ok` is true only when both checks pass.
   */
  public async validateDump(filePath: string): Promise<{
    ok: boolean;
    missingTables: string[];
    hasData: boolean;
    foundTables: string[];
    errors: string[];
  }> {
    const sql = await this.readDumpSql(filePath);
    const errors: string[] = [];

    // ---- Schema compatibility -------------------------------------------
    const foundTables: string[] = [];
    const missingTables: string[] = [];
    for (const table of BackupService.EXPECTED_TABLES) {
      // pg_dump quotes identifiers and qualifies them with the schema, e.g.
      // `CREATE TABLE public."Portfolio"` / `COPY public."Portfolio"`. Match
      // either the quoted form (exact, so "Portfolio" never matches
      // "PortfolioCategory") or an unquoted identifier with a word boundary.
      const pattern = new RegExp(
        `(CREATE TABLE|COPY|INSERT INTO)\\s+(public\\.)?("${table}"|${table}\\b)`,
      );
      if (pattern.test(sql)) {
        foundTables.push(table);
      } else {
        missingTables.push(table);
      }
    }
    if (missingTables.length > 0) {
      errors.push(
        `Dump is missing expected tables: ${missingTables.join(', ')}. ` +
          'It may belong to a different schema.',
      );
    }

    // ---- Has data --------------------------------------------------------
    // Scan line by line. Inside a `COPY ... FROM stdin;` block (terminated by a
    // line that is exactly `\.`), any non-empty line is a data row. Fall back
    // to detecting `INSERT INTO` statements for insert-style dumps.
    let hasData = false;
    let inCopy = false;
    for (const rawLine of sql.split('\n')) {
      const line = rawLine.trimEnd();
      if (!inCopy) {
        if (/^COPY\b.*FROM stdin;$/.test(line)) {
          inCopy = true;
        }
        continue;
      }
      // Inside a COPY block.
      if (line === '\\.') {
        inCopy = false;
        continue;
      }
      if (line.trim().length > 0) {
        hasData = true;
        break;
      }
    }
    if (!hasData && /INSERT INTO\s+/.test(sql)) {
      hasData = true;
    }
    if (!hasData) {
      errors.push('Dump contains no row data (all tables are empty).');
    }

    return {
      ok: missingTables.length === 0 && hasData,
      missingTables,
      hasData,
      foundTables,
      errors,
    };
  }

  /**
   * Restore a dump file into `DATABASE_URL`. Validates the dump first (schema
   * compatibility + non-empty data) and refuses to proceed when invalid.
   *
   * The restore runs through `psql` with `ON_ERROR_STOP=1` and
   * `--single-transaction`, so the entire import is atomic — any error rolls
   * back the whole thing, leaving the database untouched. Because dumps are
   * created with `--clean --if-exists`, existing objects are dropped and
   * recreated as part of the same transaction.
   *
   * This is a destructive operation against the target database; callers
   * (e.g. `scripts/run-import.ts`) must require explicit confirmation.
   */
  public async importDump(filePath: string): Promise<{
    fileName: string;
    validation: Awaited<ReturnType<BackupService['validateDump']>>;
  }> {
    const databaseUrl = getEnv('DATABASE_URL');

    const validation = await this.validateDump(filePath);
    if (!validation.ok) {
      throw new Error(
        `Refusing to import: dump failed validation. ${validation.errors.join(' ')}`,
      );
    }

    // Decompress to a temp .sql when needed; psql reads plain SQL.
    let sqlPath = filePath;
    let tempSqlPath: string | undefined;
    if (filePath.endsWith('.gz')) {
      const sql = await this.readDumpSql(filePath);
      const dir = path.join(os.tmpdir(), 'db-backups');
      await mkdir(dir, { recursive: true });
      tempSqlPath = path.join(dir, `restore-${Date.now()}.sql`);
      await writeFile(tempSqlPath, sql, 'utf8');
      sqlPath = tempSqlPath;
    }

    try {
      const command =
        `psql "${databaseUrl}" --set ON_ERROR_STOP=1 --single-transaction ` +
        `-f "${sqlPath}"`;

      Logger.info('[backup] importing dump via psql (single transaction)...');
      await execAsync(command, {
        maxBuffer: 1024 * 1024 * 128,
        shell: '/bin/bash',
      });
      Logger.info('[backup] dump imported successfully');

      return { fileName: path.basename(filePath), validation };
    } finally {
      if (tempSqlPath) {
        await unlink(tempSqlPath).catch(() => {
          // Best-effort cleanup; ignore failures.
        });
      }
    }
  }

  /**
   * Persist an uploaded dump buffer to a temp file so the path-based
   * `validateDump`/`importDump` logic can operate on it. Returns the temp path;
   * caller is responsible for cleanup.
   */
  private async writeBufferToTemp(
    buffer: Buffer,
    originalName: string,
  ): Promise<string> {
    const dir = path.join(os.tmpdir(), 'db-backups');
    await mkdir(dir, { recursive: true });
    // Preserve the .gz/.sql suffix so downstream logic decompresses correctly.
    const ext = originalName.endsWith('.gz')
      ? '.sql.gz'
      : originalName.endsWith('.sql')
        ? '.sql'
        : '.sql.gz';
    const tempPath = path.join(dir, `upload-${Date.now()}${ext}`);
    await writeFile(tempPath, buffer);
    return tempPath;
  }

  /**
   * Validate an uploaded dump buffer (no DB changes). Writes the buffer to a
   * temp file, runs `validateDump`, then cleans up. Used by the admin
   * `POST /backup/validate` endpoint to preview a dump before restoring.
   */
  public async validateBuffer(
    buffer: Buffer,
    originalName: string,
  ): Promise<Awaited<ReturnType<BackupService['validateDump']>>> {
    const tempPath = await this.writeBufferToTemp(buffer, originalName);
    try {
      return await this.validateDump(tempPath);
    } finally {
      await unlink(tempPath).catch(() => {
        // Best-effort cleanup; ignore failures.
      });
    }
  }

  /**
   * Validate and restore an uploaded dump buffer into `DATABASE_URL`. Writes
   * the buffer to a temp file, delegates to `importDump` (which validates and
   * restores atomically), then cleans up. Used by the admin
   * `POST /backup/import` endpoint. Destructive — callers must enforce auth.
   */
  public async importBuffer(
    buffer: Buffer,
    originalName: string,
  ): Promise<{
    fileName: string;
    validation: Awaited<ReturnType<BackupService['validateDump']>>;
  }> {
    const tempPath = await this.writeBufferToTemp(buffer, originalName);
    try {
      const result = await this.importDump(tempPath);
      return { ...result, fileName: originalName };
    } finally {
      await unlink(tempPath).catch(() => {
        // Best-effort cleanup; ignore failures.
      });
    }
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
