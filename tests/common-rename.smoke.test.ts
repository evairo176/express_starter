import fs from 'fs';
import path from 'path';

/**
 * Smoke test for the `cummon` -> `common` rename.
 *
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4
 */

// Resolve the project root from this test file location (tests/ -> project root).
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const cummonDir = path.join(srcDir, 'cummon');
const commonDir = path.join(srcDir, 'common');

/** Recursively collect all .ts file paths under a directory. */
function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}

describe('cummon -> common rename smoke test', () => {
  it('does not contain the old src/cummon directory (Req 17.1)', () => {
    expect(fs.existsSync(cummonDir)).toBe(false);
  });

  it('contains the new src/common directory (Req 17.2)', () => {
    expect(fs.existsSync(commonDir)).toBe(true);
    expect(fs.statSync(commonDir).isDirectory()).toBe(true);
  });

  it('has the known moved file src/common/utils/response.ts (Req 17.3)', () => {
    const responseFile = path.join(commonDir, 'utils', 'response.ts');
    expect(fs.existsSync(responseFile)).toBe(true);
  });

  it('has no source file under src/ referencing the old "cummon" string (Req 17.4)', () => {
    const tsFiles = collectTsFiles(srcDir);
    const offenders = tsFiles.filter((file) =>
      fs.readFileSync(file, 'utf8').includes('cummon'),
    );

    expect(offenders).toEqual([]);
  });
});
