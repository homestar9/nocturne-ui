# Changelog

All notable changes to Nocturne. The version in `package.json` is the contract:
bump **patch** for fixes, **minor** for new components or tokens, **major** for
renamed or removed class names and tokens.

## 1.4.0 — 2026-09-21

### Packaging
- **First public release.** Published to npmjs.com as `@homestar9/nocturne-ui` under the MIT
  license. It was previously named `@angrysam/nocturne` and aimed at GitHub Packages, but was never
  published there, so no consumer has to migrate. The CSS, class names and tokens are unchanged.

### Added
- **`ntn-tree`** — tree view: `__row` with a drag `__grip`, `__twisty`, `__icon`, `__label`,
  `__meta`, `__actions`, and real DOM nesting through `__group`. `data-ntn-tree` adds
  selection, expand/collapse, ARIA keyboard nav, and handle-gated drag-and-drop: the outer
  thirds of a row insert above/below, the middle drops inside, and `alt`+arrows do the same
  from the keyboard. Fires `ntn:treemove`, `ntn:treeselect`, `ntn:treetoggle`.
  Modelled on the desktop tree idiom (VS Code / Figma layers; react-arborist and Syncfusion's
  indicator-line drop targets for the drag mechanics).
- **`ntn-combo`** — dropdown and multi-select on the `ntn-menu` surface: option descriptions
  and icons, type-to-filter, checkbox faces, trigger chips with `+N` overflow, and a footer
  for "n selected" / clear-all. Full listbox keyboard support; fires `ntn:combochange`.
  `ntn-select` stays for plain native selects — it is smaller and gets the mobile picker.
- **`ntn-steps`** — progress steps: `__marker`, `__text`, `__title`, `__desc`, and
  `data-state="complete | current | upcoming"` as the single switch. `--vertical`, `--inline`,
  `--bars` and `--sm`; `data-ntn-steps` walks the states on click and fires `ntn:stepchange`.
- **Nested menus** — `ntn-menu__sub` wraps a parent row and its flyout. Hover and focus open it
  with no script; `nocturne.js` adds `←`/`→` traversal and flips the panel near the window
  edge. Also `ntn-menu__label`, `__shortcut`, `__caret` and `ntn-menu__item--danger`.
- **Tabs keyboard and indicator** — roving tabindex, `←`/`→` (`↑`/`↓` vertical), `home`/`end`,
  `aria-controls` wiring, and one sliding indicator element measured from the selected tab.
  New modifiers `--vertical` and `--fill`; an overflowing row scrolls and keeps the selected
  tab in view. Fires `ntn:tabchange`.
- **Tooltip** gains an arrow, `__title` / `__text` / `__key` elements, `--wrap` for a sentence,
  `--start` / `--end` edge alignment, and a 90 ms open delay.

### Changed
- **`ntn-divider` is now `--border-default`, not `--border-subtle`** — it was invisible on a
  menu or card surface. `--subtle` brings the old hairline back where a whisper is wanted.
  `ntn-divider-label` follows, and a divider inside `.ntn-menu` gets its 4px margin for free.
- **Menu and combobox moved to `src/components/menu.css`**, out of `inputs.css`. No class
  names changed; `dist/nocturne.css` is unaffected.
- `.ntn-tabs` is `display: flex` with `overflow-x: auto` instead of `inline-flex`. A tablist
  that relied on shrink-wrapping in a wide row may now stretch — wrap it in a flex row or add
  `--fill`.

## 1.3.0 — 2026-09-20

### Added
- **`ntn-daterange`** — date range picker: trigger, preset column, two month grids, and a
  draft-then-apply footer. Grids are rendered by `nocturne.js` from `data-ntn-daterange`;
  Apply fires `ntn:daterangechange`. `data-ntn-start/end/min/max`, preset keys on
  `data-ntn-range`, `--sm` and `--block` modifiers.
- **Single-date and single-date + time modes** on the same picker: `data-ntn-single`,
  `data-ntn-time` with a `data-ntn-daterange-time` input, and `ntn-daterange__time` in the
  footer. The event carries `time`, `startISO` and `endISO` when a time is set.
- **`ntn-edge`** — border effects as their own block, composable onto anything: a card, a
  panel, a toolbar, a button, a bare div. `ntn-edge` is the default hairline; `--strong`,
  `--glow` and `--processing` are the treatments. `ntn-card--glow` and
  `ntn-card--processing` stay as shorthands for the two common cases.
- **`ntn-edge--processing`** — a light travels the edge with an exterior glow orbiting it.
  Both read one registered angle (`--ntn-spin`), animated on the host and inherited by the
  ring, so they cannot drift.
- Striped-table example in the kitchen sink, and a `ntn-daterange` section in the index.

### Changed
- **Table header row is now a filled band** (`--surface-2`) with a `--border-default` rule
  under it, so it separates the header from the toolbar above and the first row below.
- **`ntn-toolbar` carries padding on all four sides.** It previously had none on top, so a
  toolbar under a card head sat flush against it.
- **`ntn-card--flush > ntn-card__head` gets a rule underneath automatically** — the table
  shell no longer needs `ntn-card__head--divided` added by hand.
- **`ntn-card--glow`** picks up an internal colour bleed and a tighter halo, so the accent
  reads on the surface rather than only as a shadow beneath it.
- `ntn-table--zebra` draws a single closing rule instead of one per row.
- `ntn-toolbar--divided` followed by `ntn-filters` no longer stacks two hairlines.

### Not shipped
- **`ntn-card--electric`** (SVG turbulence border) was cut before release — the filter
  repaints every frame over the whole card and stutters the page. Parked, not abandoned.

### Fixed
- **Radio buttons read off-centre.** The 7px dot split a pixel on both axes inside the 14px
  padding box. The checked radio is now a filled control with a 6px white dot, matching the
  checkbox, and lands on whole pixels.
- Checkbox and radio gained hover states, and align to the first line of the label when a
  `__desc` is present.

## 1.2.0 — 2026-09-20

### Added
- **Table shell.** The surrounding `ntn-card ntn-card--flush` is now documented as the table's
  wrapper: optional `ntn-card__head`, optional `ntn-toolbar`, optional `ntn-filters`, the
  table, and the pager in `ntn-card__foot`.
- **`ntn-toolbar`** — filter row above a table: `__start` `__end` `__search`, `--divided`.
- **`ntn-filters`** — expandable filter form: `__field` `__actions` `__applied`, plus
  `ntn-filter-tag` / `__remove` for applied filters. Revealed by `data-ntn-reveal="#id"`.
- **`ntn-toggle-group`** — segmented control (`__btn`, `--sm` `--lg`, `data-multi`), driven by
  `aria-pressed`, firing `ntn:toggle`.
- **Split pagination.** `ntn-pager__start` (rows-per-page select + `__summary` range) and
  `ntn-pager__end` (Previous · pages · Next), separated by `ntn-pager__sep`.
- **Live table behaviour.** `data-ntn-paginate="10"` on `.ntn-table` turns on client-side
  paging, `data-ntn-table-search`, `data-ntn-filter-tag` (rows declare `data-tags`),
  `data-ntn-page-size`, `data-ntn-summary`, `data-ntn-pages`, `data-ntn-prev/next/goto`,
  `data-ntn-table-empty`, and a `ntn:tablechange` event.
- `ntn-select--inline` (label beside the control), `ntn-card__head--divided`, `ntn-card__heading`.

### Fixed
- `[hidden]` now beats component display rules — hiding a `.ntn-card` tab panel (or a table row)
  actually hides it. Tab switching between a card panel and any other panel works.
- Table cells in a flush card line up with the card's own 20px gutter.

## 1.1.0 — 2026-09-20

### Added
- **Light theme.** `data-theme="light"` on `<html>` (or any subtree) remaps token values only —
  no component rule changes. `"auto"` follows the OS.
- Theme API in `js/nocturne.js`: `setTheme`, `toggleTheme`, `getTheme`, `getThemePreference`,
  a `ntn:themechange` event, `data-ntn-theme-toggle` and `data-ntn-theme-set` hooks, and
  `localStorage` persistence under `ntn-theme`.
- New tokens: `--control-knob`, `--danger-fg`, `--bg-blur`, and `--accent-line` /
  `--success-line` / `--warning-line` / `--danger-line` / `--info-line` / `--accent-soft-hover`.

### Changed
- `--alpha-white-04/06/10` renamed to `--alpha-ink-04/06/10` — they flip with the theme.
  (`--alpha-black-40` removed; it was unused.)
- `--accent-fg` is now a literal white rather than `var(--n-1000)`, so it survives the ramp reversal.
- Components that hardcoded violet or neutral hexes now use tokens, which also fixes accent
  themes: `themes/emerald.css` now recolours badges, alerts, and pagination correctly.

### Fixed
- Bare `<i class="fa-…">` icons no longer render italic.
- `:focus-visible` no longer forces a 6px radius onto the focused element (checkboxes shifted 1px).
- Sidebar count badges no longer stretch.

## 1.0.0 — 2026-09-20

Initial packaged release.

- Tokens: colour, type, spacing, elevation, motion, fonts, reset.
- 25 components as BEM classes across 8 stylesheets.
- Optional `js/nocturne.js` for tabs, dialogs, sidebar collapse, slider fill, table selection.
- `skill/` — Claude Code skill shipped inside the package.
- `themes/emerald.css` — example accent override.
