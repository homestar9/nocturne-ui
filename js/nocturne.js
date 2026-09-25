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
const FA_ICONS = { close: 'xmark', prev: 'chevron-left', next: 'chevron-right', 'theme-light': 'sun', 'theme-dark': 'moon' };
let renderIcon = (key) => make('i', { class: 'fa-light fa-' + (FA_ICONS[key] || key), 'aria-hidden': 'true' });

/**
 * Swap how nocturne.js renders the icons it creates (chip remove, calendar arrows, theme toggle).
 * @param {{ icon?: (key: string) => Element }} options  Keys: close, prev, next, theme-light, theme-dark.
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

  /* Alt+arrows reorder — a keyboard equivalent of the drag handle. */
  if (e.altKey) {
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
            'data-ntn-combo-clear': o.dataset.value || comboLabel(o),
            'aria-label': 'Remove ' + comboLabel(o),
          }, renderIcon('close'))));
        if (chosen.length > max) nodes.push(make('span', { class: 'ntn-combo__more' }, '+' + (chosen.length - max)));
        out.replaceChildren(...nodes);
      }
    }
  }
  const count = root.querySelector('[data-ntn-combo-count]');
  if (count) count.textContent = chosen.length + ' selected';
}

function comboFire(root) {
  const chosen = comboChosen(root);
  root.dispatchEvent(new CustomEvent('ntn:combochange', {
    bubbles: true,
    detail: {
      value: chosen.length ? (chosen[0].dataset.value || comboLabel(chosen[0])) : null,
      values: chosen.map((o) => o.dataset.value || comboLabel(o)),
      labels: chosen.map(comboLabel),
      multiple: comboMulti(root),
    },
  }));
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

function comboActivate(root, option) {
  comboOptions(root).forEach((o) => o.removeAttribute('data-ntn-active'));
  if (!option) return;
  option.setAttribute('data-ntn-active', '');
  const list = root.querySelector('.ntn-combo__list');
  if (!list) return;
  if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
  else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
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
  const i = opts.indexOf(active);
  if (e.key === 'ArrowDown') { e.preventDefault(); comboActivate(root, opts[Math.min(i + 1, opts.length - 1)] || opts[0]); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); comboActivate(root, opts[Math.max(i - 1, 0)] || opts[0]); return; }
  if (e.key === 'Home') { e.preventDefault(); comboActivate(root, opts[0]); return; }
  if (e.key === 'End') { e.preventDefault(); comboActivate(root, opts[opts.length - 1]); return; }
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
const ddPanel = (root) => root.querySelector(':scope > [popover], :scope > .ntn-menu, :scope > .ntn-popover');
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
  const r = trigger.getBoundingClientRect();
  const [side, align] = (panel.dataset.ntnPlacement || 'bottom-end').split('-');
  const gap = Number(panel.dataset.ntnOffset || 6);
  const margin = 8;
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  const below = r.bottom + gap;
  const above = r.top - gap - h;
  let top = side === 'top' ? above : below;
  if (side === 'top' && top < margin && below + h <= innerHeight - margin) top = below;
  if (side !== 'top' && top + h > innerHeight - margin && above >= margin) top = above;
  let left = align === 'start' ? r.left : r.right - w;
  left = Math.max(margin, Math.min(left, innerWidth - w - margin));
  panel.style.left = Math.round(left) + 'px';
  panel.style.top = Math.round(Math.max(margin, top)) + 'px';
  panel.setAttribute('data-ntn-side', top < r.top ? 'top' : 'bottom');
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
  group.dispatchEvent(new CustomEvent('ntn:toggle', { bubbles: true, detail: { value: btn.dataset.value || btn.textContent.trim(), pressed: btn.getAttribute('aria-pressed') === 'true' } }));
}

/* ── Date range picker ───────────────────────────────────────────────────────
   <div class="ntn-daterange" data-ntn-daterange data-ntn-start="2026-09-01" …>
   The trigger, the preset list and the footer are markup; the two month grids are
   rendered here. Selection is draft-first: nothing leaves the component until
   Apply, which fires ntn:daterangechange. */

const drMonthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const drDayFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const drFullFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const drNarrow = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
/* 1 Sep 2024 was a Sunday — seven days from there gives the locale's initials. */
const DOW = Array.from({ length: 7 }, (_, i) => drNarrow.format(new Date(2024, 8, 1 + i)));

const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthStart = (d, n = 0) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const shift = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a, b) => !!a && !!b && a.getTime() === b.getTime();
const drIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const drParse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };

function drLabel(a, b, time) {
  if (!a) return null;
  const t = time ? ` · ${time}` : '';
  if (!b || same(a, b)) return drFullFmt.format(a) + t;
  return a.getFullYear() === b.getFullYear()
    ? `${drDayFmt.format(a)} – ${drFullFmt.format(b)}`
    : `${drFullFmt.format(a)} – ${drFullFmt.format(b)}`;
}

function drState(root) {
  if (!root.ntnRange) {
    const start = drParse(root.dataset.ntnStart);
    const end = drParse(root.dataset.ntnEnd);
    const single = root.hasAttribute('data-ntn-single');
    root.ntnRange = {
      single, start, end: single ? start : end, draftStart: start, draftEnd: single ? start : end,
      hover: null, open: false, time: root.dataset.ntnTime || '',
      view: monthStart(start || new Date()),
    };
  }
  return root.ntnRange;
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

  const nav = (dir, label, ghost) => make('button', {
    type: 'button', class: 'ntn-daterange__nav', 'data-ntn-month': String(dir), 'aria-label': label,
    ...(ghost ? { 'data-ghost': '' } : {}),
  }, renderIcon(dir < 0 ? 'prev' : 'next'));
  // The grid holds only dates and weekday initials, so it is safe to write as HTML.
  const grid = make('div', { class: 'ntn-daterange__grid' });
  grid.innerHTML = DOW.map((x) => `<span class="ntn-daterange__dow">${x}</span>`).join('') + cells.join('');
  cal.replaceChildren(
    make('div', { class: 'ntn-daterange__head' },
      nav(-1, 'Previous month', !!offset),
      make('span', { class: 'ntn-daterange__month' }, drMonthFmt.format(view)),
      nav(1, 'Next month', offset !== last)),
    grid);
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
  const panel = root.querySelector('.ntn-daterange__panel');
  const trigger = root.querySelector('.ntn-daterange__trigger');
  if (commit) {
    s.start = s.draftStart;
    s.end = s.single ? s.draftStart : (s.draftEnd || s.draftStart);
    root.dataset.ntnStart = s.start ? drIso(s.start) : '';
    root.dataset.ntnEnd = s.end ? drIso(s.end) : '';
    if (s.time) root.dataset.ntnTime = s.time; 
    drSyncTrigger(root);
    const stamp = (d) => (d && s.time ? `${drIso(d)}T${s.time}` : d ? drIso(d) : null);
    root.dispatchEvent(new CustomEvent('ntn:daterangechange', {
      bubbles: true,
      detail: {
        start: s.start ? drIso(s.start) : null, end: s.end ? drIso(s.end) : null,
        time: s.time || null, startISO: stamp(s.start), endISO: stamp(s.end),
        single: s.single, startDate: s.start, endDate: s.end,
      },
    }));
  } else {
    s.draftStart = s.start; s.draftEnd = s.end; s.time = root.dataset.ntnTime || '';
    const t = root.querySelector('[data-ntn-daterange-time]');
    if (t) t.value = s.time;
  }
  s.hover = null;
  s.open = false;
  if (panel) panel.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

/* Place the panel in pixels against whatever actually clips it — an app scroll
   container is usually narrower than the window, so a viewport-only check leaves
   the panel hanging outside the column. */
function drClipBounds(el) {
  let n = el.parentElement;
  while (n && n !== document.body && n !== document.documentElement) {
    const ox = getComputedStyle(n).overflowX;
    if (ox !== 'visible') { const r = n.getBoundingClientRect(); return { left: Math.max(0, r.left), right: Math.min(innerWidth, r.right) }; }
    n = n.parentElement;
  }
  return { left: 0, right: innerWidth };
}

function drPlace(root, panel) {
  panel.classList.remove('ntn-daterange__panel--narrow');
  panel.style.left = '0px';
  const pad = 8;
  const bounds = drClipBounds(panel);
  const avail = bounds.right - bounds.left - pad * 2;
  if (panel.offsetWidth > avail) panel.classList.add('ntn-daterange__panel--narrow');
  const anchor = root.getBoundingClientRect().left;
  const w = panel.offsetWidth;
  let left = 0;
  if (anchor + w > bounds.right - pad) left = bounds.right - pad - w - anchor;
  if (anchor + left < bounds.left + pad) left = bounds.left + pad - anchor;
  panel.style.left = Math.round(left) + 'px';
}

function drOpen(root) {
  const s = drState(root);
  const panel = root.querySelector('.ntn-daterange__panel');
  const trigger = root.querySelector('.ntn-daterange__trigger');
  s.draftStart = s.start; s.draftEnd = s.end; s.hover = null;
  s.view = monthStart(s.start || new Date());
  s.open = true;
  if (panel) panel.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  drRender(root);
  if (panel) drPlace(root, panel);
}

/* Returns true when the click belonged to the picker. */
function drOnClick(root, e) {
  const s = drState(root);

  if (e.target.closest('.ntn-daterange__trigger')) { s.open ? drClose(root, false) : drOpen(root); return true; }
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

function onClick(e) {
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
      const hit = comboOptions(combo).find((o) => (o.dataset.value || comboLabel(o)) === v);
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

  const toggle = e.target.closest('[data-ntn-toggle]');
  if (toggle) {
    const el = target(toggle, 'data-ntn-toggle');
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
  if (el.matches('[data-ntn-daterange-time]')) {
    const root = el.closest('[data-ntn-daterange]');
    if (root) { drState(root).time = el.value; drRender(root); }
  }
  if (el.matches('[data-ntn-page-size]')) {
    const table = tableFor(el);
    if (table) { const s = stateOf(table); s.size = Number(el.value) || 10; s.page = 1; applyTable(table); }
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

/** Re-scan the DOM. Call after rendering new markup (framework updates, HTMX swaps). */
export function refresh(root = document) {
  // Everything matching inside root, plus root itself when it matches (refresh(tabList) works).
  const within = (sel) => (root !== document && root.matches && root.matches(sel) ? [root] : []).concat($$(sel, root));
  within('.ntn-slider input[type="range"]').forEach(syncSlider);
  within('.ntn-progress__fill[data-value]').forEach(syncProgress);
  within('.ntn-table').forEach(syncTable);
  within('.ntn-table[data-ntn-paginate]').forEach(applyTable);
  within('.ntn-tabs').forEach(setupTabs);
  within('[data-ntn-tree]').forEach(treeSync);
  within('[data-ntn-combo]').forEach(comboRender);
  within('[data-ntn-daterange]').forEach(drSyncTrigger);
  within('[data-ntn-dropdown]').forEach(ddSetup);
  if (themeManaged) syncThemeControls(getTheme());
}

const reInk = () => $$('.ntn-tabs').forEach(tabInk);

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
  document.addEventListener('mouseover', drOnHover);
  document.addEventListener('mouseover', (e) => {
    const sub = e.target.closest && e.target.closest('.ntn-menu__sub');
    if (sub) menuFlip(sub);
  });
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onTreePointerDown);
  document.addEventListener('pointerdown', ddOnPointerDown);
  document.addEventListener('focusout', ddOnFocusOut);
  document.addEventListener('scroll', ddReposition, true);
  addEventListener('resize', ddReposition);
  document.addEventListener('dragstart', onTreeDragStart);
  document.addEventListener('dragover', onTreeDragOver);
  document.addEventListener('drop', onTreeDrop);
  document.addEventListener('dragend', onTreeDragEnd);
  addEventListener('resize', reInk);
  addEventListener('load', reInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reInk);
  refresh();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

export default { start, refresh, configure, open, close, toggle, getTheme, getThemePreference, setTheme, toggleTheme };
