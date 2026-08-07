import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-architectures.mjs';

const validRecord = {
  id: 'acme',
  title: 'Acme Reference Architecture',
  organization: 'Acme Corp',
  summary: 'An example architecture.',
  industries: ['Technology'],
  tags: ['example'],
  projects: ['Kubernetes'],
  sourceUrl:
    'https://github.com/cncf/architecture/tree/main/content/en/architectures/acme',
  sourceCommit: 'abc123',
  assets: ['/img/architectures/acme/diagram.svg'],
};

function catalogFixture(records, extraFiles = {}) {
  return {
    'data/architectures/catalog.json': JSON.stringify(records),
    ...extraFiles,
  };
}

const acmeAsset = {
  'static/img/architectures/acme/diagram.svg':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>',
};

test('accepts a valid catalog with on-disk assets', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    catalogFixture([validRecord], acmeAsset),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 1 architecture records/);
});

test('fails when the catalog file is missing', () => {
  const result = runScriptWithFixtures(SCRIPT, {});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing data\/architectures\/catalog\.json/);
});

test('rejects records missing id, title, or organization', () => {
  const incomplete = { ...validRecord, title: undefined };
  const result = runScriptWithFixtures(
    SCRIPT,
    catalogFixture([incomplete], acmeAsset),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /acme: missing id, title, or organization/);
});

test('rejects duplicate record ids', () => {
  const dupe = { ...validRecord, assets: [] };
  const result = runScriptWithFixtures(
    SCRIPT,
    catalogFixture(
      [
        { ...validRecord, assets: [] },
        { ...dupe, title: 'Different Title' },
      ],
      {},
    ),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /acme: duplicate id/);
});

test('rejects assets that do not exist on disk', () => {
  const result = runScriptWithFixtures(SCRIPT, catalogFixture([validRecord]));
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /acme: missing asset \/img\/architectures\/acme\/diagram\.svg/,
  );
});

test('accepts records without an assets key', () => {
  const { assets, ...noAssets } = validRecord;
  const result = runScriptWithFixtures(SCRIPT, catalogFixture([noAssets]));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 1 architecture records/);
});
