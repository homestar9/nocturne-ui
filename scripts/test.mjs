#!/usr/bin/env node
/* Guards the namespace contract. No dependencies: run `npm test`.

   1. Every design token Nocturne declares is prefixed (--ntn-*).
   2. Every var(--x) the CSS reads is declared somewhere (or set from JS).
   3. A prefixed build renames EVERYTHING: no trace of "ntn" survives, and the output equals the
      default build with the namespace swapped — so a kit built with --prefix cms styles cms-* markup.
   4. Bad prefixes are rejected.
   5. The committed dist/ is what src/ compiles to. */
import { readFile, readdir, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { build, applyPrefix, vocabularyVars, stripBanner, root } from './build.mjs';
import { compile } from './compile.mjs';

let failures = 0;
const check = (ok, msg) => { if (ok) { console.log('  ok   ' + msg); } else { failures++; console.error('  FAIL ' + msg); } };

const tmp = await mkdtemp(join(tmpdir(), 'nocturne-test-'));
try {
  // Everything below checks a fresh compile of src/, not whatever dist/ happens to hold.
  const cssDir = join(tmp, 'compiled');
  const compiled = await compile({ outDir: cssDir });
  const base = join(tmp, 'ntn');
  const alt = join(tmp, 'zz');
  const baseFiles = await build({ cssDir, outDir: base });
  await build({ cssDir, prefix: 'zz', outDir: alt });

  console.log('dist/ is up to date');
  for (const file of compiled) {
    const rel = relative(cssDir, file);
    const fresh = stripBanner(await readFile(file, 'utf8'));
    const committed = stripBanner(await readFile(resolve(root, 'dist', rel), 'utf8').catch(() => ''));
    check(fresh === committed, `dist/${rel} matches src/ (run npm run build)`);
  }

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

  // A token nothing reads must be a step of a public scale apps build with; anything else is dead.
  const themesText = (await Promise.all((await readdir(resolve(root, 'themes'))).map((f) => readFile(resolve(root, 'themes', f), 'utf8')))).join('\n');
  const readsToken = (n) => new RegExp(`var\\(\\s*${n}(?![\\w-])`).test(css + js + themesText);
  const PUBLIC_SCALE = /^--ntn-(n|accent|magenta|cyan|space|font-size|leading|weight|tracking|z|ease|dur|shadow|chart|text|surface)-/;
  const dead = [...declared].filter((n) => !readsToken(n) && !setFromJs.has(n) && !PUBLIC_SCALE.test(n));
  check(dead.length === 0, 'every token is read, or is a step of a public scale' + (dead.length ? ': ' + dead.join(' ') : ''));

  // One meaning per family: --ntn-text-* are colours and --ntn-control-* are heights.
  const decls = [...css.matchAll(/(--ntn-(?:text|control)-[a-z0-9-]+)\s*:\s*([^;]+);/g)];
  const mixed = decls.filter(([, n, v]) => (n.startsWith('--ntn-text-') ? /^\d/.test(v.trim()) : !/^\d+px$/.test(v.trim()))).map(([, n]) => n);
  check(mixed.length === 0, '--ntn-text-* are all colours and --ntn-control-* all heights' + (mixed.length ? ': ' + [...new Set(mixed)].join(' ') : ''));

  console.log('Font-free stylesheet');
  const nofonts = await readFile(join(base, 'nocturne.nofonts.css'), 'utf8');
  check(/@import\s+url\(["']https:\/\/fonts\.googleapis/.test(css), 'nocturne.css still loads Geist from Google Fonts');
  check(!/@import\s+url/.test(nofonts), 'nocturne.nofonts.css makes no remote @import');
  const strip = (s) => s.replace(/^\/\*![\s\S]*?\*\/\n\n/, '').replace(/^@import[^\n]*\n+/gm, '');
  check(strip(nofonts) === strip(css), 'nocturne.nofonts.css is otherwise identical to nocturne.css');

  console.log('Glass hooks (R15)');
  check(/--ntn-surface-filter:\s*none;/.test(css) && /--ntn-pop-filter:\s*none;/.test(css), 'both hooks default to none');
  const HOOKS = { 'ntn-card': 'surface', 'ntn-sidebar': 'surface', 'ntn-modal': 'pop', 'ntn-menu': 'pop',
    'ntn-popover': 'pop', 'ntn-daterange__panel': 'pop', 'ntn-tooltip__bubble': 'pop', 'ntn-toast': 'pop' };
  for (const [block, hook] of Object.entries(HOOKS)) {
    const rule = css.match(new RegExp(`(?:^|\\n)\\.${block} \\{([^}]*)\\}`));
    check(rule && rule[1].includes(`backdrop-filter: var(--ntn-${hook}-filter)`), `.${block} reads --ntn-${hook}-filter`);
  }

  console.log('Focus');
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}@]+)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim().replace(/\s+/g, ' '), body: m[2] }));
  const globalRing = rules.find((r) => r.sel === ':focus-visible');
  check(globalRing && /outline:\s*var\(--ntn-focus-outline\)/.test(globalRing.body),
    'the global focus ring is an outline, so no component box-shadow can replace it');
  // Rules allowed to drop the outline without a replacement ring:
  const RING_ELSEWHERE = [
    /^\.ntn-field__control :focus-visible,/,   // the bordered group draws the ring (:focus-within)
    /^\.ntn-steps__hit:focus-visible$/,        // the marker inside draws the ring
  ];
  const ringless = rules.filter((r) => r.sel.includes(':focus-visible')
    && /outline:\s*(0|none)\s*;/.test(r.body)
    && !/box-shadow:\s*var\(--ntn-ring-focus\)/.test(r.body)
    && !RING_ELSEWHERE.some((re) => re.test(r.sel)));
  check(ringless.length === 0, 'no :focus-visible rule removes the outline without drawing a ring'
    + (ringless.length ? ': ' + ringless.map((r) => r.sel).join(' | ') : ''));

  console.log('Reduced motion');
  const calmRise = css.match(/@media \(prefers-reduced-motion: reduce\) \{\s*@keyframes ntn-rise \{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/);
  check(calmRise && !/transform/.test(calmRise[1]), 'under reduced motion, entrances (ntn-rise) fade without moving');
  const calmLeave = css.match(/@media \(prefers-reduced-motion: reduce\) \{\s*@keyframes ntn-toast-leave \{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/);
  check(calmLeave && !/transform/.test(calmLeave[1]), 'under reduced motion, a toast leaves by fading only');
  check(/@media \(prefers-reduced-motion: reduce\) \{\s*\.ntn-toast__timer \{\s*display: none;/.test(css), 'under reduced motion, the shrinking toast timer is hidden');

  console.log('Toast (NTN-23)');
  // The tones are translucent, and a toast floats over anything: each tint needs an opaque base.
  const seeThrough = ['primary', 'success', 'warning', 'danger', 'info'].filter((t) => {
    const r = rules.find((x) => x.sel === `.ntn-toast--${t}`);
    return !(r && /background:[^;]*,\s*var\(--ntn-surface-2\)\s*;/.test(r.body));
  });
  check(seeThrough.length === 0, 'every toast tone paints its tint over an opaque --ntn-surface-2' + (seeThrough.length ? ': ' + seeThrough.join(' ') : ''));
  const toaster = rules.find((r) => r.sel === '.ntn-toaster');
  check(toaster && /pointer-events:\s*none/.test(toaster.body) && rules.some((r) => r.sel === '.ntn-toast' && /pointer-events:\s*auto/.test(r.body)),
    'the region lets clicks through; only the toasts take them');
  check(rules.some((r) => r.sel === '.ntn-toaster[popover]:not(:popover-open)' && /display:\s*none/.test(r.body)), 'a closed toaster popover stays hidden despite its display: flex');

  console.log('Drop area and file rows (NTN-24)');
  // The input covers the label, so click and drop work with no JS; the label draws its focus.
  const dzInput = rules.find((r) => r.sel === '.ntn-dropzone input[type=file]' || r.sel === '.ntn-dropzone input[type="file"]');
  check(dzInput && /inset:\s*0/.test(dzInput.body) && /opacity:\s*0/.test(dzInput.body), 'the file input is stretched invisibly over the drop area');
  check(rules.some((r) => r.sel === '.ntn-dropzone:has(input:focus-visible)' && /box-shadow:\s*var\(--ntn-ring-focus\)/.test(r.body)), 'the drop area rings when its hidden input has keyboard focus');
  const fileStates = [['.ntn-file:not([data-ntn-state=uploading]) .ntn-file__progress', 'progress outside uploading'], ['.ntn-file:not([data-ntn-state=error]) .ntn-file__error', 'the error outside the error state']];
  const unhidden = fileStates.filter(([sel]) => !rules.some((r) => r.sel.replace(/"/g, '') === sel && /display:\s*none/.test(r.body)));
  check(unhidden.length === 0, 'a file row hides its ' + fileStates.map(([, m]) => m).join(' and ') + (unhidden.length ? ': not ' + unhidden.map(([, m]) => m).join(', ') : ''));

  console.log('Progress steps (NTN-17)');
  // The connector runs under the markers, so the current marker's see-through tint needs an opaque base.
  const currentMarker = rules.find((r) => r.sel === '.ntn-steps__step[data-state=current] .ntn-steps__marker');
  check(currentMarker && /background:[^;]*,\s*var\(--ntn-surface-2\)\s*;/.test(currentMarker.body),
    'the current step marker paints its tint over an opaque --ntn-surface-2 base');

  console.log('Ambient (NTN-18)');
  const PLACEMENTS = ['bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
  const unplaced = PLACEMENTS.filter((p) => !rules.some((r) => r.sel.split(/\s*,\s*/).includes(`.ntn-ambient--${p}::before`)));
  check(unplaced.length === 0, 'ntn-ambient offers every placement' + (unplaced.length ? ': missing ' + unplaced.join(' ') : ''));
  const ambientGlow = rules.find((r) => r.sel === '.ntn-ambient::before');
  check(ambientGlow && /var\(--ntn-ambient-glow\)/.test(ambientGlow.body), 'the ambient glow reads --ntn-ambient-glow');
  const stacked = rules.find((r) => r.sel === '.ntn-ambient ~ .ntn-ambient');
  check(stacked && /background:\s*none\s*;/.test(stacked.body), 'a stacked ambient leaves the background image to the first');

  console.log('Gradient (NTN-19)');
  const washAt = rules.findIndex((r) => r.sel === '.ntn-gradient');
  const wash = rules[washAt];
  check(wash && /var\(--ntn-gradient-color\)/.test(wash.body) && /var\(--ntn-gradient-size\)/.test(wash.body), 'the wash reads --ntn-gradient-color and --ntn-gradient-size');
  const noWashMod = ['strong', 'full', 'line'].filter((m) => !rules.some((r) => r.sel === `.ntn-gradient--${m}`));
  check(noWashMod.length === 0, 'ntn-gradient offers --strong, --full and --line' + (noWashMod.length ? ': missing ' + noWashMod.join(' ') : ''));
  // The wash must follow every surface background it lies over, or a shorthand wipes it out.
  const lastAt = (re) => rules.reduce((at, r, i) => (re.test(r.sel) ? i : at), -1);
  const before = { '.ntn-card': /(^|,\s*)\.ntn-card(,|$)/, '.ntn-sidebar': /(^|,\s*)\.ntn-sidebar(,|$)/, '.ntn-edge--glow': /\.ntn-edge--glow(,|$)/ };
  const washFirst = Object.entries(before).filter(([, re]) => lastAt(re) > washAt).map(([n]) => n);
  check(washAt >= 0 && washFirst.length === 0, 'the wash comes after the surfaces it lies over' + (washFirst.length ? ': ' + washFirst.join(' ') : ''));

  console.log('One disabled treatment');
  const disabledRules = rules.filter((r) => /:disabled|\[aria-disabled=("?)true\1\]/.test(r.sel) && /(?:^|[;\s])opacity:/.test(r.body));
  const oddFades = disabledRules.filter((r) => !/(?:^|[;\s])opacity:\s*var\(--ntn-disabled-opacity\)/.test(r.body));
  check(oddFades.length === 0, `every disabled rule fades by --ntn-disabled-opacity (${disabledRules.length} rules)` + (oddFades.length ? ': ' + oddFades.map((r) => r.sel).join(' | ') : ''));
  // Blocks with a disabled state must not change on hover while disabled.
  const disableable = new Set([...css.matchAll(/\.(ntn-[\w-]+?)(?:--[\w-]+)?(?::disabled|\[aria-disabled=("?)true\2\])/g)].map((m) => m[1]));
  const hoverWhileDisabled = rules.flatMap((r) => r.sel.split(/\s*,\s*/)).filter((sel) => {
    const compound = sel.split(/\s+|>|~|\+/).find((part) => part.includes(':hover'));
    const block = compound && (compound.match(/^\.(ntn-[\w-]+?)(?:--[\w-]+)?(?=[.:[]|$)/) || [])[1];
    return block && disableable.has(block) && !/:hover:(where\(:not\(:disabled|not\(:disabled)/.test(compound);
  });
  check(hoverWhileDisabled.length === 0, 'hover styles skip disabled controls' + (hoverWhileDisabled.length ? ': ' + hoverWhileDisabled.join(' | ') : ''));

  console.log('One tone set');
  // Every toned block offers primary, the four statuses and neutral; its default needs no class.
  const TONE_SET = ['primary', 'success', 'warning', 'danger', 'info', 'neutral'];
  const DEFAULT_TONE = { 'ntn-badge': 'neutral', 'ntn-alert': null, 'ntn-progress': 'primary', 'ntn-btn': ['primary', 'neutral'], 'ntn-ambient': 'primary', 'ntn-gradient': 'primary', 'ntn-toast': 'neutral' };
  for (const [block, dflt] of Object.entries(DEFAULT_TONE)) {
    const missing = TONE_SET.filter((t) => ![].concat(dflt).includes(t) && !css.includes(`.${block}--${t}`));
    check(missing.length === 0, `.${block} offers every tone` + (missing.length ? ': missing ' + missing.join(' ') : ''));
  }

  console.log('One control face (NTN-27)');
  // Controls that sit side by side in a toolbar draw the same border and lift (the control-surface mixin).
  const CONTROL_FACES = ['.ntn-field__control', '.ntn-select__control select', '.ntn-combo__trigger', '.ntn-daterange__trigger', '.ntn-toggle-group', '.ntn-radio-group--segmented', '.ntn-search'];
  const oddFaces = CONTROL_FACES.filter((sel) => {
    const r = rules.find((x) => x.sel === sel);
    return !(r && /border:\s*1px solid var\(--ntn-border-default\)/.test(r.body) && /box-shadow:\s*var\(--ntn-shadow-xs\)/.test(r.body));
  });
  check(oddFaces.length === 0, 'every form control face draws --ntn-border-default and --ntn-shadow-xs' + (oddFaces.length ? ': ' + oddFaces.join(' ') : ''));

  console.log('Tree link labels (NTN-28)');
  // An <a> label takes the row's colour. The :hover half is what beats the base a:hover.
  const labelInherits = rules.some((r) => {
    const sels = r.sel.split(/\s*,\s*/);
    return sels.includes('.ntn-tree__label') && sels.includes('.ntn-tree__label:hover') && /color:\s*inherit/.test(r.body);
  });
  check(labelInherits, 'a tree link label inherits the row colour, at rest and on hover');

  console.log('Cascade');
  // Specificity and source order settle every conflict; the reset's [hidden] is the one exception.
  const importantRules = rules.filter((r) => /!important/.test(r.body) && r.sel !== '[hidden]').map((r) => r.sel);
  check(importantRules.length === 0, 'no !important outside the [hidden] reset' + (importantRules.length ? ': ' + importantRules.join(' | ') : ''));
  check(!/@layer\b/.test(css), 'the stylesheet is unlayered (apps opt in with @import … layer())');

  console.log('Breakpoints');
  const drawerPx = (js.match(/DRAWER_QUERY\s*=\s*'\(max-width:\s*(\d+)px\)'/) || [])[1];
  const drawerCss = css.match(/@media \(width <= (\d+)px\) \{\s*\.ntn-sidebar \{[^}]*position: fixed/);
  check(drawerPx && drawerCss && drawerPx === drawerCss[1], `nocturne.js and the CSS switch the sidebar to a drawer at the same width (${drawerPx}px / ${drawerCss && drawerCss[1]}px)`);

  console.log('Layout follows its tokens');
  const pageRule = css.match(/(?:^|\n)\.ntn-page \{([^}]*)\}/);
  check(pageRule && /max-width:\s*var\(--ntn-page-max\)/.test(pageRule[1]), '.ntn-page is as wide as --ntn-page-max');
  // NTN-21: the date panel opens in the top layer; its own display must not override the closed popover.
  const drClosed = rules.find((r) => r.sel === '.ntn-daterange__panel[popover]:not(:popover-open)');
  check(drClosed && /display:\s*none/.test(drClosed.body), 'a closed date-picker popover stays hidden despite the panel\'s display: flex');
  check(!rules.some((r) => /^\.ntn-card:has\(\.ntn-daterange__panel/.test(r.sel)), 'no card overflow workaround for the date panel (the top layer is never clipped)');
  // NTN-20: the page scrolls. A scroll container here would capture every sticky inside the content.
  const appScroll = rules.find((r) => r.sel === '.ntn-app__scroll');
  check(appScroll && !/overflow/.test(appScroll.body), '.ntn-app__scroll is not a scroll container, so stickies inside it stick to the viewport');
  const flushLevels = new Set([...css.matchAll(/\.ntn-tree--flush((?: \.ntn-tree__group)+) \.ntn-tree__row \{[^}]*var\(--ntn-tree-indent\) \* (\d+)/g)]
    .filter((m) => m[1].split('.ntn-tree__group').length - 1 === Number(m[2])).map((m) => Number(m[2])));
  check([...Array(8)].every((_, i) => flushLevels.has(i + 1)), `a --flush tree indents each level by its depth (levels ${[...flushLevels].sort((a, b) => a - b).join(',')})`);

  console.log('Role sizes (NTN-30)');
  // These rules size themselves from a role token, never a literal, so retuning the token (density)
  // moves them all. Selector → token it must read.
  const ROLE_SIZES = {
    '.ntn-combo__trigger': 'control-pad-y', '.ntn-combo--sm .ntn-combo__trigger': 'control-pad-y',
    '.ntn-table th': 'row-pad-y', '.ntn-table td': 'row-pad-y',
    '.ntn-tree__row': 'row-min-h', '.ntn-tree--sm .ntn-tree__row': 'row-min-h',
    '.ntn-menu__item': 'item-pad-y', '.ntn-menu__label': 'item-pad-y', '.ntn-combo__option': 'item-pad-y',
    '.ntn-daterange__preset': 'item-pad-y', '.ntn-sidebar__item': 'item-pad-y',
    '.ntn-sidebar__sub .ntn-sidebar__item': 'item-pad-y', '.ntn-sidebar[data-collapsed] .ntn-sidebar__item': 'item-pad-y',
    '.ntn-tabs__tab': 'item-pad-y', '.ntn-tabs--pill .ntn-tabs__tab': 'item-pad-y', '.ntn-pager__step': 'item-pad-y',
    '.ntn-card__head': 'gutter', '.ntn-card__body': 'gutter', '.ntn-card__foot': 'gutter', '.ntn-stat': 'gutter',
    '.ntn-modal__head': 'gutter', '.ntn-modal__body': 'gutter', '.ntn-modal__foot': 'gutter', '.ntn-popover': 'gutter',
    '.ntn-toolbar': 'gutter', '.ntn-filters': 'gutter',
    '.ntn-card--flush .ntn-table th:first-child, .ntn-card--flush .ntn-table td:first-child': 'gutter',
    '.ntn-card--flush .ntn-table th:last-child, .ntn-card--flush .ntn-table td:last-child': 'gutter',
    '.ntn-alert': 'box-pad-y', '.ntn-toast': 'box-pad-y', '.ntn-accordion__item > summary': 'box-pad-y',
    '.ntn-field': 'field-gap', '.ntn-select': 'field-gap', '.ntn-combo': 'field-gap', '.ntn-daterange': 'field-gap',
    '.ntn-page': 'layout-gap', '.ntn-grid': 'layout-gap', '.ntn-pager__page': 'control-sm',
  };
  const roleMisses = Object.entries(ROLE_SIZES)
    .filter(([sel, token]) => !rules.some((r) => r.sel === sel && r.body.includes(`var(--ntn-${token})`)))
    .map(([sel, token]) => `${sel} (--ntn-${token})`);
  check(roleMisses.length === 0, `each of ${Object.keys(ROLE_SIZES).length} rules reads its role size token` + (roleMisses.length ? ': ' + roleMisses.join(', ') : ''));

  console.log('Component shadows follow the theme');
  // A raw black shadow never softens in the light theme; components read the --ntn-shadow-* tokens.
  const componentsDir = resolve(root, 'src', 'components');
  const blackShadows = [];
  for (const name of await readdir(componentsDir)) {
    const lines = (await readFile(join(componentsDir, name), 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (/(box-shadow|-shadow)\s*:/.test(line) && /rgba?\(\s*0[\s,]+0[\s,]+0\b|\bblack\b/.test(line)) blackShadows.push(`${name}:${i + 1}`);
    });
  }
  check(blackShadows.length === 0, 'no component shadow is a raw black' + (blackShadows.length ? ': ' + blackShadows.join(' ') : ''));

  console.log('data-theme works on a subtree');
  // Group the token file's declarations by rule selector.
  const parseBlocks = (text) => [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
    sel: m[1].trim().replace(/\s+/g, ' '),
    decls: [...m[2].matchAll(/(--ntn-[a-z0-9-]+)\s*:([^;]*);/g)].map((d) => [d[1], d[2].trim()]),
  }));
  const blocks = parseBlocks(await readFile(join(base, 'tokens.css'), 'utf8'));
  const namesIn = (pred) => new Set(blocks.filter((b) => pred(b.sel)).flatMap((b) => b.decls.map(([n]) => n)));
  // Sass drops the quotes around an attribute value that is a plain identifier.
  const lightNames = namesIn((s) => /^\[data-theme="?light"?\]$/.test(s));
  const darkNames = namesIn((s) => /\[data-theme="?dark"?\]|\[data-theme\](?!=)/.test(s));
  const missingDark = [...lightNames].filter((n) => !darkNames.has(n));
  check(lightNames.size > 30 && missingDark.length === 0,
    `each of the ${lightNames.size} tokens the light theme remaps also has a value on dark subtrees` + (missingDark.length ? ': ' + missingDark.join(' ') : ''));
  const rootOnly = blocks.filter((b) => b.sel === ':root').flatMap((b) => b.decls);
  const stale = rootOnly.filter(([, v]) => [...v.matchAll(/var\((--ntn-[a-z0-9-]+)/g)].some((m) => lightNames.has(m[1]))).map(([n]) => n);
  check(stale.length === 0, 'no :root-only token reads a mode token (it would resolve once, at the root)' + (stale.length ? ': ' + stale.join(' ') : ''));

  console.log('data-density works on a subtree (NTN-31)');
  // The touch block sits in an @media, which parseBlocks would read as a second compact block.
  const tokensText = (await readFile(join(base, 'tokens.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const coarse = tokensText.match(/@media \(pointer: coarse\) \{\s*\[data-density="?compact"?\] \{([^}]*)\}\s*\}/);
  const densityBlocks = parseBlocks(coarse ? tokensText.replace(coarse[0], '') : tokensText);
  const densityDecls = (re) => densityBlocks.filter((b) => re.test(b.sel)).flatMap((b) => b.decls);
  const comfortable = new Map(densityDecls(/^:root, \[data-density="?comfortable"?\]$/));
  const compact = new Map(densityDecls(/^\[data-density="?compact"?\]$/));
  const missingComfy = [...compact.keys()].filter((n) => !comfortable.has(n));
  check(compact.size >= 10 && missingComfy.length === 0,
    `each of the ${compact.size} tokens compact remaps also has a comfortable value, so a comfortable subtree resets it` + (missingComfy.length ? ': ' + missingComfy.join(' ') : ''));
  const densityRaw = [...tokensText.matchAll(/\[data-density[^{]*\{([^}]*)\}/g)].flatMap((m) => m[1].split(';').map((d) => d.trim()).filter(Boolean));
  const notTokens = densityRaw.filter((d) => !d.startsWith('--ntn-'));
  check(densityRaw.length > 0 && notTokens.length === 0, 'density blocks set token values only, never a component property' + (notTokens.length ? ': ' + notTokens.join('; ') : ''));
  const derived = [...comfortable, ...compact].filter(([, v]) => /var\(/.test(v)).map(([n]) => n);
  check(derived.length === 0, 'both density levels state literal values (nesting either way needs no recomputation)' + (derived.length ? ': ' + derived.join(' ') : ''));
  const densityStale = rootOnly.filter(([, v]) => [...v.matchAll(/var\((--ntn-[a-z0-9-]+)/g)].some((m) => compact.has(m[1]))).map(([n]) => n);
  check(densityStale.length === 0, 'no :root-only token reads a density token' + (densityStale.length ? ': ' + densityStale.join(' ') : ''));
  const px = (v) => parseFloat(v);
  const targetMin = px(rootOnly.find(([n]) => n === '--ntn-target-min')?.[1] ?? 'NaN');
  check(targetMin === 24 && ['sm', 'md', 'lg'].every((s) => px(compact.get(`--ntn-control-${s}`)) >= targetMin),
    `compact control heights stay at or above --ntn-target-min (${targetMin}px, WCAG 2.2 SC 2.5.8)`);
  const touch = coarse ? new Map([...coarse[1].matchAll(/(--ntn-[a-z0-9-]+)\s*:([^;]*);/g)].map((d) => [d[1], d[2].trim()])) : new Map();
  check(['sm', 'md', 'lg'].every((s) => touch.get(`--ntn-control-${s}`) === comfortable.get(`--ntn-control-${s}`)),
    'on a coarse pointer compact keeps the comfortable control heights');
  // A size derived from a control height (a segment, an inline action) floors at the target minimum.
  const unfloored = [...css.matchAll(/(.{0,32})calc\(var\(--ntn-control-(?:sm|md|lg)\) - [^)]*\)/g)]
    .filter((m) => !m[1].endsWith('max(var(--ntn-target-min), ')).map((m) => m[0].trim());
  check(unfloored.length === 0, 'every height derived from --ntn-control-* is floored with max(var(--ntn-target-min), …)' + (unfloored.length ? ': ' + unfloored.join(' | ') : ''));
  // NTN-33: "compact" names the density, so no block keeps a --compact modifier of its own.
  const compactMods = [...new Set([...css.matchAll(/\.ntn-[a-z-]+--compact\b/g)].map((m) => m[0]))];
  check(compactMods.length === 0, 'no block has a --compact modifier (density is data-density)' + (compactMods.length ? ': ' + compactMods.join(' ') : ''));

  console.log('Chart hues stay in charts');
  // Magenta and cyan are chart series two and three (skill/brand.md). Chrome reads a token a theme can retint.
  const chartHues = [];
  for (const name of await readdir(componentsDir)) {
    const lines = (await readFile(join(componentsDir, name), 'utf8')).split('\n');
    lines.forEach((line, i) => { if (/var\(--ntn-(magenta|cyan)-/.test(line)) chartHues.push(`${name}:${i + 1}`); });
  }
  check(chartHues.length === 0, 'no component reads --ntn-magenta-* or --ntn-cyan-*' + (chartHues.length ? ': ' + chartHues.join(' ') : ''));

  console.log('Mono theme');
  // Hex (bare or URL-encoded in an SVG) and rgb()/rgba() literals, as [r, g, b].
  const colours = (v) => [...v.matchAll(/(?:#|%23)([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/gi)].map((m) => {
    if (!m[1]) return [m[2], m[3], m[4]].map(Number);
    const h = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  });
  const isGrey = ([r, g, b]) => r === g && g === b;
  const monoText = await readFile(resolve(root, 'themes', 'mono.css'), 'utf8');
  const tinted = colours(monoText).filter((c) => !isGrey(c));
  check(tinted.length === 0, 'every colour themes/mono.css writes is a pure grey' + (tinted.length ? ': ' + tinted.map((c) => `rgb(${c})`).join(' ') : ''));

  // Whatever Nocturne colours outside the status tones, mono must set again for the same mode.
  const monoBlocks = parseBlocks(monoText);
  const monoNames = (pred) => new Set(monoBlocks.filter((b) => pred(b.sel)).flatMap((b) => b.decls.map(([n]) => n)));
  const monoDark = monoNames((s) => /data-theme="dark"/.test(s));
  const monoLight = monoNames((s) => /data-theme="light"/.test(s));
  const monoAlias = monoNames((s) => /\[data-theme\]/.test(s));
  const STATUS = /^--ntn-(success|warning|danger|info|magenta|cyan)-/;
  const coloured = (v) => colours(v).some((c) => !isGrey(c)) || /var\(--ntn-(magenta|cyan)-/.test(v);
  const leaks = blocks.flatMap((b) => {
    const light = /^\[data-theme="?light"?\]$/.test(b.sel);
    const covered = light ? monoLight : monoDark;
    return b.decls.filter(([n, v]) => !STATUS.test(n) && coloured(v) && !covered.has(n) && !monoAlias.has(n))
      .map(([n]) => `${n} (${light ? 'light' : 'dark'})`);
  });
  check(leaks.length === 0, 'mono sets again every non-status colour Nocturne declares, in the same mode' + (leaks.length ? ': ' + [...new Set(leaks)].join(' ') : ''));

  // NTN-22: a per-person avatar hue is colour, so mono drops its chroma.
  check(monoBlocks.some((b) => /\[data-theme\]/.test(b.sel) && b.decls.some(([n, v]) => n === '--ntn-avatar-chroma' && v === '0')),
    'mono sets --ntn-avatar-chroma to 0 on every data-theme element, so per-person avatars stay grey');

  const RAMP = ['100', '200', '300', '400', '500', '600', '700', '900'].map((s) => `--ntn-accent-${s}`).concat('--ntn-accent-fg');
  const unset = RAMP.flatMap((n) => [[monoDark, 'dark'], [monoLight, 'light']].filter(([set]) => !set.has(n)).map(([, mode]) => `${n} (${mode})`));
  check(unset.length === 0, 'mono sets the whole accent ramp and its ink in both modes' + (unset.length ? ': ' + unset.join(' ') : ''));

  console.log('Themes');
  // Nocturne itself, then every file in themes/, each read as its dark, light and alias blocks.
  const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = (rgb) => rgb.map((c) => linear(c / 255)).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const oklchHue = (rgb) => {
    const [r, g, b] = rgb.map((c) => linear(c / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return (Math.atan2(0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s) * 180 / Math.PI + 360) % 360;
  };
  const decl = (bs) => new Map(bs.flatMap((b) => b.decls));
  const coreLight = decl(blocks.filter((b) => /^\[data-theme="?light"?\]$/.test(b.sel)));
  const coreDark = decl(blocks.filter((b) => !/^\[data-theme="?light"?\]$/.test(b.sel) && !b.sel.startsWith('@')));
  const themes = [['nocturne', []]];
  for (const f of (await readdir(resolve(root, 'themes'))).filter((n) => n.endsWith('.css')).sort()) {
    themes.push([f, parseBlocks(await readFile(resolve(root, 'themes', f), 'utf8'))]);
  }
  for (const [name, tb] of themes) {
    const dark = decl(tb.filter((b) => b.sel.includes('data-theme="dark"')));
    const light = decl(tb.filter((b) => b.sel.includes('data-theme="light"')));
    const alias = decl(tb.filter((b) => b.sel.includes('[data-theme]')));
    // Which value wins on <html> in each mode. The theme's dark block also matches :root in light
    // mode and ties Nocturne's [data-theme=light] on specificity, winning on load order.
    const chain = { dark: [dark, alias, coreDark], light: [light, alias, dark, coreLight, coreDark] };
    const value = (mode, n, depth = 0) => {
      const v = chain[mode].find((m) => m.has(n))?.get(n) ?? '';
      const ref = v.match(/^var\((--ntn-[a-z0-9-]+)\)$/);
      return ref && depth < 8 ? value(mode, ref[1], depth + 1) : v;
    };
    const rgb = (mode, n) => colours(value(mode, n))[0];

    // Light surface-1 is white paper; bg-app is the greyer canvas, the harder ground.
    for (const mode of ['dark', 'light']) {
      for (const [fg, bg] of [['--ntn-accent-fg', '--ntn-accent-600'], ['--ntn-accent-300', '--ntn-surface-1'], ['--ntn-accent-300', '--ntn-bg-app']]) {
        const [a, b] = [rgb(mode, fg), rgb(mode, bg)];
        const ratio = a && b ? contrast(a, b) : 0;
        check(ratio >= 4.5, `${name}, ${mode}: ${fg} on ${bg} is ${ratio.toFixed(1)}:1 (needs 4.5)`);
      }
    }
    // A mode token set only in the dark block would beat Nocturne's light theme (see above).
    const stuck = [...dark.keys()].filter((n) => lightNames.has(n) && !light.has(n));
    check(stuck.length === 0, `${name}: every mode token its dark block sets is set again for light` + (stuck.length ? ': ' + stuck.join(' ') : ''));

    if (name === 'synthwave.css') {
      // The pink must not read as the danger red: at least 35° apart in OKLCH hue.
      const gap = Math.abs(oklchHue(rgb('dark', '--ntn-accent-600')) - oklchHue(rgb('dark', '--ntn-danger-500')));
      const apart = Math.min(gap, 360 - gap);
      check(apart >= 35, `synthwave.css: the accent is ${apart.toFixed(0)}° of hue from danger (needs 35)`);
    }
  }

  console.log('Prefix build');
  for (const file of baseFiles) {
    const rel = relative(base, file);
    const a = await readFile(file, 'utf8');
    const b = await readFile(join(alt, rel), 'utf8');
    check(!/ntn/i.test(b), `${rel}: no "ntn" left in the --prefix zz build`);
    // Banners differ by design (they name the prefix); compare everything after them.
    check(stripBanner(b) === stripBanner(applyPrefix(a, 'zz')), `${rel}: equals the default build with the namespace swapped`);
  }
  const altJs = await readFile(join(alt, 'nocturne.js'), 'utf8');
  check(/dataset\.zz[A-Z]/.test(altJs) && /data-zz-/.test(altJs), 'camelCase dataset keys follow the prefix (data-zz-x ↔ dataset.zzX)');

  console.log('Split prefixes (classes "zz", tokens stay "ntn")');
  const split = join(tmp, 'split');
  await build({ cssDir, prefix: 'zz', tokenPrefix: 'ntn', outDir: split });
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
    try { await build({ cssDir, prefix: 'ok', tokenPrefix: bad, outDir: join(tmp, 'bad') }); } catch { threwToken = true; }
    check(threwToken, `rejects tokenPrefix ${JSON.stringify(bad)}`);
    let threw = false;
    try { await build({ cssDir, prefix: bad, outDir: join(tmp, 'bad') }); } catch { threw = true; }
    check(threw, `rejects prefix ${JSON.stringify(bad)}`);
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed');
process.exitCode = failures ? 1 : 0;
