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
  'Node', 'HTMLElement', 'getComputedStyle', 'addEventListener', 'removeEventListener', 'requestAnimationFrame',
  'innerWidth', 'innerHeight', 'FocusEvent'];

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

console.log('Icons come from a pluggable renderer (M6)');
{
  const { document, mod } = await page(
    `<button data-ntn-theme-toggle><i data-ntn-theme-icon></i></button>
     <div class="ntn-combo" data-ntn-combo data-ntn-multi>
       <button class="ntn-combo__trigger"><span class="ntn-combo__value" data-ntn-combo-value></span></button>
       <ul><li class="ntn-combo__option" data-value="a" aria-selected="true">Alpha</li></ul>
     </div>`, { html: 'data-theme="dark"' });
  check(document.querySelector('.ntn-combo__chip-x i.fa-light.fa-xmark'), 'default renderer draws Font Awesome Light');
  mod.configure({ icon: (key) => { const i = document.createElement('i'); i.className = 'app-icon'; i.dataset.icon = key; return i; } });
  mod.refresh();
  check(document.querySelector('.ntn-combo__chip-x i.app-icon[data-icon="close"]') && !document.querySelector('.ntn-combo__chip-x .fa-xmark'),
    'after configure({ icon }) + refresh(), chip remove uses the app renderer');
  const themeIcon = document.querySelector('[data-ntn-theme-icon]');
  check(themeIcon && themeIcon.dataset.icon === 'theme-light', 'theme toggle icon uses the app renderer (a sun while dark)');
}

console.log('Tabs announce real changes only, and refresh() is quiet (R13)');
{
  const { document, mod } = await page(
    `<form><div class="ntn-tabs" role="tablist" id="t">
       <button class="ntn-tabs__tab" data-value="a" data-ntn-panel="#pa" aria-selected="true">A</button>
       <button class="ntn-tabs__tab" data-value="b" data-ntn-panel="#pb">B</button>
     </div></form>
     <section id="pa">A</section><section id="pb" hidden>B</section>`);
  const events = [];
  document.addEventListener('ntn:tabchange', (e) => events.push(`${e.detail.value}${e.detail.initial ? ':initial' : ''}`));
  // start() already ran on import (before the listener), so re-run the set-up path explicitly.
  mod.refresh();
  mod.refresh(document.getElementById('t'));
  check(events.length === 0, `refresh() after start does not re-announce (events: ${events.join(',') || 'none'})`);
  const tabs = document.querySelectorAll('.ntn-tabs__tab');
  check([...tabs].every((t) => t.getAttribute('type') === 'button'), 'tab buttons get type="button", so a tab never submits its form');
  click(tabs[1]);
  check(events.join(',') === 'b', `clicking another tab announces it once (events: ${events.join(',')})`);
  check(document.getElementById('pb').hidden === false && document.getElementById('pa').hidden === true, 'the chosen panel shows');
  click(tabs[1]);
  check(events.join(',') === 'b', 'clicking the already-selected tab announces nothing');
}
{
  // A list first seen by refresh() (rendered after start) is announced once, marked initial.
  const { document, mod } = await page('<div id="host"></div>');
  const events = [];
  document.addEventListener('ntn:tabchange', (e) => events.push(`${e.detail.value}${e.detail.initial ? ':initial' : ''}`));
  document.getElementById('host').innerHTML =
    `<div class="ntn-tabs" role="tablist"><button class="ntn-tabs__tab" data-value="x" data-ntn-panel="#px" aria-selected="true">X</button></div><section id="px">X</section>`;
  mod.refresh(document.getElementById('host'));
  mod.refresh(document.getElementById('host'));
  check(events.join(',') === 'x:initial', `a newly rendered list is announced once with initial (events: ${events.join(',')})`);
}

console.log('Dropdown and popover (R1, R2)');
{
  const { document, window, mod } = await page(
    `<form id="f">
       <div class="ntn-dropdown" data-ntn-dropdown id="dd">
         <button class="ntn-btn" aria-haspopup="dialog">Filters</button>
         <div class="ntn-popover" role="dialog" data-ntn-owner=".picker">
           <input name="q"><button type="button" data-ntn-close>Apply</button>
         </div>
       </div>
     </form>
     <div class="picker"><button type="button" id="day">5</button></div>
     <button type="button" id="outside">Elsewhere</button>`);
  const dd = document.getElementById('dd');
  const trigger = dd.querySelector('[aria-haspopup]');
  const panel = dd.querySelector('.ntn-popover');
  const events = [];
  dd.addEventListener('ntn:dropdownshow', () => events.push('show'));
  dd.addEventListener('ntn:dropdownhide', () => events.push('hide'));
  const isOpen = () => dd.hasAttribute('data-ntn-open');
  const pointer = (el) => el.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));

  check(trigger.getAttribute('aria-controls') === panel.id && trigger.type === 'button', 'set-up wires aria-controls and type="button" on the trigger');
  click(trigger);
  check(isOpen() && trigger.getAttribute('aria-expanded') === 'true', 'clicking the trigger opens it');
  check(document.activeElement === panel.querySelector('input'), 'the first field receives focus');
  pointer(document.getElementById('day'));
  check(isOpen(), 'a pointerdown inside the data-ntn-owner element keeps it open');
  pointer(panel.querySelector('input'));
  check(isOpen(), 'a pointerdown inside the panel keeps it open');
  pointer(document.getElementById('outside'));
  check(!isOpen() && trigger.getAttribute('aria-expanded') === 'false', 'a pointerdown elsewhere closes it');

  mod.open(dd);
  click(panel.querySelector('[data-ntn-close]'));
  check(!isOpen() && document.activeElement === trigger, 'data-ntn-close closes it and focus returns to the trigger');
  check(panel.closest('form') === document.getElementById('f'), 'the panel stays inside its form');

  mod.open(trigger);
  panel.querySelector('input').dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: document.getElementById('outside') }));
  check(!isOpen(), 'focus leaving the dropdown closes it');
  mod.toggle(dd); mod.toggle(dd);
  check(!isOpen(), 'toggle() opens and closes');
  check(events.join(',') === 'show,hide,show,hide,show,hide,show,hide', `show/hide events fire in pairs (${events.join(',')})`);
}

console.log('Sidebar drawer on a phone (R11)');
{
  const { document, window } = await page(
    `<aside class="ntn-sidebar" id="sb"><nav class="ntn-sidebar__nav">
       <a class="ntn-sidebar__item" href="#a">A</a><a class="ntn-sidebar__item" href="#b" aria-current="page">B</a>
     </nav></aside>
     <div class="ntn-sidebar__scrim"></div>
     <button type="button" data-ntn-toggle=".ntn-sidebar" aria-expanded="false">Menu</button>`);
  const sb = document.getElementById('sb');
  const toggle = document.querySelector('[data-ntn-toggle]');
  const key = (k) => document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));
  let phone = false;
  globalThis.matchMedia = (q) => ({ matches: phone && q === '(max-width: 720px)', media: q, addEventListener() {}, removeEventListener() {} });

  click(toggle);
  check(sb.hasAttribute('data-collapsed') && !sb.hasAttribute('data-open'), 'wide screen: the toggle collapses to the rail, as before');
  click(toggle);

  phone = true;
  toggle.focus();
  click(toggle);
  check(sb.hasAttribute('data-open') && !sb.hasAttribute('data-collapsed'), 'phone: the same toggle opens the drawer instead');
  check(toggle.getAttribute('aria-expanded') === 'true', 'the toggle reports aria-expanded="true"');
  check(document.activeElement === sb.querySelector('[aria-current="page"]'), 'focus moves to the current item');
  key('Escape');
  check(!sb.hasAttribute('data-open') && document.activeElement === toggle, 'Escape closes it and returns focus to the toggle');
  click(toggle);
  click(document.querySelector('.ntn-sidebar__scrim'));
  check(!sb.hasAttribute('data-open') && toggle.getAttribute('aria-expanded') === 'false', 'a click on the scrim closes it');
  delete globalThis.matchMedia;
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
  // Allowed: the pager (page numbers only) and the calendar grid (dates and weekday initials only).
  const allowed = writes.filter(([, l]) => /el\.innerHTML = pageList\(|grid\.innerHTML = DOW/.test(l));
  check(writes.length === allowed.length,
    'raw HTML is only written from numbers and dates' + (writes.length > allowed.length ? ': lines ' + writes.filter((w) => !allowed.includes(w)).map((w) => w[0]).join(', ') : ''));
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll DOM checks passed');
process.exitCode = failures ? 1 : 0;
