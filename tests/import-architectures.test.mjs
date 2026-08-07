import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before } from 'node:test';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'import-architectures.mjs';
const COMMIT = 'deadbeefcafe';

// The script shells out to git (clone/rev-parse), curl (artwork mirroring),
// and rsvg-convert (raster SVG conversion). Stub executables on a prefixed
// PATH make those deterministic and offline. Stub behavior switches:
//   RSVG_STUB_MODE=fail  -> rsvg-convert exits 1 (warning path)
//   CURL_STUB_MODE=fail  -> curl exits 1 (artwork warning path)
let binDir;
let upstreamDir;
let baseEnv;

function writeStub(name, body) {
  const path = join(binDir, name);
  writeFileSync(path, body);
  execFileSync('chmod', ['755', path]);
}

before(() => {
  binDir = mkdtempSync(join(tmpdir(), 'endusers-stub-bin-'));
  upstreamDir = mkdtempSync(join(tmpdir(), 'endusers-upstream-'));
  writeStub(
    'git',
    `#!/bin/bash
if [ "$1" = "clone" ]; then
  dest="\${@: -1}"
  cp -r "$FIXTURE_UPSTREAM_DIR/." "$dest"
  exit 0
fi
if [ "$1" = "-C" ] && [ "$3" = "rev-parse" ]; then
  echo "${COMMIT}"
  exit 0
fi
if [ "$1" = "-C" ] && [ "$3" = "fetch" ]; then
  exit 0
fi
echo "git stub: unexpected args: $*" >&2
exit 1
`,
  );
  writeStub(
    'curl',
    `#!/bin/bash
if [ "$CURL_STUB_MODE" = "fail" ]; then
  exit 1
fi
printf 'STUB-LOGO-BYTES'
`,
  );
  writeStub(
    'rsvg-convert',
    `#!/bin/bash
if [ "$RSVG_STUB_MODE" = "fail" ]; then
  exit 1
fi
printf 'STUB-PNG' > "\${@: -1}"
`,
  );
  baseEnv = {
    PATH: `${binDir}:${dirname(process.execPath)}:/usr/bin:/bin`,
    FIXTURE_UPSTREAM_DIR: upstreamDir,
  };
});

after(() => {
  rmSync(binDir, { recursive: true, force: true });
  rmSync(upstreamDir, { recursive: true, force: true });
});

// Lays out a fixture upstream clone at content/en/architectures/<id>/.
function seedUpstream(architectures) {
  rmSync(upstreamDir, { recursive: true, force: true });
  for (const [id, files] of Object.entries(architectures)) {
    for (const [name, content] of Object.entries(files)) {
      const target = join(upstreamDir, 'content/en/architectures', id, name);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  }
}

function runImport(architectures, { env = {}, readBack = [] } = {}) {
  seedUpstream(architectures);
  // The script mkdirs records/ and assets/ but expects docs/architectures/
  // to exist in the repo, so the mirror seeds it with a placeholder.
  return runScriptWithFixtures(
    SCRIPT,
    { 'docs/architectures/.gitkeep': '' },
    { env: { ...baseEnv, ...env }, readBack },
  );
}

const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';

test('imports a single architecture into catalog, record, docs, and assets', () => {
  const result = runImport({
    acme: {
      'index.md': `---
title: Acme Reference Architecture
org_name: Acme Corp
industries:
- Technology
- Finance
tags:
- edge
---

Acme runs cloud native in production.

{{< card header="Kubernetes" >}}
[![logo](https://raw.githubusercontent.com/cncf/artwork/main/projects/kubernetes/icon/color/kubernetes.svg)](https://www.cncf.io/projects/kubernetes/)
**Using since:** 2019
**Current version:** 1.30
Orchestrates all the things.
{{< /card >}}
`,
      'images/diagram.svg': simpleSvg,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Imported 1 architectures from deadbeefcafe/);
});

test('record fields come from frontmatter, cards, and the stub commit', () => {
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: Acme Reference Architecture
org_name: Acme Corp
industries:
- Technology
tags:
- edge
---

A summary paragraph.

{{< card header="Kubernetes" >}}
[site](https://www.cncf.io/projects/kubernetes/)
{{< /card >}}

{{< card header="Prometheus" >}}
[site](https://prometheus.io/)
{{< /card >}}
`,
        'images/diagram.svg': simpleSvg,
      },
    },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.equal(record.id, 'acme');
  assert.equal(record.title, 'Acme Reference Architecture');
  assert.equal(record.organization, 'Acme Corp');
  assert.deepEqual(record.industries, ['Technology']);
  assert.deepEqual(record.tags, ['edge']);
  assert.deepEqual(record.projects, ['Kubernetes', 'Prometheus']);
  assert.equal(record.sourceCommit, COMMIT);
  assert.equal(
    record.sourceUrl,
    `https://github.com/cncf/architecture/tree/${COMMIT}/content/en/architectures/acme`,
  );
  assert.deepEqual(record.assets, ['/img/architectures/acme/diagram.svg']);
  assert.equal(record.summary, 'A summary paragraph.');
});

test('catalog is sorted by organization, not directory order', () => {
  const result = runImport(
    {
      zeta: {
        'index.md': '---\ntitle: Zeta\norg_name: Zeta Corp\n---\n\nBody.\n',
      },
      acme: {
        'index.md': '---\ntitle: Acme\norg_name: Acme Corp\n---\n\nBody.\n',
      },
    },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.deepEqual(
    catalog.map((record) => record.id),
    ['acme', 'zeta'],
  );
});

test('missing frontmatter falls back to id for title and organization', () => {
  const result = runImport(
    { acme: { 'index.md': 'Just a body paragraph.\n' } },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.equal(record.title, 'acme');
  assert.equal(record.organization, 'acme');
  assert.deepEqual(record.industries, []);
  assert.deepEqual(record.tags, []);
});

test('organization derives from title when org_name is absent', () => {
  const result = runImport(
    {
      acme: {
        'index.md':
          '---\ntitle: Acme Corp — Reference Architecture\n---\n\nBody.\n',
      },
    },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.equal(record.organization, 'Acme Corp');
});

test('quoted frontmatter values and list items are unquoted', () => {
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: "Quoted Title"
org_name: 'Acme Corp'
industries:
- "Technology"
---
`,
      },
    },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.equal(record.title, 'Quoted Title');
  assert.equal(record.organization, 'Acme Corp');
  assert.deepEqual(record.industries, ['Technology']);
});

// Known limitation, documented as a regression sentinel: the frontmatter
// parser's list-item regex requires the dash at column 0, so indented YAML
// list items are silently dropped. This affects real data — upstream records
// allianz (1-space indent) and zeiss (2-space indent) import with empty
// industries/tags. If the parser is fixed to accept indentation, update this
// test to expect the items instead.
test('indented list items are dropped by the frontmatter parser', () => {
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: Acme
org_name: Acme Corp
industries:
  - Technology
---
`,
      },
    },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.deepEqual(record.industries, []);
});

test('project cards render as CNCFProjectCard with extracted metadata', () => {
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: Acme
org_name: Acme Corp
---

Intro.

{{< card header="My Project" >}}
![logo](https://raw.githubusercontent.com/cncf/artwork/main/projects/my-project/icon/color/my-project.svg)
**Using since:** 2021
**Current version:** 2.0
- Does useful things
[docs](https://example.com/docs)
{{< /card >}}
`,
      },
    },
    { readBack: ['docs/architectures/acme.md'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const doc = result.files['docs/architectures/acme.md'];
  // No cncf.io/projects link in the card, so the href falls back to a slug.
  assert.match(
    doc,
    /<CNCFProjectCard name="My Project" href="https:\/\/www\.cncf\.io\/projects\/my-project\/"/,
  );
  assert.match(doc, /logo="\/img\/cncf-projects\/my-project-my-project\.svg"/);
  assert.match(doc, /since="2021"/);
  assert.match(doc, /version="2\.0"/);
  assert.match(doc, /description="Does useful things"/);
  assert.ok(!doc.includes('{{<'), 'shortcodes are stripped');
});

test('card href prefers an explicit cncf.io projects link', () => {
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: Acme
org_name: Acme Corp
---

{{< card header="Kubernetes" >}}
[project](https://www.cncf.io/projects/kubernetes/)
[other](https://example.com/)
{{< /card >}}
`,
      },
    },
    { readBack: ['docs/architectures/acme.md'] },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.files['docs/architectures/acme.md'],
    /href="https:\/\/www\.cncf\.io\/projects\/kubernetes\/"/,
  );
});

test('cleanMarkdown fixes links, images, escapes, and blank lines', () => {
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: Acme
org_name: Acme Corp
---

First paragraph with [[linked text](https://example.com/page)].



Second paragraph after excessive blanks.

![local](./images/local.png)
![remote](https://example.com/remote.png)
![artwork](https://raw.githubusercontent.com/cncf/artwork/main/projects/etcd/icon/color/etcd.svg)

A literal <> pair.
`,
        'images/local.png': 'PNG',
      },
    },
    { readBack: ['docs/architectures/acme.md'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const doc = result.files['docs/architectures/acme.md'];
  assert.match(doc, /\[linked text\]\(https:\/\/example\.com\/page\)/);
  assert.ok(!doc.includes('\n\n\n'), 'blank runs collapse');
  assert.match(doc, /!\[local\]\(\/img\/architectures\/acme\/local\.png\)/);
  // Non-artwork remote images degrade to links.
  assert.match(doc, /\[remote\]\(https:\/\/example\.com\/remote\.png\)/);
  // Artwork images keep image syntax at the mirrored path.
  assert.match(doc, /!\[artwork\]\(\/img\/cncf-projects\/etcd-etcd\.svg\)/);
  assert.match(doc, /&lt;&gt;/);
});

test('summary skips headings and lists, strips emphasis, truncates at 240', () => {
  const long = `${'word '.repeat(60).trim()} tail`;
  const result = runImport(
    {
      acme: {
        'index.md': `---
title: Acme
org_name: Acme Corp
---

# Heading first

- a bullet list

**Bold** intro with _emphasis_ and \`code\`. ${long}
`,
      },
    },
    { readBack: ['data/architectures/catalog.json'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.ok(record.summary.startsWith('Bold intro with emphasis and code.'));
  assert.equal(record.summary.length, 240);
});

test('nested image directories keep their relative asset paths', () => {
  const result = runImport(
    {
      acme: {
        'index.md': '---\ntitle: Acme\norg_name: Acme Corp\n---\n\nBody.\n',
        'images/nested/deep/diagram.svg': simpleSvg,
      },
    },
    {
      readBack: [
        'data/architectures/catalog.json',
        'static/img/architectures/acme/nested/deep/diagram.svg',
      ],
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const [record] = JSON.parse(result.files['data/architectures/catalog.json']);
  assert.deepEqual(record.assets, [
    '/img/architectures/acme/nested/deep/diagram.svg',
  ]);
  assert.equal(
    result.files['static/img/architectures/acme/nested/deep/diagram.svg'],
    simpleSvg,
  );
});

test('imported SVGs are sanitized: DOCTYPE and metadata stripped, viewBox derived', () => {
  const dirty =
    '<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg" content="drawio-metadata" width="800" height="600"><rect/></svg>\n';
  const result = runImport(
    {
      acme: {
        'index.md': '---\ntitle: Acme\norg_name: Acme Corp\n---\n\nBody.\n',
        'images/diagram.svg': dirty,
      },
    },
    { readBack: ['static/img/architectures/acme/diagram.svg'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const sanitized = result.files['static/img/architectures/acme/diagram.svg'];
  assert.ok(!/DOCTYPE/i.test(sanitized));
  assert.ok(!/drawio-metadata/.test(sanitized));
  assert.match(sanitized, /<svg viewBox="0 0 800 600"/);
});

test('raster-embedded SVG converts to PNG when rsvg-convert succeeds', () => {
  const raster =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><image data:image/png;base64,AAAA/></svg>';
  const result = runImport(
    {
      acme: {
        'index.md': '---\ntitle: Acme\norg_name: Acme Corp\n---\n\nBody.\n',
        'images/diagram.svg': raster,
      },
    },
    {
      readBack: [
        'static/img/architectures/acme/diagram.svg',
        'static/img/architectures/acme/diagram.png',
      ],
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Converted raster-embedded SVG to PNG/);
  assert.equal(result.files['static/img/architectures/acme/diagram.svg'], null);
  assert.equal(
    result.files['static/img/architectures/acme/diagram.png'],
    'STUB-PNG',
  );
});

test('raster-embedded SVG warns and keeps the SVG when conversion fails', () => {
  const raster =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><image data:image/png;base64,AAAA/></svg>';
  const result = runImport(
    {
      acme: {
        'index.md': '---\ntitle: Acme\norg_name: Acme Corp\n---\n\nBody.\n',
        'images/diagram.svg': raster,
      },
    },
    {
      env: { RSVG_STUB_MODE: 'fail' },
      readBack: ['static/img/architectures/acme/diagram.svg'],
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /consider installing rsvg-convert/);
  assert.equal(
    result.files['static/img/architectures/acme/diagram.svg'],
    raster,
  );
});

test('artwork assets are mirrored locally; curl failure only warns', () => {
  const body = `---
title: Acme
org_name: Acme Corp
---

![logo](https://raw.githubusercontent.com/cncf/artwork/main/projects/etcd/icon/color/etcd.svg)
`;
  const ok = runImport(
    { acme: { 'index.md': body } },
    { readBack: ['static/img/cncf-projects/etcd-etcd.svg'] },
  );
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(
    ok.files['static/img/cncf-projects/etcd-etcd.svg'],
    'STUB-LOGO-BYTES',
  );

  const failed = runImport(
    { acme: { 'index.md': body } },
    {
      env: { CURL_STUB_MODE: 'fail' },
      readBack: [
        'static/img/cncf-projects/etcd-etcd.svg',
        'data/architectures/catalog.json',
      ],
    },
  );
  assert.equal(failed.status, 0, failed.stderr);
  assert.match(
    failed.stderr,
    /Could not mirror CNCF project asset: etcd\/etcd\.svg/,
  );
  assert.equal(failed.files['static/img/cncf-projects/etcd-etcd.svg'], null);
  // The import still completes and writes the record.
  assert.ok(JSON.parse(failed.files['data/architectures/catalog.json']));
});

test('docs page carries frontmatter, import, and attribution', () => {
  const result = runImport(
    {
      acme: {
        'index.md':
          '---\ntitle: Acme Architecture\norg_name: Acme Corp\n---\n\nBody text.\n',
      },
    },
    { readBack: ['docs/architectures/acme.md'] },
  );
  assert.equal(result.status, 0, result.stderr);
  const doc = result.files['docs/architectures/acme.md'];
  assert.match(
    doc,
    /^---\ntitle: "Acme Architecture"\nsidebar_label: "Acme Corp"\n---/,
  );
  assert.match(
    doc,
    /import CNCFProjectCard from '@site\/src\/components\/CNCFProjectCard';/,
  );
  assert.match(doc, /Source revision: `deadbeefcafe`/);
  assert.match(doc, /CC BY 4\.0/);
  assert.match(doc, /Body text\./);
});
