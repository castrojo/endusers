#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const data = JSON.parse(readFileSync(new URL('../data/awards.json', import.meta.url)));
const errors = [];
if (!Array.isArray(data.awards) || !data.awards.length) errors.push('awards must be a non-empty array');
let lastYear = Infinity;
for (const entry of data.awards || []) {
  const id = `${entry.year}/${entry.slug}`;
  if (!Number.isInteger(entry.year) || entry.year < 2015) errors.push(`invalid year: ${id}`);
  if (entry.year > lastYear) errors.push(`awards must be sorted newest first: ${id}`);
  lastYear = Math.max(entry.year, 2015);
  for (const field of ['award', 'awardLabel', 'organization', 'slug', 'citation', 'event']) {
    if (!entry[field]) errors.push(`missing ${field}: ${id}`);
  }
  if (!entry.announcementUrl && !entry.talkUrl) errors.push(`entry needs an announcementUrl or talkUrl: ${id}`);
  for (const field of ['announcementUrl', 'caseStudyUrl', 'talkUrl']) {
    if (entry[field] && !/^https:\/\//.test(entry[field])) errors.push(`${field} must be https: ${id}`);
  }
  if (entry.logo) {
    if (!entry.logo.startsWith('/img/awards/')) errors.push(`logo must live under /img/awards/: ${id}`);
    const file = fileURLToPath(new URL(`../static${entry.logo}`, import.meta.url));
    if (!existsSync(file)) errors.push(`logo file missing: ${entry.logo}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated ${data.awards.length} award entries`);
