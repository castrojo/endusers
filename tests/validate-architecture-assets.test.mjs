import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-architecture-assets.mjs';
const ASSET = 'static/img/architectures/acme/diagram.svg';

const validSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100"/></svg>\n';

function svgFixture(svg, path = ASSET) {
  return { [path]: svg };
}

test('accepts a valid SVG asset', () => {
  const result = runScriptWithFixtures(SCRIPT, svgFixture(validSvg));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 1 architecture asset/);
});

test('passes when the assets directory does not exist', () => {
  const result = runScriptWithFixtures(SCRIPT, {});
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 0 architecture asset/);
});

test('rejects an SVG without the SVG namespace', () => {
  const svg = '<svg viewBox="0 0 100 100"><rect width="10" height="10"/></svg>';
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /missing xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,
  );
});

test('rejects an SVG with a DOCTYPE declaration', () => {
  const svg = '<!DOCTYPE svg>\n' + validSvg;
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DOCTYPE declaration/);
});

test('--fix removes a DOCTYPE declaration in place', () => {
  const svg = '<!DOCTYPE svg>\n' + validSvg;
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg), {
    args: ['--fix'],
    readBack: [ASSET],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /removed DOCTYPE/);
  assert.doesNotMatch(result.files[ASSET], /<!DOCTYPE/i);
  assert.match(result.files[ASSET], /<svg/);
});

test('rejects an SVG missing viewBox when width/height are present', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">' +
    '<rect width="200" height="100"/></svg>';
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /missing viewBox attribute \(has width=200, height=100\)/,
  );
});

test('--fix derives viewBox from explicit width and height', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">' +
    '<rect width="200" height="100"/></svg>';
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg), {
    args: ['--fix'],
    readBack: [ASSET],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /added viewBox="0 0 200 100"/);
  assert.match(result.files[ASSET], /<svg viewBox="0 0 200 100"/);
});

test('rejects an SVG missing viewBox with no resolvable dimensions', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4"/></svg>';
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /missing viewBox attribute and resolvable width\/height/,
  );
});

test('rejects an SVG with embedded raster image data', () => {
  const svg = validSvg.replace(
    '</svg>',
    '<image href="data:image/png;base64,iVBORw0KGgo="/></svg>',
  );
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /embedded raster image data/);
});

test('warns on draw.io mxfile metadata without failing', () => {
  const svg = validSvg.replace(
    '<svg ',
    '<svg content="&lt;mxfile&gt;&lt;diagram&gt;x&lt;/diagram&gt;&lt;/mxfile&gt;" ',
  );
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /\[warn\].*draw\.io mxfile metadata/);
});

test('--fix strips draw.io mxfile metadata', () => {
  const svg = validSvg.replace(
    '<svg ',
    '<svg content="&lt;mxfile&gt;&lt;diagram&gt;x&lt;/diagram&gt;&lt;/mxfile&gt;" ',
  );
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg), {
    args: ['--fix'],
    readBack: [ASSET],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /stripped draw\.io mxfile metadata/);
  assert.doesNotMatch(result.files[ASSET], /\scontent\s*=/i);
});

test('warns on foreignObject without failing', () => {
  const svg = validSvg.replace(
    '</svg>',
    '<foreignObject><p>fallback</p></foreignObject></svg>',
  );
  const result = runScriptWithFixtures(SCRIPT, svgFixture(svg));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /\[warn\].*foreignObject/);
});

test('warns on assets larger than 2 MB without failing', () => {
  const big = 'x'.repeat(2 * 1024 * 1024 + 1);
  const result = runScriptWithFixtures(SCRIPT, {
    'static/img/architectures/acme/large.png': big,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /\[warn\].*consider optimization/);
});

test('reports no fixes needed when --fix finds clean assets', () => {
  const result = runScriptWithFixtures(SCRIPT, svgFixture(validSvg), {
    args: ['--fix'],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No fixes were needed/);
});
