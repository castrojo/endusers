#!/usr/bin/env node
/**
 * Rejects image formats the site does not use and that are affected by
 * unpatched image-size advisories (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq):
 * ICNS, JXL, and HEIF/HEIC. image-size runs at build time (via the
 * Docusaurus mdx-loader image plugins) against every image committed to the
 * repo, and no patched image-size release exists yet, so this check blocks
 * the vulnerable formats from landing regardless of file extension.
 *
 * Detection is by file signature (magic bytes), not extension, so a
 * mislabeled or extensionless file cannot slip past the check.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { collectError, reportAndExit } from './lib/validate-utils.mjs';

const root = new URL('..', import.meta.url).pathname;
const scanDir = join(root, 'static');

const issues = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

function exists(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// Detects the disallowed formats by their file signature. Returns a format
// label if the buffer matches, or null if it does not.
function detectDisallowedFormat(buffer) {
  // ICNS: 4-byte magic "icns" at the start of the file.
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'icns') {
    return 'ICNS';
  }

  // JXL bare codestream: 0xFF 0x0A.
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0x0a) {
    return 'JXL';
  }

  // JXL ISOBMFF container box signature:
  // 00 00 00 0C 4A 58 4C 20 0D 0A 87 0A
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x00 &&
    buffer[3] === 0x0c &&
    buffer.toString('ascii', 4, 8) === 'JXL ' &&
    buffer[8] === 0x0d &&
    buffer[9] === 0x0a &&
    buffer[10] === 0x87 &&
    buffer[11] === 0x0a
  ) {
    return 'JXL';
  }

  // HEIF/HEIC: ISOBMFF "ftyp" box (bytes 4-7) with a HEIF-family brand
  // (bytes 8-11), e.g. heic, heix, heim, heis, hevc, hevm, hevs, mif1, msf1.
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    const heifBrands = new Set([
      'heic',
      'heix',
      'heim',
      'heis',
      'hevc',
      'hevm',
      'hevs',
      'mif1',
      'msf1',
    ]);
    if (heifBrands.has(brand)) {
      return 'HEIF/HEIC';
    }
  }

  return null;
}

const files = exists(scanDir) ? walk(scanDir) : [];
let scanned = 0;

for (const path of files) {
  const rel = relative(root, path);
  let buffer;
  try {
    buffer = readFileSync(path);
  } catch {
    continue;
  }
  scanned += 1;

  const format = detectDisallowedFormat(buffer);
  if (format) {
    collectError(
      issues,
      rel,
      'error',
      `${format} image detected; this format is blocked (see GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq, no patched image-size release)`,
    );
  }
}

reportAndExit(issues, 'image formats');

console.log(
  `Validated ${scanned} static asset(s) for disallowed image formats.`,
);
