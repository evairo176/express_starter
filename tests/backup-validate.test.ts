/**
 * Tests for BackupService.validateDump — the safety gate that runs before any
 * destructive database import.
 *
 * validateDump must enforce two independent guarantees:
 *   1. Schema compatibility: every core table is referenced by the dump.
 *   2. Non-empty: the dump actually carries row data.
 *
 * The dump is validated by reading the (optionally gzipped) SQL text, so these
 * tests write small synthetic dumps to a temp dir — no real database needed.
 */
import { gzipSync } from 'zlib';
import { mkdtempSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import { BackupService } from '../src/modules/backup/backup.service';

const service = new BackupService();

const CORE_TABLES = [
  'User',
  'Portfolio',
  'PortfolioCategory',
  'TechStack',
  'BlogPost',
  'BlogCategory',
  'Achievement',
  'Testimonial',
];

let tmpDir: string;

beforeAll(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), 'backup-validate-'));
});

/** Build a pg_dump-style COPY block; populated by default. */
function copyBlock(table: string, rows: string[] = ['1\tx']): string {
  return (
    `COPY public."${table}" (id, name) FROM stdin;\n` +
    `${rows.join('\n')}${rows.length ? '\n' : ''}\\.\n`
  );
}

/** Assemble a full dump covering the given tables (all populated). */
function fullDump(tables: string[] = CORE_TABLES, populated = true): string {
  return tables
    .map((t) =>
      populated ? copyBlock(t, ['1\tx']) : copyBlock(t, []),
    )
    .join('\n');
}

function writeDump(name: string, sql: string, gzip = true): string {
  const file = path.join(tmpDir, name);
  writeFileSync(file, gzip ? gzipSync(Buffer.from(sql, 'utf8')) : sql);
  return file;
}

describe('BackupService.validateDump', () => {
  it('accepts a complete, populated gzipped dump', async () => {
    const file = writeDump('valid.sql.gz', fullDump());
    const result = await service.validateDump(file);

    expect(result.ok).toBe(true);
    expect(result.missingTables).toEqual([]);
    expect(result.hasData).toBe(true);
    expect(result.foundTables.sort()).toEqual([...CORE_TABLES].sort());
  });

  it('accepts a plain (non-gzipped) .sql dump', async () => {
    const file = writeDump('valid.sql', fullDump(), false);
    const result = await service.validateDump(file);
    expect(result.ok).toBe(true);
  });

  it('rejects a dump missing a core table (schema mismatch)', async () => {
    const tables = CORE_TABLES.filter((t) => t !== 'Portfolio');
    const file = writeDump('missing.sql.gz', fullDump(tables));
    const result = await service.validateDump(file);

    expect(result.ok).toBe(false);
    expect(result.missingTables).toContain('Portfolio');
    expect(result.errors.join(' ')).toMatch(/missing expected tables/i);
  });

  it('rejects a dump where all tables are empty (no data)', async () => {
    const file = writeDump('empty.sql.gz', fullDump(CORE_TABLES, false));
    const result = await service.validateDump(file);

    expect(result.ok).toBe(false);
    expect(result.hasData).toBe(false);
    expect(result.errors.join(' ')).toMatch(/no row data/i);
  });

  it('treats INSERT INTO statements as data', async () => {
    const schema = CORE_TABLES.map(
      (t) => `CREATE TABLE public."${t}" (id text);`,
    ).join('\n');
    const inserts = `INSERT INTO public."User" (id) VALUES ('1');`;
    const file = writeDump('inserts.sql.gz', `${schema}\n${inserts}`);
    const result = await service.validateDump(file);

    expect(result.ok).toBe(true);
    expect(result.hasData).toBe(true);
  });

  it('fails both checks for an unrelated/foreign dump', async () => {
    const foreign =
      'COPY public."some_other_table" (id) FROM stdin;\n1\n\\.\n';
    const file = writeDump('foreign.sql.gz', foreign);
    const result = await service.validateDump(file);

    expect(result.ok).toBe(false);
    expect(result.missingTables.length).toBe(CORE_TABLES.length);
  });
});
