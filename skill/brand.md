# Nocturne — visual and voice foundations

## Palette

Eleven cool greys (`--ntn-n-0` … `--ntn-n-1000`) do about 90% of the work. One violet ramp
(`--ntn-accent-100` … `--ntn-accent-900`) is the accent and the only themeable channel. Magenta
(`--ntn-magenta-*`) and cyan (`--ntn-cyan-*`) exist **only** as chart series two and three — never in
chrome. Semantic hues are green / amber / red / blue, each with a 14–15% alpha tint for
surfaces (`--ntn-success-soft`, `--ntn-warning-soft`, `--ntn-danger-soft`, `--ntn-info-soft`).

Ink is full-opacity at every level. The system dims text by choosing a lighter grey
(`--ntn-text-primary` → `--ntn-text-secondary` → `--ntn-text-muted` → `--ntn-text-disabled`), never by
lowering opacity on type.

## Light theme

Light is a remap of the same tokens, not a second design. The neutral ramp reverses (`--ntn-n-0`
is always furthest from the ink, `--ntn-n-1000` is always the ink), surfaces become white paper on
a grey canvas, and the shadows turn into soft grey drops instead of black ones. Accent 500–900
and every semantic 500 are unchanged, so fills, gradients, and the brand mark are identical in
both themes; only the 100–400 tints darken, because those are the values used as ink on a tinted
ground. Write for dark, then check light — if something breaks, a token value is wrong, not a
component.

## Depth

Four flat surfaces stack: `--ntn-bg-sunken` (sidebar) → `--ntn-bg-app` (canvas) → `--ntn-surface-1` (cards)
→ `--ntn-surface-2` / `--ntn-surface-3` (inputs, menus, hovers). Elevation is a hairline border plus a
wide soft drop (`--ntn-shadow-md`), never a bright glow or heavy blur. Gradients appear in exactly
four places: the brand mark tile, avatar initials, slider/progress fill, chart area fills.

Transparency and blur exist in two places only: the sticky top bar (72% app colour + 20px blur)
and the modal scrim (72% black + 6px blur). Cards are always opaque.

## Type

Geist for everything; Geist Mono for every number a user compares — currency, deltas, counts,
IDs, page numbers. Use `.ntn-num` on a numeric cell or span. Display sizes are semibold with
`--ntn-tracking-display`; UI runs 13–14px; 11px is reserved for uppercase section labels with
`--ntn-tracking-caps`. Line height 1.5 body, 1.15 display.

## Shape and border

Radii climb with the size of the thing: 4px checkbox, 6px chip, 8px control, 10px menu, 14px
card, 18px dialog, full for pills and avatars. Borders are always 1px: `--ntn-border-subtle`
separates structure, `--ntn-border-default` outlines interactive surfaces, `--ntn-border-strong` marks
hover. There is no coloured-left-border pattern anywhere in this system.

## Motion

80ms press, 140ms hover/focus/tooltip, 200ms switch/accordion/menu, 320ms progress. Entrances
use `--ntn-ease-out` with a 6px rise and a fade (`ntn-rise`). Nothing bounces, nothing
overshoots, nothing spins except spinners.

## States

Hover washes the surface +4% white and brightens the border one step. Press adds +6% and nudges
0.5px down. Focus-visible is a 3px violet ring (`--ntn-ring-focus`) with the border switched to
`--ntn-accent-500`. Disabled is 45% opacity plus `not-allowed`. Rows and nav items follow the same
rules as buttons.

## Imagery

The system ships none and expects none. Data visualisation is the imagery: violet lead line with
a fading area fill, magenta comparison line, dashed cyan third series, grid lines at 6% white.
If a product needs photography, keep it cool-toned and dark, and never put text directly on it
without a solid capsule.

## Voice

**Plain, quiet, factual.** The product states what happened and what it costs; it does not
celebrate. Sentence case everywhere except the 11px uppercase section labels.

- Address the user as *you*. Never *I*. *We* only in support and error copy where a human follows up.
- **Specifics beat adjectives:** "Response latency improved 24% after enabling request caching",
  not "Performance greatly improved". Every insight names a number, a unit, and a period.
- **Buttons are verbs:** *Export CSV*, *Add item*, *Send invite*, *Save changes*. Never *Submit*,
  *OK*, or *Click here*. Cancel is always the literal word *Cancel*.
- **Empty and helper text is one line.** Hints end with a period; labels, badges, and tooltips do not.
- **Greet once, on the dashboard only.** "Welcome back, Michael" plus a timestamp. No other screen greets.
- **Status words are lowercase nouns** inside badges (*active*, *pending*, *failed*) — they read
  as data values, not sentences.
- **Numbers:** currency with separators and two decimals (`$24,678.81`); deltas signed and padded
  to two digits (`+14.06%`, `-09.12%`); magnitudes abbreviated lowercase (`82k`, `2.19m`). All in Geist Mono.
- **No emoji.** Not in UI, not in copy, not as icons.
