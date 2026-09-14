import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'generate-members.mjs';
const OUTPUT = 'data/members.json';

const catalogEntry = {
  id: 'acme-platform',
  title: 'Acme Platform',
  organization: 'Acme Corp',
  sourceUrl: 'https://github.com/acme/arch',
  sourceCommit: 'abc123',
  industries: ['Retail'],
  projects: ['Kubernetes'],
  assets: [],
};

const awardEntry = {
  year: 2024,
  slug: 'acme',
  award: 'top-end-user',
  awardLabel: 'Top End User Award',
  organization: 'Acme',
  logo: '/img/awards/acme.svg',
  citation: 'For outstanding adoption of cloud native.',
  event: 'KubeCon NA 2024',
  announcementUrl: 'https://www.cncf.io/announcements/2024/example',
  caseStudyUrl: null,
  talkUrl: null,
};

/** Runs generate-members.mjs against in-memory catalog/awards fixtures. */
function generate(catalog = [], awards = []) {
  const result = runScriptWithFixtures(
    SCRIPT,
    {
      'data/architectures/catalog.json': JSON.stringify(catalog),
      'data/awards.json': JSON.stringify({ awards }),
    },
    [OUTPUT],
  );
  assert.equal(
    result.status,
    0,
    `script failed: ${result.stderr || result.stdout}`,
  );
  return JSON.parse(result.outputs[OUTPUT]);
}

test('emits the documented envelope and no members for empty inputs', () => {
  const output = generate([], []);
  assert.deepEqual(output.generatedFrom, [
    'data/architectures/catalog.json',
    'data/awards.json',
  ]);
  assert.equal(typeof output.description, 'string');
  assert.equal(typeof output.schema, 'object');
  assert.deepEqual(output.members, []);
});

test('derives a slug from the catalog organisation name', () => {
  const output = generate([catalogEntry], []);
  assert.equal(output.members.length, 1);
  assert.equal(output.members[0].id, 'acme');
  assert.equal(output.members[0].slug, 'acme');
  assert.equal(output.members[0].name, 'Acme Corp');
});

test('slug derivation strips legal suffixes and parenthetical qualifiers', () => {
  const output = generate(
    [
      { ...catalogEntry, id: 'a', organization: 'Globex Inc.' },
      { ...catalogEntry, id: 'b', organization: 'Initech GmbH' },
      { ...catalogEntry, id: 'c', organization: 'Umbrella (Japan) Corp' },
      { ...catalogEntry, id: 'd', organization: 'Hooli Group' },
    ],
    [],
  );
  const slugs = output.members.map((m) => m.slug);
  assert.deepEqual(slugs.sort(), ['globex', 'hooli', 'initech', 'umbrella']);
});

// Documents current behaviour, not desired behaviour: the suffix pattern ends
// in `\b`, which cannot match after the trailing period of a dotted suffix, so
// "B.V." and "S.A." survive normalisation as "bv"/"sa". Add a SLUG_OVERRIDES
// entry for such organisations until the pattern is fixed.
test('dotted legal suffixes such as B.V. and S.A. are not stripped', () => {
  const output = generate(
    [
      { ...catalogEntry, id: 'a', organization: 'Soylent B.V.' },
      { ...catalogEntry, id: 'b', organization: 'Cyberdyne S.A.' },
    ],
    [],
  );
  assert.deepEqual(output.members.map((m) => m.slug).sort(), [
    'cyberdyne-sa',
    'soylent-bv',
  ]);
});

test('slug derivation drops punctuation and collapses whitespace', () => {
  const output = generate(
    [{ ...catalogEntry, organization: "O'Neill  Cloud & Data" }],
    [],
  );
  assert.equal(output.members[0].slug, 'oneill-cloud-data');
});

test('honours SLUG_OVERRIDES for names normalisation would mangle', () => {
  const output = generate(
    [
      {
        ...catalogEntry,
        id: 'flipkart-arch',
        organization: 'Flipkart Internet Pvt. Ltd.',
      },
      {
        ...catalogEntry,
        id: 'swisscom-arch',
        organization: 'Swisscom (Switzerland) Ltd',
      },
    ],
    [],
  );
  assert.deepEqual(output.members.map((m) => m.slug).sort(), [
    'flipkart',
    'swisscom',
  ]);
});

test('applies DISPLAY_NAME_OVERRIDES to the member display name', () => {
  const output = generate(
    [
      {
        ...catalogEntry,
        organization: 'Mercedes-Benz Tech Innovation',
      },
    ],
    [],
  );
  assert.equal(output.members[0].name, 'Mercedes-Benz');
});

test('prefers the award organisation name over the catalog name', () => {
  const output = generate([catalogEntry], [awardEntry]);
  assert.equal(output.members.length, 1);
  assert.equal(output.members[0].name, 'Acme');
});

test('merges catalog and award records that share a slug', () => {
  const output = generate([catalogEntry], [awardEntry]);
  const member = output.members[0];
  assert.equal(member.architectures.length, 1);
  assert.deepEqual(member.architectures[0], {
    id: 'acme-platform',
    title: 'Acme Platform',
    sourceUrl: 'https://github.com/acme/arch',
    sourceCommit: 'abc123',
  });
  assert.equal(member.awards.length, 1);
  assert.equal(member.awards[0].year, 2024);
  assert.equal(member.awards[0].awardLabel, 'Top End User Award');
});

test('keeps award-only organisations as members', () => {
  const output = generate([], [awardEntry]);
  assert.equal(output.members.length, 1);
  assert.deepEqual(output.members[0].architectures, []);
  assert.equal(output.members[0].awards.length, 1);
});

test('ignores award entries without a slug', () => {
  const output = generate([], [{ ...awardEntry, slug: undefined }]);
  assert.deepEqual(output.members, []);
});

test('aggregates several awards for one organisation', () => {
  const output = generate(
    [],
    [awardEntry, { ...awardEntry, year: 2025, event: 'KubeCon EU 2025' }],
  );
  assert.deepEqual(
    output.members[0].awards.map((a) => a.year),
    [2024, 2025],
  );
});

test('deduplicates and sorts industries and projects across submissions', () => {
  const output = generate(
    [
      {
        ...catalogEntry,
        id: 'one',
        industries: ['Retail', 'Finance'],
        projects: ['Kubernetes', 'Argo'],
      },
      {
        ...catalogEntry,
        id: 'two',
        industries: ['Retail'],
        projects: ['Argo', 'Envoy'],
      },
    ],
    [],
  );
  const member = output.members[0];
  assert.deepEqual(member.industries, ['Finance', 'Retail']);
  assert.deepEqual(member.projects, ['Argo', 'Envoy', 'Kubernetes']);
  assert.equal(member.architectures.length, 2);
});

test('tolerates catalog entries missing industries and projects', () => {
  const output = generate(
    [{ ...catalogEntry, industries: undefined, projects: undefined }],
    [],
  );
  assert.deepEqual(output.members[0].industries, []);
  assert.deepEqual(output.members[0].projects, []);
});

test('emits members sorted by slug', () => {
  const output = generate(
    [
      { ...catalogEntry, id: 'z', organization: 'Zebra' },
      { ...catalogEntry, id: 'a', organization: 'Apex' },
      { ...catalogEntry, id: 'm', organization: 'Midway' },
    ],
    [],
  );
  assert.deepEqual(
    output.members.map((m) => m.slug),
    ['apex', 'midway', 'zebra'],
  );
});

test('collects source attribution from catalog and award URLs', () => {
  const output = generate(
    [catalogEntry],
    [{ ...awardEntry, caseStudyUrl: 'https://www.cncf.io/case-studies/acme/' }],
  );
  assert.deepEqual(output.members[0].sourceAttribution, [
    'https://github.com/acme/arch',
    'https://www.cncf.io/announcements/2024/example',
    'https://www.cncf.io/case-studies/acme/',
  ]);
});

test('omits null announcement and case-study URLs from source attribution', () => {
  const output = generate(
    [],
    [{ ...awardEntry, announcementUrl: null, caseStudyUrl: null }],
  );
  assert.deepEqual(output.members[0].sourceAttribution, []);
});

test('logo preference 1: an asset basename of "logo" wins', () => {
  const output = generate(
    [
      {
        ...catalogEntry,
        assets: ['/img/arch/acme/acme.svg', '/img/arch/acme/logo.png'],
      },
    ],
    [],
  );
  assert.equal(output.members[0].logo, '/img/arch/acme/logo.png');
});

test('logo preference 2: an asset whose basename equals the slug wins', () => {
  const output = generate(
    [
      {
        ...catalogEntry,
        assets: ['/img/arch/acme/aa.svg', '/img/arch/acme/acme.png'],
      },
    ],
    [],
  );
  assert.equal(output.members[0].logo, '/img/arch/acme/acme.png');
});

test('logo preference 3: the shortest-named SVG wins', () => {
  const output = generate(
    [
      {
        ...catalogEntry,
        assets: [
          '/img/arch/acme/detailed-platform-diagram.svg',
          '/img/arch/acme/mark.svg',
        ],
      },
    ],
    [],
  );
  assert.equal(output.members[0].logo, '/img/arch/acme/mark.svg');
});

test('logo preference 4: a PNG is used when no SVG is available', () => {
  const output = generate(
    [{ ...catalogEntry, assets: ['/img/arch/acme/diagram.png'] }],
    [],
  );
  assert.equal(output.members[0].logo, '/img/arch/acme/diagram.png');
});

test('logo preference 5: falls back to the award logo when no assets exist', () => {
  const output = generate([catalogEntry], [awardEntry]);
  assert.equal(output.members[0].logo, '/img/awards/acme.svg');
});

test('logo is null when neither assets nor an award logo exist', () => {
  const output = generate([catalogEntry], []);
  assert.equal(output.members[0].logo, null);
});

test('considers assets from every submission by the same organisation', () => {
  const output = generate(
    [
      { ...catalogEntry, id: 'one', assets: ['/img/arch/acme/diagram.png'] },
      { ...catalogEntry, id: 'two', assets: ['/img/arch/acme/logo.svg'] },
    ],
    [],
  );
  assert.equal(output.members[0].logo, '/img/arch/acme/logo.svg');
});

test('writes members.json with a trailing newline and reports the count', () => {
  const result = runScriptWithFixtures(
    SCRIPT,
    {
      'data/architectures/catalog.json': JSON.stringify([catalogEntry]),
      'data/awards.json': JSON.stringify({ awards: [awardEntry] }),
    },
    [OUTPUT],
  );
  assert.equal(result.status, 0);
  assert.ok(result.outputs[OUTPUT].endsWith('\n'));
  assert.match(result.stdout, /Generated 1 member entries\./);
});

test('fails loudly when a required input file is missing', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'data/awards.json': JSON.stringify({ awards: [] }),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /catalog\.json/);
});

test('generate-members.mjs succeeds against current repo data', () => {
  const repoRoot = new URL('..', import.meta.url).pathname;
  // Feed the real data in as fixtures so the run stays in a temp directory and
  // never overwrites the repository's committed data/members.json.
  const result = runScriptWithFixtures(
    SCRIPT,
    {
      'data/architectures/catalog.json': readFileSync(
        join(repoRoot, 'data/architectures/catalog.json'),
        'utf8',
      ),
      'data/awards.json': readFileSync(
        join(repoRoot, 'data/awards.json'),
        'utf8',
      ),
    },
    [OUTPUT],
  );
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.outputs[OUTPUT]);
  assert.ok(output.members.length > 0);
  for (const member of output.members) {
    assert.equal(member.id, member.slug);
    assert.ok(member.name.length > 0);
    assert.ok(Array.isArray(member.architectures));
    assert.ok(Array.isArray(member.awards));
  }
});
