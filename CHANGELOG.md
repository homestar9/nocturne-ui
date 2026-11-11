# Changelog

All notable changes to Nocturne. The version in `package.json` is the contract:
bump **patch** for fixes, **minor** for new components or tokens, **major** for
renamed or removed class names and tokens.

## [Unreleased]

## 1.17.2 — 2026-11-10

### Fixed
- **A dropdown's first focus skips an enhanced select's hidden native control.** Opening a
  dropdown or popover focuses its first focusable element, and `select:not([disabled])` also
  matched the native `<select>` that an enhanced select (`data-ntn-select`) hides under its
  trigger with `tabindex="-1"`. A panel whose first field was an enhanced select opened with
  focus on an invisible control. That select is now skipped, so focus lands on its trigger.

## 1.17.1 — 2026-11-10

### Fixed
- **Sidebar brand meta line truncates.** `ntn-sidebar__meta` (the line under the brand name, often
  a site address) now ends in an ellipsis like `ntn-sidebar__name`. A long value used to run out
  of the brand box.

## 1.17.0 — 2026-11-09

### Added
- **Enhanced select (`data-ntn-select` on `.ntn-select`).** `nocturne.js` draws a trigger and a
  listbox panel over the native `<select>`, which stays in the form: it posts, fires `input` and
  `change`, honours `form.reset()`, and shows the browser's `required` message under the trigger.
  The control becomes an `ntn-dropdown`, so the panel opens in the top layer and the dropdown code
  handles Escape, focus return, outside clicks, Tab-out and repositioning. The panel covers the
  trigger: right edges aligned, its top 4px above, flipping to sit with its bottom 4px below the
  trigger near the viewport's bottom (`placeFixed` gains the `over-end` placement). Keys: `↑↓`
  wrap and skip disabled options, `home/end`, `↵`, `esc`, `tab`, and type-to-jump, with
  `aria-activedescendant` on the list or the search box. `data-ntn-search` adds a filter box and
  `data-ntn-empty` its empty state. `<select multiple>` toggles and stays open (the trigger joins
  the labels, or shows `data-ntn-placeholder`); `<optgroup>` becomes a labelled group, and a
  disabled group's options can't be picked. The trigger is named by the label and the value, and
  takes the select's `aria-describedby` and `aria-invalid`. The panel has 12px corners, 32px rows
  whose highlight is inset 4px with 8px corners, a filled tick (a mask, so no icon font is
  needed), and grows out of the trigger's corner in 120ms (`ntn-pop`, a fade only under reduced
  motion).
- Picker tokens for its panel: `--ntn-picker-bg`, `-border`, `-divider`, `-text`, `-placeholder`,
  `-empty`, `-option`, `-option-active`, `-tick`, `-scrollbar`, and `--ntn-shadow-picker`. Dark
  values are exact; the light estimates join the face's block in `_theme-light.scss`. Mono and
  synthwave set them in both modes.
- Without the script, a `<select multiple>` in `.ntn-select` is the platform's list box (it grows,
  no chevron) instead of a one-row control.
- A native select's own list takes the enhanced panel's colours: options and optgroups on
  `--ntn-picker-bg` in `--ntn-picker-option` ink, group headings in the caps-label grey, disabled
  options in `--ntn-picker-empty`. Before, an `<optgroup>` painted the browser's white in dark
  mode. A multiple select's rows keep the face's fill.
- Kitchen sink: the Select section shows the enhanced, searchable, inline, multiple and
  grouped selects (the last two native and enhanced), and a new **Form controls in both themes**
  section puts a dark and a light panel side by side.
- `scrollIntoList()` and `stepTo()` are shared by the combo and the select.
- **Date picker year input (`ntn-daterange__year`).** Each month heading's year is a number input
  that reads as plain text, with only a pointer cursor. Click it to type a year or step it with
  `↑` `↓` / the spin buttons; the month follows. `Esc` restores it and `↵` keeps it, without
  closing the panel, and its events never reach a form. Bounded by the `data-ntn-min` /
  `data-ntn-max` years, it works from either month of a two-month panel. The month heads are now
  built once and patched, so the focused field survives hover and arrow redraws. Non-Gregorian or
  non-Latin-digit locales keep a plain heading.

### Changed
- **Raised control faces.** Field, select, search, the combobox and date triggers, the toggle
  group and the segmented radio drop the bordered bevel for a raised face (the `control-surface`
  mixin): a translucent fill one small step above whatever surface it sits on (`--ntn-face-bg`;
  over `#1A1A1B` it is exactly `lch(13.861 1.139 272)`, the measured value, and on Nocturne's
  darker cards the step, and so the ring, still reads), a transparent 1px border (drawn in
  forced-colours mode, and coloured by invalid), and a translucent 1px ring with a tight drop
  (`--ntn-shadow-face`). Hover lifts the fill and brightens the ring (`--ntn-face-bg-hover`,
  `--ntn-shadow-face-hover`) instead of colouring the border, and skips disabled controls. Text in
  a face is `--ntn-face-text` at weight 450 (`--ntn-weight-book`, new), with
  `--ntn-face-placeholder` placeholders, `--ntn-face-muted` icons and chevrons, and an accent
  caret. The light values are estimates, kept together at the end of `_theme-light.scss` (mostly
  aliases of the light ramp, so themes' light modes follow).
- **Field-style faces are 4px shorter than a button of the same size** (`face-height`: 30px
  beside a 34px button, 24px in compact density): field, select, search, combobox and date
  triggers. The select's chevron is a small filled shape (9 × 5, a mask) 10px from the edge.
- **Focus on a face.** Typing in a field, search or native select draws an accent hairline with a
  faint halo (`--ntn-ring-face-focus`: 1px at 80%, 3px at 22%) and settles the fill; a select,
  combobox or date trigger reached by keyboard keeps its hover face inside a wider halo
  (`--ntn-ring-face-keyboard`, 3px at 40%). Both follow the accent, so themes recolour them.
- A disabled field is only the 45% fade (no `surface-1` fill). The textarea pads 7px 10px with an
  18px line. The select pads `0 28px 0 10px`. A selected segment sits on `--ntn-face-bg-hover`,
  and segment dividers are the 8% ink hairline. `chevron()` takes a colour.
- `themes/mono.css` sets the face in grey (a white fill, no tint), and `themes/synthwave.css`
  takes its text greys from its ramp; the translucent fill picks up its purple surfaces.
- Tests: the one-control-face guard checks the raised face, no face colours its border on hover,
  every face token has a light value, and the mono guard reads `lch()` colours.
- **Loading buttons spin a ring, not the icon.** `data-loading` on `ntn-btn` turns the leading
  icon into `ntn-spinner`'s ring (700ms `ntn-spin`): 16px, or 14px on `--sm`. The ring is drawn
  in CSS in the button's own ink, so it reads on every variant and with any icon set; the glyph is
  hidden. Only a direct child `<i>` turns.

### Fixed
- **Date picker trigger and double clicks.** The trigger ignores the second click of a double click
  (`event.detail > 1`), so a quick double click, or a mouse whose switch sends ghost clicks, no
  longer opens the panel and shuts it again (or reopens one just closed). Keyboard activation
  still toggles.

### Kitchen sink
- **Every block is shown.** A Layout section (page head, `ntn-grid --2/3/4/split/split-reverse`,
  `ntn-row --between/--end`, `ntn-stack`, the text helpers and dividers, `ntn-divider-label`), and
  standalone `ntn-icon` sizes and tints plus `ntn-fab` beside the icon buttons. The Dropdown
  section has an index link. The stale version and the permanent "new" badges are gone from the
  sidebar. A test now fails when a block in `dist/` has no example, when the sink uses a class that
  `dist/` lacks, or when a section and its index link don't match.
- **Every class has an example**, not just every block. New rows show `ntn-btn--block`,
  `--lg` on field, select and combo, the select's hint and error, `ntn-radio__desc`,
  `ntn-rating--sm`, alert `--info` / `--primary` / `--neutral` / `--banner`, the end-aligned
  tooltip, progress tones / `--lg` / `--indeterminate`, avatar `--xs` / `--ring` and the busy and
  away dots, toast `--primary` / `--neutral`, the frame fades (beside the plain frame, which stays
  plain), `ntn-card--glow`, `ntn-edge--strong`, a flush tree with row actions, `ntn-modal--lg`,
  `ntn-steps--inline`, and a top bar with its own brand. The Settings example adds the sidebar's
  nested list and footer and marks its panels `ntn-tabs__panel`. The coverage test now checks
  every class in `dist/`, allowing only the 12 that `nocturne.js` draws.
- **Get started** opens the page: the two CDN lines, and in its Code a complete starter page
  (theme script, Font Awesome Free with the Light shim, a dialog that proves the script loaded),
  the npm install and bundler imports, and theme / accent / density. Links go to the component
  reference and to building with Claude Code.
- **JavaScript** closes it: `refresh(root)`, every export with an example call, and every
  `ntn:*` event with its `detail`. The Toast section's Code leads with the `toast({...})` call.
- **Reference** links: each section head links to its heading in `skill/components.md`.
- Verbatim sources: a hidden `<textarea data-sink-source>` holds code that isn't markup on the
  page; `data-sink-inline` shows it in place.
- Tests fail when a pinned CDN link in the README or the sink names another version than
  `package.json`, when the JavaScript section misses an event or export, or when a Reference link
  has no heading. The README opens with a link to the live sink, and `homepage` points there.

### Examples
- **`examples/settings.html`**: a complete account settings page, `skill/patterns.md` §4 built
  with library classes only. Tabs switch Profile, Security, Notifications and Billing; each card
  is its own `<form>` whose Save toasts what it would post (a `data-ntn-name` combo included) and
  whose Discard is a plain reset. A dropped photo fills the avatar through `ntn:files`, and a
  `<form method="dialog">` confirm closes the delete dialog. It ships in the package, so the
  bundled skill can point agents at it, and the kitchen sink links it from its index and from
  Get started. A test fails when an example page uses a class `dist/` lacks or isn't linked.
- **`examples/dashboard.html`**: `skill/patterns.md` §2. A greeting and a date range in the page
  head, four stats on neutral washes with the one alert in danger, a 1.9 / 1 split (spend by
  service, top spenders) and a 1 / 1.9 split (activity, and a deploys table that
  `data-ntn-paginate` pages, searches and filters). Applying a range toasts it through
  `ntn:daterangechange`. Ships in the package, linked the same way.

## 1.16.0 — 2026-11-09

### Added
- **`ntn-ambient--floor`**: a lit stage under a hero. The canvas brightens toward
  the bottom edge, from 35% down (`--ntn-ambient-floor`: the 800 grey in dark, the 400 in light) under a
  vignette anchored at the bottom centre, so light pools under whatever stands on it.
- **`ntn-frame`**: an app pane set into a shell, for a hero screenshot made of real markup. A sunken shell with
  the raised-surface edge and 8px of padding; `__view` is barely lit (1% ink), framed in the 5%
  hairline and set in by a dark ring (`--ntn-shadow-well`, new); `__aside` sits beside it
  (`--ntn-frame-aside`, 220px; hidden below `md`). Both shell and view carry the lit rim.
  `--fade-bottom` and `--fade-sides` dissolve it into the page with intersected masks. The kitchen
  sink has a new Frame section: a frame on a lit floor under grain.
- **`ntn-badge--processing`**: work in flight. A light sweeps
  round the hairline every 2s (a ring cut with the ring mask, `--ntn-badge-ring-opacity`), and
  a sheen crosses the `ntn-badge__label` text, clipped to the letters, over 1.8s before a 0.6s
  rest. Both stop under reduced motion; forced colours drop the ring.
- **`ntn-grain`**: film noise over its positioned parent, overlay-blended at
  `--ntn-grain-opacity` (0.6 dark, 0.35 light). The tile is an inline SVG `feTurbulence`
  (`--ntn-grain-image`), so no image ships. Hidden under reduced transparency and forced colours.

### Changed
- **Near-neutral greys.** The dark ramp moves to graphite (`#08090A` canvas, `#0F1011`
  card, `#23252A` border, `#F7F8F8` ink), dropping the blue tint. The light ramp, its ink alphas
  and its shadows go neutral too (`rgba(0,0,0,…)` instead of `rgba(16,20,27,…)`). Themes that
  set their own ramp (`amber`, `mono`, `synthwave`) are unchanged.
- **Wider, fainter dark shadows**, a low / medium / high stack: `--ntn-shadow-md`
  is `0 2px 4px` + `0 4px 24px` at 10% / 20%, `--ntn-shadow-lg` `0 7px 32px` + `0 4px 32px`,
  `--ntn-shadow-pop` `0 8px 32px` at 70%, `--ntn-glass-shadow` `0 4px 32px` at 60%.
- **Lit surfaces.** Cards, stats, accordions, modals and `ntn-edge` are framed in a
  translucent hairline (`--ntn-edge-line-strong`, the ink at 8%) with a dark separation ring
  outside it (`--ntn-shadow-ring`, new; off in light mode), the top-lit sheen over the fill, and a lit rim along the
  top edge: a second hairline (`--ntn-edge-light`, 8% white in dark, off in light) drawn on
  the border by the host's `::after` and revealed by a 200px radial beam centred on the top
  edge, falling off in steps (full, 60% at 30%, 20% at 50%, gone at 70%;
  `--ntn-edge-light-x`, `-y`, `-size`). Unlike a corner-anchored ring, it sits on the
  border rather than inside it, so the hairline never doubles. `ntn-edge--shine` and the glow
  edges skip it. Menus, popovers, the date panel and toasts take the hairline and the ring too.
- **`--ntn-hairline`**: the frame's width, 1px, or 0.5px on a 2x screen. Rules inside a
  surface (card foot, divided head, accordion items, modal foot) use it at 5% ink
  (`--ntn-edge-line`); a rule under a head is engraved with a dark line beneath it
  (`--ntn-edge-groove`, dark mode only).
- **Clipped surfaces use `overflow: clip`.** A `--flush` card, an accordion and a modal clip with
  `overflow: clip; overflow-clip-margin: var(--ntn-hairline)` instead of `overflow: hidden`, so
  the rim on the border still paints.
- **Stats and accordions** get the separation ring (no drop) and are `position: relative`.

- **`--ntn-glass-sheen` is now `--ntn-surface-sheen`**: an eased radial glow at the top centre
  (3.5% ink fading out over 160px) instead of a linear 3% gradient. `none` in light mode.

- **Bevelled control faces.** Buttons, icon buttons (`--secondary`), fields, selects, search,
  combobox and date triggers, toggle groups and segmented radios draw `--ntn-shadow-bevel` (new)
  instead of `--ntn-shadow-xs`: a 4% lit top inside the border, a 50% dark ring outside it and a
  short drop. Light mode keeps `--ntn-shadow-xs`.
- **Press gives.** `ntn-btn` and `ntn-icon-btn` scale to 97% while pressed instead of nudging
  0.5px down; they stay put under reduced motion.

- **Inter and JetBrains Mono replace Geist and Geist Mono**, both from Google Fonts (SIL OFL).
  Inter loads with its optical-size axis (`font-optical-sizing: auto`), and the body switches on
  its alternate 1 and open digits (`font-feature-settings: "cv01", "ss03"`).
  Self-hosters declare `@font-face` for the new families.
- **Weights and tracking:** `--ntn-weight-medium` 510 (was 500),
  `--ntn-weight-semibold` 590 (was 600), `--ntn-tracking-heading` -0.012em (was -0.014em),
  `--ntn-tracking-body` -0.011em (was -0.004em). `ntn-stat__value` uses tabular figures.
- **Kitchen sink:** a mono A/B toggle in the top bar (terminal icon) swaps JetBrains Mono for
  [Hack](https://github.com/source-foundry/hack), loaded from jsDelivr on first use and
  remembered per browser. It is a demo control, not part of the library.

### Removed
- **`--ntn-glass-border`.** Glass surfaces use the same `--ntn-edge-line-strong` hairline as
  every raised surface, so a theme's ramp tints both.

## 1.15.0 — 2026-10-24

### Added
- **The kitchen sink is live** at <https://homestar9.github.io/nocturne-ui/>, redeployed from
  `master` on every release (`.github/workflows/pages.yml`). Its "Read me" button now opens the
  README on GitHub.
- **`ntn-glass--clear`** and **`ntn-glass--frosted`**: a thinner or denser glass fill (50% or
  88% instead of 72%). They apply to the element and everything inside it, like `--flat`.
  Tokens: `--ntn-glass-bg-clear`, `--ntn-glass-bg-frosted`. The kitchen sink shows the three side
  by side over the full-strength photo.
- **`--ntn-glass-sheen`**: a faint top-lit gradient over dark glass (3% ink fading out), drawn as
  a separate `background-image` so `ntn-edge--glow` and `ntn-gradient` keep the glass fill under
  their own wash. `none` in light mode.

### Changed
- **Subtler glass edge.** `--ntn-glass-highlight` is a 1px hairline again (6% white in dark, 60%
  in light), after DeployBot. The 10px, 30% inner glow read as a hard bevel.

## 1.14.0 — 2026-10-23

### Added
- **`ntn-toggle-group--pill`** (NTN-35): a single-choice toggle group drawn like the pill tabs.
  The pressed button is a raised pill on a recessed track, and `nocturne.js` slides one pill
  between choices (`--ntn-toggle-x/-w`, flagged `data-ntn-ink`, re-measured when anything
  resizes).
  - With `data-multi`, each pressed button keeps its own pill and nothing slides.
  - It combines with `--sm` and `--lg` at the control height. In compact, the buttons hit the
    24px floor, so the group is 32px tall, not 28px.
  - The track and pill face are now shared mixins with `ntn-tabs--pill`, whose output is
    unchanged.
  - Kitchen sink: Day / Week / Month is the pill demo (the duplicate range example is gone).
    Every Toggle group and Tabs example has a caption matching its code-view label.

### Changed
- **Tabs switch panels; a toggle group picks a value** (NTN-34). The kitchen sink showed pill and
  fill tabs as value pickers (Day / Week / Month, List / Grid, Production / Staging / Preview)
  with no panels. Those are now toggle groups in the Toggle group section. The Tabs section's
  pill and fill examples switch real panels. `skill/components.md` says so for both blocks, and
  `skill/patterns.md` gains a "Tabs or toggle group?" rule.

### Fixed
- **Tests:** the NTN-31 guard that every height derived from `--ntn-control-*` floors at
  `--ntn-target-min` never matched anything, because Sass drops the `calc()` inside `max()`. It
  now matches the subtraction itself and requires at least four hits (NTN-35). The floors were
  all in place.

## 1.13.0 — 2026-10-23

### Added
- **Density** (NTN-31): `data-density="compact"` on `<html>`, or on any subtree, tightens the kit.
  `"comfortable"` is the default and resets a subtree. CSS only.
  - What changes: control heights drop to 24/28/34px, and rows, items, callouts, the card gutter,
    the field and layout gaps and the navbar tighten. Type, radii and widths stay.
  - On a touch screen (`pointer: coarse`) controls keep their comfortable heights.
  - **Token:** `--ntn-target-min` (24px). Sizes derived from a control height (toggle-group
    segments, the field's inline action, the small tree row) floor at it, and tabs never go below
    it.
  - The control heights, role sizes and `--ntn-topbar-h` moved to `src/tokens/_density.scss`.
  - Kitchen sink: a density switch in the top bar, and a compact / comfortable / compact demo.
- **Role size tokens** (NTN-30): the vertical rhythm of controls, rows and surfaces now comes from
  eight tokens, at the values the components used before, so nothing moves:
  - `--ntn-control-pad-y` (combobox trigger);
  - `--ntn-row-pad-y` (table cells) and `--ntn-row-min-h` (tree rows);
  - `--ntn-item-pad-y` (menu items, combobox options, sidebar items, tabs, date presets, pager
    steps);
  - `--ntn-gutter` (card, modal, stat and popover padding; the flush table edges, toolbar and
    filters line up with it);
  - `--ntn-box-pad-y` (alert, toast, accordion summary, modal foot);
  - `--ntn-field-gap` (label to control) and `--ntn-layout-gap` (page and grid gaps).

### Changed
- **`ntn-pager__page` is `--ntn-control-sm` square** (NTN-30), the same 28px it hard-coded before.
- **"Compact" now only means density** (NTN-33):
  - `ntn-table--compact` is removed. Put `data-density="compact"` on the `.ntn-table` instead.
    The header row and any controls in the cells tighten with the body rows.
  - `ntn-dropzone--compact` is renamed `ntn-dropzone--inline` (the one-line drop area), matching
    the other `--inline` modifiers.
  - The Density guidance in `skill/patterns.md` now covers app, user and region choices.

### Fixed
- **The tab ink follows a tab that changes size** (NTN-32). `nocturne.js` watches each tab list
  and its tabs with a `ResizeObserver`, so switching density live, resizing a container or
  changing a label no longer leaves the ink in the old place. Before, it only re-measured on a
  window resize or once fonts loaded.

## 1.12.1 — 2026-10-21

### Fixed
- **`ntn-search` matches the other form controls** (NTN-27): it draws `--ntn-border-default` and
  the `--ntn-shadow-xs` lift, like the field, select or toggle group beside it in a toolbar.
- **`ntn-tree` link labels take the row's colour** (NTN-28): an `<a>` `__label` no longer paints
  in the accent link colour, at rest or on hover.

## 1.12.0 — 2026-10-20

### Added
- **`ntn-tree` link rows** (NTN-26): `↵` on an item whose `__label` is an `<a href>` clicks the
  link. The click selects the item, toggles a folder and navigates, the same as a mouse click.
  Give the link `tabindex="-1"` so the item stays the single tab stop.

### Changed
- **`ntn-tree` keyboard moves are handle-gated** (NTN-25). `alt`+arrows only move an item whose
  row has a `__grip`, the same rule as drag. A tree without grips is read-only: no reorder and no
  `ntn:treemove`.

## 1.11.0 — 2026-10-20

### Added
- **`ntn-ambient` placements** (NTN-18):
  - `--bottom`, `--left` and `--right` move the glow's band to that edge.
  - `--top-left`, `--top-right`, `--bottom-left` and `--bottom-right` make it a square in that
    corner.
  - `--center` makes it a spotlight.
  - The ambient image follows the band, and the background image anchors to the same side.
- **`ntn-ambient` tones:** `--success`, `--warning`, `--danger`, `--info` and `--neutral` tint
  the glow. The accent stays the default.
- **Token:** `--ntn-ambient-glow`, the glow colour. It defaults to `--ntn-accent-glow`.
- **Stacked ambients:** several `ntn-ambient` elements layer their lights, and only the first
  draws `--ntn-background-image`.
- **Kitchen sink:** placement, tone and layered examples in the Glass section.
- **`ntn-gradient`** (NTN-19): a wash for any surface. A tone fades from the top edge into the
  surface's own background, solid or glass. The accent is the default.
  - Tones: `--success`, `--warning`, `--danger`, `--info` and `--neutral`.
  - `--strong` starts from a deeper colour.
  - `--full` fades over the whole height instead of `--ntn-gradient-size`.
  - `--line` draws the border in the tone.
- **Tokens:** `--ntn-gradient-color`, `-strong`, `-line` and `-size`.
- **Kitchen sink:** a Gradient section with tone, dashboard, depth and glass examples.
- **`ntn-daterange` additions** (NTN-21):
  - **Set from code:** a `setDateRange(root, { start, end, time })` export. Changing
    `data-ntn-start`, `-end` or `-time` and calling `refresh(root)` works too. Neither fires an
    event.
  - **Clear:** a `data-ntn-daterange-clear` button commits an empty value, time included, and
    fires `ntn:daterangechange` with null dates.
  - **Forms:** `data-ntn-name="x"` posts `x` (the ISO start, plus the time) and, for a range,
    `x-end` through hidden inputs. Every commit fires a bubbling `change`, and `form.reset()`
    restores the first value.
  - **Kitchen sink:** a clearable picker in a form, with Set from code and Reset buttons, and a
    picker inside the Modal example.
- **A colour per person on `ntn-avatar`** (NTN-22):
  - `--ntn-avatar-hue`, set inline, turns the accent gradient into an OKLCH gradient at that hue,
    at the kit's lightness and chroma, with dark ink. Without it nothing changes.
  - Tokens: `--ntn-avatar-lightness` (per mode) and `--ntn-avatar-chroma`. Mono sets the chroma
    to 0.
  - `avatarHue(name)` is the documented hash, with test vectors for server-side twins, and
    `data-ntn-avatar-name` applies it.
  - `ntn-avatar--unknown` is a neutral disc for "no person".
  - The prefixed build renames `--ntn-avatar-hue` with the classes.
  - **Kitchen sink:** hued and unknown avatars in the Avatars section.
- **Toast: `ntn-toaster` + `ntn-toast`, and `toast()` in `nocturne.js`** (NTN-23):
  - `toast({ message, title, tone, duration, dismissible, placement, icon })` returns
    `{ element, close }`.
  - **Regions:** one per placement, created on first use. Importing the module creates none.
  - **Placements:** `top-end` (default), `top-start`, `top-center`, `bottom-end` and
    `bottom-start`. The newest sits nearest the edge, and at most 5 show at once.
  - **Stacking:** the region opens in the top layer. While a modal is open, the toast mounts
    inside it, and if the modal closes its toasts move to the page.
  - **Timer:** pauses on hover and keyboard focus. Escape closes the focused toast without closing
    a modal.
  - **Announcements:** through hidden live regions, polite or assertive for danger, so each toast
    is read once.
  - **Event:** `ntn:toastclose` carries `reason`: `timeout`, `dismiss`, `api` or `overflow`.
  - **Tones:** neutral (the default), `--primary` and the four statuses. Each tint lies over an
    opaque surface.
  - **Motion:** reduced motion fades it in and out and hides the timer line.
  - **Icons:** new `configure({ icon })` keys `success`, `warning`, `danger` and `info`.
  - **Kitchen sink:** a Toast section with every tone and placement, and the modal case on the
    Modal example's Send invite button.
- **Upload look: `ntn-dropzone`, `ntn-file-list` and `ntn-file`** (NTN-24). No engine is bundled.
  - **Drop area:** a `<label>` with a file input stretched over it, so click and drop work with
    no JS.
    - Elements: `__icon`, `__title` and `__hint`.
    - States: `data-ntn-dragover` and `aria-disabled`.
    - Modifier: `--compact`.
  - **File rows:** `__thumb`, `__name`, `__meta`, `__actions`, `__progress` (shown only while
    `data-ntn-state="uploading"`) and `__error` (shown only in `error`).
  - **Optional `data-ntn-dropzone`:** counts drag enters and leaves (file drags only) to set
    `data-ntn-dragover`, and fires `ntn:files` on a drop or a pick.
  - **Kitchen sink:** an Upload section with every drop-area and file-row state.

### Changed
- **Breaking:** `--ntn-ambient-height` is now `--ntn-ambient-size`, since the band can sit on a
  side.
- **Published from GitHub Actions** through npm trusted publishing, so each release carries npm
  provenance linking it to the commit and workflow that built it.

- **`ntn-daterange` opens in the top layer** (NTN-21):
  - The panel is a `popover="manual"`, so no `overflow` ancestor clips it, and inside a modal it
    sits above the dialog.
  - It is placed against the trigger with the dropdown's flip-and-clamp logic, and follows it on
    scroll and resize.
  - `__panel--narrow` is now chosen from the window width.
  - The `.ntn-card:has(…panel)` overflow workaround is gone.
- **Locale time:** the date picker's trigger shows the time the way the user's locale writes it
  (`2:05 PM` in en-US). Before, it showed the raw `14:05`.

### Fixed
- **The date picker's time can now be emptied.** Apply with an empty time input used to keep the
  old `data-ntn-time`.
- **The app shell no longer traps `position: sticky`** (NTN-20). `.ntn-app` is only `min-height`
  tall, so `.ntn-app__scroll` never scrolled. Its `overflow-y: auto` still made it a scroll
  container, so every sticky inside the content stuck to a pane that never moved.
  - The overflow is gone, and the page is the one scroller.
  - The kitchen sink has an App shell section with a sticky save bar. Its scrollspy and smooth
    scrolling now follow the page.

## 1.10.0 — 2026-10-19

### Added
- **`themes/mono.css`** (NTN-15): a theme in greys only, so an app can bring its own brand colour
  without fighting a theme hue. The accent is near white in dark mode and near black in light
  mode, and its ink flips with it. The neutrals keep Nocturne's lightness with the blue taken
  out. Charts, the processing ring and the light-mode shadows go grey too. The status tones keep
  their colour.
- **`themes/synthwave.css`** (NTN-16): Miami Vice after dark. A hot pink accent with dark ink,
  kept about 40° of hue from the danger red. Miami teal for the second chart series, the
  processing glint and the shine lights, and a sunset orange for the third series. Night-purple
  greys in dark mode, pastel pink paper with purple-navy ink in light mode. Hotter glows, and a
  CSS-gradient sunset as `--ntn-ambient-image` (turn it off with `none`).
- **Kitchen sink:** Mono and Synthwave buttons in the accent picker.
- **Tests:** every theme, Nocturne's own included, is checked for contrast (the ink on the fill,
  and accent text on cards and canvas, in both modes), and for any mode token set in its dark
  block but not again for light (it would beat Nocturne's light theme on load order).
- **Tokens:** `--ntn-processing-glint`, the bright stop in the processing ring (cyan by default),
  and `--ntn-check-mark-white` / `--ntn-check-dash-white`, so a theme whose ink flips per mode
  can point the checkbox art back at white.

### Fixed
- **Progress steps** (NTN-17): the connector no longer shows through the current step's marker.
  Its soft accent tint now sits on an opaque `--ntn-surface-2` base, like the upcoming marker.

### Changed
- The processing ring reads `--ntn-processing-glint` instead of `--ntn-cyan-400`, so no
  component reads a chart hue directly. A test guards it.
- The dark checkbox art (`--ntn-check-mark-ink`, `-dash-ink`) is a pure grey (`#0A0A0A`, was
  `#0A0C10`).

## 1.9.0 — 2026-10-10 (unpublished)

### Added
- **`ntn-glass`**: translucent, blurred cards, stats, accordions and sidebar with a lit top edge,
  for pages over artwork or a gradient. Put it on one surface, or on a wrapper (up to
  `.ntn-app`) to glaze every surface inside. Controls, menus and modals stay solid. Falls back to
  solid under `prefers-reduced-transparency` and for the phone sidebar drawer.
  `ntn-glass--flat` drops the lit top edge, for glass over the plain ambient glow.
- **`ntn-ambient`**: the backdrop to sit glass on, a static accent glow behind the top of the app
  that fades into the canvas. An app adds its artwork at full strength with
  `--ntn-background-image`, or dimmed and fading with `--ntn-ambient-image`.
- **Tokens:** `--ntn-glass-bg`, `-border`, `-highlight`, `-shadow`, `-blur`,
  `--ntn-background-image`, and `--ntn-ambient-image`, `-opacity`, `-height`. Amber sets
  DeployBot's light-mode glass.
- **`ntn-edge--shine`**: a quieter border effect beside `--glow` and `--processing`. Two
  soft lights drift round the edge half a lap apart, each trailed by a faint halo; ambient, so
  it can stay on. The lights ride the border box with `offset-path`, so the host carries one
  `<span class="ntn-edge__shine" aria-hidden="true">` child. Falls back to the plain hairline
  without `offset-path` support, and pauses under `prefers-reduced-motion`. Tokens:
  `--ntn-shine-speed`, `-length`, `-thickness`, `-head`, `-color`, `-glow`.
- **Kitchen sink:** a Glass section showing glass over the glow, over a photo as the ambient
  image, and over the photo as the background image (`examples/images/background.avif`), and a
  droplet button in the top bar that turns glass and the ambient band on for the whole page.
- **Kitchen sink code view (NTN-1).** Every section has a Code button that shows each example's
  markup, coloured, with a Copy button. A code button in the top bar opens or closes every
  section at once. Code starts hidden. The snippets are read from the demos themselves
  (`examples/sink-code.js`), so they can't drift. The invite dialog now lives in the Modal section.
- **Token:** `--ntn-focus-outline`, the keyboard focus ring as an outline value.
- **Tokens:** `--ntn-shadow-control`, `-hairline`, `-float` and `-inset`, the small depths of
  filled buttons, glowing buttons, the FAB and the switch track. Mode tokens: the light theme
  softens them.
- **Token:** `--ntn-disabled-opacity` (0.45), the one fade every disabled control uses.
- **One tone set (NTN-8).** Every toned block now offers primary, success, warning, danger, info
  and neutral (`skill/components.md` "Tones"). New: `ntn-alert--neutral` (a grey notice) and
  `ntn-progress--info`.
- **Token:** `--ntn-accent-800` fills the gap in the accent ramp, derived from 700 and 900, so
  every theme has it without setting it (NTN-13).

### Changed
- **Token names (NTN-10).** Font sizes are `--ntn-font-size-2xs … -5xl` (were `--ntn-text-*`, which
  also named the text colours), and the switch's off-state knob is `--ntn-switch-knob` (was
  `--ntn-control-knob`, among the control heights). `--ntn-text-*` is now colours only and
  `--ntn-control-*` heights only.
- **Container frames are `--ntn-border-default`** in every theme, as in DeployBot: `ntn-card`,
  `ntn-stat`, `ntn-accordion` and `ntn-edge` (modals already were). The rules inside them (table
  rows, card feet, divided heads, accordion items) stay on `--ntn-border-subtle`, so the frame
  reads first. `ntn-edge--strong` moves up to `--ntn-border-strong` to stay a step above.
- **No inset ring in dark shadows.** `--ntn-shadow-sm`, `-md` and `-lg` drop the faint 2–3% white
  inner ring; depth is the border and the drop alone.
- **Brand:** cards are opaque except under `ntn-glass` (`skill/brand.md`).
- **`themes/amber.css` uses DeployBot's greys.** Dark mode drops the blue tint for near-neutral
  graphite. Light mode gets a warm paper canvas and off-white cards with slate text, and the
  accent text stops become a burnt amber (`--ntn-accent-300` is `#9B4900`). The faint step
  (`--ntn-n-600`, also `--ntn-text-disabled`) is softer than Nocturne's, so labels and
  placeholders read lighter under amber. Inner hairlines (`--ntn-border-subtle`: table rows,
  dividers) are a touch brighter. No token was added or renamed. Other themes are unchanged.
- **Docs:** a theme may now retint the neutral ramp as well as the accent (README "Accent").
- **`src/` is SCSS (NTN-2).** The source is Sass partials (`src/nocturne.scss`,
  `src/tokens.scss`, `src/tokens/_*.scss`, `src/components/_*.scss`, plus `src/abstracts/` for
  mixins, tone maps and breakpoints). `dist/` keeps the same files and needs no build step;
  `npm run build` compiles with Sass, a devDependency.
- **`nocturne-build` requires `--out`.** It renames the compiled `dist/` stylesheets instead of
  reading `src/`, so a prefix build still needs no dependencies. The output is unchanged.
- **Breakpoints use range syntax** (`width <= 720px` / `width > 720px`), so the phone and
  wide-screen rules meet exactly. With `max-width: 720px` and `min-width: 721px`, a fractional
  width between the two matched neither.
- **Step descriptions follow the row, not the window (NTN-11).** A horizontal `ntn-steps` drops
  its `__desc` lines when the row itself is narrower than 640px (a container query), so a wizard
  in a narrow column sheds them too. Before, only a viewport of 640px or less did. `skill/patterns.md`
  now lists the two viewport breakpoints (1100px, 720px) for page-level CSS.
- **`ntn-page` is 1440px wide, and follows `--ntn-page-max` (NTN-6).** The page column was
  hard-coded to 1360px while the token said 1440px, so setting the token did nothing. It now reads
  the token, and the token's 1440px is the width: pages are 80px wider on large screens. Set
  `--ntn-page-max: 1360px` to keep the old width.
- **Toggle-group and segmented end corners** follow `--ntn-radius-md` (minus the 1px border)
  instead of a fixed 7px. No change at the default radius.
- **Cascade (NTN-12).** Nocturne stays unlayered; the README shows how an app puts it in a
  cascade layer at import (`@import … layer(ntn)`). The menu and date-range carets drop their
  `!important` for a two-class selector; `[hidden]` in the reset is the only `!important` left.
- **Derived tokens (NTN-13).** The dark `--ntn-bg-blur`, `--ntn-scrim` and `--ntn-border-subtle`
  derive from the neutral ramp instead of hard-coded colours (same values), so a theme that
  retints the greys carries them. Spacing written in pixels that sit on the space scale reads the
  `--ntn-space-*` tokens (same values); off-scale geometry stays literal.

### Removed
- `--ntn-btn-solid` and `--ntn-btn-solid-hover`. No rule read them.
- `--ntn-shadow-none` (it was `none`), `--ntn-border-accent` (the same value as `--ntn-accent`) and
  `--ntn-glow-accent` (unread; the halo tokens replaced it) (NTN-13).

### Fixed
- **Keyboard focus ring (NTN-3).** Buttons, the primary icon button, the FAB, the switch, the date
  trigger and interactive cards showed no focus ring: their own `box-shadow` replaced the global
  one. The ring is now an outline (`--ntn-focus-outline`), which no shadow can replace. It also
  survives Windows forced-colours mode, where field-style controls now draw a system outline too.
  The date trigger rings on focus, not only while open, and the combobox search no longer shows a
  second ring inside its group.
- **Light-theme shadows (NTN-7).** The primary and glow buttons, the FAB and the switch track
  used raw black shadows, which stayed black on a light page. They now read the new
  `--ntn-shadow-*` tokens: soft grey in light, unchanged in dark.
- **Reduced motion (NTN-4).** `prefers-reduced-motion` covered only the edge effects and tabs. Now
  every entrance (`ntn-rise`: menus, popovers, the date panel, tooltips, modals, accordion panels,
  filters) fades in place, interactive cards and the FAB no longer lift on hover, the sidebar rail
  and phone drawer change without sliding, and the indeterminate progress bar pulses instead of
  sweeping. Spinners still turn.
- **One disabled treatment (NTN-9).** Disabled controls faded by 0.4, 0.45, 0.5 or 0.55 depending
  on the block. All now fade by `--ntn-disabled-opacity` (0.45, as `brand.md` always said) with a
  `not-allowed` cursor. Tabs and pager steps, which greyed their text instead, fade the same way.
  The FAB and toggle-group buttons gain a disabled style (`aria-disabled` too). Disabled controls
  no longer react to hover: buttons, icon buttons, the FAB, toggle groups, tabs, pager steps, menu
  items, combobox triggers and options, date-range edges, clickable steps and segmented radio
  options.
- **Flush tree depth (NTN-5).** In `ntn-tree--flush`, rows below the second level kept the
  second level's indent, so deep branches flattened. Each row now indents by its own depth,
  through 12 levels. The depth guide in a default tree also follows `--ntn-tree-indent` instead
  of sitting at a fixed 10px; no change at the default indent.
- **`ntn-icon-btn`** dims for `aria-disabled="true"` as well as `disabled`, like `ntn-btn`.
- **Combobox:** `aria-invalid="true"` on the trigger shows the invalid state, as it does on a
  field or select (`data-invalid` on the block still works).
- **Select:** the hint turns red when the select is invalid, as a field's does.
- **Rating:** the read-only star's hidden label uses the full visually-hidden pattern.
- **Accordion:** an open panel's text sat right against the summary. `ntn-accordion__panel` now
  has 12px (`--ntn-space-3`) of top padding.

## 1.8.0 — 2026-10-07

Prepared as 1.7.0 and published as 1.8.0; there is no 1.7.0 on npm.

### Added
- **`ntn-btn--glow`**: with `--primary`, adds a halo in the button's colour (accent, or the
  tone's). Use it for the one action on the page you want read first. Disabled drops the halo.
- **`themes/amber.css`**: a warm gold accent with dark ink, next to emerald. It sits close to
  the warning hue, so keep main actions on `--primary` rather than the `--warning` tone.
- **Tokens:** `--ntn-accent-fill` and `--ntn-accent-fill-hover` (the top-lit gradient, derived
  from the ramp), `--ntn-accent-halo`, and `--ntn-highlight-top` (the inset top edge).
- **Kitchen sink:** an accent picker (violet, emerald, amber) in the top bar.
- **`npm run sink`** serves the repo locally and prints the kitchen sink URL. Opened from a file,
  the page now shows a notice: browsers block module scripts on `file://`, so `nocturne.js` never
  loaded there and the theme toggle, tabs, dialogs and dropdowns did nothing.

### Changed
- **Filled accent buttons are lit from the top.** `ntn-btn--primary`, `ntn-icon-btn--primary` and
  `ntn-fab` use a vertical gradient, a lighter hairline and an inset highlight in place of a
  flat fill. Pressing drops to the flat `--ntn-accent-active`. Primary tone buttons
  (`--primary --danger` and so on) get the same treatment in their tone. No class or token was
  renamed, but primary buttons look different.

## 1.6.0 — 2026-09-25

### Added
- **`ntn-dropdown` and `ntn-popover`**: a trigger (`aria-haspopup`) plus a menu or a free-form
  panel, opened by `nocturne.js` in the top layer, so no ancestor (not even a flush card) clips it.
  - **Placement:** `data-ntn-placement`, flipped and kept on screen.
  - **Keyboard:** arrows on the trigger open it; arrows, `Home` and `End` move through items.
  - **Closing:** Escape returns focus to the trigger and closes only the menu inside a modal.
    Outside clicks, focus leaving, choosing an item and `data-ntn-close` also close it.
  - **Opening** one closes the others.
  - **`data-ntn-owner`** exempts a body-mounted picker from outside clicks.
  - **Events and API:** `ntn:dropdownshow` / `ntn:dropdownhide`, and exports `open()`,
    `close()`, `toggle()`.
- **`ntn-combo` posts with its form.** Add `data-ntn-name="x"` and `nocturne.js` keeps hidden
  `<input name="x">` children in step with the selection. Multi-select posts one per value.
  Single-select posts exactly one, `""` when empty, like a `<select>` with an empty first option.
  - Every user change also fires a bubbling native `change` after `ntn:combochange`.
  - `form.reset()` restores the first-rendered selection.
  - `refresh(root)` re-syncs after you set `aria-selected` yourself.
- **Menus: `Home` / `End`** jump to the first / last item, and arrow keys skip disabled items.
- **`ntn-rating`**: a star rating built on native radios (values 1…max plus a value-0 "Clear").
  A form always posts it, arrow keys work natively, and the stars are CSS-drawn (no icon set).
  It has a hover preview and a read-only variant (`--readonly`, `role="img"`).
- **`ntn-radio-group--segmented`**: native radios drawn as a segmented switch, for picking one of
  two to four short options. The `<legend>` stays for assistive tech but is hidden from view.
  Posting and arrow keys stay native.
- **Search loading state**: `data-loading` on `ntn-search` turns the leading icon into a
  CSS spinner (so it works with any icon set).
- **Sidebar drawer**: at 720px and below, `ntn-sidebar` is an off-canvas drawer instead of a
  squeezed column. The existing `data-ntn-toggle` opens it (`data-open`). An optional
  `ntn-sidebar__scrim` sibling dims the page. Escape or a scrim click closes it, and focus goes in
  and comes back out. The rail (`data-collapsed`) now applies only above 720px.
- **Glass hooks**: `--ntn-surface-filter` (cards, sidebar) and `--ntn-pop-filter` (modal, menu,
  popover, date-range panel, tooltip) feed `backdrop-filter`. Both default to `none`, so
  Nocturne renders byte-identically; a skin with translucent surfaces sets them.
- **`dist/nocturne.nofonts.css`** (package export `./css/nofonts`): the full stylesheet without the
  Google Fonts `@import`, for apps that self-host Geist or run a strict CSP. Prefixed builds emit
  it too.

### Changed
- **`ntn:tabchange` fires only for real changes.**
  - A list is announced once when first set up, with `detail.initial: true`.
  - After that, the event fires only when the selection actually changes. A later `refresh()`
    and clicking the already-selected tab are silent. Before, every `refresh()` re-announced every
    tab list, so apps redrew panels for nothing each time they inserted HTML.
  - Tab `<button>`s without a `type` get `type="button"`, so a tab never submits its form.
  - `refresh(root)` also covers `root` itself when it matches, so `refresh(tabList)` works.
- **Accent tints derive from the ramp.** `--ntn-accent-soft`, `-soft-hover`, `-softer`, `-glow`,
  `-line`, `-line-strong` and `--ntn-focus-ring` are now `color-mix()` of `--ntn-accent-500`.
  A brand theme only sets the ramp and `--ntn-accent-fg`, and nothing stays violet (before this,
  emerald left the lines and the soft hover violet). Nocturne's own colours are unchanged.
- **Checkbox art is a token.** `--ntn-check-mark` and `--ntn-check-dash` live on `:root` with dark
  `-ink` variants, so a theme with a dark `--ntn-accent-fg` swaps them in one line. Before, they
  sat on `.ntn-check`, where a `:root` override never reached them. The multi-select combo's
  checkbox face uses the same token instead of its own hard-coded white tick.
- **`themes/emerald.css`** sets just the ramp and the ink, and puts its light-mode stops in a
  `:root[data-theme="light"]` block. It used to overwrite the light theme's darkened stops, which
  left pale green text on white.
- **Cards no longer clip their content.** A combobox panel, tooltip or date picker opened inside a
  default `ntn-card` now spills out instead of being cut off, so the kitchen sink's
  `style="overflow:visible"` workarounds are gone. `ntn-card__foot` rounds its own bottom corners.
  `ntn-card--flush` still clips, because it holds edge-to-edge tables and media.

### Fixed
- **`data-theme` on a subtree now works in both directions.** Aliases such as
  `--ntn-text-primary: var(--ntn-n-900)` resolved once at `:root`, so a light panel inside a dark
  page kept the dark page's text colours. A dark panel inside a light page kept everything light.
  - Tokens now sit in three blocks:
    - mode primitives on `:root, [data-theme="dark"]`;
    - constants on `:root`;
    - aliases re-declared on `:root, [data-theme]`.
  - A subtree sets its own text colour.
  - `npm test` checks the split, and pages with `data-theme` only on `<html>` render
    byte-identically.
  - `themes/emerald.css` uses `:root [data-theme]` selectors so the brand follows into subtrees.
    Custom brand themes should do the same (see Accent in the README).
- The date-range panel used a hard-coded `z-index: 60`, so a sticky top bar (`--ntn-z-sticky`,
  100) could cover it. It now uses `--ntn-z-dropdown` like the other popups.
- The kitchen sink used an `ntn-card--sm` modifier that never existed; it is gone from the demo.

## 1.5.0 — 2026-09-24

The first public release: MIT, on npmjs.com as `@homestar9/nocturne-ui`. Earlier versions were
private (`@angrysam/nocturne`) and never published, so nobody has to migrate. The token rename
below would normally be a major bump; it ships as a minor only because there are no consumers yet.

### Changed
- **Every design token is namespaced.** `--accent` is now `--ntn-accent`, `--surface-1` is
  `--ntn-surface-1`, `--n-500` is `--ntn-n-500`, and likewise for all 156 tokens: colours,
  type, spacing, radii, elevation, motion and z-index. Nothing Nocturne declares can collide with
  an app's own custom properties any more. Rename rule: put `ntn-` after the leading `--`.
- **Keyframes are namespaced:** `nocturne-spin`, `-pulse`, `-rise`, `-shimmer` and
  `-border-spin` are now `ntn-spin` and so on.
- **Modifiers are named for meaning, not looks.** Buttons now have two axes that combine:
  - **Emphasis:** default, `--primary`, `--secondary` or `--subtle`.
  - **Tone:** `--success`, `--warning`, `--danger` or `--info`.

  Renames: `ntn-btn--ghost` → `--subtle`, `ntn-btn--soft` → `--secondary`, and the tone
  `--accent` → `--primary` on `ntn-badge`, `ntn-alert` and `ntn-icon`.

  **`ntn-btn--danger` alone is now an outlined destructive button.** The old solid red button
  is `ntn-btn--primary ntn-btn--danger`.

  Every emphasis combines with every tone. Before this, `--ghost --danger` rendered solid red
  because `--danger` won by source order; `--subtle --danger` is now a quiet red button.
- **Progress and slider values publish CSS variables on their blocks:** `--ntn-progress` and
  `--ntn-slider-pct` sit on `.ntn-progress` / `.ntn-slider`. Before, the width was inline and
  the variable sat on the input. Progress also gets `role="progressbar"` and the `aria-value*`
  attributes.
- **Vertical tabs** are declared with `aria-orientation="vertical"`. The `--vertical` modifier
  still works, and the script adds the attribute to it.
- **The icon italic reset** no longer keys on Font Awesome class names. It covers
  `i[class*="fa-"]`, `i[data-icon]` and empty `<i>`, and leaves `<i>` used for real italics alone.

### Added
- **Build-time prefix.** `nocturne-build --prefix <name> --out <dir>` (or
  `import { build } from '@homestar9/nocturne-ui/build'`) emits the CSS, JS and themes with the whole
  namespace renamed: classes, tokens, `data-*` hooks (and their `dataset` keys), events, the theme
  storage key and keyframes. An app can own its markup vocabulary (`.app-card`) and still use Nocturne,
  or swap to another kit built to the same names. Prefixes are lowercase letters and digits.
- **A separate prefix for tokens.** `--token-prefix` (`tokenPrefix`) keeps design tokens
  kit-named (`--ntn-*`) while classes, hooks and events take your prefix.

  State variables the script writes, and the `--ntn-tree-indent` knob, always follow the class
  prefix because they belong to the markup. The state variables are discovered from the script,
  so the list can't drift.
- **Pluggable icons.** `configure({ icon: (key) => element })` swaps how `nocturne.js` draws the
  icons it creates. The keys are `close`, `prev`, `next`, `theme-light` and `theme-dark`, and the
  default is Font Awesome Light. The calendar head is now built as DOM, not an HTML string.
- **Field anatomy:**
  - `ntn-field__prefix` and `ntn-field__action`, a small icon button inside the control;
  - `ntn-field__error` and `ntn-select__error`;
  - an invalid state from `aria-invalid="true"` on the input, with `data-invalid` still working.

  Documented rules: `required` as an attribute, and a placeholder on every text input
  (`" "` when there's nothing to say) so themes can float the label.
- **Accessibility and markup hooks:**
  - Menu rows take `aria-checked="true"` with `role="menuitemcheckbox|menuitemradio"`.
    `aria-selected` is still styled but isn't valid on menu items.
  - `ntn-sidebar__label` for item text.
  - `ntn-tabs__label` (optional) around tab text.
  - `ntn-modal__close` for the head's dismiss button.
  - An explicit `ntn-alert--info` (info is still the default).
  - New tokens `--ntn-success-fg`, `--ntn-warning-fg` and `--ntn-info-fg` for ink on solid
    status colours.
- **Theme opt-out.** `<html data-ntn-theme-control="manual">` hands light/dark to the app: `nocturne.js` never touches `data-theme` or `ntn-theme`, adds no
  OS listener, and ignores `data-ntn-theme-toggle` / `data-ntn-theme-set`. Without it, nothing
  changes.
- **`npm test`**, a guard that checks every declared token is prefixed, every `var()` the CSS
  reads is declared, and a `--prefix` build leaves no trace of `ntn` and equals the default build
  with the namespace swapped. It also runs behaviour tests in a simulated browser (`jsdom`, a
  dev-only dependency; the package still has no runtime dependencies). It runs on `prepack` too.

### Fixed
- **Security: combobox labels could inject HTML.** Chips, the single-select value and the chip
  remove buttons were built by pasting option labels into `innerHTML`, so a label like
  `<img src=x onerror=…>` (for example a user-entered tag name) became live markup. They are now
  built as text nodes and attributes. The date range summary, which can show a typed time, is
  built the same way.
- **Pager buttons submitted forms.** The generated page-number buttons had no `type`, so inside a
  `<form>` a click submitted it. They are now `type="button"`.

## 1.4.0 — 2026-09-21 (unpublished)

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
