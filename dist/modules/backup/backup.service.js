"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = exports.BackupService = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const zlib_1 = require("zlib");
const util_1 = require("util");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const app_config_1 = require("../../config/app.config");
const get_env_1 = require("../../common/utils/get-env");
const logger_1 = __importDefault(require("../../libs/logger"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
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
class BackupService {
    /** Build a timestamped backup filename, e.g. `backup-2024-06-07_00-00-00.sql.gz`. */
    buildFileName() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
            `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        return `backup-${stamp}.sql.gz`;
    }
    /**
     * Run `pg_dump` against `DATABASE_URL` and write a gzip-compressed SQL dump
     * to a temp directory. Returns the absolute path to the created file.
     */
    createDump() {
        return __awaiter(this, void 0, void 0, function* () {
            const databaseUrl = (0, get_env_1.getEnv)('DATABASE_URL');
            const dir = path_1.default.join(os_1.default.tmpdir(), 'db-backups');
            yield (0, promises_1.mkdir)(dir, { recursive: true });
            const fileName = this.buildFileName();
            const filePath = path_1.default.join(dir, fileName);
            // `pg_dump` honors the connection string directly. `--no-owner`/`--no-acl`
            // keep the dump portable; `--clean --if-exists` prepends DROP statements so
            // the dump can be restored onto an existing database idempotently; gzip
            // compresses the output stream.
            const command = `pg_dump "${databaseUrl}" --no-owner --no-acl --clean --if-exists | gzip > "${filePath}"`;
            logger_1.default.info('[backup] running pg_dump...');
            yield execAsync(command, {
                maxBuffer: 1024 * 1024 * 64,
                shell: '/bin/bash',
            });
            const { size } = yield (0, promises_1.stat)(filePath);
            if (size === 0) {
                throw new Error('pg_dump produced an empty file');
            }
            logger_1.default.info(`[backup] dump created: ${fileName} (${size} bytes)`);
            return { filePath, fileName };
        });
    }
    /**
     * Send a file to the configured Telegram chat via the Bot API. Throws when
     * credentials are missing or the API responds with an error.
     */
    sendToTelegram(filePath, fileName, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = app_config_1.config.BACKUP.TELEGRAM_BOT_TOKEN;
            const chatId = app_config_1.config.BACKUP.TELEGRAM_CHAT_ID;
            if (!token || !chatId) {
                throw new Error('Telegram credentials are not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)');
            }
            const form = new form_data_1.default();
            form.append('chat_id', chatId);
            form.append('caption', caption);
            form.append('document', (0, fs_1.createReadStream)(filePath), { filename: fileName });
            const url = `https://api.telegram.org/bot${token}/sendDocument`;
            logger_1.default.info('[backup] uploading backup to Telegram...');
            yield axios_1.default.post(url, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000,
            });
            logger_1.default.info('[backup] backup sent to Telegram successfully');
        });
    }
    /**
     * Read a gzip-compressed SQL dump back into a plain UTF-8 string. Accepts
     * either a `.gz` file (decompressed in memory) or a raw `.sql` file.
     */
    readDumpSql(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield (0, promises_1.readFile)(filePath);
            if (filePath.endsWith('.gz')) {
                return (0, zlib_1.gunzipSync)(buffer).toString('utf8');
            }
            return buffer.toString('utf8');
        });
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
    validateDump(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = yield this.readDumpSql(filePath);
            const errors = [];
            // ---- Schema compatibility -------------------------------------------
            const foundTables = [];
            const missingTables = [];
            for (const table of BackupService.EXPECTED_TABLES) {
                // pg_dump quotes identifiers and qualifies them with the schema, e.g.
                // `CREATE TABLE public."Portfolio"` / `COPY public."Portfolio"`. Match
                // either the quoted form (exact, so "Portfolio" never matches
                // "PortfolioCategory") or an unquoted identifier with a word boundary.
                const pattern = new RegExp(`(CREATE TABLE|COPY|INSERT INTO)\\s+(public\\.)?("${table}"|${table}\\b)`);
                if (pattern.test(sql)) {
                    foundTables.push(table);
                }
                else {
                    missingTables.push(table);
                }
            }
            if (missingTables.length > 0) {
                errors.push(`Dump is missing expected tables: ${missingTables.join(', ')}. ` +
                    'It may belong to a different schema.');
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
        });
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
    importDump(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const databaseUrl = (0, get_env_1.getEnv)('DATABASE_URL');
            const validation = yield this.validateDump(filePath);
            if (!validation.ok) {
                throw new Error(`Refusing to import: dump failed validation. ${validation.errors.join(' ')}`);
            }
            // Decompress to a temp .sql when needed; psql reads plain SQL.
            let sqlPath = filePath;
            let tempSqlPath;
            if (filePath.endsWith('.gz')) {
                const sql = yield this.readDumpSql(filePath);
                const dir = path_1.default.join(os_1.default.tmpdir(), 'db-backups');
                yield (0, promises_1.mkdir)(dir, { recursive: true });
                tempSqlPath = path_1.default.join(dir, `restore-${Date.now()}.sql`);
                yield (0, promises_1.writeFile)(tempSqlPath, sql, 'utf8');
                sqlPath = tempSqlPath;
            }
            try {
                const command = `psql "${databaseUrl}" --set ON_ERROR_STOP=1 --single-transaction ` +
                    `-f "${sqlPath}"`;
                logger_1.default.info('[backup] importing dump via psql (single transaction)...');
                yield execAsync(command, {
                    maxBuffer: 1024 * 1024 * 128,
                    shell: '/bin/bash',
                });
                logger_1.default.info('[backup] dump imported successfully');
                return { fileName: path_1.default.basename(filePath), validation };
            }
            finally {
                if (tempSqlPath) {
                    yield (0, promises_1.unlink)(tempSqlPath).catch(() => {
                        // Best-effort cleanup; ignore failures.
                    });
                }
            }
        });
    }
    /**
     * Persist an uploaded dump buffer to a temp file so the path-based
     * `validateDump`/`importDump` logic can operate on it. Returns the temp path;
     * caller is responsible for cleanup.
     */
    writeBufferToTemp(buffer, originalName) {
        return __awaiter(this, void 0, void 0, function* () {
            const dir = path_1.default.join(os_1.default.tmpdir(), 'db-backups');
            yield (0, promises_1.mkdir)(dir, { recursive: true });
            // Preserve the .gz/.sql suffix so downstream logic decompresses correctly.
            const ext = originalName.endsWith('.gz')
                ? '.sql.gz'
                : originalName.endsWith('.sql')
                    ? '.sql'
                    : '.sql.gz';
            const tempPath = path_1.default.join(dir, `upload-${Date.now()}${ext}`);
            yield (0, promises_1.writeFile)(tempPath, buffer);
            return tempPath;
        });
    }
    /**
     * Validate an uploaded dump buffer (no DB changes). Writes the buffer to a
     * temp file, runs `validateDump`, then cleans up. Used by the admin
     * `POST /backup/validate` endpoint to preview a dump before restoring.
     */
    validateBuffer(buffer, originalName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tempPath = yield this.writeBufferToTemp(buffer, originalName);
            try {
                return yield this.validateDump(tempPath);
            }
            finally {
                yield (0, promises_1.unlink)(tempPath).catch(() => {
                    // Best-effort cleanup; ignore failures.
                });
            }
        });
    }
    /**
     * Validate and restore an uploaded dump buffer into `DATABASE_URL`. Writes
     * the buffer to a temp file, delegates to `importDump` (which validates and
     * restores atomically), then cleans up. Used by the admin
     * `POST /backup/import` endpoint. Destructive — callers must enforce auth.
     */
    importBuffer(buffer, originalName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tempPath = yield this.writeBufferToTemp(buffer, originalName);
            try {
                const result = yield this.importDump(tempPath);
                return Object.assign(Object.assign({}, result), { fileName: originalName });
            }
            finally {
                yield (0, promises_1.unlink)(tempPath).catch(() => {
                    // Best-effort cleanup; ignore failures.
                });
            }
        });
    }
    /**
     * Full backup flow: dump the database, deliver it to Telegram, then clean up
     * the temp file. Returns the file name on success.
     */
    runBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            let filePath;
            try {
                const dump = yield this.createDump();
                filePath = dump.filePath;
                const caption = `🗄️ Database backup\n` +
                    `📅 ${new Date().toISOString()}\n` +
                    `📦 ${dump.fileName}`;
                yield this.sendToTelegram(dump.filePath, dump.fileName, caption);
                return dump.fileName;
            }
            finally {
                if (filePath) {
                    yield (0, promises_1.unlink)(filePath).catch(() => {
                        // Best-effort cleanup; ignore failures.
                    });
                }
            }
        });
    }
}
exports.BackupService = BackupService;
/**
 * Core tables expected to be present in a valid dump. These map to the
 * Prisma models that hold the portfolio/blog content; a dump missing any of
 * them is considered structurally incompatible with the current schema.
 */
BackupService.EXPECTED_TABLES = [
    'User',
    'Portfolio',
    'PortfolioCategory',
    'TechStack',
    'BlogPost',
    'BlogCategory',
    'Achievement',
    'Testimonial',
];
exports.backupService = new BackupService();
