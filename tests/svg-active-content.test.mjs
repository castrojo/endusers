import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findSvgActiveContent,
  stripSvgActiveContent,
} from '../scripts/lib/svg-active-content.mjs';

const BENIGN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
  <title>Ingress only</title>
  <a href="https://www.cncf.io/"><rect width="10" height="10" fill="#fff"/></a>
  <text font-size="4">on-call rotation</text>
</svg>`;

test('benign SVG reports no active content and is left untouched', () => {
  assert.deepEqual(findSvgActiveContent(BENIGN), []);
  assert.equal(stripSvgActiveContent(BENIGN), BENIGN);
});

test('detects and strips a script element', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect/></svg>`;
  assert.deepEqual(findSvgActiveContent(svg), ['contains a <script> element']);
  const stripped = stripSvgActiveContent(svg);
  assert.doesNotMatch(stripped, /script/i);
  assert.match(stripped, /<rect\/>/);
});

test('detects and strips a self-closing script element', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><script href="evil.js"/></svg>`;
  assert.deepEqual(findSvgActiveContent(svg), [
    'contains a self-closing <script> element',
  ]);
  assert.doesNotMatch(stripSvgActiveContent(svg), /script/i);
});

test('detects and strips inline event handlers', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)" onmouseover='steal()' fill="#000"/></svg>`;
  const findings = findSvgActiveContent(svg);
  assert.ok(findings.includes('contains inline event handler onload'));
  assert.ok(findings.includes('contains inline event handler onmouseover'));
  const stripped = stripSvgActiveContent(svg);
  assert.doesNotMatch(stripped, /onload|onmouseover/i);
  assert.match(stripped, /fill="#000"/);
});

test('detects and strips javascript: URIs in href and xlink:href', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><a xlink:href="javascript:alert(1)"><text>x</text></a><a href=' javascript:alert(2)'>y</a></svg>`;
  const findings = findSvgActiveContent(svg);
  assert.ok(findings.includes('contains a javascript URI in xlink:href'));
  assert.ok(findings.includes('contains a javascript URI in href'));
  assert.doesNotMatch(stripSvgActiveContent(svg), /javascript:/i);
});

test('leaves ordinary https links and data:image URIs alone', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><a href="https://example.com/a"><image xlink:href="data:image/png;base64,AAAA"/></a></svg>`;
  assert.deepEqual(findSvgActiveContent(svg), []);
  assert.equal(stripSvgActiveContent(svg), svg);
});
