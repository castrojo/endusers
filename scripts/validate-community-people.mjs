#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { reportAndExit } from './lib/validate-utils.mjs';

// Weekly refresh (refresh-community-people.yml runs every Monday). Allow a
// few missed cycles before failing the build loudly, but do not let stale
// TAB/staff data sit unnoticed indefinitely.
const MAX_AGE_DAYS = 45;

const data = JSON.parse(
  readFileSync(new URL('../data/community-people.json', import.meta.url)),
);
const errors = [];

if (Number.isNaN(Date.parse(data.fetchedAt))) {
  errors.push({
    path: 'community-people.json',
    severity: 'error',
    message: 'fetchedAt must be ISO 8601',
  });
} else {
  const ageMs = Date.now() - Date.parse(data.fetchedAt);
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  if (ageDays > MAX_AGE_DAYS) {
    errors.push({
      path: 'community-people.json',
      severity: 'error',
      message: `fetchedAt is ${Math.floor(ageDays)} days old, exceeding the ${MAX_AGE_DAYS}-day staleness threshold. Run 'npm run fetch:community-people' or check refresh-community-people.yml.`,
    });
  }
}

const sections = ['tab', 'staff'];
for (const section of sections) {
  const entries = data.people?.[section];
  if (!Array.isArray(entries) || !entries.length) {
    errors.push({
      path: `people.${section}`,
      severity: 'error',
      message: `${section} must be a non-empty array`,
    });
    continue;
  }
  entries.forEach((person, index) => {
    const id = `people.${section}[${index}]`;
    if (!person.name)
      errors.push({ path: id, severity: 'error', message: 'missing name' });
    if (!person.image)
      errors.push({ path: id, severity: 'error', message: 'missing image' });
    if (!person.github && !person.linkedin && !person.twitter && !person.blog) {
      errors.push({
        path: id,
        severity: 'error',
        message: 'person needs at least one public profile link',
      });
    }
  });
}

reportAndExit(errors, 'community people');
console.log(
  `Validated ${(data.people?.tab?.length || 0) + (data.people?.staff?.length || 0)} community profiles`,
);
