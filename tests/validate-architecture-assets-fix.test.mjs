import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-architecture-assets.mjs';
const ASSET = 'static/img/architectures/example/diagram.svg';

const VALID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';

function runFix(svg) {
  return runScriptWithFixtures(
    SCRIPT,
    { [ASSET]: svg },
    { args: ['--fix'], readBack: [ASSET] },
  );
}

test('--fix removes a DOCTYPE declaration and rewrites the file', () => {
  const result = runFix(`<!DOCTYPE svg>\n${VALID_SVG}`);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.files[ASSET], /<!DOCTYPE/i);
  assert.match(result.files[ASSET], /^<svg /);
  assert.match(result.stdout, /removed DOCTYPE/);
});

test('--fix adds a viewBox derived from width and height', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect/></svg>';
  const result = runFix(svg);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.files[ASSET], /viewBox="0 0 100 50"/);
  assert.match(result.stdout, /added viewBox="0 0 100 50"/);
});

test('--fix supports fractional width and height dimensions', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120.5px" height="60.25px"><rect/></svg>';
  const result = runFix(svg);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.files[ASSET], /viewBox="0 0 120\.5 60\.25"/);
});

test('--fix cannot repair a missing viewBox without dimensions', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
  const result = runFix(svg);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /missing viewBox attribute and resolvable width\/height/,
  );
  assert.equal(result.files[ASSET], svg, 'unfixable file must be left intact');
});

test('--fix strips draw.io mxfile metadata', () => {
  const svg = VALID_SVG.replace('<svg ', '<svg content="&lt;mxfile&gt;" ');
  const result = runFix(svg);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.files[ASSET], /mxfile/);
  assert.match(result.files[ASSET], /viewBox="0 0 100 100"/);
  assert.match(result.stdout, /stripped draw\.io mxfile metadata/);
});

test('--fix applies DOCTYPE and viewBox repairs to the same file', () => {
  const svg =
    '<!DOCTYPE svg>\n<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect/></svg>';
  const result = runFix(svg);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.files[ASSET], /<!DOCTYPE/i);
  assert.match(result.files[ASSET], /viewBox="0 0 200 80"/);
  assert.match(result.stdout, /Fixed 2 issue\(s\)/);
});

test('--fix reports that no fixes were needed for a valid SVG', () => {
  const result = runFix(VALID_SVG);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.files[ASSET], VALID_SVG, 'valid file must not be edited');
  assert.match(result.stdout, /No fixes were needed/);
});

test('--fix still fails on errors it cannot repair', () => {
  const svg = '<svg viewBox="0 0 100 100"><rect/></svg>';
  const result = runFix(svg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing xmlns/);
  assert.equal(result.files[ASSET], svg);
});

test('foreignObject warning is not auto-fixed', () => {
  const svg = VALID_SVG.replace(
    '<rect width="100" height="100"/>',
    '<foreignObject width="10" height="10"><p>label</p></foreignObject>',
  );
  const result = runFix(svg);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.files[ASSET], svg, 'warning must not rewrite the file');
  assert.match(result.stderr, /foreignObject/);
});

test('without --fix the file is never modified', () => {
  const svg = `<!DOCTYPE svg>\n${VALID_SVG}`;
  const result = runScriptWithFixtures(
    SCRIPT,
    { [ASSET]: svg },
    { readBack: [ASSET] },
  );
  assert.equal(result.status, 1);
  assert.equal(result.files[ASSET], svg);
});
