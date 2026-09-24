#!/usr/bin/env node
/* Guards the namespace contract. No dependencies: run `npm test`.

   1. Every design token Nocturne declares is prefixed (--ntn-*).
   2. Every var(--x) the CSS reads is declared somewhere (or set from JS).
   3. A prefixed build renames EVERYTHING: no trace of "ntn" survives, and the output equals the
      default build with the namespace swapped — so a kit built with --prefix cms styles cms-* markup.
   4. Bad prefixes are rejected. */
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { build, applyPrefix } from './build.mjs';

let failures = 0;
const check = (ok, msg) => { if (ok) { console.log('  ok   ' + msg); } else { failures++; console.error('  FAIL ' + msg); } };

const tmp = await mkdtemp(join(tmpdir(), 'nocturne-test-'));
try {
  const base = join(tmp, 'ntn');
  const alt = join(tmp, 'zz');
  const baseFiles = await build({ outDir: base });
  await build({ prefix: 'zz', outDir: alt });

  console.log('Tokens');
  const css = await readFile(join(base, 'nocturne.css'), 'utf8');
  const js = await readFile(join(base, 'nocturne.js'), 'utf8');
  // A declaration starts a token (not a BEM modifier like .ntn-btn--primary:hover).
  const declared = new Set([...css.matchAll(/(?<![A-Za-z0-9_-])(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
  const unprefixed = [...declared].filter((n) => !n.startsWith('--ntn-'));
  check(unprefixed.length === 0, `all ${declared.size} declared custom properties start with --ntn-` + (unprefixed.length ? ': ' + unprefixed.join(' ') : ''));

  const setFromJs = new Set([...js.matchAll(/['"`](--ntn-[a-zA-Z0-9-]+)/g)].map((m) => m[1]));
  const read = new Set([...css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((m) => m[1]));
  const undeclared = [...read].filter((n) => !declared.has(n) && !setFromJs.has(n));
  check(undeclared.length === 0, `every var() the CSS reads is declared (${read.size} names)` + (undeclared.length ? ': ' + undeclared.join(' ') : ''));

  console.log('Prefix build');
  for (const file of baseFiles) {
    const rel = relative(base, file);
    const a = await readFile(file, 'utf8');
    const b = await readFile(join(alt, rel), 'utf8');
    check(!/ntn/i.test(b), `${rel}: no "ntn" left in the --prefix zz build`);
    // Banners differ by design (they name the prefix); compare everything after them.
    const body = (s) => s.replace(/^\/\*![\s\S]*?\*\/\n\n/, '');
    check(body(b) === body(applyPrefix(a, 'zz')), `${rel}: equals the default build with the namespace swapped`);
  }
  const altJs = await readFile(join(alt, 'nocturne.js'), 'utf8');
  check(/dataset\.zz[A-Z]/.test(altJs) && /data-zz-/.test(altJs), 'camelCase dataset keys follow the prefix (data-zz-x ↔ dataset.zzX)');

  console.log('Prefix validation');
  for (const bad of ['', 'Cms', 'my-ui', '1x', 'a_b', 'c s']) {
    let threw = false;
    try { await build({ prefix: bad, outDir: join(tmp, 'bad') }); } catch { threw = true; }
    check(threw, `rejects prefix ${JSON.stringify(bad)}`);
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed');
process.exitCode = failures ? 1 : 0;
