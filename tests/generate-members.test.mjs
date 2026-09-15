import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'generate-members.mjs';
const OUTPUT = 'data/members.json';

function catalogEntry(overrides = {}) {
  return {
    id: 'acme-platform',
    title: 'Acme Platform',
    organization: 'Acme Corp',
    sourceUrl: 'https://github.com/cncf/architecture/tree/main/acme',
    sourceCommit: 'abc123',
    industries: ['Retail'],
    projects: ['Kubernetes'],
    assets: [],
    ...overrides,
  };
}

function awardEntry(overrides = {}) {
  return {
    year: 2024,
    slug: 'acme',
    award: 'Top End User Award',
    awardLabel: 'Winner',
    organization: 'Acme',
    citation: 'For outstanding adoption of cloud native.',
    event: 'KubeCon NA 2024',
    announcementUrl: 'https://www.cncf.io/announcements/2024/example',
    ...overrides,
  };
}

// Runs generate-members.mjs against fixture catalog/awards data and returns
// the parsed data/members.json it produced.
function generate({ catalog = [], awards = [] }) {
  const result = runScriptWithFixtures(
    SCRIPT,
    {
      'data/architectures/catalog.json': JSON.stringify(catalog),
      'data/awards.json': JSON.stringify({ awards }),
    },
    { outputs: [OUTPUT] },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.outputs[OUTPUT], `${SCRIPT} did not write ${OUTPUT}`);
  return JSON.parse(result.outputs[OUTPUT]);
}

function bySlug(output, slug) {
  const member = output.members.find((m) => m.slug === slug);
  assert.ok(
    member,
    `expected a member with slug "${slug}", got ${output.members
      .map((m) => m.slug)
      .join(', ')}`,
  );
  return member;
}

test('derives a slug from the catalog organisation name', () => {
  const output = generate({ catalog: [catalogEntry()] });
  const member = bySlug(output, 'acme');
  assert.equal(member.id, 'acme');
  assert.equal(member.name, 'Acme Corp');
});

test('strips legal suffixes and parenthetical qualifiers from slugs', () => {
  const output = generate({
    catalog: [
      catalogEntry({ id: 'a', organization: 'Globex Inc.' }),
      catalogEntry({ id: 'b', organization: 'Initech GmbH' }),
      catalogEntry({ id: 'c', organization: 'Umbrella (Europe) AG' }),
    ],
  });
  const slugs = output.members.map((m) => m.slug);
  assert.deepEqual(slugs, ['globex', 'initech', 'umbrella']);
});

test('applies slug overrides for names that normalise incorrectly', () => {
  const output = generate({
    catalog: [
      catalogEntry({ id: 'a', organization: 'Flipkart Internet Pvt. Ltd.' }),
      catalogEntry({ id: 'b', organization: 'Swisscom (Switzerland) Ltd' }),
    ],
  });
  assert.deepEqual(
    output.members.map((m) => m.slug),
    ['flipkart', 'swisscom'],
  );
});

test('applies display-name overrides for verbose legal names', () => {
  const output = generate({
    catalog: [catalogEntry({ organization: 'Mercedes-Benz Tech Innovation' })],
  });
  assert.equal(output.members[0].name, 'Mercedes-Benz');
});

test('prefers the award organisation name over the catalog name', () => {
  const output = generate({
    catalog: [catalogEntry({ organization: 'Acme Corp' })],
    awards: [awardEntry({ organization: 'Acme' })],
  });
  const member = bySlug(output, 'acme');
  assert.equal(member.name, 'Acme');
});

test('merges catalog and award data onto a single member', () => {
  const output = generate({
    catalog: [catalogEntry()],
    awards: [awardEntry()],
  });
  assert.equal(output.members.length, 1);
  const member = bySlug(output, 'acme');
  assert.equal(member.architectures.length, 1);
  assert.equal(member.architectures[0].id, 'acme-platform');
  assert.equal(member.awards.length, 1);
  assert.equal(member.awards[0].year, 2024);
});

test('includes award-only organisations that have no architecture', () => {
  const output = generate({ awards: [awardEntry({ slug: 'initech' })] });
  const member = bySlug(output, 'initech');
  assert.deepEqual(member.architectures, []);
  assert.deepEqual(member.industries, []);
  assert.deepEqual(member.projects, []);
});

test('ignores award entries without a slug', () => {
  const output = generate({
    awards: [awardEntry({ slug: undefined }), awardEntry({ slug: 'acme' })],
  });
  assert.deepEqual(
    output.members.map((m) => m.slug),
    ['acme'],
  );
  assert.equal(bySlug(output, 'acme').awards.length, 1);
});

test('accumulates multiple awards for the same organisation', () => {
  const output = generate({
    awards: [awardEntry({ year: 2023 }), awardEntry({ year: 2024 })],
  });
  assert.deepEqual(
    bySlug(output, 'acme').awards.map((a) => a.year),
    [2023, 2024],
  );
});

test('normalises optional award URLs to null when absent', () => {
  const output = generate({
    awards: [awardEntry({ announcementUrl: undefined })],
  });
  const award = bySlug(output, 'acme').awards[0];
  assert.equal(award.announcementUrl, null);
  assert.equal(award.caseStudyUrl, null);
  assert.equal(award.talkUrl, null);
});

test('deduplicates and sorts industries and projects across submissions', () => {
  const output = generate({
    catalog: [
      catalogEntry({
        id: 'a',
        industries: ['Retail', 'Finance'],
        projects: ['Kubernetes', 'Envoy'],
      }),
      catalogEntry({
        id: 'b',
        industries: ['Finance'],
        projects: ['Envoy', 'Argo'],
      }),
    ],
  });
  const member = bySlug(output, 'acme');
  assert.deepEqual(member.industries, ['Finance', 'Retail']);
  assert.deepEqual(member.projects, ['Argo', 'Envoy', 'Kubernetes']);
});

test('tolerates catalog entries without industries or projects', () => {
  const output = generate({
    catalog: [
      catalogEntry({
        industries: undefined,
        projects: undefined,
        assets: undefined,
      }),
    ],
  });
  const member = bySlug(output, 'acme');
  assert.deepEqual(member.industries, []);
  assert.deepEqual(member.projects, []);
  assert.equal(member.logo, null);
});

test('emits members sorted by slug', () => {
  const output = generate({
    catalog: [
      catalogEntry({ id: 'z', organization: 'Zeta' }),
      catalogEntry({ id: 'a', organization: 'Alpha' }),
      catalogEntry({ id: 'm', organization: 'Mu' }),
    ],
  });
  const slugs = output.members.map((m) => m.slug);
  assert.deepEqual(slugs, [...slugs].sort());
});

test('collects source attribution from catalog and award URLs', () => {
  const output = generate({
    catalog: [catalogEntry()],
    awards: [
      awardEntry({
        announcementUrl: 'https://www.cncf.io/announcements/2024/example',
        caseStudyUrl: 'https://www.cncf.io/case-studies/acme',
        talkUrl: undefined,
      }),
    ],
  });
  assert.deepEqual(bySlug(output, 'acme').sourceAttribution, [
    'https://github.com/cncf/architecture/tree/main/acme',
    'https://www.cncf.io/announcements/2024/example',
    'https://www.cncf.io/case-studies/acme',
  ]);
});

test('reports the generated member count on stdout', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    {
      'data/architectures/catalog.json': JSON.stringify([
        catalogEntry({ id: 'a', organization: 'Alpha' }),
        catalogEntry({ id: 'b', organization: 'Beta' }),
      ]),
      'data/awards.json': JSON.stringify({ awards: [] }),
    },
    { outputs: [OUTPUT] },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated 2 member entries\./);
});

test('records the generating sources in the output envelope', () => {
  const output = generate({ catalog: [catalogEntry()] });
  assert.deepEqual(output.generatedFrom, [
    'data/architectures/catalog.json',
    'data/awards.json',
  ]);
  assert.ok(output.schema.id);
});

// pickLogo preference order: named "logo.*" > filename matching the slug >
// shortest SVG > any PNG > award logo > null.
test('prefers an asset literally named logo', () => {
  const output = generate({
    catalog: [
      catalogEntry({
        assets: ['/img/acme/architecture.svg', '/img/acme/logo.png'],
      }),
    ],
  });
  assert.equal(bySlug(output, 'acme').logo, '/img/acme/logo.png');
});

test('falls back to an asset whose filename matches the member slug', () => {
  const output = generate({
    catalog: [
      catalogEntry({
        assets: ['/img/acme/overview-diagram.svg', '/img/acme/acme.png'],
      }),
    ],
  });
  assert.equal(bySlug(output, 'acme').logo, '/img/acme/acme.png');
});

test('falls back to the shortest-named SVG when no logo or slug match exists', () => {
  const output = generate({
    catalog: [
      catalogEntry({
        assets: [
          '/img/acme/full-platform-architecture.svg',
          '/img/acme/mark.svg',
        ],
      }),
    ],
  });
  assert.equal(bySlug(output, 'acme').logo, '/img/acme/mark.svg');
});

test('falls back to a PNG when no SVG asset exists', () => {
  const output = generate({
    catalog: [catalogEntry({ assets: ['/img/acme/platform-diagram.png'] })],
  });
  assert.equal(bySlug(output, 'acme').logo, '/img/acme/platform-diagram.png');
});

test('falls back to the award logo when no catalog assets exist', () => {
  const output = generate({
    awards: [awardEntry({ logo: '/img/awards/acme.png' })],
  });
  assert.equal(bySlug(output, 'acme').logo, '/img/awards/acme.png');
});

test('produces a deterministic result for identical input', () => {
  const input = {
    catalog: [
      catalogEntry({ id: 'b', organization: 'Beta' }),
      catalogEntry({ id: 'a', organization: 'Alpha' }),
    ],
    awards: [awardEntry()],
  };
  assert.deepEqual(generate(input), generate(input));
});
