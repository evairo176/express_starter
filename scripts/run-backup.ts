/**
 * Manually trigger a database backup -> Telegram delivery, without waiting for
 * the scheduled 00:00 cron. Useful for verifying the Telegram credentials.
 *
 * Run: npx ts-node scripts/run-backup.ts
 */
import 'dotenv/config';

import { backupService } from '../src/modules/backup/backup.service';

backupService
  .runBackup()
  .then((fileName) => {
    console.log(`Backup sent to Telegram: ${fileName}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backup failed:', error?.message ?? error);
    process.exit(1);
  });
