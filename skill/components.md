# Nocturne class reference

Every block, its elements, its modifiers, and the markup that produces it. Copy these shapes
exactly. One class per element; state lives in attributes.

Icons are Font Awesome Light written as bare `<i class="fa-light fa-name">` — the parent block
sizes and colours them. Never give an `<i>` a Nocturne class unless it is standing alone, in
which case use `.ntn-icon`.

---

## Layout

| Class | Role |
| --- | --- |
| `ntn-app` | Flex shell: sidebar + main |
| `ntn-app__main` | Column holding navbar and scroll area |
| `ntn-app__scroll` | The scrolling region under a sticky navbar |
| `ntn-page` | Centred 1360px content column, 24px gutters, 14px gaps |
| `ntn-page__head` `ntn-page__title` `ntn-page__sub` `ntn-page__actions` | Page header parts |
| `ntn-grid` + `--2` `--3` `--4` `--split` `--split-reverse` | Card grids (14px gap, responsive) |
| `ntn-row` + `--between` `--end` | Horizontal group with 8px gap |
| `ntn-stack` | Vertical group with 12px gap |
| `ntn-eyebrow` | 11px uppercase section label |
| `ntn-num` | Mono, tabular figures — every comparable number |
| `ntn-kbd` | Keyboard hint |
| `ntn-empty` `ntn-empty__title` | Empty state |

```html
<div class="ntn-app">
  <aside class="ntn-sidebar">…</aside>
  <div class="ntn-app__main">
    <header class="ntn-navbar">…</header>
    <div class="ntn-app__scroll">
      <main class="ntn-page">
        <div class="ntn-page__head">
          <div>
            <h1 class="ntn-page__title">Billing</h1>
            <p class="ntn-page__sub">Usage and invoices for this workspace.</p>
          </div>
          <div class="ntn-page__actions">
            <button class="ntn-btn ntn-btn--sm"><i class="fa-light fa-download"></i>Export CSV</button>
          </div>
        </div>
        <div class="ntn-grid ntn-grid--4">…</div>
      </main>
    </div>
  </div>
</div>
```

---

## Button — `ntn-btn`

Two axes, named for **meaning** — combine one of each:

- Emphasis: (default) · `--primary` the main action · `--secondary` a supporting action with more
  weight than default · `--subtle` a low-key action
- Tone: accent unless one of `--success` `--warning` `--danger` `--info`

Size: `--sm` `--lg` · `--block`
States: `disabled`, `data-loading` (spins the leading icon).

```html
<button class="ntn-btn ntn-btn--primary"><i class="fa-light fa-plus"></i>Add item</button>
<button class="ntn-btn">Cancel</button>
<button class="ntn-btn ntn-btn--subtle ntn-btn--sm"><i class="fa-light fa-ellipsis"></i></button>
<button class="ntn-btn ntn-btn--primary ntn-btn--danger" disabled>Delete workspace</button>
<button class="ntn-btn ntn-btn--primary" data-loading><i class="fa-light fa-sort"></i>Saving</button>
```

Default is the everyday button. One `--primary` per view. `--secondary` is for a highlighted
non-destructive action inside a card. A tone says what the action means, not how loud it is:
`--primary --danger` for an irreversible action, `--subtle --danger` for a reversible "Remove",
`--danger` alone for an outlined destructive option.

## Icon button — `ntn-icon-btn`

Modifiers: `--secondary` `--primary` · `--sm` `--lg`. Toggle state: `aria-pressed="true"`.
Always give it `aria-label`.

```html
<button class="ntn-icon-btn" aria-label="Notifications"><i class="fa-light fa-bell"></i></button>
<button class="ntn-icon-btn ntn-icon-btn--secondary ntn-icon-btn--sm" aria-label="Filter"><i class="fa-light fa-filter"></i></button>
```

## FAB — `ntn-fab`

Modifier: `--extended` (adds a label). Fixed bottom-right.

```html
<button class="ntn-fab ntn-fab--extended"><i class="fa-light fa-plus"></i>New key</button>
```

---

## Text field — `ntn-field`

Elements, in order: `__label`, then `__control` holding [a leading `<i>` or `__prefix`] the input
[`__suffix` or `__action`], then `__hint` and `__error`. Modifiers: `--sm` `--lg` `--textarea`.

- **Error:** `aria-invalid="true"` on the input, `aria-describedby` pointing at `__error`
  (`data-invalid` on the block also works). The control turns red.
- **Required:** the `required` attribute, never a typed asterisk.
- **Placeholder:** every text input carries one (`placeholder=" "` when there is nothing to say),
  so themes can float the label with `:placeholder-shown`.
- **Disabled:** disable the input, not the block.
- **`__action`** is a small icon button inside the control (a clear or title-case button, say),
  with `type="button"` and an `aria-label`.

```html
<div class="ntn-field">
  <label class="ntn-field__label" for="slug">URL slug</label>
  <span class="ntn-field__control">
    <span class="ntn-field__prefix">/</span>
    <input id="slug" type="text" placeholder=" " required>
  </span>
</div>

<div class="ntn-field">
  <label class="ntn-field__label" for="title">Title</label>
  <span class="ntn-field__control">
    <input id="title" type="text" placeholder=" " aria-invalid="true" aria-describedby="title-error">
    <button type="button" class="ntn-field__action" aria-label="Title case"><i class="fa-light fa-font"></i></button>
  </span>
  <span class="ntn-field__error" id="title-error">Title must be at least 20 characters.</span>
</div>
```

A bare `<label class="ntn-field">` wrapper (below) is fine when the control holds one input and
no button.

```html
<label class="ntn-field">
  <span class="ntn-field__label">Workspace name</span>
  <span class="ntn-field__control">
    <i class="fa-light fa-cube"></i>
    <input type="text" placeholder="Cortex Labs">
  </span>
  <span class="ntn-field__hint">Visible to everyone in this workspace.</span>
</label>

<label class="ntn-field" data-invalid>
  <span class="ntn-field__label">Seats</span>
  <span class="ntn-field__control">
    <input type="number" value="0">
    <span class="ntn-field__suffix">seats</span>
  </span>
  <span class="ntn-field__hint">Enter at least one seat.</span>
</label>
```

## Select — `ntn-select`

Native `<select>`, styled. Elements: `__label` `__control` `__hint` `__error`. Modifiers: `--sm` `--lg`
`--inline`. Error: `aria-invalid="true"` on the `<select>` (or `data-invalid` on the block). Smallest footprint, and it gets the platform picker on mobile — use it whenever the
options are plain strings. Reach for `ntn-combo` when they need descriptions, icons, filtering
or multi-select.

```html
<label class="ntn-select">
  <span class="ntn-select__label">Region</span>
  <span class="ntn-select__control">
    <select><option>us-east-1</option><option>eu-west-2</option></select>
  </span>
</label>
```

## Dropdown · Multi-select — `ntn-combo`

A listbox on the `ntn-menu` surface — the select replacement. Elements: `__label` `__trigger`
`__value` `__caret` `__chip` `__chip-x` `__more` `__panel` `__search` `__list` `__option`
`__text` `__option-title` `__option-desc` `__tick` `__box` `__empty` `__foot` `__hint`.
Modifiers: `--sm` `--lg` `--inline`. Invalid: `data-invalid` on the root.

`nocturne.js` owns open/close, filtering, keyboard (`↑↓` `↵` `esc` `home/end`) and chip
rendering; selection lives on each option's `aria-selected`, so the DOM is the state. Add
`data-ntn-multi` for multi-select (checkbox faces in the list, chips in the trigger,
`data-ntn-max` chips before a `+N`), and a `__search` input with `data-ntn-combo-search` to
filter. Fires `ntn:combochange` with `{ value, values, labels, multiple }`.

```html
<div class="ntn-combo" data-ntn-combo data-ntn-multi data-ntn-max="2">
  <span class="ntn-combo__label">Notify channels</span>
  <button type="button" class="ntn-combo__trigger" aria-haspopup="listbox" aria-expanded="false">
    <span class="ntn-combo__value" data-ntn-combo-value data-ntn-placeholder="No channels"></span>
    <i class="fa-light fa-chevron-down ntn-combo__caret"></i>
  </button>
  <div class="ntn-combo__panel ntn-menu" hidden>
    <div class="ntn-combo__list" role="listbox" aria-multiselectable="true">
      <button type="button" class="ntn-combo__option" role="option" data-value="email" aria-selected="true">
        <span class="ntn-combo__box"></span>
        <span class="ntn-combo__text"><span class="ntn-combo__option-title">Email</span></span>
      </button>
      <button type="button" class="ntn-combo__option" role="option" data-value="slack" aria-selected="false">
        <span class="ntn-combo__box"></span>
        <span class="ntn-combo__text">
          <span class="ntn-combo__option-title">Slack</span>
          <span class="ntn-combo__option-desc">#alerts-prod</span>
        </span>
      </button>
    </div>
    <div class="ntn-combo__foot">
      <span class="ntn-combo__hint" data-ntn-combo-count></span>
      <button type="button" class="ntn-btn ntn-btn--subtle ntn-btn--sm" data-ntn-combo-none>Clear</button>
    </div>
  </div>
</div>
```

Single-select drops `data-ntn-multi` and swaps `__box` for a trailing
`<i class="fa-light fa-check ntn-combo__tick">`; picking an option closes the panel.

## Menu — `ntn-menu`

Dropdown surface for action menus and custom pickers. Elements: `__item` `__label` (section
heading) `__shortcut` `__caret` `__sub`. Item modifier: `--danger`. A checkable row is
`role="menuitemcheckbox"` (or `menuitemradio` in a pick-one group) with `aria-checked="true"`;
disabled row: `aria-disabled="true"`. Positioning is the app's job.

Nest a menu by wrapping the parent row and its panel in `__sub`: hover and focus open the
flyout in CSS alone. `nocturne.js` adds `←`/`→` traversal and flips the panel to the left when
the window edge is closer than the panel is wide. Nesting is unbounded, but two levels is the
practical limit for a pointer.

```html
<div class="ntn-menu" role="menu">
  <p class="ntn-menu__label">This file</p>
  <button class="ntn-menu__item" role="menuitem"><span>Rename</span><span class="ntn-menu__shortcut">F2</span></button>
  <div class="ntn-menu__sub">
    <button class="ntn-menu__item" role="menuitem" aria-haspopup="true" aria-expanded="false">
      <span><i class="fa-light fa-share"></i> Share</span>
      <i class="fa-light fa-chevron-right ntn-menu__caret"></i>
    </button>
    <div class="ntn-menu" role="menu">
      <button class="ntn-menu__item" role="menuitem">Copy link</button>
      <button class="ntn-menu__item" role="menuitem">Email a copy</button>
    </div>
  </div>
  <hr class="ntn-divider">
  <button class="ntn-menu__item ntn-menu__item--danger" role="menuitem"><span>Delete</span></button>
</div>
```

## Dropdown — `ntn-dropdown` · Popover — `ntn-popover`

A trigger with `aria-haspopup` plus its panel, inside `<div class="ntn-dropdown" data-ntn-dropdown>`.
The panel is an `ntn-menu` (`role="menu"`, items `ntn-menu__item` with `role="menuitem"`) or, for
content that is not a menu (a filter form), an `ntn-popover` (`role="dialog"`, `aria-label`, optional
`__foot`).

`nocturne.js` opens the panel in the **top layer** (Popover API):
- no ancestor clips it, not even a `--flush` card;
- it stays in place in the DOM, so form fields inside belong to the surrounding form;
- placement comes from `data-ntn-placement` (`bottom-end` default, `bottom-start`, `top-end`,
  `top-start`), flipped and kept on screen.

Behaviour:
- **Keyboard:** `↓`/`↑` on the trigger opens on the first/last item; `↑`/`↓`/`Home`/`End` move
  through items.
- **Closing:** Escape closes it and returns focus to the trigger; inside a modal, only the menu
  closes. A click outside, focus leaving, choosing an item, or a `data-ntn-close` inside the panel
  (e.g. Apply) close it too.
- **Opening** one closes the others.
- **`data-ntn-owner=".selector"`** on the panel ignores clicks inside that element, for a picker
  appended to `<body>`.
- **Events** `ntn:dropdownshow` / `ntn:dropdownhide`; functions `open(el)`, `close(el)`, `toggle(el)`.

```html
<div class="ntn-dropdown" data-ntn-dropdown>
  <button type="button" class="ntn-btn ntn-btn--sm" aria-haspopup="menu" aria-expanded="false">Actions<i class="fa-light fa-chevron-down"></i></button>
  <div class="ntn-menu" role="menu" data-ntn-placement="bottom-end">
    <a class="ntn-menu__item" role="menuitem" href="/items/1/edit"><span><i class="fa-light fa-pen"></i> Edit</span></a>
    <hr class="ntn-divider">
    <button type="button" class="ntn-menu__item ntn-menu__item--danger" role="menuitem"><span><i class="fa-light fa-trash"></i> Delete</span></button>
  </div>
</div>

<div class="ntn-dropdown" data-ntn-dropdown>
  <button type="button" class="ntn-btn ntn-btn--sm" aria-haspopup="dialog" aria-expanded="false"><i class="fa-light fa-filter"></i>Filters</button>
  <div class="ntn-popover" role="dialog" aria-label="Filters" data-ntn-placement="bottom-end">
    …fields…
    <div class="ntn-popover__foot"><button type="button" class="ntn-btn ntn-btn--sm ntn-btn--primary" data-ntn-close>Apply</button></div>
  </div>
</div>
```

---

## Slider — `ntn-slider`

Elements: `__head` `__label` `__value`. The fill and the readout are driven by
`js/nocturne.js`; `data-unit` on `__value` appends a unit.

```html
<label class="ntn-slider">
  <span class="ntn-slider__head">
    <span class="ntn-slider__label">Rate limit</span>
    <span class="ntn-slider__value" data-unit=" rpm">240</span>
  </span>
  <input type="range" min="0" max="600" step="10" value="240">
</label>
```

## Search — `ntn-search`

Elements: `__shortcut`. Modifiers: `--sm` `--lg`. Loading: `data-loading` on the block turns the
leading icon into a spinner (put `aria-busy="true"` on the input).

```html
<div class="ntn-search">
  <i class="fa-light fa-magnifying-glass"></i>
  <input type="search" placeholder="Search here ...">
  <span class="ntn-search__shortcut">⌘K</span>
</div>
```

---

## Checkbox — `ntn-check` · Radio — `ntn-radio` · Switch — `ntn-switch`

Elements: `__label` `__desc`. Group radios in `ntn-radio-group` (`--row` for horizontal,
`--segmented` for a pick-one switch of two to four short options, drawn like a toggle group).
State comes from the native input: `checked`, `indeterminate` (set in JS), `disabled`.

Checkbox and radio share one language: 16px control, accent fill when on, white mark.
With a `__desc` the control aligns to the first line of the label, not to the top of the block.

```html
<label class="ntn-check">
  <input type="checkbox" checked>
  <span class="ntn-check__label">Rotate keys automatically
    <span class="ntn-check__desc">Applies to every key in the project.</span>
  </span>
</label>

<div class="ntn-radio-group">
  <label class="ntn-radio"><input type="radio" name="plan" checked><span class="ntn-radio__label">Team</span></label>
  <label class="ntn-radio"><input type="radio" name="plan"><span class="ntn-radio__label">Enterprise</span></label>
</div>

<fieldset class="ntn-radio-group ntn-radio-group--segmented">
  <legend>Content mode</legend>
  <label class="ntn-radio"><input type="radio" name="mode" value="document" checked><span class="ntn-radio__label"><i class="fa-light fa-file-lines"></i>Document</span></label>
  <label class="ntn-radio"><input type="radio" name="mode" value="sections"><span class="ntn-radio__label"><i class="fa-light fa-layer-group"></i>Sections</span></label>
</fieldset>

<label class="ntn-switch">
  <input type="checkbox" role="switch" checked>
  <span class="ntn-switch__label">Usage alerts</span>
</label>
```

---

## Rating — `ntn-rating`

A `<fieldset>` of native radios: one `__star` per value (1…max) plus a `__clear` radio with value 0.
The form therefore ALWAYS posts the field (0 = no rating), and the arrow keys work as in any radio
group. Stars are drawn in CSS and light up to the checked one, with a hover preview. "Clear" shows
once a star is chosen. Render `checked` on the value-0 radio when there is no rating yet. Modifier:
`--sm`. Colour knob: `--ntn-rating-color` (default `--ntn-warning-400`).

```html
<fieldset class="ntn-rating">
  <legend class="ntn-rating__legend">Rating</legend>
  <label class="ntn-rating__star"><input type="radio" name="rating" value="1"><span>1 star</span></label>
  <label class="ntn-rating__star"><input type="radio" name="rating" value="2"><span>2 stars</span></label>
  <label class="ntn-rating__star"><input type="radio" name="rating" value="3" checked><span>3 stars</span></label>
  <label class="ntn-rating__star"><input type="radio" name="rating" value="4"><span>4 stars</span></label>
  <label class="ntn-rating__star"><input type="radio" name="rating" value="5"><span>5 stars</span></label>
  <label class="ntn-rating__clear"><input type="radio" name="rating" value="0"><span>Clear</span></label>
</fieldset>

<!-- Read-only (a show screen): one span per star, data-on on the lit ones. -->
<span class="ntn-rating ntn-rating--readonly" role="img" aria-label="3 of 5 stars">
  <span class="ntn-rating__star" data-on></span><span class="ntn-rating__star" data-on></span><span class="ntn-rating__star" data-on></span><span class="ntn-rating__star"></span><span class="ntn-rating__star"></span>
</span>
```

---

## Card — `ntn-card`

Elements: `__head` `__title` `__sub` `__actions` `__body` `__foot`.
Modifiers: `--flush` (body padding 0 — use for tables; its `__head` gets a rule underneath
automatically), `--interactive`. On any other card, add the rule yourself with
`ntn-card__head--divided`.

Border effects are **not** card modifiers — see **Border effects** below. `ntn-card--glow` and
`ntn-card--processing` remain as shorthands for the two most common cases.

```html
<section class="ntn-card">
  <header class="ntn-card__head">
    <div>
      <h3 class="ntn-card__title">Requests</h3>
      <p class="ntn-card__sub">Last 30 days</p>
    </div>
    <div class="ntn-card__actions">
      <button class="ntn-icon-btn ntn-icon-btn--sm" aria-label="More"><i class="fa-light fa-ellipsis"></i></button>
    </div>
  </header>
  <div class="ntn-card__body">…</div>
  <footer class="ntn-card__foot">Updated 30 sec ago</footer>
</section>
```

A table always sits in a `ntn-card ntn-card--flush` with its pagination in `__foot`.

## Stat — `ntn-stat`

Elements: `__head` `__label` `__figure` `__value` `__delta` `__caption`.
Delta modifiers: `--down` `--flat` (default is positive/green).

```html
<div class="ntn-stat">
  <div class="ntn-stat__head">
    <span class="ntn-stat__label">Monthly spend</span>
    <span class="ntn-badge ntn-badge--sm">live</span>
  </div>
  <div class="ntn-stat__figure">
    <span class="ntn-stat__value">$24,678.81</span>
    <span class="ntn-stat__delta">+14.06%</span>
  </div>
  <span class="ntn-stat__caption">vs. $21,637.02 last month</span>
</div>
```

## Modal — `ntn-modal`

A native `<dialog>`. Elements: `__head` `__title` `__desc` `__close` `__body` `__foot`.
Modifiers: `--sm` `--lg`. Open with `data-ntn-open="#id"`, close with `data-ntn-close`
(or `dialog.showModal()` / `.close()`).

```html
<button class="ntn-btn" data-ntn-open="#invite">Send invite</button>

<dialog class="ntn-modal" id="invite">
  <header class="ntn-modal__head">
    <div>
      <h2 class="ntn-modal__title">Invite a teammate</h2>
      <p class="ntn-modal__desc">They will get access to this workspace only.</p>
    </div>
    <button type="button" class="ntn-modal__close" aria-label="Close" data-ntn-close><i class="fa-light fa-xmark"></i></button>
  </header>
  <div class="ntn-modal__body">…</div>
  <footer class="ntn-modal__foot">
    <button class="ntn-btn" data-ntn-close>Cancel</button>
    <button class="ntn-btn ntn-btn--primary">Send invite</button>
  </footer>
</dialog>
```

## Accordion — `ntn-accordion`

Native `<details>`. Elements: `__item` `__panel`. The chevron is drawn by CSS.

```html
<div class="ntn-accordion">
  <details class="ntn-accordion__item" open>
    <summary><i class="fa-light fa-key"></i>API keys</summary>
    <div class="ntn-accordion__panel">Keys are scoped to a single project.</div>
  </details>
  <details class="ntn-accordion__item">
    <summary><i class="fa-light fa-shield"></i>Security</summary>
    <div class="ntn-accordion__panel">SSO is available on Enterprise.</div>
  </details>
</div>
```

## Divider — `ntn-divider`

`<hr class="ntn-divider">`, `--vertical` for a stretched rule inside a flex row, or
`<div class="ntn-divider-label">Section</div>` for a labelled rule.

---

## Border effects — `ntn-edge`

A border treatment that composes onto anything — a card, a panel, a toolbar, a button, a bare
div. `ntn-edge` on its own is the default hairline at the standard radius; the modifiers add
the effect. Set your own `border-radius` and the effect follows it.

| Class | Effect |
| --- | --- |
| `ntn-edge` | Default hairline, `--ntn-radius-xl`. `--strong` for `--ntn-border-default` |
| `ntn-edge--glow` | Accent hairline, halo, and a colour bleed from the top edge. The one element on the page you want read first |
| `ntn-edge--processing` | A light travels the edge and an exterior glow orbits with it. Pair with a `ntn-spinner` or an indeterminate `ntn-progress`; remove the class when the job lands |

```html
<div class="ntn-edge ntn-edge--processing" style="padding:20px">…</div>
<button class="ntn-btn ntn-edge--glow">Upgrade</button>
<section class="ntn-card ntn-card--processing">…</section>   <!-- card shorthand -->
```

Both moving effects read one registered angle (`--ntn-spin`), animated on the host and
inherited by its ring, so the light and the glow never drift apart. Under
`prefers-reduced-motion` they settle to a static halo.

## Badge — `ntn-badge`

Modifiers: `--neutral` (default) `--primary` `--success` `--warning` `--danger` `--info` · `--dot` (leading status dot)
· `--sm` · `--count` (numeric pill). Text is a lowercase noun.

```html
<span class="ntn-badge ntn-badge--success ntn-badge--dot">active</span>
<span class="ntn-badge ntn-badge--danger">failed</span>
<span class="ntn-badge ntn-badge--count">12</span>
```

## Alert — `ntn-alert`

Elements: `__body` `__title` `__text` `__actions`. Modifiers: `--success` `--warning`
`--danger` `--primary` `--info` · `--banner` (full-bleed, square). Default tone is info; state it with `--info`.
Dismiss with `data-ntn-dismiss`.

```html
<div class="ntn-alert ntn-alert--warning" role="status">
  <i class="fa-light fa-triangle-exclamation"></i>
  <div class="ntn-alert__body">
    <div class="ntn-alert__title">Usage is at 92% of the plan limit</div>
    <div class="ntn-alert__text">Requests are throttled above 100%.</div>
  </div>
  <div class="ntn-alert__actions">
    <button class="ntn-btn ntn-btn--sm">Upgrade now</button>
    <button class="ntn-icon-btn ntn-icon-btn--sm" aria-label="Dismiss" data-ntn-dismiss><i class="fa-light fa-xmark"></i></button>
  </div>
</div>
```

## Tooltip — `ntn-tooltip`

CSS only — wraps the trigger; opens on hover **and** keyboard focus after a 90 ms delay, so a
pointer crossing a toolbar stays quiet. Elements: `__bubble` `__title` `__text` `__key`.
Bubble modifiers: `--bottom` `--left` `--right` (placement) · `--start` `--end` (align to the
trigger's edge instead of its centre) · `--wrap` (a sentence, max 232px). The arrow is drawn
from the bubble's own surface, so a theme change carries it.

Never put anything interactive in a bubble — it is `pointer-events: none`. Give it
`role="tooltip"`, and keep it out of an `overflow: hidden` ancestor (a plain `.ntn-card` clips).

```html
<span class="ntn-tooltip">
  <button class="ntn-icon-btn ntn-icon-btn--sm" aria-label="Retention policy"><i class="fa-light fa-circle-info"></i></button>
  <span class="ntn-tooltip__bubble ntn-tooltip__bubble--wrap" role="tooltip">
    <span class="ntn-tooltip__title">Retention</span>
    <span class="ntn-tooltip__text">Events older than 30 days are rolled up hourly.</span>
  </span>
</span>
```

## Progress — `ntn-progress`

Elements: `__head` `__label` `__value` `__track` `__fill`. Modifiers: `--sm` `--lg`
`--success` `--warning` `--danger` `--neutral` `--indeterminate`.
Set the level with `data-value` (and optional `data-max`) on `__fill`; `nocturne.js` applies it.

```html
<div class="ntn-progress">
  <div class="ntn-progress__head">
    <span class="ntn-progress__label">Storage</span>
    <span class="ntn-progress__value">82k / 120k</span>
  </div>
  <div class="ntn-progress__track"><div class="ntn-progress__fill" data-value="68"></div></div>
</div>
```

## Spinner — `ntn-spinner`

`--lg` for 24px. Wrap with `ntn-loading` for a labelled spinner.

```html
<span class="ntn-loading"><span class="ntn-spinner"></span>Loading invoices</span>
```

## Avatar — `ntn-avatar` · `ntn-avatars`

Modifiers: `--xs` `--sm` `--lg` `--xl` `--ring`. Status dot: `__status` with
`--online` `--busy` `--away`. Overlapping group: `ntn-avatars`, overflow via `__more`.

```html
<span class="ntn-avatar">MR<span class="ntn-avatar__status ntn-avatar__status--online"></span></span>
<span class="ntn-avatar ntn-avatar--lg"><img src="/u/12.jpg" alt="Michael Reyes"></span>

<span class="ntn-avatars">
  <span class="ntn-avatar ntn-avatar--sm">MR</span>
  <span class="ntn-avatar ntn-avatar--sm">JT</span>
  <span class="ntn-avatars__more">+4</span>
</span>
```

---

## Table — `ntn-table`

A wrapper block; `table`, `th`, `td` are styled by tag. Cell classes: `__num` (right-aligned
mono), `__primary` (emphasised first column), `__actions` (right-aligned button cell),
`__empty` (empty-state cell). Modifiers: `--compact` `--zebra`.
The header row is a filled band (`--ntn-surface-2`) with a stronger rule under it, so it separates
the table from whatever sits above it. Reach for `--zebra` on long, number-heavy lists; leave
it off when rows carry badges and avatars.
Sortable headers carry `aria-sort="none|ascending|descending"`. Selection uses
`data-ntn-select-all` on the header checkbox; rows get `aria-selected` from `nocturne.js`.

**The card is the component wrapper.** A table is assembled from five parts, in this order —
all but the table itself optional:

| Part | Class | Holds |
| --- | --- | --- |
| Header | `ntn-card__head` | Title (+ count badge), `__sub`, right-side actions |
| Toolbar | `ntn-toolbar` | `__start` (toggle-group filter) · `__end` (search, Filters button) |
| Filter form | `ntn-filters` | Selects, `__actions`, `__applied` filter tags — starts `hidden` |
| Table | `ntn-table` | The rows |
| Footer | `ntn-card__foot` | `ntn-pager` |

Add `data-ntn-paginate="10"` to the `.ntn-table` and `nocturne.js` runs client-side paging,
text search and tag filtering over the rows already in the DOM (see **JS hooks**). Leave it
off and the markup is static.

```html
<section class="ntn-card ntn-card--flush" data-ntn-table-scope>
  <header class="ntn-card__head">
    <div class="ntn-card__heading">
      <h3 class="ntn-card__title">Team members <span class="ntn-badge ntn-badge--primary ntn-badge--sm">14 users</span></h3>
      <p class="ntn-card__sub">Manage who has access to this workspace.</p>
    </div>
    <div class="ntn-card__actions">
      <button class="ntn-btn ntn-btn--sm"><i class="fa-light fa-download"></i>Export</button>
      <button class="ntn-btn ntn-btn--primary ntn-btn--sm"><i class="fa-light fa-user-plus"></i>Add member</button>
    </div>
  </header>

  <div class="ntn-toolbar ntn-toolbar--divided">
    <div class="ntn-toolbar__start">
      <div class="ntn-toggle-group ntn-toggle-group--sm">
        <button class="ntn-toggle-group__btn" aria-pressed="true" data-ntn-filter-tag="all">All</button>
        <button class="ntn-toggle-group__btn" aria-pressed="false" data-ntn-filter-tag="admin">Admins</button>
      </div>
    </div>
    <div class="ntn-toolbar__end">
      <div class="ntn-search ntn-search--sm ntn-toolbar__search">
        <i class="fa-light fa-magnifying-glass"></i>
        <input type="search" placeholder="Search members" data-ntn-table-search>
      </div>
      <button class="ntn-btn ntn-btn--sm" data-ntn-reveal="#member-filters" aria-expanded="false">
        <i class="fa-light fa-filter"></i>Filters<span class="ntn-badge ntn-badge--count">2</span>
      </button>
    </div>
  </div>

  <div class="ntn-filters" id="member-filters" hidden>
    <label class="ntn-select ntn-select--sm ntn-filters__field">
      <span class="ntn-select__label">Status</span>
      <span class="ntn-select__control"><select><option>Any status</option></select></span>
    </label>
    <div class="ntn-filters__actions">
      <button class="ntn-btn ntn-btn--subtle ntn-btn--sm">Clear all</button>
      <button class="ntn-btn ntn-btn--secondary ntn-btn--sm">Apply filters</button>
    </div>
    <div class="ntn-filters__applied">
      <span class="ntn-filter-tag">Status: Active<button class="ntn-filter-tag__remove" aria-label="Remove"><i class="fa-light fa-xmark"></i></button></span>
    </div>
  </div>

  <div class="ntn-table" data-ntn-paginate="10">
    <table>
      <thead>
        <tr>
          <th><label class="ntn-check"><input type="checkbox" data-ntn-select-all></label></th>
          <th>Member</th>
          <th aria-sort="descending">Last active<i class="fa-light fa-arrow-down"></i></th>
          <th class="ntn-table__num">Spend</th>
          <th class="ntn-table__actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr data-tags="owner">
          <td><label class="ntn-check"><input type="checkbox"></label></td>
          <td class="ntn-table__primary">Michael Reyes</td>
          <td>2 hours ago</td>
          <td class="ntn-table__num">$1,204.55</td>
          <td class="ntn-table__actions">
            <button class="ntn-icon-btn ntn-icon-btn--sm" aria-label="More"><i class="fa-light fa-ellipsis"></i></button>
          </td>
        </tr>
        <tr data-ntn-table-empty hidden>
          <td colspan="5" class="ntn-table__empty">No members match those filters.</td>
        </tr>
      </tbody>
    </table>
  </div>
  <footer class="ntn-card__foot">
    <div class="ntn-pager">…</div>
  </footer>
</section>
```

## Toolbar — `ntn-toolbar` · Filter form — `ntn-filters`

Toolbar elements: `__start` `__end` `__search`. Modifier: `--divided` (rule underneath — use it
whenever a table follows). The toolbar is its own band: it carries padding on all four sides.
Filter-form elements: `__field` `__actions` `__applied`, plus `ntn-filter-tag` /
`ntn-filter-tag__remove` for an applied filter. Both live inside the table's card, but work
above any content block. The filter form is revealed by a button carrying
`data-ntn-reveal="#id"`, and drops its own top rule when it follows a `--divided` toolbar.

## Date & range picker — `ntn-daterange`

Elements: `__trigger` `__value` `__caret` `__panel` `__row` `__presets` `__preset` `__cals`
`__cal` `__foot` `__summary` `__actions`. Modifiers: `--sm` `--block`.
`__row` must wrap `__presets` + `__cals` — the panel is a column, and that row is what
sets its width. `nocturne.js` positions the panel inside whatever clips it and adds
`__panel--narrow` (chip presets, one month) when it cannot fit.

The two month grids are rendered by `nocturne.js` — write the shell only. Selection is
draft-first: presets and clicks change nothing outside the panel until **Apply**, which fires
`ntn:daterangechange` with `{ start, end }` as `YYYY-MM-DD` (and `startDate` / `endDate` as
`Date`s). Cancel, Escape, or a click outside reverts.

Set the initial range with `data-ntn-start` / `data-ntn-end`; bound it with `data-ntn-min` /
`data-ntn-max`. Preset keys on `data-ntn-range`: a plain number (last N days, ending today),
`today`, `yesterday`, `month`, `last-month`, `ytd`.

**Single date.** Add `data-ntn-single` to the root (and `ntn-daterange--single` for the tighter
padding), ship one `__cal`, and drop the preset column. A click sets start and end to the same
day; the event still carries both, so consumers read one shape either way.

**Single date + time.** Keep `data-ntn-single` and add `data-ntn-time="09:30"` plus a time input
in the footer:

```html
<label class="ntn-daterange__time">
  <span>Time</span>
  <input type="time" value="09:30" step="900" data-ntn-daterange-time>
</label>
```

The event detail then carries `time`, `startISO` and `endISO` (`2026-10-02T09:30`) alongside the
plain dates. There is no range + time variant — two times in one popover is a form, not a picker.

```html
<div class="ntn-daterange" data-ntn-daterange data-ntn-start="2026-09-01" data-ntn-end="2026-09-20">
  <button class="ntn-daterange__trigger" type="button" aria-expanded="false">
    <i class="fa-light fa-calendar-range"></i>
    <span class="ntn-daterange__value" data-ntn-daterange-label data-ntn-placeholder="All time"></span>
    <i class="fa-light fa-chevron-down ntn-daterange__caret"></i>
  </button>
  <div class="ntn-daterange__panel" hidden>
    <div class="ntn-daterange__row">
      <div class="ntn-daterange__presets">
        <button type="button" class="ntn-daterange__preset" data-ntn-range="7">Last 7 days</button>
        <button type="button" class="ntn-daterange__preset" data-ntn-range="30">Last 30 days</button>
        <button type="button" class="ntn-daterange__preset" data-ntn-range="month">This month</button>
      </div>
      <div class="ntn-daterange__cals">
        <div class="ntn-daterange__cal" data-ntn-cal="0"></div>
        <div class="ntn-daterange__cal" data-ntn-cal="1"></div>
      </div>
    </div>
    <footer class="ntn-daterange__foot">
      <span class="ntn-daterange__summary" data-ntn-daterange-summary></span>
      <div class="ntn-daterange__actions">
        <button class="ntn-btn ntn-btn--subtle ntn-btn--sm" type="button" data-ntn-daterange-cancel>Cancel</button>
        <button class="ntn-btn ntn-btn--primary ntn-btn--sm" type="button" data-ntn-daterange-apply>Apply</button>
      </div>
    </footer>
  </div>
</div>
```

## Toggle group — `ntn-toggle-group`

Segmented control — the left-hand filter in a table toolbar, or a range switch above a chart.
Element: `__btn`. Modifiers: `--sm` `--lg`. State lives on `aria-pressed`; the group is
exclusive unless it carries `data-multi`. `nocturne.js` moves the pressed state and fires
`ntn:toggle`.

```html
<div class="ntn-toggle-group">
  <button class="ntn-toggle-group__btn" aria-pressed="true">12 months</button>
  <button class="ntn-toggle-group__btn" aria-pressed="false">30 days</button>
  <button class="ntn-toggle-group__btn" aria-pressed="false">7 days</button>
</div>
```

---

## Navbar — `ntn-navbar`

Elements: `__brand` `__mark` `__center` `__right`. Sticky, blurred, 56px.

```html
<header class="ntn-navbar">
  <div class="ntn-navbar__brand"><span class="ntn-navbar__mark"><i class="fa-light fa-cube"></i></span>Cortex Labs</div>
  <div class="ntn-navbar__center"><div class="ntn-search">…</div></div>
  <div class="ntn-navbar__right">
    <button class="ntn-icon-btn" aria-label="Notifications"><i class="fa-light fa-bell"></i></button>
    <span class="ntn-avatar ntn-avatar--sm">MR</span>
  </div>
</header>
```

## Sidebar — `ntn-sidebar`

Elements: `__brand` `__mark` `__brand-text` `__name` `__meta` `__nav` `__group` `__section`
`__item` `__label` `__sub` `__foot`. Active item: `aria-current="page"`. Collapse to the 56px rail with
`data-collapsed` on the block — toggle it via `data-ntn-toggle=".ntn-sidebar"`.
Wrap item text in `__label` so the rail can hide it (a bare direct-child `<span>` still works).

```html
<aside class="ntn-sidebar">
  <div class="ntn-sidebar__brand">
    <span class="ntn-sidebar__mark"><i class="fa-light fa-cube"></i></span>
    <span class="ntn-sidebar__brand-text">
      <span class="ntn-sidebar__name">Cortex Labs</span>
      <span class="ntn-sidebar__meta">Pro workspace</span>
    </span>
  </div>
  <nav class="ntn-sidebar__nav">
    <div class="ntn-sidebar__group">
      <p class="ntn-sidebar__section">Platform</p>
      <a class="ntn-sidebar__item" href="#" aria-current="page"><i class="fa-light fa-gauge-high"></i><span class="ntn-sidebar__label">Overview</span></a>
      <a class="ntn-sidebar__item" href="#"><i class="fa-light fa-users"></i><span class="ntn-sidebar__label">Users</span><span class="ntn-badge ntn-badge--count">8</span></a>
    </div>
  </nav>
</aside>
```

## Tabs — `ntn-tabs`

Elements: `__tab`, optional `__label` around the tab text. Modifiers: `--pill` (segmented) `--fill` (equal
widths) `--sm`. Vertical: `aria-orientation="vertical"` on the list (the `--vertical` modifier still works).
Selected: `aria-selected="true"`; disable one with `disabled`. Add `data-ntn-panel="#id"` to let
`nocturne.js` show and hide panels — it also wires `aria-controls`/`aria-labelledby` and
`role="tabpanel"`.

`nocturne.js` runs the ARIA tabs pattern: roving tabindex (one tab in the tab order), `←`/`→`
— `↑`/`↓` when vertical — to move with automatic activation, `home`/`end` for the ends. It
measures the selected tab and slides one indicator element (`--ntn-tab-x/-w`, `-y/-h`), marking
the list `data-ntn-ink`; without the script each tab's own underline is the fallback. A row of
tabs wider than its container scrolls, and the selected tab is kept in view. Fires
`ntn:tabchange`.

```html
<div class="ntn-tabs" role="tablist" aria-label="Billing">
  <button class="ntn-tabs__tab" id="t-usage" role="tab" aria-selected="true" data-ntn-panel="#usage">Usage</button>
  <button class="ntn-tabs__tab" id="t-inv" role="tab" aria-selected="false" data-ntn-panel="#invoices">Invoices<span class="ntn-badge ntn-badge--count">3</span></button>
</div>
<section id="usage">…</section>
<section id="invoices" hidden>…</section>
```

Tabs switch views inside one page; they are not navigation. More than about six, or labels
longer than two words, means a vertical list or a sidebar instead.

## Breadcrumbs — `ntn-crumbs`

Elements: `__link` `__sep`. The last link carries `aria-current="page"`.

```html
<nav class="ntn-crumbs" aria-label="Breadcrumb">
  <a class="ntn-crumbs__link" href="#"><i class="fa-light fa-house"></i>Home</a>
  <i class="fa-light fa-chevron-right ntn-crumbs__sep"></i>
  <a class="ntn-crumbs__link" href="#" aria-current="page">Billing</a>
</nav>
```

## Pagination — `ntn-pager`

A split row: `__start` carries the page-size select and the `__summary` range, `__end` carries
the stepper. Elements: `__start` `__end` `__sep` `__step` `__pages` `__page` `__gap`
`__summary`. Current page: `aria-current="page"`. Lives in a card footer.

```html
<footer class="ntn-card__foot">
  <div class="ntn-pager">
    <div class="ntn-pager__start">
      <label class="ntn-select ntn-select--sm ntn-select--inline">
        <span class="ntn-select__label">Rows per page</span>
        <span class="ntn-select__control">
          <select data-ntn-page-size><option>5</option><option selected>10</option><option>25</option></select>
        </span>
      </label>
      <span class="ntn-pager__sep"></span>
      <span class="ntn-pager__summary" data-ntn-summary>Showing <b>1–10</b> of <b>248</b></span>
    </div>
    <div class="ntn-pager__end">
      <button class="ntn-pager__step" data-ntn-prev><i class="fa-light fa-arrow-left"></i>Previous</button>
      <div class="ntn-pager__pages" data-ntn-pages>
        <button class="ntn-pager__page" aria-current="page">1</button>
        <button class="ntn-pager__page">2</button>
        <span class="ntn-pager__gap">…</span>
        <button class="ntn-pager__page">25</button>
      </div>
      <button class="ntn-pager__step" data-ntn-next>Next<i class="fa-light fa-arrow-right"></i></button>
    </div>
  </div>
</footer>
```

Drop `__start` for a bare stepper, or drop `__pages` for Previous/Next only. With
`data-ntn-paginate` on the table, the `data-ntn-*` hooks above are filled in by the script.

## Tree view — `ntn-tree`

A hierarchy list in the VS Code / Figma-layers idiom. Elements: `__item` `__row` `__grip`
`__twisty` (`--leaf` keeps the slot without a chevron) `__icon` `__label` `__meta` `__group`
`__actions`. Modifiers: `--sm` `--flush` (edge-to-edge inside a `ntn-card--flush`).

Depth is real DOM nesting: an `__item` holds its `__row` and, when it has children, a
`__group` of further items. The item carries the state — `role="treeitem"`, `aria-expanded`,
`aria-selected`, `data-ntn-id` — and the focus. Set `--ntn-tree-indent` to change the step.

`data-ntn-tree` turns on behaviour: click or `↵` selects (`data-ntn-multi` + ⌘/ctrl for
multi-select), clicking a folder row or `←`/`→` opens and closes it, `↑`/`↓` `home` `end` move
focus. Drag is handle-gated — an item only becomes draggable while the pointer is down on its
`__grip`, so labels stay selectable. Drop intent comes from where in the row the pointer sits:
the outer thirds insert above or below (an insertion line), the middle drops inside (the row
fills). `alt`+`↑`/`↓` reorders among siblings and `alt`+`→`/`←` indents and outdents, the
keyboard equivalent of a drag. Add `data-ntn-nest` to let leaves accept children too.

Events: `ntn:treemove` `{ id, position, targetId, parentId, index, item }`,
`ntn:treeselect` `{ id, ids, item }`, `ntn:treetoggle` `{ id, expanded, item }`. The DOM is
moved for you — mirror the event into your own model.

```html
<div class="ntn-tree" role="tree" aria-label="Files" data-ntn-tree data-ntn-nest>
  <div class="ntn-tree__item" role="treeitem" aria-expanded="true" data-ntn-id="design">
    <div class="ntn-tree__row">
      <span class="ntn-tree__grip" aria-hidden="true"><i class="fa-light fa-grip-vertical"></i></span>
      <span class="ntn-tree__twisty" aria-hidden="true"><i class="fa-light fa-chevron-right"></i></span>
      <i class="ntn-tree__icon fa-light fa-folder-open"></i>
      <span class="ntn-tree__label">Design system</span>
      <span class="ntn-tree__meta">6</span>
    </div>
    <div class="ntn-tree__group" role="group">
      <div class="ntn-tree__item" role="treeitem" data-ntn-id="tokens">
        <div class="ntn-tree__row">
          <span class="ntn-tree__grip" aria-hidden="true"><i class="fa-light fa-grip-vertical"></i></span>
          <span class="ntn-tree__twisty ntn-tree__twisty--leaf" aria-hidden="true"></span>
          <i class="ntn-tree__icon fa-light fa-file-code"></i>
          <span class="ntn-tree__label">tokens.css</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Progress steps — `ntn-steps`

A wizard's spine on an `<ol>`. Elements: `__step` `__hit` (makes a step clickable) `__marker`
`__text` `__title` `__desc` `__count`. Modifiers: `--vertical` `--inline` (marker beside the
text) `--bars` (segments only, for "Step 3 of 4") `--sm`.

Each step carries `data-state="complete | current | upcoming"` — that one attribute paints the
marker, both label lines and the connector behind it. Complete steps take a check icon,
the rest their number. `data-ntn-steps` on the list makes `__hit` clicks walk the states and
fire `ntn:stepchange` `{ index, id, total }`; without it the states are yours to set.

```html
<ol class="ntn-steps" data-ntn-steps>
  <li class="ntn-steps__step" data-state="complete" data-ntn-id="details">
    <button type="button" class="ntn-steps__hit">
      <span class="ntn-steps__marker"><i class="fa-light fa-check"></i></span>
      <span class="ntn-steps__text">
        <span class="ntn-steps__title">Your details</span>
        <span class="ntn-steps__desc">Name and email</span>
      </span>
    </button>
  </li>
  <li class="ntn-steps__step" data-state="current" data-ntn-id="team">
    <button type="button" class="ntn-steps__hit">
      <span class="ntn-steps__marker">2</span>
      <span class="ntn-steps__text"><span class="ntn-steps__title">Invite your team</span></span>
    </button>
  </li>
</ol>
```

Four or five steps is the ceiling for the horizontal form; past that go `--vertical` or
`--bars` with a `__count` line.

---

## Theme

`data-theme` on `<html>` — `"dark"` (default), `"light"`, or `"auto"`. It also works on any
subtree for a light panel inside a dark app. Never write a theme selector in product code; both
themes are the same class names with different token values.

```html
<button class="ntn-icon-btn" aria-label="Toggle light theme" data-ntn-theme-toggle>
  <i class="fa-light fa-sun" data-ntn-theme-icon></i>
</button>
```

`nocturne.js` flips the icon between sun and moon, keeps `aria-pressed` in sync, and stores the
preference. For an explicit three-way picker, use `data-ntn-theme-set="dark|light|auto"` on each
option; the script marks the active one with `aria-selected`.

API: `setTheme(pref)`, `toggleTheme()`, `getTheme()`, `getThemePreference()`, and a
`ntn:themechange` event on `document`.

Tokens that carry theme meaning, when you need them directly:

| Token | Role |
| --- | --- |
| `--ntn-accent-fg` | Ink sitting ON the accent (labels, knobs, brand marks) |
| `--ntn-control-knob` | A switch's off-state knob |
| `--ntn-alpha-ink-04/06/10` | Wash over the current surface — white on dark, black on light |
| `--ntn-bg-blur` | Translucent fill behind the sticky top bar |
| `--ntn-accent-line`, `--ntn-success-line`, `--ntn-warning-line`, `--ntn-danger-line`, `--ntn-info-line` | Hairlines for tinted surfaces |

## JS hooks

`js/nocturne.js` is optional and dependency-free. It listens at the document level, so markup
rendered later still works; call `refresh()` after a framework re-render if you use
`data-value` progress bars, sliders, or a paginated table.

Table controls are found inside the nearest `[data-ntn-table-scope]` or `.ntn-card` around the
table, so header, toolbar, filter form and pager can sit anywhere in that wrapper.

| Attribute | Effect |
| --- | --- |
| `data-ntn-open="#id"` | `showModal()` on that dialog |
| `data-ntn-close` | Closes the enclosing dialog |
| `data-ntn-dismiss` | Removes the enclosing `.ntn-alert` |
| `data-ntn-toggle="<selector>"` | Toggles `data-collapsed` (sidebar rail) |
| `data-ntn-panel="#id"` on a tab | Tab switching; the tablist also gets keyboard nav and a sliding indicator, and fires `ntn:tabchange` |
| `data-ntn-tree` on `.ntn-tree` | Selection, expand/collapse, keyboard nav and handle-gated drag; fires `ntn:treemove`, `ntn:treeselect`, `ntn:treetoggle` |
| `data-ntn-nest` on `.ntn-tree` | Lets leaf rows accept a child on drop |
| `data-ntn-multi` on `.ntn-tree` | ⌘/ctrl-click selects several rows |
| `data-ntn-combo` on `.ntn-combo` | Owns the listbox: open/close, filtering, keyboard, chips; fires `ntn:combochange` |
| `data-ntn-multi` / `data-ntn-max="2"` on `.ntn-combo` | Multi-select, and how many chips show before `+N` |
| `data-ntn-combo-value` / `-search` / `-count` / `-none` | Trigger readout, filter input, "n selected", clear-all |
| `data-ntn-steps` on `.ntn-steps` | Clicking `__hit` walks the step states; fires `ntn:stepchange` |
| `data-ntn-reveal="#id"` | Shows/hides that element (filter forms), keeps `aria-expanded` |
| `data-ntn-select-all` on a checkbox | Select-all inside `.ntn-table` |
| `.ntn-toggle-group__btn` | Moves `aria-pressed` within the group; fires `ntn:toggle` |
| `data-ntn-paginate="10"` on `.ntn-table` | Client-side paging, search and tag filtering; fires `ntn:tablechange` |
| `data-ntn-table-search` on an input | Filters those rows on their text |
| `data-ntn-filter-tag="admin"` on a toggle button | Keeps rows whose `data-tags` lists the value (`all` = no filter) |
| `data-ntn-page-size` on a select | Rows per page |
| `data-ntn-summary` / `data-ntn-pages` | Receive "Showing 1–10 of 24" and the page buttons |
| `data-ntn-prev` / `data-ntn-next` / `data-ntn-goto="3"` | Step and jump |
| `data-ntn-table-empty` on a `<tr>` | Shown only when nothing matches |
| `data-value` / `data-max` on `.ntn-progress__fill` | Sets the fill width |
| `data-ntn-theme-toggle` | Flips dark ⇄ light, persists, swaps the icon |
| `data-ntn-theme-set="dark\|light\|auto"` | Sets a specific theme preference |
| `data-ntn-daterange` on `.ntn-daterange` | Renders the month grids, owns selection; fires `ntn:daterangechange` on Apply |
| `data-ntn-start` / `-end` / `-min` / `-max` | Initial range and bounds, `YYYY-MM-DD` |
| `data-ntn-single` on the root | One date instead of a range |
| `data-ntn-time="09:30"` + `data-ntn-daterange-time` on an input | Adds a time to a single date; event gains `time`, `startISO`, `endISO` |
| `data-ntn-range="7\|today\|month\|last-month\|ytd"` on a preset | Sets the draft range |
| `data-ntn-daterange-label` / `-summary` / `-apply` / `-cancel` | The picker's trigger text, footer readout, and buttons |
