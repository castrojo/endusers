import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-launch-metrics.mjs';

const validSignal = {
  id: 'github-stars',
  label: 'GitHub stars',
  source: 'https://github.com/castrojo/endusers',
  baseline: 0,
  target90Day: 50,
  targetWindow: '90 days post-launch',
};

function launchMetricsFixture(overrides = {}) {
  return {
    'data/launch-metrics.json': JSON.stringify({
      baselineSnapshotAt: '2026-08-08',
      signals: [
        validSignal,
        { ...validSignal, id: 'github-watchers', label: 'GitHub watchers' },
        { ...validSignal, id: 'github-forks', label: 'GitHub forks' },
      ],
      ...overrides,
    }),
  };
}

test('accepts a valid launch metrics file', () => {
  const result = runScriptWithFixtures(SCRIPT, launchMetricsFixture());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 3 launch success signals/);
});

test('rejects an invalid baselineSnapshotAt date', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    launchMetricsFixture({ baselineSnapshotAt: 'not-a-date' }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /valid date/);
});

test('rejects fewer than 3 signals', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    launchMetricsFixture({ signals: [validSignal] }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /between 3 and 5/);
});

test('rejects more than 5 signals', () => {
  const signals = Array.from({ length: 6 }, (_, i) => ({
    ...validSignal,
    id: `signal-${i}`,
  }));
  const result = runScriptWithFixtures(
    SCRIPT,
    launchMetricsFixture({ signals }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /between 3 and 5/);
});

test('rejects duplicate signal ids', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    launchMetricsFixture({
      signals: [
        validSignal,
        { ...validSignal },
        { ...validSignal, id: 'github-forks' },
      ],
    }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /duplicate or missing signal id/);
});

test('rejects a signal missing target90Day', () => {
  const { target90Day, ...withoutTarget } = validSignal;
  const result = runScriptWithFixtures(
    SCRIPT,
    launchMetricsFixture({
      signals: [
        withoutTarget,
        { ...validSignal, id: 'github-watchers' },
        { ...validSignal, id: 'github-forks' },
      ],
    }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing target90Day/);
});

test('warns when target90Day is lower than baseline', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    launchMetricsFixture({
      signals: [
        { ...validSignal, baseline: 10, target90Day: 5 },
        { ...validSignal, id: 'github-watchers' },
        { ...validSignal, id: 'github-forks' },
      ],
    }),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /lower than baseline/);
});
