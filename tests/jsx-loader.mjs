// Module hooks that let `node --test` import the site's React sources.
//
// Node cannot parse JSX, and it has no idea what a `*.module.css` import means,
// so `import('src/components/.../index.js')` fails with `Unexpected token '<'`
// before a single assertion runs. These hooks close both gaps using packages
// Docusaurus already installs, so no new dependency is introduced:
//
//   - JSX is compiled with @babel/core + @babel/preset-react (automatic runtime).
//   - CSS module imports resolve to a stub whose every property is its own key,
//     which is what the real css-loader produces for class name lookups.
//
// Registered via `node --import ./tests/register-jsx.mjs --test ...`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';
import presetReact from '@babel/preset-react';

const CSS_STUB_URL = new URL('./css-module-stub.mjs', import.meta.url).href;

const isStyleSheet = (specifier) => /\.(css|scss|sass)(\?.*)?$/.test(specifier);

// Only first-party sources are compiled; node_modules keeps whatever loader
// semantics each package shipped with.
const isProjectSource = (url) =>
  url.startsWith('file:') &&
  /\/src\/.*\.(js|jsx)$/.test(url) &&
  !url.includes('/node_modules/');

export function resolve(specifier, context, nextResolve) {
  if (isStyleSheet(specifier)) {
    return { url: CSS_STUB_URL, format: 'module', shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
  if (!isProjectSource(url)) {
    return nextLoad(url, context);
  }

  const filename = fileURLToPath(url);
  const { code } = transformSync(readFileSync(filename, 'utf8'), {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: 'inline',
    presets: [[presetReact, { runtime: 'automatic' }]],
  });

  return { format: 'module', source: code, shortCircuit: true };
}
