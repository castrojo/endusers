// Entry point for `node --import ./tests/register-jsx.mjs`.
//
// registerHooks runs the hooks synchronously on the main thread, which keeps
// the compiled module graph in the same realm as the test process. It needs
// Node >= 22.15; CI pins Node 22, which resolves to a newer patch than that.
import { registerHooks } from 'node:module';
import * as jsxLoader from './jsx-loader.mjs';

if (typeof registerHooks !== 'function') {
  throw new Error(
    'The UI test harness needs Node >= 22.15 for module.registerHooks().',
  );
}

registerHooks(jsxLoader);
