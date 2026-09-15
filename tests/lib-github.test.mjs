import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import { githubFetch, makeGitHubHeaders } from '../scripts/lib/github.mjs';

test('makeGitHubHeaders returns the API accept header and default user agent', () => {
  const headers = makeGitHubHeaders();
  assert.equal(headers.Accept, 'application/vnd.github+json');
  assert.equal(headers['User-Agent'], 'cncf-endusers-site-build');
});

test('makeGitHubHeaders omits Authorization when no token is given', () => {
  for (const token of [undefined, '', null]) {
    const headers = makeGitHubHeaders(token);
    assert.ok(
      !('Authorization' in headers),
      `expected no Authorization header for token ${JSON.stringify(token)}`,
    );
  }
});

test('makeGitHubHeaders sends a bearer token when one is provided', () => {
  const headers = makeGitHubHeaders('ghp_example');
  assert.equal(headers.Authorization, 'Bearer ghp_example');
});

test('makeGitHubHeaders honours a caller-supplied user agent', () => {
  const headers = makeGitHubHeaders(undefined, 'collect-metrics');
  assert.equal(headers['User-Agent'], 'collect-metrics');
});

test('githubFetch returns parsed JSON and forwards auth headers', async () => {
  const calls = [];
  mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => ({ login: 'cncf' }) };
  });

  try {
    const body = await githubFetch(
      'https://api.github.com/orgs/cncf',
      'ghp_example',
      'collect-metrics',
    );
    assert.deepEqual(body, { login: 'cncf' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.github.com/orgs/cncf');
    assert.deepEqual(calls[0].init.headers, {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'collect-metrics',
      Authorization: 'Bearer ghp_example',
    });
  } finally {
    mock.restoreAll();
  }
});

test('githubFetch throws with the status and URL on a non-2xx response', async () => {
  mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    status: 404,
    json: async () => {
      throw new Error('json() must not be called on an error response');
    },
  }));

  try {
    await assert.rejects(
      () => githubFetch('https://api.github.com/orgs/missing'),
      /GitHub API 404: https:\/\/api\.github\.com\/orgs\/missing/,
    );
  } finally {
    mock.restoreAll();
  }
});

test('githubFetch surfaces rate-limit responses as errors', async () => {
  mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    status: 403,
    json: async () => ({}),
  }));

  try {
    await assert.rejects(
      () => githubFetch('https://api.github.com/rate_limit'),
      /GitHub API 403/,
    );
  } finally {
    mock.restoreAll();
  }
});
