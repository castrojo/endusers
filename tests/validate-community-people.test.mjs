import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-community-people.mjs';

const validPerson = {
  name: 'Alice Example',
  company: 'ACME Corp',
  role: 'TAB Chair',
  bio: '',
  location: '',
  image: 'https://github.com/alice.png',
  github: 'alice',
  linkedin: null,
  twitter: null,
  blog: '',
  publicRepos: 5,
  followers: 10,
  profileUpdatedAt: null,
};

function fixture(overrides = {}) {
  const base = {
    fetchedAt: new Date().toISOString(),
    people: { tab: [validPerson], staff: [] },
    ...overrides,
  };
  return { 'data/community-people.json': JSON.stringify(base) };
}

test('accepts valid community-people data', () => {
  const result = runScriptWithFixtures(SCRIPT, fixture());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated/);
});

test('rejects missing fetchedAt', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    { 'data/community-people.json': JSON.stringify({ people: { tab: [validPerson], staff: [] } }) },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fetchedAt/);
});

test('rejects invalid fetchedAt', () => {
  const result = runScriptWithFixtures(SCRIPT, fixture({ fetchedAt: 'not-a-date' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fetchedAt/);
});

test('rejects stale data older than 30 days', () => {
  const staleDate = new Date(Date.now() - 35 * 86_400_000).toISOString();
  const result = runScriptWithFixtures(SCRIPT, fixture({ fetchedAt: staleDate }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /days old/);
});

test('accepts data that is just under 30 days old', () => {
  const freshEnough = new Date(Date.now() - 29 * 86_400_000).toISOString();
  const result = runScriptWithFixtures(SCRIPT, fixture({ fetchedAt: freshEnough }));
  assert.equal(result.status, 0, result.stderr);
});

test('rejects person missing name', () => {
  const { name, ...noName } = validPerson;
  const result = runScriptWithFixtures(
    SCRIPT,
    fixture({ people: { tab: [noName], staff: [] } }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing name/);
});

test('rejects person missing image', () => {
  const { image, ...noImage } = validPerson;
  const result = runScriptWithFixtures(
    SCRIPT,
    fixture({ people: { tab: [noImage], staff: [] } }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing image/);
});

test('rejects people that is not a keyed object', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    { 'data/community-people.json': JSON.stringify({ fetchedAt: new Date().toISOString(), people: [] }) },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /people must be an object/);
});
