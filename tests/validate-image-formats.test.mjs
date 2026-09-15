import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-image-formats.mjs';

// image-size (a transitive Docusaurus build dependency with no patched
// release) is vulnerable to DoS via crafted ICNS, JXL, and HEIF/HEIC files
// (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq). This validator blocks those
// formats by file signature regardless of extension.

const ICNS_HEADER = Buffer.from('icns', 'ascii');
const JXL_CODESTREAM_HEADER = Buffer.from([0xff, 0x0a]);
const JXL_CONTAINER_HEADER = Buffer.from([
  0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a,
]);

function heifFixture(brand) {
  return Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18]),
    Buffer.from('ftyp', 'ascii'),
    Buffer.from(brand, 'ascii'),
  ]);
}

test('validates zero assets when static/ is absent', () => {
  const result = runScriptWithFixtures(SCRIPT, {});
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 0 static asset/);
});

test('accepts an ordinary PNG', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/logo.png': png,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 1 static asset/);
});

test('rejects an ICNS file', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/icon.icns': ICNS_HEADER,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ICNS image detected/);
});

test('rejects a bare JXL codestream', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/photo.jxl': JXL_CODESTREAM_HEADER,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /JXL image detected/);
});

test('rejects a JXL ISOBMFF container', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/photo-container.jxl': JXL_CONTAINER_HEADER,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /JXL image detected/);
});

test('rejects a HEIC file', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/photo.heic': heifFixture('heic'),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HEIF\/HEIC image detected/);
});

test('rejects a HEIF file with an unrelated extension', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/disguised.png': heifFixture('mif1'),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HEIF\/HEIC image detected/);
});

test('walks nested static directories', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/a/one.png': png,
    'static/img/architectures/b/deep/two.png': png,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 2 static asset/);
});
