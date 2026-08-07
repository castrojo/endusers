import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname;

// Runs a script from scripts/ against fixture data by mirroring the repo
// layout in a temp directory. The scripts resolve inputs relative to their
// own import.meta.url (../data, ../src/css, ../static), so a copy placed in
// <tmp>/scripts/ reads fixtures from <tmp>/ instead of the real repo.
// options.args passes CLI flags (e.g. ['--fix']); options.readBack lists
// fixture-relative paths to read after the run (for asserting mutations).
// options.env merges extra environment variables into the child process
// (e.g. a PATH prefixed with stub executables for scripts that shell out).
// Returns { status, stdout, stderr, files }.
export function runScriptWithFixtures(scriptName, fixtures = {}, options = {}) {
  const { args = [], readBack = [], env } = options;
  const work = mkdtempSync(join(tmpdir(), 'endusers-test-'));
  try {
    mkdirSync(join(work, 'scripts'), { recursive: true });
    cpSync(
      join(repoRoot, 'scripts', scriptName),
      join(work, 'scripts', scriptName),
    );
    for (const [relativePath, content] of Object.entries(fixtures)) {
      const target = join(work, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    const files = {};
    const run = spawnSync(
      'node',
      [join(work, 'scripts', scriptName), ...args],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: env ? { ...process.env, ...env } : process.env,
      },
    );
    const result = {
      status: run.status ?? 1,
      stdout: run.stdout ?? '',
      stderr: run.stderr ?? '',
    };
    for (const relativePath of readBack) {
      try {
        files[relativePath] = readFileSync(join(work, relativePath), 'utf8');
      } catch {
        files[relativePath] = null;
      }
    }
    return { ...result, files };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
