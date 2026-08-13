#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { reportAndExit } from './lib/validate-utils.mjs';

const data = JSON.parse(
  readFileSync(new URL('../data/launch-metrics.json', import.meta.url)),
);
const errors = [];

if (Number.isNaN(Date.parse(data.baselineSnapshotAt))) {
  errors.push({
    path: 'launch-metrics.json',
    severity: 'error',
    message: 'baselineSnapshotAt must be a valid date',
  });
}
if (
  !Array.isArray(data.signals) ||
  data.signals.length < 3 ||
  data.signals.length > 5
) {
  errors.push({
    path: 'launch-metrics.json',
    severity: 'error',
    message: 'signals must contain between 3 and 5 entries',
  });
}

const ids = new Set();
for (const signal of data.signals || []) {
  if (!signal.id || ids.has(signal.id)) {
    errors.push({
      path: signal.id || '(missing id)',
      severity: 'error',
      message: 'duplicate or missing signal id',
    });
  }
  ids.add(signal.id);
  if (!signal.label)
    errors.push({
      path: signal.id,
      severity: 'error',
      message: 'missing label',
    });
  if (!signal.source)
    errors.push({
      path: signal.id,
      severity: 'error',
      message: 'missing source',
    });
  if (signal.baseline === undefined || signal.baseline === null) {
    errors.push({
      path: signal.id,
      severity: 'error',
      message: 'missing baseline value',
    });
  }
  if (signal.target90Day === undefined || signal.target90Day === null) {
    errors.push({
      path: signal.id,
      severity: 'error',
      message: 'missing target90Day value',
    });
  }
  if (
    typeof signal.baseline === 'number' &&
    typeof signal.target90Day === 'number' &&
    signal.target90Day < signal.baseline
  ) {
    errors.push({
      path: signal.id,
      severity: 'warn',
      message: 'target90Day is lower than baseline',
    });
  }
}

reportAndExit(errors, 'launch metrics');
console.log(`Validated ${data.signals.length} launch success signals`);
