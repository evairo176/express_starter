"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBackupCron = registerBackupCron;
const node_cron_1 = __importDefault(require("node-cron"));
const app_config_1 = require("../../config/app.config");
const logger_1 = __importDefault(require("../../libs/logger"));
const backup_service_1 = require("./backup.service");
/**
 * Register the daily database-backup cron job.
 *
 * Runs on the schedule defined by `BACKUP_CRON` (default `0 0 * * *` — every
 * day at 00:00) in the `BACKUP_TIMEZONE` timezone, dumps the database, and
 * delivers it to Telegram. The job is skipped entirely when `BACKUP_ENABLED`
 * is `false` or when the Telegram credentials are not configured, so the app
 * boots cleanly in environments that don't need it (e.g. local/dev, CI).
 */
function registerBackupCron() {
    if (!app_config_1.config.BACKUP.ENABLED) {
        logger_1.default.info('[backup] scheduled backup disabled (BACKUP_ENABLED=false)');
        return;
    }
    if (!app_config_1.config.BACKUP.TELEGRAM_BOT_TOKEN || !app_config_1.config.BACKUP.TELEGRAM_CHAT_ID) {
        logger_1.default.warn('[backup] Telegram credentials missing; skipping cron registration. ' +
            'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable daily backups.');
        return;
    }
    const expression = app_config_1.config.BACKUP.CRON;
    if (!node_cron_1.default.validate(expression)) {
        logger_1.default.error(`[backup] invalid BACKUP_CRON expression: "${expression}"`);
        return;
    }
    node_cron_1.default.schedule(expression, () => {
        logger_1.default.info('[backup] scheduled backup triggered');
        backup_service_1.backupService
            .runBackup()
            .then((fileName) => logger_1.default.info(`[backup] scheduled backup completed: ${fileName}`))
            .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`[backup] scheduled backup failed: ${message}`);
        });
    }, { timezone: app_config_1.config.BACKUP.TIMEZONE });
    logger_1.default.info(`[backup] daily backup cron registered ("${expression}", ${app_config_1.config.BACKUP.TIMEZONE})`);
}
