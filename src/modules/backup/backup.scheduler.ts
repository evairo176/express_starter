import cron from 'node-cron';

import { config } from '../../config/app.config';
import Logger from '../../libs/logger';
import { backupService } from './backup.service';

/**
 * Register the daily database-backup cron job.
 *
 * Runs on the schedule defined by `BACKUP_CRON` (default `0 0 * * *` — every
 * day at 00:00) in the `BACKUP_TIMEZONE` timezone, dumps the database, and
 * delivers it to Telegram. The job is skipped entirely when `BACKUP_ENABLED`
 * is `false` or when the Telegram credentials are not configured, so the app
 * boots cleanly in environments that don't need it (e.g. local/dev, CI).
 */
export function registerBackupCron(): void {
  if (!config.BACKUP.ENABLED) {
    Logger.info('[backup] scheduled backup disabled (BACKUP_ENABLED=false)');
    return;
  }

  if (!config.BACKUP.TELEGRAM_BOT_TOKEN || !config.BACKUP.TELEGRAM_CHAT_ID) {
    Logger.warn(
      '[backup] Telegram credentials missing; skipping cron registration. ' +
        'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable daily backups.',
    );
    return;
  }

  const expression = config.BACKUP.CRON;

  if (!cron.validate(expression)) {
    Logger.error(`[backup] invalid BACKUP_CRON expression: "${expression}"`);
    return;
  }

  cron.schedule(
    expression,
    () => {
      Logger.info('[backup] scheduled backup triggered');
      backupService
        .runBackup()
        .then((fileName) =>
          Logger.info(`[backup] scheduled backup completed: ${fileName}`),
        )
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          Logger.error(`[backup] scheduled backup failed: ${message}`);
        });
    },
    { timezone: config.BACKUP.TIMEZONE },
  );

  Logger.info(
    `[backup] daily backup cron registered ("${expression}", ${config.BACKUP.TIMEZONE})`,
  );
}
