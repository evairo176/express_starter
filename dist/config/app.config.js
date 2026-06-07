"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const get_env_1 = require("../common/utils/get-env");
const appConfig = () => ({
    NODE_ENV: (0, get_env_1.getEnv)('NODE_ENV', 'development'),
    APP_ORIGIN: (0, get_env_1.getEnv)('APP_ORIGIN', 'localhost'),
    SITE_URL: (0, get_env_1.getEnv)('SITE_URL', (0, get_env_1.getEnv)('FRONTEND_URL', 'http://localhost:5173')),
    PORT: (0, get_env_1.getEnv)('PORT', '5000'),
    BASE_PATH: (0, get_env_1.getEnv)('BASE_PATH', '/api/v1'),
    JWT: {
        SECRET: (0, get_env_1.getEnv)('JWT_SECRET'),
        EXPIRES_IN: (0, get_env_1.getEnv)('JWT_EXPIRES_IN', '15m'),
        REFRESH_SECRET: (0, get_env_1.getEnv)('JWT_REFRESH_SECRET'),
        REFRESH_EXPIRES_IN: (0, get_env_1.getEnv)('JWT_REFRESH_EXPIRES_IN', '30d'),
    },
    MAILER_SENDER: (0, get_env_1.getEnv)('MAILER_SENDER'),
    RESEND_API_KEY: (0, get_env_1.getEnv)('RESEND_API_KEY'),
    CONTACT_OWNER_EMAIL: (0, get_env_1.getEnv)('CONTACT_OWNER_EMAIL', ''),
    // Database backup -> Telegram. The scheduled cron job (00:00 daily) runs only
    // when both the bot token and chat id are configured. Leave blank to disable.
    BACKUP: {
        // Toggle the scheduled job entirely. Defaults to enabled.
        ENABLED: (0, get_env_1.getEnv)('BACKUP_ENABLED', 'true') !== 'false',
        // Cron expression for the schedule. Defaults to every day at midnight.
        CRON: (0, get_env_1.getEnv)('BACKUP_CRON', '0 0 * * *'),
        // IANA timezone used to interpret the cron schedule.
        TIMEZONE: (0, get_env_1.getEnv)('BACKUP_TIMEZONE', 'Asia/Jakarta'),
        // Telegram delivery credentials (filled in by the user via .env).
        TELEGRAM_BOT_TOKEN: (0, get_env_1.getEnv)('TELEGRAM_BOT_TOKEN', ''),
        TELEGRAM_CHAT_ID: (0, get_env_1.getEnv)('TELEGRAM_CHAT_ID', ''),
    },
    // Comment moderation: when enabled (default), newly created blog comments
    // start unapproved and are hidden from public reads until an admin approves
    // them. Set COMMENT_MODERATION=false to auto-approve comments.
    COMMENT_MODERATION: (0, get_env_1.getEnv)('COMMENT_MODERATION', 'true') !== 'false',
    RATE_LIMIT: {
        AUTH: {
            WINDOW_MS: Number((0, get_env_1.getEnv)('RATE_LIMIT_AUTH_WINDOW_MS', '900000')),
            MAX: Number((0, get_env_1.getEnv)('RATE_LIMIT_AUTH_MAX', '10')),
        },
        WRITE: {
            WINDOW_MS: Number((0, get_env_1.getEnv)('RATE_LIMIT_WRITE_WINDOW_MS', '900000')),
            MAX: Number((0, get_env_1.getEnv)('RATE_LIMIT_WRITE_MAX', '30')),
        },
    },
});
exports.config = appConfig();
