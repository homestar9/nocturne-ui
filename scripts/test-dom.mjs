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

console.log('Tab ink follows a tab that resizes on its own (NTN-32)');
{
  // jsdom has no layout and no ResizeObserver: stub both, then resize a tab without a window resize.
  const observed = new Set();
  let notify;
  globalThis.ResizeObserver = class { constructor(cb) { notify = cb; } observe(el) { observed.add(el); } };
  const { document } = await page(
    `<div class="ntn-tabs" role="tablist" id="t">
       <button class="ntn-tabs__tab" aria-selected="true">A</button>
       <button class="ntn-tabs__tab">B</button>
     </div>`);
  delete globalThis.ResizeObserver;
  const list = document.getElementById('t');
  const [a, b] = list.querySelectorAll('.ntn-tabs__tab');
  check(observed.has(list) && observed.has(a) && observed.has(b), 'the tab list and each of its tabs are observed');
  const box = { offsetLeft: 12, offsetWidth: 64, offsetHeight: 24, offsetTop: 0 };
  for (const [k, v] of Object.entries(box)) Object.defineProperty(a, k, { configurable: true, get: () => v });
  notify([{ target: a }]);
  check(list.style.getPropertyValue('--ntn-tab-w') === '64px' && list.style.getPropertyValue('--ntn-tab-x') === '12px',
    `a resize re-measures the ink (x ${list.style.getPropertyValue('--ntn-tab-x') || 'unset'}, w ${list.style.getPropertyValue('--ntn-tab-w') || 'unset'})`);
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

console.log('Combo form association (R7)');
{
  const opt = (v, label, sel = false) => `<li class="ntn-combo__option" role="option" data-value="${v}" aria-selected="${sel}">${label}</li>`;
  const combo = (attrs, opts) => `<div class="ntn-combo" data-ntn-combo ${attrs}>
       <button type="button" class="ntn-combo__trigger"><span class="ntn-combo__value" data-ntn-combo-value></span></button>
       <div class="ntn-combo__panel" hidden><ul class="ntn-combo__list">${opts}</ul></div></div>`;
  const { document, window, mod } = await page(
    `<form id="f">
       ${combo('id="tags" data-ntn-multi data-ntn-name="tags" data-ntn-max="5"', opt('a', 'Alpha', true) + opt('b', 'Beta') + opt('c', 'Gamma'))}
       ${combo('id="status" data-ntn-name="status"', opt('open', 'Open') + opt('closed', 'Closed'))}
       ${combo('id="loose"', opt('x', 'X', true))}
     </form>`);
  const form = document.getElementById('f');
  const data = () => new window.FormData(form);
  const pick = (id, v) => click(document.querySelector(`#${id} [data-value="${v}"]`));
  const changes = [];
  form.addEventListener('change', (e) => changes.push(e.target.id));

  check(JSON.stringify(data().getAll('tags')) === '["a"]', 'a multi combo posts its initial selection');
  check(data().has('status') && data().get('status') === '', 'a single combo with nothing chosen posts an empty value, like a <select>');
  check(!document.querySelector('#loose input'), 'a combo without data-ntn-name adds no inputs');
  pick('tags', 'c');
  check(JSON.stringify(data().getAll('tags')) === '["a","c"]', `picking adds a value (${JSON.stringify(data().getAll('tags'))})`);
  pick('status', 'closed');
  check(data().get('status') === 'closed' && data().getAll('status').length === 1, 'a single combo posts exactly one value');
  check(changes.join(',') === 'tags,status', `each pick fires a bubbling change the form hears (${changes.join(',')})`);
  click(document.querySelector('#tags [data-ntn-combo-clear="a"]'));
  check(JSON.stringify(data().getAll('tags')) === '["c"]', 'removing a chip drops its value');

  document.querySelector('#tags [data-value="b"]').setAttribute('aria-selected', 'true');
  mod.refresh(document.getElementById('tags'));
  check(JSON.stringify(data().getAll('tags')) === '["b","c"]', 'an app that changes aria-selected and calls refresh() gets matching inputs');

  form.reset();
  check(JSON.stringify(data().getAll('tags')) === '["a"]' && data().get('status') === '', 'form.reset() restores the first-rendered selection');
  check(document.querySelector('#tags [data-ntn-combo-value]').textContent.includes('Alpha'), '...and redraws the chips');
}

const picker = (attrs, foot = '') => `<div class="ntn-daterange" data-ntn-daterange ${attrs}>
     <button type="button" class="ntn-daterange__trigger" aria-expanded="false"><span class="ntn-daterange__value" data-ntn-daterange-label></span></button>
     <div class="ntn-daterange__panel" hidden>
       <div class="ntn-daterange__cals"><div class="ntn-daterange__cal" data-ntn-cal="0"></div></div>
       <footer class="ntn-daterange__foot">${foot}
         <button type="button" data-ntn-daterange-clear>Clear</button>
         <button type="button" data-ntn-daterange-cancel>Cancel</button>
         <button type="button" data-ntn-daterange-apply>Apply</button>
       </footer>
     </div>
   </div>`;

console.log('Date picker: set from code, clear, form association (NTN-21)');
{
  const { document, window, mod } = await page(
    `<form id="f">
       ${picker('id="range" data-ntn-name="when" data-ntn-start="2026-09-01" data-ntn-end="2026-09-20"')}
       ${picker('id="pub" data-ntn-single data-ntn-name="publish" data-ntn-start="2026-10-02" data-ntn-time="14:05"', '<input type="time" value="14:05" data-ntn-daterange-time>')}
     </form>`);
  const form = document.getElementById('f');
  const range = document.getElementById('range');
  const pub = document.getElementById('pub');
  const data = () => new window.FormData(form);
  const label = (r) => r.querySelector('[data-ntn-daterange-label]').textContent;
  const fullDay = (y, m, d) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(y, m - 1, d));
  const twoPm = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, 14, 5));
  const events = [];
  const changes = [];
  form.addEventListener('ntn:daterangechange', (e) => events.push(e.detail));
  form.addEventListener('change', (e) => changes.push(e.target.id));

  check(data().get('when') === '2026-09-01' && data().get('when-end') === '2026-09-20', 'a range posts x and x-end as ISO dates');
  check(data().get('publish') === '2026-10-02T14:05' && !data().has('publish-end'), 'a single date with a time posts one ISO date-time');
  check(label(pub) === `${fullDay(2026, 10, 2)} · ${twoPm}`, `the trigger shows the time the locale's way (${label(pub)})`);

  mod.setDateRange(range, { start: '2026-01-05', end: new Date(2026, 0, 9) });
  check(range.dataset.ntnStart === '2026-01-05' && range.dataset.ntnEnd === '2026-01-09', 'setDateRange() takes ISO strings or Dates and writes the attributes');
  check(label(range).includes(fullDay(2026, 1, 9)), `...re-renders the trigger (${label(range)})`);
  check(data().get('when') === '2026-01-05' && data().get('when-end') === '2026-01-09', '...and the form inputs');
  check(events.length === 0, 'setDateRange() fires no event, like setting an input value');
  mod.setDateRange(pub, { time: '08:00' });
  check(pub.dataset.ntnStart === '2026-10-02' && data().get('publish') === '2026-10-02T08:00', 'a part left out is kept');
  check(pub.querySelector('[data-ntn-daterange-time]').value === '08:00', 'the time input follows');

  range.dataset.ntnStart = '2026-03-01';
  range.dataset.ntnEnd = '2026-03-02';
  mod.refresh(range);
  check(data().get('when') === '2026-03-01' && label(range).includes(fullDay(2026, 3, 2)), 'changing the attributes and calling refresh(root) works too');

  click(pub.querySelector('.ntn-daterange__trigger'));
  click(pub.querySelector('[data-ntn-daterange-clear]'));
  const cleared = events.at(-1);
  check(cleared && cleared.start === null && cleared.end === null && cleared.time === null && cleared.startISO === null,
    'Clear fires ntn:daterangechange with null dates and time');
  check(pub.dataset.ntnStart === '' && !('ntnTime' in pub.dataset), 'Clear empties the attributes, the time included');
  check(data().has('publish') && data().get('publish') === '', 'a cleared picker posts an empty value');
  check(label(pub) === 'Select a date' && pub.querySelector('[data-ntn-daterange-label]').hasAttribute('data-empty'), 'the trigger shows its placeholder');
  check(pub.querySelector('.ntn-daterange__panel').hidden && pub.querySelector('.ntn-daterange__trigger').getAttribute('aria-expanded') === 'false', 'the panel closes');
  check(changes.join(',') === 'pub', `a commit fires a bubbling change the form hears (${changes.join(',')})`);

  click(range.querySelector('.ntn-daterange__trigger'));
  click(range.querySelector('[data-ntn-day="2026-03-10"]'));
  click(range.querySelector('[data-ntn-day="2026-03-12"]'));
  check(data().get('when') === '2026-03-01', 'a draft changes no input before Apply');
  click(range.querySelector('[data-ntn-daterange-apply]'));
  check(data().get('when') === '2026-03-10' && data().get('when-end') === '2026-03-12', 'Apply updates the inputs');

  form.reset();
  check(data().get('when') === '2026-09-01' && data().get('when-end') === '2026-09-20' && data().get('publish') === '2026-10-02T14:05',
    'form.reset() restores the first-rendered values');
  check(label(pub) === `${fullDay(2026, 10, 2)} · ${twoPm}`, '...and redraws the trigger');
}

console.log('Date picker opens in the top layer (NTN-21)');
{
  const { document, window, mod } = await page(picker('id="dr" data-ntn-start="2026-09-01" data-ntn-end="2026-09-20"'));
  // jsdom has no popover API, so stub one and re-run set-up.
  const shown = new Set();
  window.HTMLElement.prototype.showPopover = function () { shown.add(this); };
  window.HTMLElement.prototype.hidePopover = function () { shown.delete(this); };
  mod.refresh();
  const dr = document.getElementById('dr');
  const panel = dr.querySelector('.ntn-daterange__panel');
  check(panel.getAttribute('popover') === 'manual' && !panel.hidden, 'refresh() makes the panel a manual popover and drops the no-JS hidden');
  click(dr.querySelector('.ntn-daterange__trigger'));
  check(shown.has(panel), 'opening shows it in the top layer');
  check(/^\d+px$/.test(panel.style.left) && /^\d+px$/.test(panel.style.top), `...placed against the trigger in viewport pixels (${panel.style.left}, ${panel.style.top})`);
  document.body.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check(!shown.has(panel) && !dr.ntnRange.open, 'Escape hides it again');
}

console.log('Avatar hue (NTN-22)');
{
  const { document, mod } = await page('<span class="ntn-avatar" id="a" data-ntn-avatar-name="Ada Lovelace">AL</span>');
  // The documented vectors (skill/components.md): server-side twins test against these.
  const VECTORS = [['', 0], ['A', 65], ['Ada Lovelace', 235], ['Grace Hopper', 356], ['Zoë', 166], ['😀', 259]];
  const wrong = VECTORS.filter(([n, h]) => mod.avatarHue(n) !== h);
  check(!wrong.length, 'avatarHue() matches the documented vectors' + (wrong.length ? ': ' + wrong.map(([n]) => JSON.stringify(n)).join(' ') : ''));
  check(mod.default.avatarHue === mod.avatarHue, 'avatarHue is on the default export too');
  const a = document.getElementById('a');
  check(a.style.getPropertyValue('--ntn-avatar-hue') === '235', 'data-ntn-avatar-name sets --ntn-avatar-hue from the name');
  a.dataset.ntnAvatarName = 'Grace Hopper';
  mod.refresh(a);
  check(a.style.getPropertyValue('--ntn-avatar-hue') === '356', 'refresh(el) follows a changed name');
}

console.log('Toast (NTN-23)');
{
  const { document, window, mod } = await page('<button id="before">Before</button><dialog id="dlg"><button id="in">In</button></dialog>');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const closes = [];
  document.addEventListener('ntn:toastclose', (e) => closes.push(e.detail.reason));
  const regions = () => document.querySelectorAll('.ntn-toaster');
  const live = (el) => el.isConnected && !el.hasAttribute('data-ntn-leaving');

  check(regions().length === 0, 'importing the module creates no toast region');
  const a = mod.toast({ title: EVIL, message: EVIL, tone: 'success' });
  check(regions().length === 1 && a.element.parentElement === regions()[0], 'the first toast creates its region');
  check(regions()[0].dataset.ntnPlacement === 'top-end' && regions()[0].getAttribute('aria-label') === 'Notifications', 'top-end by default, labelled Notifications');
  check(!a.element.querySelector('img') && window.pwned === undefined, 'title and message are never parsed as HTML');
  check(a.element.querySelector('.ntn-toast__title').textContent === EVIL && a.element.querySelector('.ntn-toast__message').textContent === EVIL, '...they are the literal text');
  check(a.element.classList.contains('ntn-toast--success') && a.element.querySelector('.ntn-toast__icon.fa-circle-check'), 'a tone adds its modifier and icon');
  const close = a.element.querySelector('.ntn-toast__close');
  check(close && close.type === 'button' && close.getAttribute('aria-label') === 'Dismiss' && close.querySelector('.fa-xmark'), 'the close button is a labelled button drawn with the close icon');
  const b = mod.toast('Saved');
  check(regions().length === 1 && b.element.parentElement === regions()[0], 'a second toast reuses the region');
  mod.toast({ message: 'x', placement: 'bottom-start' });
  check(regions().length === 2 && document.querySelector('.ntn-toaster[data-ntn-placement="bottom-start"]'), 'each placement gets its own region');
  await wait(80);
  const polite = document.querySelector('.ntn-toaster__live[aria-live="polite"]');
  check(polite && polite.textContent === 'x', `the polite live region announces the newest (${polite && polite.textContent})`);
  const d = mod.toast({ message: 'Failed', tone: 'danger', duration: 0 });
  await wait(80);
  const assertive = document.querySelector('.ntn-toaster__live[aria-live="assertive"]');
  check(assertive && assertive.textContent === 'Failed' && !d.element.hasAttribute('role'), 'a danger toast is announced assertively, once (the toast itself is not live)');

  click(close);
  check(closes.at(-1) === 'dismiss' && a.element.hasAttribute('data-ntn-leaving'), 'the close button dismisses (reason "dismiss")');
  b.close();
  check(closes.at(-1) === 'api', 'handle.close() closes (reason "api")');
  await wait(220);
  check(!a.element.isConnected && !b.element.isConnected, 'closed toasts leave the DOM after their exit');

  const s = mod.toast({ message: 'slow', duration: 100 });
  s.element.dispatchEvent(new window.MouseEvent('mouseenter'));
  await wait(160);
  check(live(s.element) && s.element.hasAttribute('data-ntn-paused'), 'hovering pauses the timer');
  s.element.dispatchEvent(new window.MouseEvent('mouseleave'));
  await wait(160);
  check(!live(s.element) && closes.at(-1) === 'timeout', 'leaving resumes it, and it times out (reason "timeout")');

  const f = mod.toast({ message: 'focus', duration: 100 });
  const before = document.getElementById('before');
  before.focus();
  f.element.querySelector('.ntn-toast__close').focus();
  await wait(160);
  check(live(f.element), 'keyboard focus inside pauses the timer');
  document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  check(!live(f.element) && closes.at(-1) === 'dismiss', 'Escape closes the focused toast');
  check(document.activeElement === before, 'focus goes back to where it was before the toast');

  check(live(d.element), 'duration: 0 stays until dismissed');
  closes.length = 0;
  const many = Array.from({ length: 7 }, (_, i) => mod.toast({ message: 'n' + i, duration: 0 }));
  const shown = [...regions()[0].querySelectorAll('.ntn-toast')].filter(live);
  check(shown.length === 5 && !live(many[0].element) && !live(many[1].element) && live(many[6].element),
    `the stack caps at 5 and drops the oldest (${shown.length} shown)`);
  check(closes.filter((r) => r === 'overflow').length === 3, `the dropped ones close with reason "overflow" (${closes.join(',')})`);

  // jsdom has no :modal, so stand in for showModal() / close() on this one dialog.
  const dlg = document.getElementById('dlg');
  const matches = window.Element.prototype.matches;
  dlg.matches = (sel) => (sel === ':modal' ? dlg.open : matches.call(dlg, sel));
  dlg.setAttribute('open', '');
  const m = mod.toast({ message: 'in the modal', duration: 0 });
  check(m.element.closest('dialog') === dlg, 'while a modal is open, the toast mounts inside it (outside is inert)');
  check(dlg.querySelector('.ntn-toaster__live[aria-live="polite"]'), '...with its own live region, since the page is hidden from assistive tech');
  dlg.removeAttribute('open');
  dlg.dispatchEvent(new window.Event('close'));
  check(live(m.element) && !m.element.closest('dialog') && m.element.closest('.ntn-toaster').parentElement === document.body,
    'when the modal closes, its toasts move to the page');
}

console.log('Drop area (NTN-24)');
{
  const { document, window } = await page(
    `<label class="ntn-dropzone" data-ntn-dropzone id="dz">
       <input type="file" multiple id="dz-input">
       <span class="ntn-dropzone__icon"><i class="fa-light fa-cloud-arrow-up"></i></span>
       <span class="ntn-dropzone__title" id="dz-title">Drop files</span>
     </label>
     <label class="ntn-dropzone" data-ntn-dropzone aria-disabled="true" id="off"><span id="off-title">Off</span></label>`);
  // jsdom has no DragEvent; a plain event with a dataTransfer stands in.
  const drag = (el, type, types = ['Files'], files = []) => {
    const e = new window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'dataTransfer', { value: { types, files } });
    el.dispatchEvent(e);
    return e;
  };
  const dz = document.getElementById('dz');
  const title = document.getElementById('dz-title');
  const input = document.getElementById('dz-input');
  const on = () => dz.hasAttribute('data-ntn-dragover');
  const got = [];
  document.addEventListener('ntn:files', (e) => got.push(e.detail.files.map((f) => f.name).join(',')));

  drag(dz, 'dragenter');
  check(on(), 'a file drag entering the area sets data-ntn-dragover');
  drag(title, 'dragenter');
  drag(dz, 'dragleave');
  check(on(), 'moving onto a child (enter child, leave parent) keeps it');
  drag(title, 'dragleave');
  check(!on(), 'leaving the last one clears it');

  drag(dz, 'dragenter', ['text/plain']);
  check(!on(), 'a drag without files (a tree row) is ignored');
  check(!drag(dz, 'dragover', ['text/plain']).defaultPrevented, '...and its dragover is left alone');
  check(drag(dz, 'dragover').defaultPrevented, 'a file dragover is accepted, so a near miss never opens the file');

  drag(dz, 'dragenter');
  const dropped = drag(title, 'drop', ['Files'], [{ name: 'a.png' }, { name: 'b.pdf' }]);
  check(!on() && dropped.defaultPrevented && got.at(-1) === 'a.png,b.pdf', `a drop beside the input clears the state and fires ntn:files (${got.at(-1)})`);
  drag(dz, 'dragenter');
  const native = drag(input, 'drop', ['Files'], [{ name: 'c.png' }]);
  check(!on() && !native.defaultPrevented && got.length === 1, 'a drop on the input is left to the browser (its change fires ntn:files)');
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
  check(got.length === 2 && got.at(-1) === '', 'picking files fires ntn:files once, with the input\'s files');

  const off = document.getElementById('off');
  drag(off, 'dragenter');
  check(!off.hasAttribute('data-ntn-dragover'), 'an aria-disabled area ignores drags');
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

console.log('Tree keyboard moves are handle-gated (NTN-25)');
{
  const item = (id, grip) => `<div class="ntn-tree__item" role="treeitem" data-ntn-id="${id}"><div class="ntn-tree__row">` +
    (grip ? '<span class="ntn-tree__grip" aria-hidden="true"></span>' : '') + `<span class="ntn-tree__label">${id}</span></div></div>`;
  const { document, window } = await page(
    `<div class="ntn-tree" role="tree" id="ro" data-ntn-tree>${item('a', false)}${item('b', false)}</div>
     <div class="ntn-tree" role="tree" id="rw" data-ntn-tree>${item('c', true)}${item('d', true)}</div>`);
  const moves = [];
  document.addEventListener('ntn:treemove', (e) => moves.push(e.detail));
  const order = (id) => [...document.querySelectorAll(`#${id} > .ntn-tree__item`)].map((i) => i.dataset.ntnId).join('');
  const altDown = (el) => {
    el.focus();
    const e = new window.KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e;
  };

  const ro = altDown(document.querySelector('[data-ntn-id="a"]'));
  check(order('ro') === 'ab' && moves.length === 0, 'alt+↓ on a grip-less tree leaves the order alone and fires no ntn:treemove');
  check(!ro.defaultPrevented, '...and leaves the key to the browser');
  const c = document.querySelector('[data-ntn-id="c"]');
  const rw = altDown(c);
  check(order('rw') === 'dc' && moves.length === 1 && moves[0].position === 'after' && rw.defaultPrevented,
    `with grips, alt+↓ still moves (${order('rw')}, ${moves.length} event)`);
  check(document.activeElement === c, 'the moved item keeps focus');
}

console.log('Tree Enter follows a label link (NTN-26)');
{
  const { document, window } = await page(
    `<div class="ntn-tree" role="tree" data-ntn-tree>
       <div class="ntn-tree__item" role="treeitem" aria-expanded="false" data-ntn-id="a">
         <div class="ntn-tree__row"><a class="ntn-tree__label" href="#a" tabindex="-1">A</a></div>
         <div class="ntn-tree__group" role="group">
           <div class="ntn-tree__item" role="treeitem" data-ntn-id="a1"><div class="ntn-tree__row"><span class="ntn-tree__label">A1</span></div></div>
         </div>
       </div>
       <div class="ntn-tree__item" role="treeitem" aria-expanded="false" data-ntn-id="b">
         <div class="ntn-tree__row"><span class="ntn-tree__label">B</span></div>
         <div class="ntn-tree__group" role="group">
           <div class="ntn-tree__item" role="treeitem" data-ntn-id="b1"><div class="ntn-tree__row"><span class="ntn-tree__label">B1</span></div></div>
         </div>
       </div>
     </div>`);
  const enter = (el) => {
    el.focus();
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  };
  const a = document.querySelector('[data-ntn-id="a"]');
  const b = document.querySelector('[data-ntn-id="b"]');
  let clicks = 0;
  document.querySelector('a.ntn-tree__label').addEventListener('click', () => clicks++);
  let toggles = 0;
  document.addEventListener('ntn:treetoggle', () => toggles++);

  enter(a);
  check(clicks === 1, `↵ clicks the row's label link once (${clicks})`);
  check(a.getAttribute('aria-selected') === 'true' && a.getAttribute('aria-expanded') === 'true' && toggles === 1,
    `...which selects the item and opens the folder exactly once (${toggles} toggle)`);
  enter(b);
  check(clicks === 1 && b.getAttribute('aria-selected') === 'true' && b.getAttribute('aria-expanded') === 'true',
    'a row without a link still selects and toggles on ↵');
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

console.log('Kitchen sink code view (NTN-1)');
{
  const raw = await readFile(resolve(root, 'examples/kitchen-sink.html'), 'utf8');
  check(/<script src="sink-code\.js"><\/script>\s*<\/body>/.test(raw),
    'sink-code.js is a plain classic script at the end of <body>, so it reads the markup before nocturne.js runs');
  // The page's own scripts are stripped: none of them is under test, and nocturne.js never loads here.
  const dom = new JSDOM(raw.replace(/<script\b[\s\S]*?<\/script>/g, ''),
    { runScripts: 'outside-only', url: 'http://localhost/examples/kitchen-sink.html' });
  const { window } = dom;
  const document = window.document;
  let copied = null;
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async (t) => { copied = t; } } });
  window.eval(await readFile(resolve(root, 'examples/sink-code.js'), 'utf8'));

  const sections = [...document.querySelectorAll('.sink')];
  const bare = sections.filter((s) => !s.querySelector('[data-sink-example]')).map((s) => s.id);
  check(sections.length > 0 && !bare.length, `every section marks at least one example${bare.length ? ' (missing: ' + bare.join(', ') + ')' : ''}`);
  const toggles = sections.map((s) => s.querySelectorAll('.sink__head .sink__codetoggle'));
  check(toggles.every((t) => t.length === 1), 'every section head gets exactly one Code button');
  const pairs = toggles.map((t) => [t[0], document.getElementById(t[0]?.getAttribute('aria-controls'))]);
  check(pairs.every(([b, p]) => p && b.getAttribute('aria-expanded') === 'false' && p.hidden), 'code is off by default: every panel starts hidden');

  const code = [...document.querySelectorAll('.sink__pre')].map((p) => p.textContent);
  const dirty = code.filter((c) => !c.trim() || /sink__|data-sink|=""/.test(c));
  check(code.length >= sections.length && !dirty.length,
    `${code.length} snippets, none empty or carrying page chrome${dirty.length ? ': ' + dirty[0].slice(0, 80) : ''}`);
  check(document.querySelector('.sink__pre .sink__tok-tag') && document.querySelector('.sink__pre .sink__tok-attr'), 'snippets are coloured');

  const [button, panel] = pairs[0];
  button.click();
  check(!panel.hidden && button.getAttribute('aria-expanded') === 'true', 'a Code button opens its own panel');
  check(pairs.slice(1).every(([, p]) => p.hidden), '...and no other');
  button.click();
  const all = document.getElementById('code-toggle');
  all.click();
  check(pairs.every(([b, p]) => !p.hidden && b.getAttribute('aria-expanded') === 'true') && all.getAttribute('aria-pressed') === 'true',
    'the top-bar button opens every panel');
  all.click();
  check(pairs.every(([, p]) => p.hidden) && all.getAttribute('aria-pressed') === 'false', '...and closes them again');

  const pre = panel.querySelector('.sink__pre');
  panel.querySelector('.sink__snippet-head button').click();
  await new Promise((r) => setTimeout(r, 0));
  check(copied === pre.textContent, 'Copy puts the snippet text on the clipboard');
  window.close();
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
