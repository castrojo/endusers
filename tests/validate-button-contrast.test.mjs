import assert from 'node:assert/strict';
import test from 'node:test';
import { runScriptWithFixtures } from './helpers.mjs';

const SCRIPT = 'validate-button-contrast.mjs';

function cssWith(colors) {
  return colors
    .map((color, index) =>
      index % 2 === 0
        ? `--cncf-button-background: ${color};`
        : `--cncf-button-background-hover: ${color};`,
    )
    .join('\n');
}

const fourOf = (color) => cssWith([color, color, color, color]);

test('accepts four backgrounds with sufficient contrast', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': fourOf('#005ea8'),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /4 theme backgrounds/);
});

test('accepts #767676, the lightest gray passing WCAG AA 4.5:1 on white', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': fourOf('#767676'),
  });
  assert.equal(result.status, 0, result.stderr);
});

test('rejects #777777, one step below the WCAG AA boundary', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': fourOf('#777777'),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /4\.5:1/);
});

test('rejects white button backgrounds', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': fourOf('#ffffff'),
  });
  assert.equal(result.status, 1);
});

test('rejects when fewer than four theme backgrounds are defined', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': cssWith(['#005ea8', '#004f91', '#007f68']),
  });
  assert.equal(result.status, 1);
});

test('rejects when more than four theme backgrounds are defined', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': cssWith([
      '#005ea8',
      '#004f91',
      '#007f68',
      '#006f5b',
      '#005ea8',
    ]),
  });
  assert.equal(result.status, 1);
});

test('matches hex colors case-insensitively', () => {
  const result = runScriptWithFixtures(SCRIPT, {
    'src/css/custom.css': cssWith(['#005EA8', '#004F91', '#007F68', '#006F5B']),
  });
  assert.equal(result.status, 0, result.stderr);
});
