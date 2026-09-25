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
import { build, applyPrefix, vocabularyVars } from './build.mjs';

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

  console.log('Font-free stylesheet');
  const nofonts = await readFile(join(base, 'nocturne.nofonts.css'), 'utf8');
  check(/@import\s+url\(["']https:\/\/fonts\.googleapis/.test(css), 'nocturne.css still loads Geist from Google Fonts');
  check(!/@import\s+url/.test(nofonts), 'nocturne.nofonts.css makes no remote @import');
  const strip = (s) => s.replace(/^\/\*![\s\S]*?\*\/\n\n/, '').replace(/^@import[^\n]*\n+/gm, '');
  check(strip(nofonts) === strip(css), 'nocturne.nofonts.css is otherwise identical to nocturne.css');

  console.log('Glass hooks (R15)');
  check(/--ntn-surface-filter:\s*none;/.test(css) && /--ntn-pop-filter:\s*none;/.test(css), 'both hooks default to none');
  const HOOKS = { 'ntn-card': 'surface', 'ntn-sidebar': 'surface', 'ntn-modal': 'pop', 'ntn-menu': 'pop',
    'ntn-popover': 'pop', 'ntn-daterange__panel': 'pop', 'ntn-tooltip__bubble': 'pop' };
  for (const [block, hook] of Object.entries(HOOKS)) {
    const rule = css.match(new RegExp(`(?:^|\\n)\\.${block} \\{([^}]*)\\}`));
    check(rule && rule[1].includes(`backdrop-filter: var(--ntn-${hook}-filter)`), `.${block} reads --ntn-${hook}-filter`);
  }

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

  console.log('Split prefixes (classes "zz", tokens stay "ntn")');
  const split = join(tmp, 'split');
  await build({ prefix: 'zz', tokenPrefix: 'ntn', outDir: split });
  const vocab = await vocabularyVars();
  check(['slider-pct', 'progress', 'tab-x', 'tab-w', 'tree-indent'].every((n) => vocab.has(n)),
    `vocabulary vars discovered: ${[...vocab].join(' ')}`);
  for (const rel of ['nocturne.css', 'tokens.css', 'nocturne.js', join('themes', 'emerald.css')]) {
    const t = await readFile(join(split, rel), 'utf8');
    const leak = t.match(/\.ntn-[a-z]|data-ntn-|ntn:[a-z]|dataset\.ntn|['"]ntn-theme|keyframes ntn-/);
    check(!leak, `${rel}: no ntn class, hook, event, storage key or keyframe survives` + (leak ? ` (found "${leak[0]}")` : ''));
    const stray = [...new Set([...t.matchAll(/--zz-([a-zA-Z0-9-]+)/g)].map((m) => m[1]))].filter((n) => !vocab.has(n));
    check(stray.length === 0, `${rel}: the only --zz-* properties are vocabulary vars` + (stray.length ? ': ' + stray.join(' ') : ''));
  }
  const splitCss = await readFile(join(split, 'nocturne.css'), 'utf8');
  check(/var\(--ntn-accent\)/.test(splitCss) && /\.zz-card\b/.test(splitCss) && /var\(--zz-slider-pct\)/.test(splitCss),
    'tokens stay --ntn-*, classes become .zz-*, state vars become --zz-*');

  console.log('Prefix validation');
  for (const bad of ['', 'Cms', 'my-ui', '1x', 'a_b', 'c s']) {
    let threwToken = false;
    try { await build({ prefix: 'ok', tokenPrefix: bad, outDir: join(tmp, 'bad') }); } catch { threwToken = true; }
    check(threwToken, `rejects tokenPrefix ${JSON.stringify(bad)}`);
    let threw = false;
    try { await build({ prefix: bad, outDir: join(tmp, 'bad') }); } catch { threw = true; }
    check(threw, `rejects prefix ${JSON.stringify(bad)}`);
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed');
process.exitCode = failures ? 1 : 0;
