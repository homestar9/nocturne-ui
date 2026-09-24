#!/usr/bin/env node
/* Behaviour tests for js/nocturne.js in a simulated browser (jsdom, a devDependency only).
   Each scenario loads a FRESH copy of the module into its own page, because the module wires
   itself up on import. Run with `npm test`. */
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const moduleUrl = new URL('../js/nocturne.js', import.meta.url).href;
const GLOBALS = ['window', 'document', 'localStorage', 'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent',
  'Node', 'HTMLElement', 'getComputedStyle', 'addEventListener', 'removeEventListener', 'requestAnimationFrame'];

let failures = 0;
let run = 0;
const check = (ok, msg) => { if (ok) console.log('  ok   ' + msg); else { failures++; console.error('  FAIL ' + msg); } };

/** Build a page, expose its globals, then import a fresh copy of nocturne.js. */
async function page(body, { html = '', storage = {} } = {}) {
  const dom = new JSDOM(`<!doctype html><html ${html}><head></head><body>${body}</body></html>`, { url: 'http://localhost/' });
  const { window } = dom;
  for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
  for (const name of GLOBALS) {
    const value = window[name];
    globalThis[name] = typeof value === 'function' && !/^[A-Z]/.test(name) ? value.bind(window) : value;
  }
  window.requestAnimationFrame ??= (fn) => setTimeout(fn, 0);
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  const mod = await import(`${moduleUrl}?case=${++run}`);
  return { window, document: window.document, mod };
}

const EVIL = '<img src=x onerror="window.pwned=1">';
const click = (el) => el.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));

console.log('Combo labels are text, never HTML (R5)');
{
  const opt = (value, label, selected) =>
    `<li class="ntn-combo__option" role="option" data-value='${value}' aria-selected="${selected}">` +
    `<span class="ntn-combo__option-title">${label.replace(/</g, '&lt;')}</span></li>`;
  const { document, window } = await page(
    `<div class="ntn-combo" data-ntn-combo data-ntn-multi data-ntn-max="3">
       <button class="ntn-combo__trigger"><span class="ntn-combo__value" data-ntn-combo-value></span></button>
       <ul class="ntn-combo__list">${opt('a', EVIL, true)}${opt('b" onmouseover="x', 'Quote "b"', true)}${opt('c', 'Plain', false)}</ul>
     </div>
     <div class="ntn-combo" id="single" data-ntn-combo>
       <button class="ntn-combo__trigger"><span class="ntn-combo__value" data-ntn-combo-value></span></button>
       <ul class="ntn-combo__list">${opt('s', EVIL, true)}</ul>
     </div>`);
  const out = document.querySelector('[data-ntn-combo-value]');
  check(!out.querySelector('img') && !document.querySelector('#single img'), 'no <img> element is created from a label');
  check(window.pwned === undefined, 'no injected handler ran');
  const chips = [...out.querySelectorAll('.ntn-combo__chip > span')].map((s) => s.textContent);
  check(chips[0] === EVIL && chips[1] === 'Quote "b"', 'chip text is the literal label');
  const x = out.querySelectorAll('.ntn-combo__chip-x');
  check(x[0].getAttribute('aria-label') === 'Remove ' + EVIL, 'remove button aria-label carries the literal label');
  check(x[1].getAttribute('data-ntn-combo-clear') === 'b" onmouseover="x' && !x[1].hasAttribute('onmouseover'),
    'a value containing a quote stays inside its attribute');
  check(document.querySelector('#single [data-ntn-combo-value]').textContent === EVIL, 'single-select value is the literal label');
  click(x[1].querySelector('i'));
  check(document.querySelector('[data-value^="b"]').getAttribute('aria-selected') === 'false', 'removing a chip still deselects its option');
}

console.log('Theme opt-out (R4)');
{
  const { document, window, mod } = await page(
    '<button data-ntn-theme-toggle aria-pressed="x"><i data-ntn-theme-icon class="keep"></i></button>',
    { html: 'data-ntn-theme-control="manual" data-theme="light"', storage: { 'ntn-theme': 'dark' } });
  const htmlEl = document.documentElement;
  check(htmlEl.getAttribute('data-theme') === 'light', 'start() leaves the server-rendered data-theme alone');
  const before = htmlEl.getAttribute('data-theme');
  click(document.querySelector('[data-ntn-theme-toggle]'));
  check(htmlEl.getAttribute('data-theme') === before, 'a data-ntn-theme-toggle click does nothing');
  check(window.localStorage.getItem('ntn-theme') === 'dark', 'the ntn-theme storage key is never written');
  mod.refresh();
  const btn = document.querySelector('[data-ntn-theme-toggle]');
  check(btn.getAttribute('aria-pressed') === 'x' && btn.querySelector('i').className === 'keep', 'refresh() leaves theme controls untouched');
  check(mod.setTheme('dark') === 'dark' && htmlEl.getAttribute('data-theme') === 'dark', 'setTheme() still works when called directly');
}
{
  const { document } = await page('', { html: 'data-theme="dark"', storage: { 'ntn-theme': 'light' } });
  check(document.documentElement.getAttribute('data-theme') === 'light', 'without the opt-out, the stored preference is applied (unchanged behaviour)');
}

console.log('Generated buttons never submit a form');
{
  const rows = Array.from({ length: 12 }, (_, i) => `<tr><td>${i}</td></tr>`).join('');
  const { document } = await page(
    `<form><table class="ntn-table" id="t" data-ntn-paginate="5"><tbody>${rows}</tbody></table>
       <div data-ntn-table-scope="#t"><nav data-ntn-pages></nav></div></form>`);
  const pages = [...document.querySelectorAll('[data-ntn-pages] button')];
  check(pages.length > 0 && pages.every((b) => b.type === 'button'), `pager buttons are type="button" (${pages.length} rendered)`);
}

console.log('Source guard');
{
  const src = await readFile(resolve(root, 'js/nocturne.js'), 'utf8');
  const writes = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(l));
  // Allowed: the pager (page numbers only) and the calendar grid (dates and Intl month names only).
  const allowed = writes.filter(([, l]) => /el\.innerHTML = pageList\(|cal\.innerHTML =/.test(l));
  check(writes.length === allowed.length,
    'raw HTML is only written from numbers and dates' + (writes.length > allowed.length ? ': lines ' + writes.filter((w) => !allowed.includes(w)).map((w) => w[0]).join(', ') : ''));
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll DOM checks passed');
process.exitCode = failures ? 1 : 0;
