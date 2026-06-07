import { getEnv } from '../common/utils/get-env';

const appConfig = () => ({
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  APP_ORIGIN: getEnv('APP_ORIGIN', 'localhost'),
  SITE_URL: getEnv('SITE_URL', getEnv('FRONTEND_URL', 'http://localhost:5173')),
  PORT: getEnv('PORT', '5000'),
  BASE_PATH: getEnv('BASE_PATH', '/api/v1'),
  JWT: {
    SECRET: getEnv('JWT_SECRET'),
    EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '15m'),
    REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
    REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  MAILER_SENDER: getEnv('MAILER_SENDER'),
  RESEND_API_KEY: getEnv('RESEND_API_KEY'),
  CONTACT_OWNER_EMAIL: getEnv('CONTACT_OWNER_EMAIL', ''),
  // Database backup -> Telegram. The scheduled cron job (00:00 daily) runs only
  // when both the bot token and chat id are configured. Leave blank to disable.
  BACKUP: {
    // Toggle the scheduled job entirely. Defaults to enabled.
    ENABLED: getEnv('BACKUP_ENABLED', 'true') !== 'false',
    // Cron expression for the schedule. Defaults to every day at midnight.
    CRON: getEnv('BACKUP_CRON', '0 0 * * *'),
    // IANA timezone used to interpret the cron schedule.
    TIMEZONE: getEnv('BACKUP_TIMEZONE', 'Asia/Jakarta'),
    // Telegram delivery credentials (filled in by the user via .env).
    TELEGRAM_BOT_TOKEN: getEnv('TELEGRAM_BOT_TOKEN', ''),
    TELEGRAM_CHAT_ID: getEnv('TELEGRAM_CHAT_ID', ''),
  },
  // Comment moderation: when enabled (default), newly created blog comments
  // start unapproved and are hidden from public reads until an admin approves
  // them. Set COMMENT_MODERATION=false to auto-approve comments.
  COMMENT_MODERATION: getEnv('COMMENT_MODERATION', 'true') !== 'false',
  RATE_LIMIT: {
    AUTH: {
      WINDOW_MS: Number(getEnv('RATE_LIMIT_AUTH_WINDOW_MS', '900000')),
      MAX: Number(getEnv('RATE_LIMIT_AUTH_MAX', '10')),
    },
    WRITE: {
      WINDOW_MS: Number(getEnv('RATE_LIMIT_WRITE_WINDOW_MS', '900000')),
      MAX: Number(getEnv('RATE_LIMIT_WRITE_MAX', '30')),
    },
  },
});

export const config = appConfig();
