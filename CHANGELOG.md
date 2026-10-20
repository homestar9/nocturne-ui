# Changelog

All notable changes to Nocturne. The version in `package.json` is the contract:
bump **patch** for fixes, **minor** for new components or tokens, **major** for
renamed or removed class names and tokens.

## [Unreleased]

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

### Changed
- **Breaking:** `--ntn-ambient-height` is now `--ntn-ambient-size`, since the band can sit on a
  side.

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
