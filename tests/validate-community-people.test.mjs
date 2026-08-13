import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-community-people.mjs';

const validPerson = {
  name: 'Ada Lovelace',
  company: 'Analytical Engines Inc',
  role: 'TAB Chair',
  image: 'https://avatars.githubusercontent.com/u/1?v=4',
  github: 'ada',
};

function peopleFixture({
  fetchedAt = new Date().toISOString(),
  tab = [validPerson],
  staff = [validPerson],
} = {}) {
  return {
    'data/community-people.json': JSON.stringify({
      fetchedAt,
      people: { tab, staff },
    }),
  };
}

test('accepts fresh, well-formed community data', () => {
  const result = runScriptWithFixtures(SCRIPT, peopleFixture());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 2 community profiles/);
});

test('rejects a non-ISO fetchedAt', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    peopleFixture({ fetchedAt: 'not a date' }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ISO 8601/);
});

test('rejects stale data past the staleness threshold', () => {
  const staleDate = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const result = runScriptWithFixtures(
    SCRIPT,
    peopleFixture({ fetchedAt: staleDate }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /staleness threshold/);
});

test('accepts data just inside the staleness threshold', () => {
  const recentDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const result = runScriptWithFixtures(
    SCRIPT,
    peopleFixture({ fetchedAt: recentDate }),
  );
  assert.equal(result.status, 0, result.stderr);
});

test('rejects an empty tab section', () => {
  const result = runScriptWithFixtures(SCRIPT, peopleFixture({ tab: [] }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tab must be a non-empty array/);
});

test('rejects a person missing a name', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    peopleFixture({ tab: [{ ...validPerson, name: undefined }] }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing name/);
});

test('rejects a person with no public profile link', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    peopleFixture({
      tab: [
        {
          ...validPerson,
          github: undefined,
          linkedin: undefined,
          twitter: undefined,
          blog: undefined,
        },
      ],
    }),
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /public profile link/);
});
