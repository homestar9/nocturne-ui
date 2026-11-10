/* Nocturne behaviours — optional, dependency-free progressive enhancement.
   Every component works without this file; these hooks cover the interactions
   CSS alone cannot express. Markup opts in with data-ntn-* attributes.

   <script type="module" src=".../nocturne.js"></script>
*/

const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Build an element from plain values. Strings become TEXT nodes and attributes are set with
   setAttribute, so nothing is ever parsed as HTML — labels and values can be user data. */
function make(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}
/* Icons the behaviours draw themselves, by SEMANTIC key. The default renders Font Awesome Light;
   an app with its own icon system calls configure({ icon: (key) => element }) and then refresh(). */
const FA_ICONS = {
  close: 'xmark', prev: 'chevron-left', next: 'chevron-right', 'theme-light': 'sun', 'theme-dark': 'moon',
  success: 'circle-check', warning: 'triangle-exclamation', danger: 'circle-exclamation', info: 'circle-info',
};
let renderIcon = (key) => make('i', { class: 'fa-light fa-' + (FA_ICONS[key] || key), 'aria-hidden': 'true' });

/**
 * Swap how nocturne.js renders the icons it creates (chip remove, calendar arrows, theme toggle,
 * toasts).
 * @param {{ icon?: (key: string) => Element }} options  Keys: close, prev, next, theme-light,
 *   theme-dark, and the toast tones success, warning, danger, info.
 */
export function configure({ icon } = {}) {
  if (typeof icon === 'function') renderIcon = icon;
}

const STORE = 'ntn-theme';
const target = (el, attr) => {
  const v = el.getAttribute(attr);
  return v ? document.querySelector(v) : null;
};

/* ── Theme ───────────────────────────────────────────────────────────────────
   'dark' | 'light' | 'auto'. 'auto' follows the OS and is resolved here, so the
   CSS only ever sees a concrete data-theme value. The choice persists in
   localStorage under 'ntn-theme'. */

const mql = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
const systemTheme = () => (mql && mql.matches ? 'light' : 'dark');

function read() {
  try { return localStorage.getItem(STORE); } catch (e) { return null; }
}

/** The theme currently painted: 'dark' or 'light'. */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** The stored preference: 'dark', 'light', or 'auto'. */
export function getThemePreference() {
  return read() || document.documentElement.dataset.theme || 'dark';
}

/** Set 'dark' | 'light' | 'auto'. Persists, then paints. */
export function setTheme(pref) {
  const resolved = pref === 'auto' ? systemTheme() : pref === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolved);
  try { localStorage.setItem(STORE, pref); } catch (e) { /* private mode */ }
  syncThemeControls(resolved);
  document.dispatchEvent(new CustomEvent('ntn:themechange', { detail: { theme: resolved, preference: pref } }));
  return resolved;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

function syncThemeControls(theme) {
  $$('[data-ntn-theme-toggle]').forEach((el) => {
    el.setAttribute('aria-pressed', String(theme === 'light'));
    const icon = el.querySelector('[data-ntn-theme-icon]');
    if (icon) {
      // Shows the mode a click switches TO: a moon while light, a sun while dark.
      const next = renderIcon(theme === 'light' ? 'theme-dark' : 'theme-light');
      next.setAttribute('data-ntn-theme-icon', '');
      icon.replaceWith(next);
    }
  });
  $$('[data-ntn-theme-set]').forEach((el) => {
    el.setAttribute('aria-selected', String(el.getAttribute('data-ntn-theme-set') === getThemePreference()));
  });
}

/* Opt-out for apps that own light/dark themselves: <html data-ntn-theme-control="manual">,
   rendered by the server (it is read when this module starts, i.e. on import). Nocturne then
   never reads or writes data-theme or its storage key, adds no OS listener, and ignores its own
   theme controls. setTheme() and toggleTheme() still work when called directly. */
let themeManaged = true;
const themeIsManual = () => document.documentElement.getAttribute('data-ntn-theme-control') === 'manual';

function initTheme() {
  const pref = read() || document.documentElement.dataset.theme || 'dark';
  const resolved = pref === 'auto' ? systemTheme() : pref === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolved);
  syncThemeControls(resolved);
  if (mql && mql.addEventListener) {
    mql.addEventListener('change', () => { if (getThemePreference() === 'auto') setTheme('auto'); });
  }
}

/* Range fill + live value readout. */
function syncSlider(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const pct = max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100;
  const block = input.closest('.ntn-slider');
  (block || input).style.setProperty('--ntn-slider-pct', pct + '%');
  const out = block && block.querySelector('.ntn-slider__value');
  if (out) out.textContent = input.value + (out.dataset.unit || '');
}

/* Progress from data-value (keeps percentages out of the markup's style attr). Publishes
   --ntn-progress on the block (a state var any kit can read) and the progressbar ARIA values. */
function syncProgress(fill) {
  const max = Number(fill.dataset.max || 100);
  const value = Number(fill.dataset.value || 0);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const block = fill.closest('.ntn-progress') || fill;
  block.style.setProperty('--ntn-progress', pct + '%');
  if (!block.hasAttribute('role')) block.setAttribute('role', 'progressbar');
  block.setAttribute('aria-valuemin', '0');
  block.setAttribute('aria-valuemax', String(max));
  block.setAttribute('aria-valuenow', String(value));
}

/* ── Tabs ────────────────────────────────────────────────────────────────────
   data-ntn-panel on a tab points at the panel it reveals. One tab sits in the
   tab order at a time and the arrow keys move between them (automatic
   activation — the pattern ARIA recommends when panels are cheap to show).
   The ink bar is one sliding element: we measure the selected tab, publish
   --ntn-tab-x/-w, and flag the list so the per-tab underline fallback yields. */

const tabAll = (list) => $$('.ntn-tabs__tab', list);
const tabEnabled = (list) => tabAll(list).filter((t) => !t.disabled && t.getAttribute('aria-disabled') !== 'true');

function tabInk(list) {
  const tab = list.querySelector('.ntn-tabs__tab[aria-selected="true"]');
  if (!tab) return;
  /* Measuring before layout settles (first paint, late font swap) yields 0 —
     publishing that would hide both the ink bar AND the CSS fallback, so the
     flag only goes on once a real measurement exists. */
  if (!tab.offsetWidth || !tab.offsetHeight) return;
  if (tabsVertical(list)) {
    list.style.setProperty('--ntn-tab-y', tab.offsetTop + 'px');
    list.style.setProperty('--ntn-tab-h', tab.offsetHeight + 'px');
  } else {
    list.style.setProperty('--ntn-tab-x', tab.offsetLeft + 'px');
    list.style.setProperty('--ntn-tab-w', tab.offsetWidth + 'px');
    /* Keep the selected tab inside the scroll rail without scrollIntoView. */
    const pad = 24;
    if (tab.offsetLeft < list.scrollLeft + pad) list.scrollLeft = Math.max(0, tab.offsetLeft - pad);
    else if (tab.offsetLeft + tab.offsetWidth > list.scrollLeft + list.clientWidth - pad) list.scrollLeft = tab.offsetLeft + tab.offsetWidth - list.clientWidth + pad;
  }
  list.setAttribute('data-ntn-ink', '');
}

/* An ink (the tabs' indicator, a pill toggle group's sliding pill) can change size with no window
   resize: density switched live, a container resizing, a label changing. Watching each host and
   its items re-measures the ink whenever one does. */
const INK_HOSTS = '.ntn-tabs, .ntn-toggle-group--pill';
let inkResize;
function observeInk(host, items) {
  if (typeof ResizeObserver !== 'function') return;
  if (!inkResize) {
    inkResize = new ResizeObserver((entries) => {
      new Set(entries.map((e) => e.target.closest(INK_HOSTS))).forEach((h) => {
        if (h) (h.classList.contains('ntn-tabs') ? tabInk : toggleInk)(h);
      });
    });
  }
  [host, ...items].forEach((el) => inkResize.observe(el));
}

/* Tab lists already announced once, so a later refresh() never re-fires ntn:tabchange. */
const announcedTabs = new WeakSet();

/**
 * Selects a tab (and shows its panel). Announces ntn:tabchange only when the selection really
 * changes, or once with detail.initial when a list is first set up.
 */
function selectTab(tab, focus, { announce = true, initial = false } = {}) {
  const list = tab.closest('.ntn-tabs');
  if (!list) return;
  const changed = list.querySelector('.ntn-tabs__tab[aria-selected="true"]') !== tab;
  tabAll(list).forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = target(t, 'data-ntn-panel');
    if (!panel) return;
    panel.hidden = !on;
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'tabpanel');
    if (t.id) panel.setAttribute('aria-labelledby', t.id);
    if (panel.id) t.setAttribute('aria-controls', panel.id);
  });
  tabInk(list);
  if (focus === true) tab.focus();
  if (announce && (changed || initial)) {
    list.dispatchEvent(new CustomEvent('ntn:tabchange', { bubbles: true, detail: { value: tab.dataset.value || tab.textContent.trim(), tab, initial } }));
  }
}

/* Vertical tabs are declared with aria-orientation="vertical" (the --vertical modifier still works). */
const tabsVertical = (list) => list.getAttribute('aria-orientation') === 'vertical' || list.classList.contains('ntn-tabs--vertical');

function setupTabs(list) {
  if (list.classList.contains('ntn-tabs--vertical') && !list.hasAttribute('aria-orientation')) list.setAttribute('aria-orientation', 'vertical');
  const tabs = tabAll(list);
  if (!tabs.length) return;
  if (!tabs.some((t) => t.getAttribute('aria-selected') === 'true')) tabs[0].setAttribute('aria-selected', 'true');
  tabs.forEach((t) => {
    if (!t.hasAttribute('role')) t.setAttribute('role', 'tab');
    // A tab never submits the form it sits in.
    if (t.tagName === 'BUTTON' && !t.hasAttribute('type')) t.type = 'button';
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
  });
  observeInk(list, tabs);
  const sel = list.querySelector('.ntn-tabs__tab[aria-selected="true"]');
  const first = !announcedTabs.has(list);
  announcedTabs.add(list);
  if (sel && sel.hasAttribute('data-ntn-panel')) selectTab(sel, false, { announce: first, initial: first });
  else tabInk(list);
}

function onTabKey(tab, e) {
  const list = tab.closest('.ntn-tabs');
  const vertical = tabsVertical(list);
  const tabs = tabEnabled(list);
  const i = tabs.indexOf(tab);
  let to = -1;
  if (e.key === (vertical ? 'ArrowDown' : 'ArrowRight')) to = (i + 1) % tabs.length;
  else if (e.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) to = (i - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') to = 0;
  else if (e.key === 'End') to = tabs.length - 1;
  else return;
  e.preventDefault();
  selectTab(tabs[to], true);
}

/* ── Tree view ───────────────────────────────────────────────────────────────
   Nested .ntn-tree__item elements; the item carries role="treeitem", the focus
   and the expanded/selected state, its > .ntn-tree__group holds the children.
   Dragging is handle-gated: the item only becomes draggable while the pointer
   is down on its grip, so label text stays selectable and rows stay clickable.
   Drop intent comes from where in the row the pointer sits — the outer thirds
   insert above or below, the middle drops inside (the indicator-line idiom
   every desktop tree uses). */

const treeRow = (item) => item.querySelector(':scope > .ntn-tree__row');
const treeGroup = (item) => item.querySelector(':scope > .ntn-tree__group');
const treeKids = (item) => { const g = treeGroup(item); return g ? $$(':scope > .ntn-tree__item', g) : []; };
const treeId = (item) => item.dataset.ntnId || (treeRow(item) ? treeRow(item).querySelector('.ntn-tree__label') : null)?.textContent.trim() || '';
const treeOpen = (item) => item.getAttribute('aria-expanded') === 'true';

function treeVisible(root) {
  return $$('.ntn-tree__item', root).filter((it) => !it.parentElement.closest('.ntn-tree__item[aria-expanded="false"]'));
}

/* Rebuild the structural bits markup cannot keep in sync through a move:
   empty groups go, leaves lose their twisty, new parents gain one. */
function treeSync(root) {
  $$('.ntn-tree__item', root).forEach((item) => {
    const g = treeGroup(item);
    const branch = !!(g && g.querySelector(':scope > .ntn-tree__item'));
    if (g && !branch) g.remove();
    if (!item.hasAttribute('role')) item.setAttribute('role', 'treeitem');
    if (branch && !item.hasAttribute('aria-expanded')) item.setAttribute('aria-expanded', 'true');
    if (!branch) item.removeAttribute('aria-expanded');
    const row = treeRow(item);
    const twisty = row && row.querySelector('.ntn-tree__twisty');
    if (twisty) twisty.classList.toggle('ntn-tree__twisty--leaf', !branch);
    if (item.tabIndex !== 0) item.tabIndex = -1;
  });
  const items = treeVisible(root);
  if (items.length && !items.some((i) => i.tabIndex === 0)) {
    (root.querySelector('.ntn-tree__item[aria-selected="true"]') || items[0]).tabIndex = 0;
  }
}

function treeFocus(item) {
  const root = item.closest('.ntn-tree');
  $$('.ntn-tree__item', root).forEach((i) => { i.tabIndex = i === item ? 0 : -1; });
  item.focus();
}

function treeToggle(item, force) {
  if (!treeGroup(item)) return false;
  const next = force === undefined ? !treeOpen(item) : force;
  if (next === treeOpen(item)) return false;
  item.setAttribute('aria-expanded', String(next));
  item.dispatchEvent(new CustomEvent('ntn:treetoggle', { bubbles: true, detail: { id: treeId(item), expanded: next, item } }));
  return true;
}

function treeSelect(item, additive) {
  const root = item.closest('.ntn-tree');
  const multi = root.hasAttribute('data-ntn-multi');
  if (!multi || !additive) $$('.ntn-tree__item[aria-selected="true"]', root).forEach((i) => { if (i !== item) i.removeAttribute('aria-selected'); });
  if (multi && additive && item.getAttribute('aria-selected') === 'true') item.removeAttribute('aria-selected');
  else item.setAttribute('aria-selected', 'true');
  root.dispatchEvent(new CustomEvent('ntn:treeselect', {
    bubbles: true,
    detail: { id: treeId(item), ids: $$('.ntn-tree__item[aria-selected="true"]', root).map(treeId), item },
  }));
}

function treeMove(item, targetItem, zone) {
  const root = item.closest('.ntn-tree');
  if (!root || item === targetItem || item.contains(targetItem)) return;
  if (zone === 'inside') {
    let g = treeGroup(targetItem);
    if (!g) {
      g = document.createElement('div');
      g.className = 'ntn-tree__group';
      g.setAttribute('role', 'group');
      targetItem.appendChild(g);
    }
    g.appendChild(item);
    targetItem.setAttribute('aria-expanded', 'true');
  } else if (zone === 'before') targetItem.before(item);
  else targetItem.after(item);
  treeSync(root);
  const holder = item.parentElement;
  const parent = holder.classList.contains('ntn-tree__group') ? holder.closest('.ntn-tree__item') : null;
  root.dispatchEvent(new CustomEvent('ntn:treemove', {
    bubbles: true,
    detail: {
      id: treeId(item), position: zone, targetId: treeId(targetItem),
      parentId: parent ? treeId(parent) : null,
      index: $$(':scope > .ntn-tree__item', holder).indexOf(item), item,
    },
  }));
}

let treeDrag = null;

function treeZone(row, clientY, nestable) {
  const r = row.getBoundingClientRect();
  const y = (clientY - r.top) / r.height;
  if (!nestable) return y < 0.5 ? 'before' : 'after';
  if (y < 0.3) return 'before';
  if (y > 0.7) return 'after';
  return 'inside';
}

const treeClearDrop = (root) => $$('.ntn-tree__row[data-ntn-drop]', root).forEach((r) => r.removeAttribute('data-ntn-drop'));

function onTreePointerDown(e) {
  const grip = e.target.closest('.ntn-tree__grip');
  const item = grip && grip.closest('.ntn-tree__item');
  if (item) { item.draggable = true; return; }
  const other = e.target.closest('.ntn-tree__item[draggable="true"]');
  if (other) other.draggable = false;
}

function onTreeDragStart(e) {
  const item = e.target.closest('.ntn-tree__item[draggable="true"]');
  if (!item) return;
  const root = item.closest('.ntn-tree');
  treeDrag = { item, root };
  item.setAttribute('data-ntn-dragging', '');
  root.setAttribute('data-ntn-dragging', '');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', treeId(item)); } catch (err) { /* older engines */ }
  }
}

function onTreeDragOver(e) {
  if (!treeDrag) return;
  const row = e.target.closest && e.target.closest('.ntn-tree__row');
  const over = row && row.closest('.ntn-tree__item');
  treeClearDrop(treeDrag.root);
  if (!over || !treeDrag.root.contains(over) || treeDrag.item.contains(over)) return;
  const nestable = treeDrag.root.hasAttribute('data-ntn-nest') || !!treeGroup(over);
  const zone = treeZone(row, e.clientY, nestable);
  row.setAttribute('data-ntn-drop', zone);
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
}

function onTreeDrop(e) {
  if (!treeDrag) return;
  const row = e.target.closest && e.target.closest('.ntn-tree__row[data-ntn-drop]');
  if (row) {
    e.preventDefault();
    treeMove(treeDrag.item, row.closest('.ntn-tree__item'), row.getAttribute('data-ntn-drop'));
  }
  onTreeDragEnd();
}

function onTreeDragEnd() {
  if (!treeDrag) return;
  treeClearDrop(treeDrag.root);
  treeDrag.item.removeAttribute('data-ntn-dragging');
  treeDrag.item.draggable = false;
  treeDrag.root.removeAttribute('data-ntn-dragging');
  treeDrag = null;
}

function onTreeKey(item, e) {
  const root = item.closest('.ntn-tree');
  const items = treeVisible(root);
  const i = items.indexOf(item);

  /* Alt+arrows reorder — a keyboard equivalent of the drag handle, so only where there is one. */
  if (e.altKey) {
    if (!item.querySelector(':scope > .ntn-tree__row .ntn-tree__grip')) return;
    const holder = item.parentElement;
    const sibs = $$(':scope > .ntn-tree__item', holder);
    const at = sibs.indexOf(item);
    if (e.key === 'ArrowUp' && at > 0) { e.preventDefault(); treeMove(item, sibs[at - 1], 'before'); item.focus(); return; }
    if (e.key === 'ArrowDown' && at < sibs.length - 1) { e.preventDefault(); treeMove(item, sibs[at + 1], 'after'); item.focus(); return; }
    if (e.key === 'ArrowRight' && at > 0) { e.preventDefault(); treeMove(item, sibs[at - 1], 'inside'); item.focus(); return; }
    if (e.key === 'ArrowLeft') {
      const parent = holder.classList.contains('ntn-tree__group') ? holder.closest('.ntn-tree__item') : null;
      if (parent) { e.preventDefault(); treeMove(item, parent, 'after'); item.focus(); }
      return;
    }
    return;
  }

  if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); treeFocus(items[i + 1]); return; }
  if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); treeFocus(items[i - 1]); return; }
  if (e.key === 'Home') { e.preventDefault(); treeFocus(items[0]); return; }
  if (e.key === 'End') { e.preventDefault(); treeFocus(items[items.length - 1]); return; }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (treeGroup(item) && !treeOpen(item)) treeToggle(item, true);
    else if (treeKids(item).length) treeFocus(treeKids(item)[0]);
    return;
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (treeGroup(item) && treeOpen(item)) treeToggle(item, false);
    else {
      const parent = item.parentElement.closest('.ntn-tree__item');
      if (parent) treeFocus(parent);
    }
    return;
  }
  /* A label link: ↵ clicks it, and the click path selects and toggles, as a mouse click does. */
  const link = e.key === 'Enter' && !e.metaKey && !e.ctrlKey
    && item.querySelector(':scope > .ntn-tree__row a.ntn-tree__label[href]');
  if (link) { e.preventDefault(); link.click(); return; }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    treeSelect(item, e.metaKey || e.ctrlKey);
    if (e.key === 'Enter') treeToggle(item);
  }
}

/* ── Combobox ────────────────────────────────────────────────────────────────
   A listbox in a .ntn-menu surface: descriptions, icons, type-to-filter and
   multi-select chips — everything a native <select> cannot render. Selection
   lives on the options' aria-selected, so the DOM is the state. */

const comboOptions = (root) => $$('.ntn-combo__option', root);
const comboChosen = (root) => comboOptions(root).filter((o) => o.getAttribute('aria-selected') === 'true');
const comboLabel = (o) => o.dataset.label || (o.querySelector('.ntn-combo__option-title') || o).textContent.trim();
const comboMulti = (root) => root.hasAttribute('data-ntn-multi');
const comboValue = (o) => o.dataset.value || comboLabel(o);
const comboDefaults = new WeakMap();

/* Form association: data-ntn-name="x" keeps hidden <input name="x"> children in step with the
   selection (one per value when multi; one, possibly "", when single, like a <select> with an
   empty first option). The options stay the state; the inputs are derived from them. */
function comboSync(root) {
  if (!comboDefaults.has(root)) comboDefaults.set(root, comboChosen(root));
  const name = root.dataset.ntnName;
  if (!name) return;
  const values = comboChosen(root).map(comboValue);
  if (!comboMulti(root) && !values.length) values.push('');
  const inputs = $$('input[data-ntn-combo-input]', root);
  values.forEach((v, i) => {
    let input = inputs[i];
    if (!input) { input = make('input', { type: 'hidden', 'data-ntn-combo-input': '' }); root.append(input); }
    input.name = name;
    input.value = v;
  });
  inputs.slice(values.length).forEach((el) => el.remove());
}

/* A form reset puts each combo back to the selection it was first rendered with. */
function comboOnReset(e) {
  if (e.defaultPrevented) return;
  $$('[data-ntn-combo]', e.target).forEach((root) => {
    const initial = comboDefaults.get(root);
    if (!initial) return;
    comboOptions(root).forEach((o) => o.setAttribute('aria-selected', String(initial.includes(o))));
    comboRender(root);
  });
}

function comboRender(root) {
  const out = root.querySelector('[data-ntn-combo-value]');
  const chosen = comboChosen(root);
  if (out) {
    if (!chosen.length) {
      out.textContent = out.dataset.ntnPlaceholder || (comboMulti(root) ? 'Select options' : 'Select an option');
      out.setAttribute('data-empty', '');
    } else {
      out.removeAttribute('data-empty');
      if (!comboMulti(root)) out.replaceChildren(make('span', {}, comboLabel(chosen[0])));
      else {
        const max = Number(root.dataset.ntnMax || 2);
        const nodes = chosen.slice(0, max).map((o) => make('span', { class: 'ntn-combo__chip' },
          make('span', {}, comboLabel(o)),
          make('button', {
            type: 'button',
            class: 'ntn-combo__chip-x',
            'data-ntn-combo-clear': comboValue(o),
            'aria-label': 'Remove ' + comboLabel(o),
          }, renderIcon('close'))));
        if (chosen.length > max) nodes.push(make('span', { class: 'ntn-combo__more' }, '+' + (chosen.length - max)));
        out.replaceChildren(...nodes);
      }
    }
  }
  const count = root.querySelector('[data-ntn-combo-count]');
  if (count) count.textContent = chosen.length + ' selected';
  comboSync(root);
}

/* After a user change: ntn:combochange with the detail, then a plain bubbling change (from the
   combo root) so form-level change listeners see it like any other control. */
function comboFire(root) {
  const chosen = comboChosen(root);
  root.dispatchEvent(new CustomEvent('ntn:combochange', {
    bubbles: true,
    detail: {
      value: chosen.length ? comboValue(chosen[0]) : null,
      values: chosen.map(comboValue),
      labels: chosen.map(comboLabel),
      multiple: comboMulti(root),
    },
  }));
  root.dispatchEvent(new Event('change', { bubbles: true }));
}

function comboFilter(root) {
  const input = root.querySelector('[data-ntn-combo-search]');
  const q = input ? input.value.trim().toLowerCase() : '';
  let hits = 0;
  comboOptions(root).forEach((o) => {
    const on = !q || o.textContent.toLowerCase().includes(q);
    o.hidden = !on;
    if (on) hits++;
  });
  $$('.ntn-combo__group-label', root).forEach((g) => {
    const next = [];
    let n = g.nextElementSibling;
    while (n && n.classList.contains('ntn-combo__option')) { next.push(n); n = n.nextElementSibling; }
    g.hidden = next.length > 0 && next.every((o) => o.hidden);
  });
  const blank = root.querySelector('.ntn-combo__empty');
  if (blank) blank.hidden = hits !== 0;
  comboActivate(root, comboOptions(root).find((o) => !o.hidden) || null);
}

/* Scrolls a listbox just enough to show an option (the combo's and the select's). */
function scrollIntoList(list, option) {
  if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
  else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
}

/* The option an arrow, Home or End key moves to among the pickable ones. With wrap, ↑/↓ run past
   the ends; without, they stop there. null for any other key. */
function stepTo(opts, active, key, wrap) {
  const n = opts.length;
  if (!n) return null;
  const i = opts.indexOf(active);
  if (key === 'Home') return opts[0];
  if (key === 'End') return opts[n - 1];
  if (key === 'ArrowDown') return i < 0 ? opts[0] : opts[wrap ? (i + 1) % n : Math.min(i + 1, n - 1)];
  if (key === 'ArrowUp') return i < 0 ? opts[wrap ? n - 1 : 0] : opts[wrap ? (i - 1 + n) % n : Math.max(i - 1, 0)];
  return null;
}

function comboActivate(root, option) {
  comboOptions(root).forEach((o) => o.removeAttribute('data-ntn-active'));
  if (!option) return;
  option.setAttribute('data-ntn-active', '');
  const list = root.querySelector('.ntn-combo__list');
  if (list) scrollIntoList(list, option);
}

function comboClose(root) {
  const panel = root.querySelector('.ntn-combo__panel');
  const trigger = root.querySelector('.ntn-combo__trigger');
  if (panel) panel.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  root.removeAttribute('data-ntn-side');
}

function comboOpenPanel(root) {
  $$('[data-ntn-combo]').forEach((r) => { if (r !== root) comboClose(r); });
  const panel = root.querySelector('.ntn-combo__panel');
  const trigger = root.querySelector('.ntn-combo__trigger');
  if (!panel) return;
  panel.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  /* Flip above the trigger when the panel would run off the bottom. */
  const r = panel.getBoundingClientRect();
  if (r.bottom > innerHeight - 8 && root.getBoundingClientRect().top > r.height + 16) root.setAttribute('data-ntn-side', 'up');
  const search = root.querySelector('[data-ntn-combo-search]');
  if (search) { search.value = ''; comboFilter(root); search.focus(); }
  else comboActivate(root, comboChosen(root)[0] || comboOptions(root)[0]);
}

function comboPick(root, option) {
  if (option.getAttribute('aria-disabled') === 'true') return;
  if (comboMulti(root)) {
    option.setAttribute('aria-selected', String(option.getAttribute('aria-selected') !== 'true'));
  } else {
    comboOptions(root).forEach((o) => o.setAttribute('aria-selected', String(o === option)));
  }
  comboRender(root);
  comboFire(root);
  if (!comboMulti(root)) {
    comboClose(root);
    const trigger = root.querySelector('.ntn-combo__trigger');
    if (trigger) trigger.focus();
  }
}

function onComboKey(root, e) {
  const panel = root.querySelector('.ntn-combo__panel');
  const open = panel && !panel.hidden;
  if (!open) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); comboOpenPanel(root); }
    return;
  }
  const opts = comboOptions(root).filter((o) => !o.hidden && o.getAttribute('aria-disabled') !== 'true');
  const active = root.querySelector('.ntn-combo__option[data-ntn-active]');
  const to = stepTo(opts, active, e.key, false);
  if (to) { e.preventDefault(); comboActivate(root, to); return; }
  if (e.key === 'Enter') { e.preventDefault(); if (active) comboPick(root, active); return; }
  if (e.key === 'Escape' || e.key === 'Tab') {
    comboClose(root);
    if (e.key === 'Escape') { e.preventDefault(); const t = root.querySelector('.ntn-combo__trigger'); if (t) t.focus(); }
  }
}

/* ── Nested menus ────────────────────────────────────────────────────────────
   Hover and focus open a submenu with CSS alone; this adds keyboard traversal
   and flips the flyout when the window edge is nearer than the panel is wide. */

function menuFlip(sub) {
  const panel = sub.querySelector(':scope > .ntn-menu');
  if (!panel) return;
  sub.removeAttribute('data-ntn-side');
  const prev = panel.style.display;
  panel.style.display = 'block';
  const w = panel.offsetWidth;
  panel.style.display = prev;
  const r = sub.getBoundingClientRect();
  if (r.right + 4 + w > innerWidth - 8 && r.left - w > 8) sub.setAttribute('data-ntn-side', 'left');
}

function onSubmenuKey(item, e) {
  const sub = item.closest('.ntn-menu__sub');
  const own = sub && sub.querySelector(':scope > .ntn-menu');
  if (e.key === 'ArrowRight' && own && item.parentElement === sub) {
    e.preventDefault();
    menuFlip(sub);
    sub.setAttribute('data-ntn-open', '');
    const first = own.querySelector('.ntn-menu__item');
    if (first) first.focus();
    return;
  }
  if (e.key === 'ArrowLeft') {
    const holder = item.closest('.ntn-menu');
    const parentSub = holder && holder.parentElement && holder.parentElement.closest('.ntn-menu__sub');
    if (parentSub) {
      e.preventDefault();
      parentSub.removeAttribute('data-ntn-open');
      const owner = parentSub.querySelector(':scope > .ntn-menu__item');
      if (owner) owner.focus();
    }
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
    const holder = item.closest('.ntn-menu');
    const items = $$(':scope > .ntn-menu__item, :scope > .ntn-menu__sub > .ntn-menu__item', holder)
      .filter((i) => i.getAttribute('aria-disabled') !== 'true');
    const i = items.indexOf(item);
    if (i < 0) return;
    e.preventDefault();
    let to = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    if (e.key === 'Home') to = 0;
    if (e.key === 'End') to = items.length - 1;
    items[to].focus();
  }
}

/* ── Dropdown + popover ──────────────────────────────────────────────────────
   <div class="ntn-dropdown" data-ntn-dropdown>
     <button type="button" class="ntn-btn" aria-haspopup="menu" aria-expanded="false">Actions</button>
     <div class="ntn-menu" role="menu" data-ntn-placement="bottom-end">…ntn-menu__item…</div>
   </div>
   The panel (an ntn-menu, or an ntn-popover with role="dialog" for a form) is given the popover
   attribute, so it opens in the TOP LAYER: no ancestor's overflow clips it, no z-index fights. It
   stays where it is in the DOM, so form controls inside it still belong to the surrounding form.
   Opening one closes the others. A pointerdown outside closes it, except inside an element matching
   the panel's data-ntn-owner (a date picker appended to <body>, say); so does focus leaving it.
   Escape closes it and returns focus to the trigger (and does not also close an enclosing dialog).
   Fires ntn:dropdownshow / ntn:dropdownhide on the dropdown, after positioning. */

let ddSeq = 0;
const ddRoot = (el) => (el && el.closest ? el.closest('[data-ntn-dropdown]') : null);
const ddPanel = (root) => root.querySelector(':scope > [popover], :scope > .ntn-menu, :scope > .ntn-popover, :scope > .ntn-select__panel');
const ddTrigger = (root) => root.querySelector(':scope > [aria-haspopup], :scope > [data-ntn-dropdown-trigger]');
const ddIsOpen = (root) => root.hasAttribute('data-ntn-open');
const DD_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Wires ARIA and the popover attribute once. Safe to call repeatedly. */
function ddSetup(root) {
  const panel = ddPanel(root);
  const trigger = ddTrigger(root);
  if (!panel || !trigger) return false;
  if (!panel.hasAttribute('popover') && typeof panel.showPopover === 'function') panel.setAttribute('popover', 'manual');
  if (!panel.hasAttribute('popover')) panel.hidden = !ddIsOpen(root);
  if (!panel.id) panel.id = 'ntn-dd-' + (++ddSeq);
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', String(ddIsOpen(root)));
  if (trigger.tagName === 'BUTTON' && !trigger.hasAttribute('type')) trigger.type = 'button';
  return true;
}

/** Positions the panel against its trigger: preferred side and edge, flipped and kept on screen. */
function ddPlace(root) {
  const panel = ddPanel(root);
  const trigger = ddTrigger(root);
  if (!panel || !trigger) return;
  placeFixed(panel, trigger, panel.dataset.ntnPlacement || 'bottom-end', Number(panel.dataset.ntnOffset || 6));
}

/* Places a top-layer (position: fixed) panel against an anchor in viewport pixels. Shared by
   dropdowns, the date picker and the select. Placements are side-align: bottom, top, or over (the
   select's: the panel covers the anchor, its top `gap` above the anchor's top, or, near the
   viewport's bottom, its bottom `gap` below the anchor's bottom; data-ntn-side says which). */
function placeFixed(panel, anchor, placement, gap) {
  const r = anchor.getBoundingClientRect();
  const [side, align] = placement.split('-');
  const margin = 8;
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  let top;
  let up;
  if (side === 'over') {
    top = r.top - gap;
    up = false;
    if (top + h > innerHeight - margin) {
      const flipped = r.bottom + gap - h;
      up = flipped >= margin;
      top = up ? flipped : innerHeight - margin - h;
    }
  } else {
    const below = r.bottom + gap;
    const above = r.top - gap - h;
    top = side === 'top' ? above : below;
    if (side === 'top' && top < margin && below + h <= innerHeight - margin) top = below;
    if (side !== 'top' && top + h > innerHeight - margin && above >= margin) top = above;
    up = top < r.top;
  }
  let left = align === 'start' ? r.left : r.right - w;
  left = Math.max(margin, Math.min(left, innerWidth - w - margin));
  panel.style.left = Math.round(left) + 'px';
  panel.style.top = Math.round(Math.max(margin, top)) + 'px';
  panel.setAttribute('data-ntn-side', up ? 'top' : 'bottom');
}

/**
 * Opens a dropdown or popover.
 * @param {Element} target  the dropdown, its trigger, or anything inside it
 * @param {{ focus?: 'first'|'last'|false }} [options]  what receives focus (default: the first item or field)
 */
function ddOpen(target, { focus = 'first' } = {}) {
  const root = ddRoot(target);
  if (!root || ddIsOpen(root) || !ddSetup(root)) return;
  $$('[data-ntn-dropdown][data-ntn-open]').forEach((other) => { if (!other.contains(root)) ddClose(other); });
  const panel = ddPanel(root);
  root.setAttribute('data-ntn-open', '');
  if (panel.hasAttribute('popover')) {
    try { panel.showPopover(); } catch (e) { /* already open or detached */ }
  } else {
    panel.hidden = false;
  }
  ddPlace(root);
  ddTrigger(root).setAttribute('aria-expanded', 'true');
  if (focus) {
    const menuItems = $$('.ntn-menu__item:not([aria-disabled="true"])', panel).filter((i) => !i.closest('.ntn-menu__sub > .ntn-menu'));
    const pool = menuItems.length ? menuItems : $$(DD_FOCUSABLE, panel);
    const to = focus === 'last' ? pool[pool.length - 1] : pool[0];
    if (to) to.focus();
  }
  root.dispatchEvent(new CustomEvent('ntn:dropdownshow', { bubbles: true, detail: { panel } }));
}

/**
 * Closes a dropdown or popover (and any open inside it).
 * @param {Element} target  the dropdown, its trigger, or anything inside it
 * @param {{ returnFocus?: boolean }} [options]  focus the trigger afterwards (default: only if focus was inside)
 */
function ddClose(target, { returnFocus = false } = {}) {
  const root = ddRoot(target);
  if (!root || !ddIsOpen(root)) return;
  const panel = ddPanel(root);
  $$('[data-ntn-dropdown][data-ntn-open]', panel).forEach((inner) => ddClose(inner));
  const hadFocus = panel.contains(document.activeElement);
  root.removeAttribute('data-ntn-open');
  if (panel.hasAttribute('popover')) {
    try { panel.hidePopover(); } catch (e) { /* already closed */ }
  } else {
    panel.hidden = true;
  }
  $$('.ntn-menu__sub[data-ntn-open]', panel).forEach((s) => s.removeAttribute('data-ntn-open'));
  const trigger = ddTrigger(root);
  trigger.setAttribute('aria-expanded', 'false');
  if (returnFocus || hadFocus) trigger.focus();
  root.dispatchEvent(new CustomEvent('ntn:dropdownhide', { bubbles: true, detail: { panel } }));
}

/**
 * Opens a closed dropdown or closes an open one.
 * @param {Element} target  the dropdown, its trigger, or anything inside it
 */
function ddToggle(target) {
  const root = ddRoot(target);
  if (root) (ddIsOpen(root) ? ddClose(root) : ddOpen(root));
}

/* Public API. Thin wrappers, so internal callers never collide with a local named open/close. */
export function open(target, options) { ddOpen(target, options); }
export function close(target, options) { ddClose(target, options); }
export function toggle(target) { ddToggle(target); }

/** True when `el` is inside the element a panel names as its owner (e.g. a body-mounted picker). */
function ddOwned(root, el) {
  const owner = ddPanel(root)?.getAttribute('data-ntn-owner');
  return !!(owner && el && el.closest && el.closest(owner));
}

function ddOnPointerDown(e) {
  $$('[data-ntn-dropdown][data-ntn-open]').forEach((root) => {
    if (!root.contains(e.target) && !ddOwned(root, e.target)) ddClose(root);
  });
}

function ddOnFocusOut(e) {
  const to = e.relatedTarget;
  if (!to) return;
  $$('[data-ntn-dropdown][data-ntn-open]').forEach((root) => {
    if (root.contains(e.target) && !root.contains(to) && !ddOwned(root, to)) ddClose(root);
  });
}

function ddReposition() {
  $$('[data-ntn-dropdown][data-ntn-open]').forEach(ddPlace);
  $$('[data-ntn-daterange]').filter((r) => drState(r).open).forEach(drPlace);
}

/* ── Select ──────────────────────────────────────────────────────────────────
   <label class="ntn-select" data-ntn-select [data-ntn-search="Search teams…"]
          [data-ntn-empty="No matching teams"] [data-ntn-placeholder="No teams"]>
     <span class="ntn-select__label">Team</span>
     <span class="ntn-select__control"><select name="team">…</select></span>
   </label>
   The native <select> stays in the form, invisible under a trigger button, so it posts, fires
   input and change, takes form.reset() and shows the browser's required message. The control
   becomes an ntn-dropdown: its listbox panel opens in the top layer over the trigger, and the
   dropdown code owns Escape, focus return, outside clicks, Tab-out and repositioning. The list is
   built from the <select> on every open, so options added later need no refresh; refresh(root)
   redraws the trigger after the app sets the value in code. <select multiple> toggles and stays
   open; <optgroup> becomes a labelled group. */

let selSeq = 0;
const selRoot = (el) => (el && el.closest ? el.closest('[data-ntn-select]') : null);
const selNative = (root) => root.querySelector('.ntn-select__control > select');
const selCtl = (root) => root.querySelector('.ntn-select__control');
const selTrigger = (root) => root.querySelector('.ntn-select__trigger');
const selPanel = (root) => root.querySelector('.ntn-select__panel');
const selList = (root) => root.querySelector('.ntn-select__list');
const selSearch = (root) => root.querySelector('.ntn-select__search');
const selOptions = (root) => $$('.ntn-select__option', selList(root));
const selPickable = (root) => selOptions(root).filter((o) => !o.hidden && o.getAttribute('aria-disabled') !== 'true');
const selTyped = new WeakMap();

/** Draws the trigger and panel once; on later calls re-syncs the trigger. */
function selSetup(root) {
  const select = selNative(root);
  const ctl = selCtl(root);
  if (!select || !ctl) return;
  let trigger = selTrigger(root);
  if (!trigger) {
    const id = 'ntn-sel-' + (++selSeq);
    const label = root.querySelector('.ntn-select__label');
    if (label && !label.id) label.id = id + '-label';
    const value = make('span', { class: 'ntn-select__value', id: id + '-value' });
    trigger = make('button', { type: 'button', class: 'ntn-select__trigger', 'aria-haspopup': 'listbox',
      'aria-labelledby': (label ? label.id + ' ' : '') + value.id }, value);
    const list = make('div', { class: 'ntn-select__list', role: 'listbox', id: id + '-list', tabindex: '-1' });
    if (label) list.setAttribute('aria-labelledby', label.id);
    if (select.multiple) list.setAttribute('aria-multiselectable', 'true');
    const panel = make('div', { class: 'ntn-select__panel', 'data-ntn-placement': 'over-end', 'data-ntn-offset': '4' });
    if (root.hasAttribute('data-ntn-search')) {
      const search = make('input', { type: 'text', class: 'ntn-select__search', role: 'combobox', 'aria-autocomplete': 'list',
        'aria-expanded': 'true', 'aria-controls': list.id, autocomplete: 'off', spellcheck: 'false',
        placeholder: root.getAttribute('data-ntn-search') || 'Search…' });
      if (label) search.setAttribute('aria-labelledby', label.id);
      panel.append(search);
    }
    panel.append(list, make('div', { class: 'ntn-select__empty', hidden: '' }, root.getAttribute('data-ntn-empty') || 'No results'));
    select.after(trigger, panel);
    select.tabIndex = -1;
    ctl.setAttribute('data-ntn-dropdown', '');
  }
  for (const name of ['aria-describedby', 'aria-invalid']) {
    const v = select.getAttribute(name);
    if (v === null) trigger.removeAttribute(name); else trigger.setAttribute(name, v);
  }
  trigger.disabled = select.disabled;
  ddSetup(ctl);
  // A panel upgraded to a popover on a later refresh drops the no-popover hidden.
  const panel = selPanel(root);
  if (panel.hasAttribute('popover')) panel.hidden = false;
  selRender(root);
}

/** The trigger shows the chosen label (multiple: the labels, joined), or the placeholder. */
function selRender(root) {
  const select = selNative(root);
  const out = root.querySelector('.ntn-select__value');
  if (!select || !out) return;
  const chosen = Array.from(select.options).filter((o) => o.selected);
  const empty = select.multiple ? !chosen.length : !chosen.length || chosen[0].value === '';
  out.textContent = select.multiple
    ? (chosen.length ? chosen.map((o) => o.text).join(', ') : root.dataset.ntnPlaceholder || 'Select options')
    : (chosen[0] ? chosen[0].text : '');
  out.toggleAttribute('data-empty', empty);
}

/* One option row. Its data-ntn-index points back at the native option. */
function selOption(listId, o, n) {
  const el = make('div', { class: 'ntn-select__option', role: 'option', id: `${listId}-${n}`,
    'data-ntn-index': String(o.index), 'aria-selected': String(o.selected) },
  make('span', { class: 'ntn-select__text' }, o.text),
  make('span', { class: 'ntn-select__tick', 'aria-hidden': 'true' }));
  const group = o.parentElement;
  if (o.disabled || (group && group.tagName === 'OPTGROUP' && group.disabled)) el.setAttribute('aria-disabled', 'true');
  return el;
}

function selBuild(root) {
  const select = selNative(root);
  const list = selList(root);
  let n = 0;
  let g = 0;
  const nodes = [];
  for (const child of select.children) {
    if (child.tagName === 'OPTION') nodes.push(selOption(list.id, child, n++));
    else if (child.tagName === 'OPTGROUP') {
      const head = make('div', { class: 'ntn-select__group', id: `${list.id}-g${g++}`, role: 'presentation' }, child.label);
      const group = make('div', { role: 'group', 'aria-labelledby': head.id }, head);
      for (const o of child.children) if (o.tagName === 'OPTION') group.append(selOption(list.id, o, n++));
      nodes.push(group);
    }
  }
  list.replaceChildren(...nodes);
}

/** Marks the active option for keyboard and screen readers, on the search box or the list. */
function selActivate(root, option, scroll = true) {
  const list = selList(root);
  selOptions(root).forEach((o) => o.removeAttribute('data-ntn-active'));
  const owner = selSearch(root) || list;
  if (!option) { owner.removeAttribute('aria-activedescendant'); return; }
  option.setAttribute('data-ntn-active', '');
  owner.setAttribute('aria-activedescendant', option.id);
  if (scroll) scrollIntoList(list, option);
}

/* Shows the options matching the search, hides emptied groups, and swaps in the empty state. */
function selFilter(root) {
  const search = selSearch(root);
  const q = search ? search.value.trim().toLowerCase() : '';
  let hits = 0;
  selOptions(root).forEach((o) => {
    o.hidden = !!q && !o.textContent.toLowerCase().includes(q);
    if (!o.hidden) hits++;
  });
  $$('[role="group"]', selList(root)).forEach((grp) => { grp.hidden = !grp.querySelector('.ntn-select__option:not([hidden])'); });
  selList(root).hidden = !hits;
  root.querySelector('.ntn-select__empty').hidden = hits > 0;
}

function selOpen(root) {
  const ctl = selCtl(root);
  const trigger = selTrigger(root);
  if (!ctl || !trigger || trigger.disabled || ddIsOpen(ctl)) return;
  selBuild(root);
  const search = selSearch(root);
  if (search) search.value = '';
  selFilter(root);
  selPanel(root).style.minWidth = Math.max(204, trigger.offsetWidth) + 'px';
  ddOpen(ctl, { focus: false });
  (search || selList(root)).focus({ preventScroll: true });
  const chosen = selPickable(root).find((o) => o.getAttribute('aria-selected') === 'true');
  selActivate(root, chosen || selPickable(root)[0] || null);
}

function selFire(select) {
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

/* Single: choose and close. Multiple: toggle and stay open. */
function selPick(root, option) {
  if (!option || option.getAttribute('aria-disabled') === 'true') return;
  const select = selNative(root);
  const o = select.options[Number(option.dataset.ntnIndex)];
  if (!o) return;
  if (select.multiple) {
    o.selected = !o.selected;
    option.setAttribute('aria-selected', String(o.selected));
    selFire(select);
    selActivate(root, option, false);
    return;
  }
  if (!o.selected) { o.selected = true; selFire(select); }
  selRender(root);
  ddClose(selCtl(root), { returnFocus: true });
}

/* Type-to-jump: keys typed within 500ms of each other match the start of a label. */
function selTypeahead(root, ch) {
  const now = Date.now();
  const last = selTyped.get(root);
  const typed = (last && now - last.at < 500 ? last.typed : '') + ch.toLowerCase();
  selTyped.set(root, { typed, at: now });
  const hit = selPickable(root).find((o) => o.textContent.trim().toLowerCase().startsWith(typed));
  if (hit) selActivate(root, hit);
}

/* Keys on a select. True when handled; Escape and Tab fall through to the dropdown code. */
function onSelectKey(root, e) {
  const ctl = selCtl(root);
  const trigger = selTrigger(root);
  if (!ctl || !trigger) return false;
  if (!ddIsOpen(ctl)) {
    // Enter and Space reach the trigger as a native click; only the arrows open it from here.
    if (e.target === trigger && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); selOpen(root); return true; }
    return false;
  }
  if (!selPanel(root).contains(e.target)) return false;
  const search = selSearch(root);
  const active = selList(root).querySelector('.ntn-select__option[data-ntn-active]');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || (!search && (e.key === 'Home' || e.key === 'End'))) {
    e.preventDefault();
    selActivate(root, stepTo(selPickable(root), active, e.key, true));
    return true;
  }
  // Enter always stops here, so it never submits the form from the search box.
  if (e.key === 'Enter' || (e.key === ' ' && !search && selNative(root).multiple)) {
    e.preventDefault();
    selPick(root, active);
    return true;
  }
  if (!search && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { selTypeahead(root, e.key); return true; }
  return false;
}

/* Clicks inside an enhanced select. A <label> would forward any other click to the hidden
   <select>, so those are stopped, and a click on the label focuses the trigger. */
function onSelectClick(root, e) {
  const trigger = selTrigger(root);
  if (!trigger) return false;
  if (trigger.contains(e.target)) {
    e.preventDefault();
    if (!trigger.disabled) { if (ddIsOpen(selCtl(root))) ddClose(selCtl(root), { returnFocus: true }); else selOpen(root); }
    return true;
  }
  if (selPanel(root).contains(e.target)) {
    if (e.target === selSearch(root)) return true;
    e.preventDefault();
    const option = e.target.closest('.ntn-select__option');
    if (option) selPick(root, option);
    return true;
  }
  if (e.target.closest('label')) {
    e.preventDefault();
    if (!trigger.disabled) trigger.focus();
    return true;
  }
  return false;
}

/* form.reset() fires before the controls reset, and no change follows: redraw once it has. */
function selOnReset(e) {
  if (e.defaultPrevented) return;
  const roots = $$('[data-ntn-select]', e.target);
  if (roots.length) setTimeout(() => roots.forEach(selRender), 0);
}

/* Table select-all + per-row aria-selected. */
function syncTable(table) {
  const all = table.querySelector('[data-ntn-select-all]');
  const rows = $$('tbody tr', table);
  const boxes = rows.map((r) => r.querySelector('input[type="checkbox"]')).filter(Boolean);
  rows.forEach((r) => {
    const box = r.querySelector('input[type="checkbox"]');
    if (box) r.setAttribute('aria-selected', String(box.checked));
  });
  if (!all) return;
  const on = boxes.filter((b) => b.checked).length;
  all.checked = on > 0 && on === boxes.length;
  all.indeterminate = on > 0 && on < boxes.length;
}

/* ── Table paging, search and tag filters ────────────────────────────────────
   Opt in with <div class="ntn-table" data-ntn-paginate="10">. Controls live
   anywhere inside the surrounding .ntn-card (or [data-ntn-table-scope]):
     [data-ntn-table-search]  input — filters rows on their text
     [data-ntn-filter-tag]    button — keeps rows whose data-tags lists the value
     [data-ntn-page-size]     select — rows per page
     [data-ntn-summary]       element — receives "Showing 1-10 of 24"
     [data-ntn-pages]         element — receives the page buttons
     [data-ntn-prev] / [data-ntn-next] — step buttons
   Without this attribute a table is pure markup, exactly as before. */

const scopeOf = (table) => table.closest('[data-ntn-table-scope]') || table.closest('.ntn-card') || document;

function stateOf(table) {
  if (!table.ntnState) table.ntnState = { page: 1, size: Number(table.dataset.ntnPaginate) || 10, q: '', tag: '' };
  return table.ntnState;
}

function pageList(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}

function applyTable(table) {
  const s = stateOf(table);
  const scope = scopeOf(table);
  const rows = $$('tbody tr', table).filter((r) => !r.hasAttribute('data-ntn-table-empty'));
  const hit = rows.filter((r) => {
    if (s.q && !r.textContent.toLowerCase().includes(s.q)) return false;
    if (s.tag && s.tag !== 'all' && !(r.dataset.tags || '').split(/\s+/).includes(s.tag)) return false;
    return true;
  });
  const size = s.size > 0 ? s.size : hit.length || 1;
  const pages = Math.max(1, Math.ceil(hit.length / size));
  s.page = Math.min(Math.max(1, s.page), pages);
  const start = (s.page - 1) * size;
  const shown = hit.slice(start, start + size);
  rows.forEach((r) => { r.hidden = true; });
  shown.forEach((r) => { r.hidden = false; });

  const blank = table.querySelector('[data-ntn-table-empty]');
  if (blank) blank.hidden = hit.length !== 0;

  $$('[data-ntn-summary]', scope).forEach((el) => {
    el.textContent = hit.length
      ? 'Showing ' + (start + 1) + '\u2013' + (start + shown.length) + ' of ' + hit.length
      : 'No matching rows';
  });
  $$('[data-ntn-pages]', scope).forEach((el) => {
    el.innerHTML = pageList(s.page, pages).map((n) => (n === '…'
      ? '<span class="ntn-pager__gap">…</span>'
      : '<button type="button" class="ntn-pager__page" data-ntn-goto="' + n + '"' + (n === s.page ? ' aria-current="page"' : '') + '>' + n + '</button>')).join('');
  });
  $$('[data-ntn-prev]', scope).forEach((b) => { b.disabled = s.page <= 1; });
  $$('[data-ntn-next]', scope).forEach((b) => { b.disabled = s.page >= pages; });
  syncTable(table);
  table.dispatchEvent(new CustomEvent('ntn:tablechange', { bubbles: true, detail: { page: s.page, pages, size, matched: hit.length, total: rows.length } }));
}

const tableFor = (el) => {
  const scope = el.closest('[data-ntn-table-scope]') || el.closest('.ntn-card');
  return scope ? scope.querySelector('.ntn-table[data-ntn-paginate]') : null;
};

/* Exclusive toggle group; add data-multi to the group for independent toggles. */
function pressToggle(btn) {
  const group = btn.closest('.ntn-toggle-group');
  if (!group) return;
  if (group.hasAttribute('data-multi')) {
    btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true'));
  } else {
    $$('.ntn-toggle-group__btn', group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  }
  toggleInk(group);
  group.dispatchEvent(new CustomEvent('ntn:toggle', { bubbles: true, detail: { value: btn.dataset.value || btn.textContent.trim(), pressed: btn.getAttribute('aria-pressed') === 'true' } }));
}

/* Pill toggle group: one pill slides behind the pressed button, as the pill tabs' ink does. Only
   an exclusive group slides; with data-multi each pressed button keeps its own raised fill (the
   no-script look too). With nothing pressed, or before layout, the flag comes off. */
function toggleInk(group) {
  if (!group.classList.contains('ntn-toggle-group--pill') || group.hasAttribute('data-multi')) return;
  const btn = group.querySelector('.ntn-toggle-group__btn[aria-pressed="true"]');
  if (!btn || !btn.offsetWidth) { group.removeAttribute('data-ntn-ink'); return; }
  group.style.setProperty('--ntn-toggle-x', btn.offsetLeft + 'px');
  group.style.setProperty('--ntn-toggle-w', btn.offsetWidth + 'px');
  group.setAttribute('data-ntn-ink', '');
}

function setupToggleInk(group) {
  observeInk(group, $$('.ntn-toggle-group__btn', group));
  toggleInk(group);
}

/* ── Date range picker ───────────────────────────────────────────────────────
   <div class="ntn-daterange" data-ntn-daterange data-ntn-start="2026-09-01" …>
   The trigger, the preset list and the footer are markup; the two month grids are
   rendered here. Selection is draft-first: nothing leaves the component until
   Apply (or Clear), which fires ntn:daterangechange. The data-ntn-start / -end / -time
   attributes always hold the committed value: an app may change them and call refresh(root),
   or call setDateRange(). The panel opens in the top layer, placed against the trigger. */

const drMonthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const drDayFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const drFullFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const drTimeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const drNarrow = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
/* 1 Sep 2024 was a Sunday — seven days from there gives the locale's initials. */
const DOW = Array.from({ length: 7 }, (_, i) => drNarrow.format(new Date(2024, 8, 1 + i)));

const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthStart = (d, n = 0) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const shift = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a, b) => !!a && !!b && a.getTime() === b.getTime();
const drIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const drParse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const drTimeOk = (t) => /^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(t || '');
/* The input's value stays 24-hour HH:MM; the label shows it the way the user's locale does. */
const drTimeLabel = (t) => (drTimeOk(t) ? drTimeFmt.format(new Date(2000, 0, 1, +t.slice(0, 2), +t.slice(3, 5))) : '');
const drStamp = (s, d) => (d && s.time ? `${drIso(d)}T${s.time}` : d ? drIso(d) : null);

function drLabel(a, b, time) {
  if (!a) return null;
  const t = drTimeLabel(time) ? ` · ${drTimeLabel(time)}` : '';
  if (!b || same(a, b)) return drFullFmt.format(a) + t;
  return a.getFullYear() === b.getFullYear()
    ? `${drDayFmt.format(a)} – ${drFullFmt.format(b)}`
    : `${drFullFmt.format(a)} – ${drFullFmt.format(b)}`;
}

const drDefaults = new WeakMap();
const drPanel = (root) => root.querySelector('.ntn-daterange__panel');

function drState(root) {
  if (!root.ntnRange) {
    const single = root.hasAttribute('data-ntn-single');
    root.ntnRange = { single, hover: null, open: false };
    drDefaults.set(root, { start: root.dataset.ntnStart || null, end: root.dataset.ntnEnd || null, time: root.dataset.ntnTime || null });
    drLoad(root);
  }
  return root.ntnRange;
}

/* Reads the committed value from the attributes. Skipped while open, so a draft survives. */
function drLoad(root) {
  const s = drState(root);
  if (s.open) return;
  s.start = drParse(root.dataset.ntnStart);
  s.end = s.single ? s.start : drParse(root.dataset.ntnEnd);
  s.draftStart = s.start; s.draftEnd = s.end;
  s.time = drTimeOk(root.dataset.ntnTime) ? root.dataset.ntnTime : '';
  s.view = monthStart(s.start || new Date());
}

/* Opens in the top layer where the browser supports popovers, so no overflow ancestor clips the
   panel and it sits above a modal around it. The markup ships hidden for the no-JS case. */
function drSetup(root) {
  const panel = drPanel(root);
  if (!panel || typeof panel.showPopover !== 'function') return;
  if (!panel.hasAttribute('popover')) panel.setAttribute('popover', 'manual');
  panel.hidden = false;
}

function drShow(panel, on) {
  if (!panel) return;
  if (panel.hasAttribute('popover') && typeof panel.showPopover === 'function') {
    try { on ? panel.showPopover() : panel.hidePopover(); } catch (e) { /* already in that state */ }
  } else {
    panel.hidden = !on;
  }
}

/* Form association: data-ntn-name="x" keeps hidden inputs in step with the committed value —
   x (ISO start, with THH:MM when there is a time) and, for a range, x-end. "" when empty. */
function drSyncInputs(root) {
  const name = root.dataset.ntnName;
  if (!name) return;
  const s = drState(root);
  const want = [[name, drStamp(s, s.start)]];
  if (!s.single) want.push([name + '-end', drStamp(s, s.end)]);
  const inputs = $$('input[data-ntn-daterange-input]', root);
  want.forEach(([n, v], i) => {
    let input = inputs[i];
    if (!input) { input = make('input', { type: 'hidden', 'data-ntn-daterange-input': '' }); root.append(input); }
    input.name = n;
    input.value = v || '';
  });
  inputs.slice(want.length).forEach((el) => el.remove());
}

function drRefresh(root) {
  drSetup(root);
  drLoad(root);
  drSyncTrigger(root);
  drSyncInputs(root);
}

/**
 * Sets a date picker's committed value from code (a saved filter, a record being edited) and
 * redraws its trigger and form inputs. Fires no event, like setting an input's value.
 * @param {Element} root  the [data-ntn-daterange] element
 * @param {{ start?: string|Date|null, end?: string|Date|null, time?: string|null }} value
 *   Dates as YYYY-MM-DD or Date, time as 24-hour HH:MM. null clears a part; a part left out is kept.
 */
export function setDateRange(root, { start, end, time } = {}) {
  if (!root || !root.matches || !root.matches('[data-ntn-daterange]')) return;
  const s = drState(root);
  if (s.open) drClose(root, false);
  const day = (v) => (v instanceof Date ? drIso(v) : drParse(v) ? v : '');
  if (start !== undefined) root.dataset.ntnStart = day(start);
  if (end !== undefined) root.dataset.ntnEnd = day(end);
  if (time !== undefined) { if (drTimeOk(time)) root.dataset.ntnTime = time; else delete root.dataset.ntnTime; }
  drRefresh(root);
  const t = root.querySelector('[data-ntn-daterange-time]');
  if (t) t.value = s.time;
}

/* A form reset puts each picker back to the value it was first rendered with. */
function drOnReset(e) {
  if (e.defaultPrevented) return;
  $$('[data-ntn-daterange]', e.target).forEach((root) => {
    const initial = drDefaults.get(root);
    if (initial) setDateRange(root, initial);
  });
}

function drPresetRange(key) {
  const today = day0(new Date());
  if (/^\d+$/.test(key)) return [shift(today, 1 - Number(key)), today];
  if (key === 'today') return [today, today];
  if (key === 'yesterday') return [shift(today, -1), shift(today, -1)];
  if (key === 'month') return [monthStart(today), today];
  if (key === 'last-month') return [monthStart(today, -1), shift(monthStart(today), -1)];
  if (key === 'ytd') return [new Date(today.getFullYear(), 0, 1), today];
  return null;
}

function drRenderCal(root, s, cal, offset, last) {
  const view = monthStart(s.view, offset);
  const lead = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay());
  const today = day0(new Date());
  const min = drParse(root.dataset.ntnMin);
  const max = drParse(root.dataset.ntnMax);
  let a = s.draftStart;
  let b = s.draftEnd;
  if (!s.single && a && !b && s.hover) { b = s.hover < a ? a : s.hover; a = s.hover < a ? s.hover : a; }

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = shift(lead, i);
    const outside = d.getMonth() !== view.getMonth();
    const off = (min && d < min) || (max && d > max);
    const isA = same(d, a);
    const isB = same(d, b);
    const inside = a && b && d >= a && d <= b;
    let band = '';
    if (isA && (isB || !b)) band = 'only';
    else if (isA) band = 'start';
    else if (isB) band = 'end';
    else if (inside) band = 'mid';
    cells.push(
      `<button type="button" class="ntn-daterange__day" data-ntn-day="${drIso(d)}"` +
      (band ? ` data-range="${band}"` : '') + (isA || isB ? ' data-edge' : '') +
      (outside ? ' data-outside' : '') + (same(d, today) ? ' aria-current="date"' : '') +
      (off ? ' disabled' : '') + `>${d.getDate()}</button>`
    );
  }

  // The grid holds only dates and weekday initials, so it is safe to write as HTML.
  const grid = make('div', { class: 'ntn-daterange__grid' });
  grid.innerHTML = DOW.map((x) => `<span class="ntn-daterange__dow">${x}</span>`).join('') + cells.join('');

  // The head is built once and patched, so a focused year input survives every redraw (hover,
  // arrows, presets); only the grid is replaced.
  let head = cal.querySelector(':scope > .ntn-daterange__head');
  if (!head) {
    const nav = (dir, label) => make('button', { type: 'button', class: 'ntn-daterange__nav', 'data-ntn-month': String(dir), 'aria-label': label });
    head = make('div', { class: 'ntn-daterange__head' }, nav(-1, 'Previous month'), make('span', { class: 'ntn-daterange__month' }), nav(1, 'Next month'));
    cal.replaceChildren(head);
  }
  const [prev, month, next] = head.children;
  // Redrawn each time, so configure({ icon }) and refresh() still reach the arrows.
  prev.replaceChildren(renderIcon('prev'));
  next.replaceChildren(renderIcon('next'));
  prev.toggleAttribute('data-ghost', !!offset);
  next.toggleAttribute('data-ghost', offset !== last);
  drPatchMonth(root, month, view, offset);
  const old = cal.querySelector(':scope > .ntn-daterange__grid');
  if (old) old.replaceWith(grid); else cal.append(grid);
}

/* The year in each month heading is a number input styled as text: click it to step or
   type a year. Only where the heading's year is the Gregorian year in Latin digits, so the input
   never disagrees with the year on screen; other calendars keep a plain heading. */
const drYearEditable = (() => {
  const o = drMonthFmt.resolvedOptions();
  return o.calendar === 'gregory' && o.numberingSystem === 'latn';
})();

function drPatchMonth(root, month, view, offset) {
  const parts = drMonthFmt.formatToParts(view);
  const at = parts.findIndex((p) => p.type === 'year');
  if (!drYearEditable || at < 0) { month.textContent = drMonthFmt.format(view); return; }
  let input = month.querySelector('[data-ntn-year]');
  if (!input) {
    input = drYearInput(root, offset);
    month.replaceChildren(document.createTextNode(''), input, document.createTextNode(''));
  }
  const text = (list) => list.map((p) => p.value).join('');
  month.firstChild.data = text(parts.slice(0, at));
  month.lastChild.data = text(parts.slice(at + 1));
  // Bounds: the years of data-ntn-min / -max, else a century either side (so ↑ on an emptied
  // field lands near now, not in year 1000), always taking in the year on show.
  const year = view.getFullYear();
  const now = new Date().getFullYear();
  const min = drParse(root.dataset.ntnMin);
  const max = drParse(root.dataset.ntnMax);
  input.min = String(Math.min(year, min ? min.getFullYear() : now - 100));
  input.max = String(Math.max(year, max ? max.getFullYear() : now + 100));
  if (document.activeElement !== input) input.value = String(year);
}

/* Its events stop here: a year edit is navigation, not a value, so neither the picker's root nor a
   form hears input or change (form="" also rules out implicit submission on Enter). */
function drYearInput(root, offset) {
  const input = make('input', {
    type: 'number', class: 'ntn-daterange__year', 'data-ntn-year': '', inputmode: 'numeric',
    form: '', 'aria-label': 'Year', step: '1',
  });
  let from = null;
  // Sets the view absolutely, keeping this month's month, so repeated steps never compound and
  // either month of a two-month panel can be edited. Clamped to the min / max months.
  const go = (y) => {
    const s = drState(root);
    let v = new Date(y, monthStart(s.view, offset).getMonth(), 1);
    const min = drParse(root.dataset.ntnMin);
    const max = drParse(root.dataset.ntnMax);
    if (min && v < monthStart(min)) v = monthStart(min);
    if (max && v > monthStart(max)) v = monthStart(max);
    s.view = monthStart(v, -offset);
    drRender(root);
  };
  input.addEventListener('focus', () => { from = Number(input.value); });
  input.addEventListener('input', (e) => {
    e.stopPropagation();
    const y = Number(input.value);
    // A partly typed year ("20") waits for the rest.
    if (/^\d{4}$/.test(input.value) && y >= Number(input.min) && y <= Number(input.max)) go(y);
  });
  input.addEventListener('change', (e) => e.stopPropagation());
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Enter') return;
    // Stopped here, so Escape leaves the panel (and a drawer or modal around it) open.
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape' && from) { input.value = String(from); go(from); }
    input.blur();
  });
  // Leaving puts the year on show back, so an emptied or partial value never lingers.
  input.addEventListener('blur', () => { input.value = String(monthStart(drState(root).view, offset).getFullYear()); });
  return input;
}

function drRender(root) {
  const s = drState(root);
  const cals = $$('[data-ntn-cal]', root);
  const last = cals.length - 1;
  cals.forEach((cal, i) => drRenderCal(root, s, cal, Number(cal.dataset.ntnCal) || i, last));

  const summary = root.querySelector('[data-ntn-daterange-summary]');
  if (summary) {
    const text = drLabel(s.draftStart, s.draftEnd, s.time);
    const nights = !s.single && s.draftStart && s.draftEnd ? Math.round((s.draftEnd - s.draftStart) / 86400000) + 1 : 0;
    // The label can carry a typed time value, so it is built as text, never parsed as HTML.
    if (text) summary.replaceChildren(make('b', {}, text), nights ? ` · ${nights} day${nights === 1 ? '' : 's'}` : '');
    else summary.textContent = s.single ? 'Pick a date' : 'Pick a start date';
  }

  const applied = drLabel(s.draftStart, s.draftEnd, s.time);
  $$('[data-ntn-range]', root).forEach((p) => {
    const r = drPresetRange(p.getAttribute('data-ntn-range'));
    p.setAttribute('aria-pressed', String(!!r && same(r[0], s.draftStart) && same(r[1], s.draftEnd)));
  });

  const apply = root.querySelector('[data-ntn-daterange-apply]');
  if (apply) apply.disabled = !applied;
}

function drSyncTrigger(root) {
  const s = drState(root);
  const out = root.querySelector('[data-ntn-daterange-label]');
  if (!out) return;
  const text = drLabel(s.start, s.end, s.time);
  out.textContent = text || out.dataset.ntnPlaceholder || (s.single ? 'Select a date' : 'Select dates');
  out.toggleAttribute('data-empty', !text);
}

function drClose(root, commit) {
  const s = drState(root);
  const trigger = root.querySelector('.ntn-daterange__trigger');
  if (commit) {
    s.start = s.draftStart;
    s.end = s.single ? s.draftStart : (s.draftEnd || s.draftStart);
    root.dataset.ntnStart = s.start ? drIso(s.start) : '';
    root.dataset.ntnEnd = s.end ? drIso(s.end) : '';
    if (s.time) root.dataset.ntnTime = s.time; else delete root.dataset.ntnTime;
    drSyncTrigger(root);
    drSyncInputs(root);
    root.dispatchEvent(new CustomEvent('ntn:daterangechange', {
      bubbles: true,
      detail: {
        start: s.start ? drIso(s.start) : null, end: s.end ? drIso(s.end) : null,
        time: s.time || null, startISO: drStamp(s, s.start), endISO: drStamp(s, s.end),
        single: s.single, startDate: s.start, endDate: s.end,
      },
    }));
    root.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    s.draftStart = s.start; s.draftEnd = s.end; s.time = root.dataset.ntnTime || '';
    const t = root.querySelector('[data-ntn-daterange-time]');
    if (t) t.value = s.time;
  }
  s.hover = null;
  s.open = false;
  drShow(drPanel(root), false);
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

/* Clear commits an empty value at once (an optional publish or expiry date). */
function drClear(root) {
  const s = drState(root);
  s.draftStart = null; s.draftEnd = null; s.time = '';
  const t = root.querySelector('[data-ntn-daterange-time]');
  if (t) t.value = '';
  drClose(root, true);
}

/* Narrow (chip presets, one month) when the full panel cannot fit the window; then, in the top
   layer, place it under the trigger — flipped above near the bottom, kept on screen. */
function drPlace(root) {
  const panel = drPanel(root);
  if (!panel) return;
  panel.classList.remove('ntn-daterange__panel--narrow');
  if (panel.offsetWidth > innerWidth - 16) panel.classList.add('ntn-daterange__panel--narrow');
  const trigger = root.querySelector('.ntn-daterange__trigger');
  if (trigger && panel.hasAttribute('popover')) placeFixed(panel, trigger, panel.dataset.ntnPlacement || 'bottom-start', 6);
}

function drOpen(root) {
  const s = drState(root);
  const panel = drPanel(root);
  const trigger = root.querySelector('.ntn-daterange__trigger');
  drSetup(root);
  s.draftStart = s.start; s.draftEnd = s.end; s.hover = null;
  s.view = monthStart(s.start || new Date());
  s.open = true;
  drShow(panel, true);
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  drRender(root);
  drPlace(root);
}

/* Returns true when the click belonged to the picker. */
function drOnClick(root, e) {
  const s = drState(root);

  if (e.target.closest('.ntn-daterange__trigger')) {
    // The second click of a double click (or of a chattering mouse switch) changes nothing, so a
    // panel never opens and shuts again in one go. Keys give detail 0 and still toggle.
    if (e.detail > 1) return true;
    s.open ? drClose(root, false) : drOpen(root);
    return true;
  }
  if (!s.open) return false;

  const nav = e.target.closest('[data-ntn-month]');
  if (nav) { s.view = monthStart(s.view, Number(nav.getAttribute('data-ntn-month'))); drRender(root); return true; }

  const preset = e.target.closest('[data-ntn-range]');
  if (preset) {
    const r = drPresetRange(preset.getAttribute('data-ntn-range'));
    if (r) { s.draftStart = r[0]; s.draftEnd = r[1]; s.hover = null; s.view = monthStart(r[1], -1); drRender(root); }
    return true;
  }

  const cell = e.target.closest('[data-ntn-day]');
  if (cell) {
    const d = drParse(cell.getAttribute('data-ntn-day'));
    if (s.single) { s.draftStart = d; s.draftEnd = d; }
    else if (!s.draftStart || s.draftEnd || d < s.draftStart) { s.draftStart = d; s.draftEnd = null; }
    else s.draftEnd = d;
    s.hover = null;
    drRender(root);
    return true;
  }

  if (e.target.closest('[data-ntn-daterange-apply]')) { drClose(root, true); return true; }
  if (e.target.closest('[data-ntn-daterange-clear]')) { drClear(root); return true; }
  if (e.target.closest('[data-ntn-daterange-cancel]')) { drClose(root, false); return true; }
  return true;
}

function drOnHover(e) {
  const cell = e.target.closest && e.target.closest('[data-ntn-day]');
  if (!cell) return;
  const root = cell.closest('[data-ntn-daterange]');
  if (!root) return;
  const s = drState(root);
  if (!s.open || !s.draftStart || s.draftEnd) return;
  const d = drParse(cell.getAttribute('data-ntn-day'));
  if (same(d, s.hover)) return;
  s.hover = d;
  drRender(root);
}

/* Steps: with data-ntn-steps on the list, clicking a step walks the states. */
function stepsGoto(step) {
  const root = step.closest('.ntn-steps');
  if (!root || !root.hasAttribute('data-ntn-steps')) return;
  const steps = $$('.ntn-steps__step', root);
  const at = steps.indexOf(step);
  steps.forEach((s, i) => s.setAttribute('data-state', i < at ? 'complete' : i === at ? 'current' : 'upcoming'));
  $$('[data-ntn-steps-count]', root).forEach((el) => { el.textContent = 'Step ' + (at + 1) + ' of ' + steps.length; });
  root.dispatchEvent(new CustomEvent('ntn:stepchange', { bubbles: true, detail: { index: at, id: step.dataset.ntnId || null, total: steps.length } }));
}

/* ── Sidebar drawer ──────────────────────────────────────────────────────────
   At 720px and below the sidebar is off-canvas: data-open slides it in over an optional
   .ntn-sidebar__scrim sibling. The data-ntn-toggle that collapses it to a rail on wider screens
   opens and closes it here instead. Focus moves into the drawer, and Escape or the scrim closes it
   and returns focus to the toggle. */
const DRAWER_QUERY = '(max-width: 720px)';
const drawerMode = () => typeof matchMedia === 'function' && matchMedia(DRAWER_QUERY).matches;
const drawerOpeners = new WeakMap();

function drawerSet(sidebar, open, opener) {
  sidebar.toggleAttribute('data-open', open);
  const toggles = $$('[data-ntn-toggle]').filter((t) => target(t, 'data-ntn-toggle') === sidebar);
  toggles.forEach((t) => t.setAttribute('aria-expanded', String(open)));
  if (open) {
    if (opener) drawerOpeners.set(sidebar, opener);
    const first = sidebar.querySelector('.ntn-sidebar__item[aria-current="page"]') || sidebar.querySelector('.ntn-sidebar__item');
    if (first) first.focus();
  } else {
    const back = drawerOpeners.get(sidebar) || toggles[0];
    if (back && sidebar.contains(document.activeElement)) back.focus();
  }
}

function onClick(e) {
  // An enhanced select first: its trigger is also a dropdown trigger, but opening builds the list.
  const sel = selRoot(e.target);
  if (sel && onSelectClick(sel, e)) return;

  // Dropdown trigger: toggle. A chosen menu item, or a data-ntn-close inside an open panel
  // (a filter form's Apply), closes it; the item's own action still runs.
  const ddTrig = e.target.closest('[data-ntn-dropdown] > [aria-haspopup], [data-ntn-dropdown] > [data-ntn-dropdown-trigger]');
  if (ddTrig && !ddTrig.disabled && ddTrig.getAttribute('aria-disabled') !== 'true') { ddToggle(ddTrig); return; }
  const ddItem = e.target.closest('[data-ntn-dropdown][data-ntn-open] .ntn-menu__item');
  if (ddItem && !ddItem.hasAttribute('aria-haspopup') && ddItem.getAttribute('aria-disabled') !== 'true') ddClose(ddItem);
  const ddCloser = e.target.closest('[data-ntn-dropdown][data-ntn-open] [data-ntn-close]');
  if (ddCloser) { ddClose(ddCloser, { returnFocus: true }); return; }

  const drRoot = e.target.closest('[data-ntn-daterange]');
  $$('[data-ntn-daterange]').forEach((r) => { if (r !== drRoot && drState(r).open) drClose(r, false); });
  if (drRoot && drOnClick(drRoot, e)) return;

  const combo = e.target.closest('[data-ntn-combo]');
  $$('[data-ntn-combo]').forEach((r) => { if (r !== combo) comboClose(r); });
  if (combo) {
    const clear = e.target.closest('[data-ntn-combo-clear]');
    if (clear) {
      const v = clear.getAttribute('data-ntn-combo-clear');
      const hit = comboOptions(combo).find((o) => comboValue(o) === v);
      if (hit) { hit.setAttribute('aria-selected', 'false'); comboRender(combo); comboFire(combo); }
      return;
    }
    if (e.target.closest('[data-ntn-combo-none]')) {
      comboOptions(combo).forEach((o) => o.setAttribute('aria-selected', 'false'));
      comboRender(combo); comboFire(combo);
      return;
    }
    if (e.target.closest('.ntn-combo__trigger')) {
      const panel = combo.querySelector('.ntn-combo__panel');
      if (panel && panel.hidden) comboOpenPanel(combo); else comboClose(combo);
      return;
    }
    const opt = e.target.closest('.ntn-combo__option');
    if (opt) { comboPick(combo, opt); return; }
  }

  const row = e.target.closest('.ntn-tree__row');
  if (row) {
    const item = row.closest('.ntn-tree__item');
    if (e.target.closest('.ntn-tree__grip') || e.target.closest('.ntn-tree__actions')) return;
    if (e.target.closest('.ntn-tree__twisty')) { treeToggle(item); return; }
    treeFocus(item);
    treeSelect(item, e.metaKey || e.ctrlKey);
    if (treeGroup(item)) treeToggle(item);
    return;
  }

  const stepHit = e.target.closest('.ntn-steps__hit');
  if (stepHit) { stepsGoto(stepHit.closest('.ntn-steps__step')); return; }

  const themeToggle = e.target.closest('[data-ntn-theme-toggle]');
  if (themeToggle && themeManaged) { toggleTheme(); return; }

  const themeSet = e.target.closest('[data-ntn-theme-set]');
  if (themeSet && themeManaged) { setTheme(themeSet.getAttribute('data-ntn-theme-set')); return; }

  const open = e.target.closest('[data-ntn-open]');
  if (open) { const d = target(open, 'data-ntn-open'); if (d && d.showModal) { d.showModal(); return; } }

  const close = e.target.closest('[data-ntn-close]');
  if (close) { const d = close.closest('dialog') || target(close, 'data-ntn-close'); if (d) { d.close(); return; } }

  const dismiss = e.target.closest('[data-ntn-dismiss]');
  if (dismiss) { const box = dismiss.closest('.ntn-alert'); if (box) { box.remove(); return; } }

  const scrim = e.target.closest('.ntn-sidebar__scrim');
  if (scrim) { $$('.ntn-sidebar[data-open]').forEach((sb) => drawerSet(sb, false)); return; }

  const toggle = e.target.closest('[data-ntn-toggle]');
  if (toggle) {
    const el = target(toggle, 'data-ntn-toggle');
    // On a phone the sidebar is an off-canvas drawer: the same toggle opens and closes it.
    if (el && el.classList.contains('ntn-sidebar') && drawerMode()) {
      drawerSet(el, !el.hasAttribute('data-open'), toggle);
      return;
    }
    if (el) {
      const collapsed = el.hasAttribute('data-collapsed');
      el.toggleAttribute('data-collapsed', !collapsed);
      toggle.setAttribute('aria-expanded', String(collapsed));
      return;
    }
  }

  const reveal = e.target.closest('[data-ntn-reveal]');
  if (reveal) {
    const el = target(reveal, 'data-ntn-reveal');
    if (el) {
      el.hidden = !el.hidden;
      reveal.setAttribute('aria-expanded', String(!el.hidden));
      if (reveal.matches('.ntn-btn, .ntn-icon-btn')) reveal.setAttribute('aria-pressed', String(!el.hidden));
      return;
    }
  }

  const toggleBtn = e.target.closest('.ntn-toggle-group__btn');
  if (toggleBtn) {
    pressToggle(toggleBtn);
    if (toggleBtn.hasAttribute('data-ntn-filter-tag')) {
      const table = tableFor(toggleBtn);
      if (table) { const s = stateOf(table); s.tag = toggleBtn.getAttribute('data-ntn-filter-tag'); s.page = 1; applyTable(table); }
    }
    return;
  }

  const goto = e.target.closest('[data-ntn-goto], [data-ntn-prev], [data-ntn-next]');
  if (goto) {
    const table = tableFor(goto);
    if (table) {
      const s = stateOf(table);
      if (goto.hasAttribute('data-ntn-goto')) s.page = Number(goto.getAttribute('data-ntn-goto'));
      else s.page += goto.hasAttribute('data-ntn-next') ? 1 : -1;
      applyTable(table);
      return;
    }
  }

  const tab = e.target.closest('.ntn-tabs__tab');
  if (tab && !tab.disabled && tab.getAttribute('aria-disabled') !== 'true') { selectTab(tab); return; }
}

function onKeyDown(e) {
  const t = e.target;
  const q = (sel) => (t && t.closest ? t.closest(sel) : null);

  // Escape in a dismissible toast closes that toast only (preventDefault keeps a modal open).
  const toastEl = q('.ntn-toast');
  if (toastEl && e.key === 'Escape' && toastEl.querySelector('.ntn-toast__close')) {
    e.preventDefault();
    toastClose(toastEl, 'dismiss');
    return;
  }

  // A select's keys come before the dropdown's: the arrows open it, and move through its list.
  const sel = q('[data-ntn-select]');
  if (sel && onSelectKey(sel, e)) return;

  // A closed dropdown's trigger: arrow keys open it on the first / last item.
  const ddTrig = q('[data-ntn-dropdown] > [aria-haspopup], [data-ntn-dropdown] > [data-ntn-dropdown-trigger]');
  if (ddTrig && !ddIsOpen(ddRoot(ddTrig)) && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    ddOpen(ddTrig, { focus: e.key === 'ArrowUp' ? 'last' : 'first' });
    return;
  }

  const tab = q('.ntn-tabs__tab');
  if (tab) { onTabKey(tab, e); return; }
  const combo = q('[data-ntn-combo]');
  if (combo) {
    onComboKey(combo, e);
    // An Escape the combo used (to close its own panel) stops here; otherwise it may close a dropdown.
    if (e.key !== 'Escape' || e.defaultPrevented) return;
  }
  const item = q('.ntn-tree__item');
  if (item && t === item) { onTreeKey(item, e); return; }
  const mi = q('.ntn-menu__item');
  if (mi) onSubmenuKey(mi, e);

  if (e.key !== 'Escape') return;
  const openDrawer = $$('.ntn-sidebar[data-open]')[0];
  if (openDrawer && !q('[data-ntn-dropdown][data-ntn-open]')) { e.preventDefault(); drawerSet(openDrawer, false); return; }
  // Innermost first: an open date picker, then an open submenu, then the dropdown around the focus.
  const openRanges = $$('[data-ntn-daterange]').filter((r) => drState(r).open);
  if (openRanges.length) { openRanges.forEach((r) => drClose(r, false)); e.preventDefault(); return; }
  const openSub = q('.ntn-menu__sub[data-ntn-open]');
  $$('.ntn-menu__sub[data-ntn-open]').forEach((s) => s.removeAttribute('data-ntn-open'));
  if (openSub) { e.preventDefault(); const owner = openSub.querySelector(':scope > .ntn-menu__item'); if (owner) owner.focus(); return; }
  const dd = q('[data-ntn-dropdown][data-ntn-open]') || $$('[data-ntn-dropdown][data-ntn-open]').pop();
  if (dd) {
    // preventDefault also stops a native <dialog> around the menu from closing on this Escape.
    e.preventDefault();
    ddClose(dd, { returnFocus: true });
  }
}

function onChange(e) {
  const el = e.target;
  if (el.matches('.ntn-slider input[type="range"]')) syncSlider(el);
  if (el.matches('.ntn-table input[type="checkbox"]')) {
    const table = el.closest('.ntn-table');
    if (el.hasAttribute('data-ntn-select-all')) {
      $$('tbody input[type="checkbox"]', table).forEach((b) => { b.checked = el.checked; });
    }
    syncTable(table);
  }
  if (e.type === 'change' && el.matches('[data-ntn-dropzone] input[type="file"]')) {
    const zone = el.closest('[data-ntn-dropzone]');
    if (zone.getAttribute('aria-disabled') !== 'true') dzFire(zone, el.files);
  }
  if (el.matches('[data-ntn-daterange-time]')) {
    const root = el.closest('[data-ntn-daterange]');
    if (root) { drState(root).time = el.value; drRender(root); }
  }
  if (el.matches('[data-ntn-page-size]')) {
    const table = tableFor(el);
    if (table) { const s = stateOf(table); s.size = Number(el.value) || 10; s.page = 1; applyTable(table); }
  }
  if (el.matches('[data-ntn-select] .ntn-select__control > select')) selRender(selRoot(el));
  if (el.matches('.ntn-select__search')) {
    const root = selRoot(el);
    if (root) { selFilter(root); selActivate(root, selPickable(root)[0] || null); ddPlace(selCtl(root)); }
  }
  if (el.matches('[data-ntn-combo-search]')) {
    const root = el.closest('[data-ntn-combo]');
    if (root) comboFilter(root);
  }
  if (el.matches('[data-ntn-table-search]')) {
    const table = tableFor(el);
    if (table) { const s = stateOf(table); s.q = el.value.trim().toLowerCase(); s.page = 1; applyTable(table); }
  }
}

/* ── Avatar hue ──────────────────────────────────────────────────────────────
   A stable colour per person. The hash is deliberately simple so a server can twin it:
   h = (h × 31 + c) mod 360 over the name's UTF-16 code units c, from h = 0. A twin must hash
   the same units (JavaScript's charCodeAt, Java's charAt), not code points, to agree on
   names outside the Basic Multilingual Plane (emoji, some CJK). */

/**
 * The hue (0–359) for a name, for --ntn-avatar-hue.
 * @param {string} name
 * @returns {number}
 */
export function avatarHue(name) {
  const s = String(name ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/* data-ntn-avatar-name="Ada Lovelace" on an .ntn-avatar sets its hue from the name. */
function syncAvatar(el) {
  el.style.setProperty('--ntn-avatar-hue', String(avatarHue(el.dataset.ntnAvatarName)));
}

/* ── Drop area ───────────────────────────────────────────────────────────────
   <label class="ntn-dropzone" data-ntn-dropzone> with a file input stretched over it. The
   browser already takes a drop on that input; this adds data-ntn-dragover while files are held
   over the area, and fires ntn:files { files } on a drop or a pick, for apps with no upload
   library. Enters and leaves are counted, because moving over a child fires both. Only drags
   that carry files count, so a tree row dragged across the page passes it by. */

const dzDepth = new WeakMap();
const dzFiles = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');

function dzZone(e) {
  const zone = e.target.closest && e.target.closest('[data-ntn-dropzone]');
  return zone && zone.getAttribute('aria-disabled') !== 'true' && dzFiles(e) ? zone : null;
}

function dzFire(zone, files) {
  zone.dispatchEvent(new CustomEvent('ntn:files', { bubbles: true, detail: { files: Array.from(files || []) } }));
}

function dzReset(zone) {
  dzDepth.delete(zone);
  zone.removeAttribute('data-ntn-dragover');
}

function onDzEnter(e) {
  const zone = dzZone(e);
  if (!zone) return;
  dzDepth.set(zone, (dzDepth.get(zone) || 0) + 1);
  zone.setAttribute('data-ntn-dragover', '');
}

function onDzLeave(e) {
  const zone = dzZone(e);
  if (!zone) return;
  const depth = (dzDepth.get(zone) || 1) - 1;
  if (depth > 0) dzDepth.set(zone, depth); else dzReset(zone);
}

/* Without this, a drop that misses the input would make the browser open the file. */
function onDzOver(e) {
  if (dzZone(e)) e.preventDefault();
}

function onDzDrop(e) {
  const zone = dzZone(e);
  if (!zone) return;
  dzReset(zone);
  // A drop on the input sets its files natively, and the change that follows fires ntn:files.
  if (e.target.matches && e.target.matches('input[type="file"]')) return;
  e.preventDefault();
  dzFire(zone, e.dataTransfer.files);
}

/* ── Toast ───────────────────────────────────────────────────────────────────
   toast() builds a notice in a corner region, created on first use (one per placement and
   container). The region opens in the top layer; while a modal is open it is mounted inside
   that dialog, because everything outside a modal is inert. Announcements go through two hidden
   live regions per container (polite, and assertive for danger), so each toast is read once.
   Text is always set as text, never parsed as HTML. */

const TOAST_PLACEMENTS = ['top-end', 'top-start', 'top-center', 'bottom-end', 'bottom-start'];
const TOAST_TONES = ['primary', 'success', 'warning', 'danger', 'info'];
const TOAST_ICONS = ['success', 'warning', 'danger', 'info'];
const TOAST_MAX = 5;
const TOAST_LEAVE_MS = 160;
const toasts = new WeakMap();

/* The topmost open modal, if any: toasts outside it could not be reached. */
function toastHost() {
  const modals = $$('dialog[open]').filter((d) => { try { return d.matches(':modal'); } catch (e) { return false; } });
  return modals.pop() || document.body;
}

function toastLive(host, assertive) {
  const sel = `:scope > .ntn-toaster__live[aria-live="${assertive ? 'assertive' : 'polite'}"]`;
  let live = host.querySelector(sel);
  if (!live) { live = make('div', { class: 'ntn-toaster__live', 'aria-live': assertive ? 'assertive' : 'polite', 'aria-atomic': 'true' }); host.append(live); }
  return live;
}

function toastRegion(host, placement) {
  let region = host.querySelector(`:scope > .ntn-toaster[data-ntn-placement="${placement}"]`);
  if (!region) {
    region = make('section', { class: 'ntn-toaster', 'data-ntn-placement': placement, 'aria-label': 'Notifications' });
    if (typeof region.showPopover === 'function') region.setAttribute('popover', 'manual');
    host.append(region);
  }
  return region;
}

const regionToasts = (region) => $$(':scope > .ntn-toast:not([data-ntn-leaving])', region);

/* An empty region is hidden; re-opening it puts it on top of the top layer again, above any
   menu or picker opened since. (A region already showing toasts is left alone, since re-opening
   would replay their animations.) */
function toastRaise(region) {
  if (!region.hasAttribute('popover') || regionToasts(region).length) return;
  try { region.hidePopover(); } catch (e) { /* not open */ }
  try { region.showPopover(); } catch (e) { /* detached */ }
}

function toastSettle(region) {
  if (region.querySelector(':scope > .ntn-toast')) return;
  if (region.hasAttribute('popover')) { try { region.hidePopover(); } catch (e) { /* not open */ } }
}

function toastTick(el) {
  const t = toasts.get(el);
  if (!t || !t.duration) return;
  const pause = t.hover || t.focus;
  el.toggleAttribute('data-ntn-paused', pause);
  if (pause && t.timer) {
    clearTimeout(t.timer); t.timer = null;
    t.left -= Date.now() - t.since;
  } else if (!pause && !t.timer) {
    t.since = Date.now();
    t.timer = setTimeout(() => toastClose(el, 'timeout'), Math.max(0, t.left));
  }
}

function toastClose(el, reason) {
  const t = toasts.get(el);
  if (!t || t.closed) return;
  t.closed = true;
  clearTimeout(t.timer);
  const region = el.parentElement;
  const hadFocus = el.contains(document.activeElement);
  el.setAttribute('data-ntn-leaving', '');
  el.dispatchEvent(new CustomEvent('ntn:toastclose', { bubbles: true, detail: { reason } }));
  if (hadFocus) {
    // Back to where the user was before tabbing in, or to the next toast.
    const next = region && regionToasts(region).map((x) => x.querySelector('.ntn-toast__close')).find(Boolean);
    const back = t.returnTo && t.returnTo.isConnected ? t.returnTo : next;
    if (back) back.focus();
  }
  setTimeout(() => { el.remove(); if (region) toastSettle(region); }, TOAST_LEAVE_MS);
}

/**
 * Shows a toast.
 * @param {string | {
 *   message?: string, title?: string, tone?: 'neutral'|'primary'|'success'|'warning'|'danger'|'info',
 *   duration?: number, dismissible?: boolean, icon?: boolean,
 *   placement?: 'top-end'|'top-start'|'top-center'|'bottom-end'|'bottom-start'
 * }} options  A string is the message. duration is in ms (default 4000); 0 keeps it until
 *   dismissed. Text is set as text, so it may carry user data.
 * @returns {{ element: HTMLElement, close: () => void }}
 */
export function toast(options = {}) {
  const o = typeof options === 'string' ? { message: options } : options;
  const { message = '', title = '', duration = 4000, dismissible = true, icon = true } = o;
  const tone = TOAST_TONES.includes(o.tone) ? o.tone : 'neutral';
  const placement = TOAST_PLACEMENTS.includes(o.placement) ? o.placement : 'top-end';
  const host = toastHost();
  const region = toastRegion(host, placement);

  const el = make('div', { class: 'ntn-toast' + (tone === 'neutral' ? '' : ' ntn-toast--' + tone) });
  if (icon && TOAST_ICONS.includes(tone)) {
    const glyph = renderIcon(tone);
    glyph.classList.add('ntn-toast__icon');
    glyph.setAttribute('aria-hidden', 'true');
    el.append(glyph);
  }
  const body = make('div', { class: 'ntn-toast__body' });
  if (title) body.append(make('div', { class: 'ntn-toast__title' }, String(title)));
  if (message) body.append(make('div', { class: 'ntn-toast__message' }, String(message)));
  el.append(body);
  if (dismissible) el.append(make('button', { type: 'button', class: 'ntn-toast__close', 'aria-label': 'Dismiss' }, renderIcon('close')));
  if (duration > 0) {
    el.style.setProperty('--ntn-toast-duration', duration + 'ms');
    el.append(make('div', { class: 'ntn-toast__timer' }));
  }

  const t = { duration: duration > 0 ? duration : 0, left: duration, since: 0, timer: null, hover: false, focus: false, returnTo: null, closed: false };
  toasts.set(el, t);
  el.addEventListener('mouseenter', () => { t.hover = true; toastTick(el); });
  el.addEventListener('mouseleave', () => { t.hover = false; toastTick(el); });
  el.addEventListener('focusin', (e) => {
    if (!t.focus && e.relatedTarget && !el.contains(e.relatedTarget)) t.returnTo = e.relatedTarget;
    t.focus = true; toastTick(el);
  });
  el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) { t.focus = false; toastTick(el); } });
  el.addEventListener('click', (e) => { if (e.target.closest('.ntn-toast__close')) toastClose(el, 'dismiss'); });

  toastRaise(region);
  region.append(el);
  regionToasts(region).slice(0, -TOAST_MAX).forEach((old) => toastClose(old, 'overflow'));
  toastTick(el);

  // Announce after a beat, so a live region created just now is in the tree before it changes.
  const live = toastLive(host, tone === 'danger');
  const words = [title, message].filter(Boolean).join('. ');
  live.textContent = '';
  setTimeout(() => { live.textContent = words; }, 60);

  return { element: el, close: () => toastClose(el, 'api') };
}

/* A modal that closes takes its toasts' region with it: hand them to the page instead. */
function toastOnDialogClose(e) {
  const dialog = e.target;
  if (!dialog || dialog.tagName !== 'DIALOG') return;
  $$(':scope > .ntn-toaster', dialog).forEach((region) => {
    const live = $$(':scope > .ntn-toast:not([data-ntn-leaving])', region);
    region.remove();
    if (!live.length) return;
    const home = toastRegion(document.body, region.dataset.ntnPlacement);
    toastRaise(home);
    live.forEach((el) => {
      const t = toasts.get(el);
      // Re-inserting restarts the timer line; start it where the clock is.
      const timer = el.querySelector('.ntn-toast__timer');
      if (timer && t) timer.style.animationDelay = -(t.duration - (t.timer ? t.left - (Date.now() - t.since) : t.left)) + 'ms';
      home.append(el);
    });
  });
}

/** Re-scan the DOM. Call after rendering new markup (framework updates, HTMX swaps). */
export function refresh(root = document) {
  // Everything matching inside root, plus root itself when it matches (refresh(tabList) works).
  const within = (sel) => (root !== document && root.matches && root.matches(sel) ? [root] : []).concat($$(sel, root));
  within('.ntn-slider input[type="range"]').forEach(syncSlider);
  within('.ntn-progress__fill[data-value]').forEach(syncProgress);
  within('.ntn-table').forEach(syncTable);
  within('.ntn-table[data-ntn-paginate]').forEach(applyTable);
  within('.ntn-tabs').forEach(setupTabs);
  within('.ntn-toggle-group--pill').forEach(setupToggleInk);
  within('[data-ntn-tree]').forEach(treeSync);
  within('[data-ntn-combo]').forEach(comboRender);
  within('[data-ntn-daterange]').forEach(drRefresh);
  within('[data-ntn-select]').forEach(selSetup);
  within('[data-ntn-dropdown]').forEach(ddSetup);
  within('[data-ntn-avatar-name]').forEach(syncAvatar);
  if (themeManaged) syncThemeControls(getTheme());
}

const reInk = () => {
  $$('.ntn-tabs').forEach(tabInk);
  $$('.ntn-toggle-group--pill').forEach(toggleInk);
};

let started = false;
/**
 * Wire every behaviour. Runs automatically on import, and only once, so a later call is a no-op;
 * use the data-ntn-theme-control="manual" attribute to opt out of theme handling.
 * @param {{ theme?: boolean }} [options] theme: false leaves light/dark entirely to the app.
 *   Defaults to false when <html data-ntn-theme-control="manual"> is present, true otherwise.
 */
export function start(options = {}) {
  if (started) return;
  started = true;
  themeManaged = options.theme ?? !themeIsManual();
  if (themeManaged) initTheme();
  document.addEventListener('click', onClick);
  document.addEventListener('input', onChange);
  document.addEventListener('change', onChange);
  document.addEventListener('reset', comboOnReset);
  document.addEventListener('reset', drOnReset);
  document.addEventListener('reset', selOnReset);
  // A press on a select's panel keeps focus in its search box or list; hovering an option makes it active.
  document.addEventListener('mousedown', (e) => {
    if (e.target.closest && e.target.closest('.ntn-select__panel') && !e.target.matches('.ntn-select__search')) e.preventDefault();
  });
  document.addEventListener('mouseover', (e) => {
    const o = e.target.closest && e.target.closest('.ntn-select__option');
    if (o && o.getAttribute('aria-disabled') !== 'true') selActivate(selRoot(o), o, false);
  });
  document.addEventListener('mouseover', drOnHover);
  document.addEventListener('mouseover', (e) => {
    const sub = e.target.closest && e.target.closest('.ntn-menu__sub');
    if (sub) menuFlip(sub);
  });
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('close', toastOnDialogClose, true);
  document.addEventListener('pointerdown', onTreePointerDown);
  document.addEventListener('pointerdown', ddOnPointerDown);
  document.addEventListener('focusout', ddOnFocusOut);
  document.addEventListener('scroll', ddReposition, true);
  addEventListener('resize', ddReposition);
  document.addEventListener('dragstart', onTreeDragStart);
  document.addEventListener('dragover', onTreeDragOver);
  document.addEventListener('drop', onTreeDrop);
  document.addEventListener('dragend', onTreeDragEnd);
  document.addEventListener('dragenter', onDzEnter);
  document.addEventListener('dragleave', onDzLeave);
  document.addEventListener('dragover', onDzOver);
  document.addEventListener('drop', onDzDrop);
  addEventListener('resize', reInk);
  addEventListener('load', reInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reInk);
  refresh();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

export default { start, refresh, configure, open, close, toggle, toast, setDateRange, avatarHue, getTheme, getThemePreference, setTheme, toggleTheme };
