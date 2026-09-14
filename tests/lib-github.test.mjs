import assert from 'node:assert/strict';
import test from 'node:test';
import { makeGitHubHeaders, githubFetch } from '../scripts/lib/github.mjs';

test('makeGitHubHeaders sets the GitHub JSON Accept header', () => {
  assert.equal(makeGitHubHeaders().Accept, 'application/vnd.github+json');
});

test('makeGitHubHeaders uses the shared default User-Agent', () => {
  assert.equal(makeGitHubHeaders()['User-Agent'], 'cncf-endusers-site-build');
});

test('makeGitHubHeaders honours a caller-supplied User-Agent', () => {
  assert.equal(
    makeGitHubHeaders(undefined, 'collect-metrics')['User-Agent'],
    'collect-metrics',
  );
});

test('makeGitHubHeaders omits Authorization when no token is given', () => {
  assert.equal('Authorization' in makeGitHubHeaders(), false);
  assert.equal('Authorization' in makeGitHubHeaders(''), false);
  assert.equal('Authorization' in makeGitHubHeaders(undefined), false);
});

test('makeGitHubHeaders emits a Bearer Authorization header for a token', () => {
  assert.equal(makeGitHubHeaders('t0ken').Authorization, 'Bearer t0ken');
});

test('githubFetch returns parsed JSON on a successful response', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ login: 'cncf' }) };
  });

  const body = await githubFetch('https://api.github.com/orgs/cncf');

  assert.deepEqual(body, { login: 'cncf' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.github.com/orgs/cncf');
  assert.equal(calls[0].options.headers.Accept, 'application/vnd.github+json');
});

test('githubFetch forwards the token and User-Agent as headers', async (t) => {
  let seenHeaders;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    seenHeaders = options.headers;
    return { ok: true, status: 200, json: async () => ({}) };
  });

  await githubFetch('https://api.github.com/rate_limit', 't0ken', 'ua-test');

  assert.equal(seenHeaders.Authorization, 'Bearer t0ken');
  assert.equal(seenHeaders['User-Agent'], 'ua-test');
});

test('githubFetch throws with the status and URL on a non-2xx response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    status: 404,
    json: async () => ({}),
  }));

  await assert.rejects(
    () => githubFetch('https://api.github.com/repos/cncf/missing'),
    /GitHub API 404: https:\/\/api\.github\.com\/repos\/cncf\/missing/,
  );
});

test('githubFetch surfaces rate-limit responses as errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    status: 403,
    json: async () => ({}),
  }));

  await assert.rejects(
    () => githubFetch('https://api.github.com/rate_limit'),
    /GitHub API 403/,
  );
});
