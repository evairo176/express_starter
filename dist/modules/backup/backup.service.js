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
            // keep the dump portable; gzip compresses the output stream.
            const command = `pg_dump "${databaseUrl}" --no-owner --no-acl | gzip > "${filePath}"`;
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
exports.backupService = new BackupService();
