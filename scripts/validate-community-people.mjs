#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { reportAndExit } from './lib/validate-utils.mjs';

// Maximum age (days) before community-people.json is considered stale.
// The refresh-community-people workflow runs weekly; 30 days allows three
// missed cycles before the build fails — a forcing function to fix the
// refresh workflow when it breaks (cf. issue #122).
const MAX_AGE_DAYS = 30;

const data = JSON.parse(
  readFileSync(new URL('../data/community-people.json', import.meta.url)),
);
const errors = [];

// Freshness check
if (!data.fetchedAt || Number.isNaN(Date.parse(data.fetchedAt))) {
  errors.push({
    path: 'community-people.json',
    severity: 'error',
    message: 'fetchedAt must be an ISO 8601 date',
  });
} else {
  const ageDays = (Date.now() - Date.parse(data.fetchedAt)) / 86_400_000;
  if (ageDays > MAX_AGE_DAYS) {
    errors.push({
      path: 'community-people.json',
      severity: 'error',
      message: `data is ${Math.round(ageDays)} days old (limit: ${MAX_AGE_DAYS}). Re-run: npm run fetch:community-people`,
    });
  }
}

// Structure and required-field checks
if (!data.people || typeof data.people !== 'object' || Array.isArray(data.people)) {
  errors.push({
    path: 'community-people.json',
    severity: 'error',
    message: 'people must be an object with section arrays (tab, staff, …)',
  });
} else {
  for (const [section, entries] of Object.entries(data.people)) {
    if (!Array.isArray(entries)) {
      errors.push({ path: section, severity: 'error', message: 'section must be an array' });
      continue;
    }
    for (const person of entries) {
      const id = `people.${section}.${person.name ?? '(unnamed)'}`;
      if (!person.name) errors.push({ path: id, severity: 'error', message: 'missing name' });
      if (!person.image) errors.push({ path: id, severity: 'error', message: 'missing image' });
    }
  }
}

reportAndExit(errors, 'community-people');
const total = Object.values(data.people ?? {}).flat().length;
console.log(`Validated ${total} community profiles (fetched ${data.fetchedAt})`);
