import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { collectError, reportAndExit } from '../scripts/lib/validate-utils.mjs';

const moduleUrl = new URL('../scripts/lib/validate-utils.mjs', import.meta.url)
  .href;

// reportAndExit calls process.exit(1) when any 'error' severity entry exists,
// so the exiting paths are exercised in a child process.
function runReportAndExit(errors, contextLabel) {
  const source = `
    import { reportAndExit } from ${JSON.stringify(moduleUrl)};
    reportAndExit(${JSON.stringify(errors)}, ${JSON.stringify(contextLabel)});
    console.log('did-not-exit');
  `;
  const result = spawnSync('node', ['--input-type=module', '-e', source], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

test('collectError appends a structured entry', () => {
  const errors = [];
  collectError(errors, 'data/awards.json', 'error', 'missing slug');
  assert.deepEqual(errors, [
    { path: 'data/awards.json', severity: 'error', message: 'missing slug' },
  ]);
});

test('collectError preserves insertion order across calls', () => {
  const errors = [];
  collectError(errors, 'a.json', 'warn', 'first');
  collectError(errors, 'b.json', 'error', 'second');
  assert.deepEqual(
    errors.map((e) => e.message),
    ['first', 'second'],
  );
});

test('reportAndExit succeeds silently when there are no entries', () => {
  const { status, stdout, stderr } = runReportAndExit([], 'awards');
  assert.equal(status, 0);
  assert.match(stdout, /did-not-exit/);
  assert.equal(stderr.trim(), '');
});

test('reportAndExit reports warnings without failing', () => {
  const { status, stdout, stderr } = runReportAndExit(
    [{ path: 'data/awards.json', severity: 'warn', message: 'stale citation' }],
    'awards',
  );
  assert.equal(status, 0);
  assert.match(stdout, /did-not-exit/);
  assert.match(stderr, /1 warning\(s\) in awards/);
  assert.match(stderr, /\[warn\] data\/awards\.json: stale citation/);
});

test('reportAndExit exits non-zero and prints each error', () => {
  const { status, stdout, stderr } = runReportAndExit(
    [
      { path: 'data/awards.json', severity: 'error', message: 'missing slug' },
      { path: 'data/members.json', severity: 'error', message: 'bad logo' },
    ],
    'awards',
  );
  assert.equal(status, 1);
  assert.doesNotMatch(stdout, /did-not-exit/);
  assert.match(stderr, /2 error\(s\) in awards/);
  assert.match(stderr, /\[error\] data\/awards\.json: missing slug/);
  assert.match(stderr, /\[error\] data\/members\.json: bad logo/);
});

test('reportAndExit reports warnings and errors together before exiting', () => {
  const { status, stderr } = runReportAndExit(
    [
      { path: 'a.json', severity: 'warn', message: 'soft problem' },
      { path: 'b.json', severity: 'error', message: 'hard problem' },
    ],
    'architecture assets',
  );
  assert.equal(status, 1);
  assert.match(stderr, /1 warning\(s\) in architecture assets/);
  assert.match(stderr, /\[warn\] a\.json: soft problem/);
  assert.match(stderr, /1 error\(s\) in architecture assets/);
  assert.match(stderr, /\[error\] b\.json: hard problem/);
});

test('reportAndExit treats unknown severities as non-fatal', () => {
  const { status, stdout } = runReportAndExit(
    [{ path: 'a.json', severity: 'info', message: 'fyi' }],
    'awards',
  );
  assert.equal(status, 0);
  assert.match(stdout, /did-not-exit/);
});
