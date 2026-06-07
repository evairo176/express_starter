/**
 * Restore a database backup (.sql.gz or .sql) into DATABASE_URL.
 *
 * Before doing anything destructive, the dump is validated:
 *   1. Schema compatibility — every core table must be present in the dump.
 *   2. Non-empty — the dump must contain actual row data.
 *
 * The actual restore is destructive (it DROPs and recreates objects), so it
 * only runs when you pass `--confirm`. Without it, the script validates the
 * dump and prints the report without touching the database.
 *
 * Usage:
 *   # validate only (safe, no DB changes)
 *   npx ts-node scripts/run-import.ts ./backups/backup.sql.gz
 *
 *   # validate then restore (DESTRUCTIVE)
 *   npx ts-node scripts/run-import.ts ./backups/backup.sql.gz --confirm
 */
import 'dotenv/config';

import { existsSync } from 'fs';
import path from 'path';

import { backupService } from '../src/modules/backup/backup.service';

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const fileArg = args.find((a) => !a.startsWith('--'));

  if (!fileArg) {
    console.error('Usage: ts-node scripts/run-import.ts <path-to-dump> [--confirm]');
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`\nValidating dump: ${filePath}\n`);
  const validation = await backupService.validateDump(filePath);

  console.log(`  Schema check : ${validation.missingTables.length === 0 ? 'OK' : 'FAILED'}`);
  console.log(`    found      : ${validation.foundTables.join(', ') || '(none)'}`);
  if (validation.missingTables.length > 0) {
    console.log(`    missing    : ${validation.missingTables.join(', ')}`);
  }
  console.log(`  Has data     : ${validation.hasData ? 'YES' : 'NO'}`);
  console.log(`  Valid        : ${validation.ok ? 'YES' : 'NO'}`);

  if (!validation.ok) {
    console.error('\nDump failed validation:');
    validation.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (!confirm) {
    console.log(
      '\nDump is valid. Re-run with --confirm to RESTORE it into DATABASE_URL.\n' +
        'WARNING: restore is destructive — it drops and recreates objects.\n',
    );
    process.exit(0);
  }

  console.log('\n--confirm passed. Restoring (destructive, atomic transaction)...\n');
  const result = await backupService.importDump(filePath);
  console.log(`\nRestore complete: ${result.fileName}\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Import failed:', error?.message ?? error);
  process.exit(1);
});
