# Nocturne — visual and voice foundations

## Palette

Eleven near-neutral greys (`--ntn-n-0` … `--ntn-n-1000`, a graphite ramp) do about 90% of the work. One violet ramp
(`--ntn-accent-100` … `--ntn-accent-900`) is the accent and the main themeable channel; a theme may
also retint the greys, as `themes/amber.css` does with warmer ones. `themes/mono.css`
turns everything but the status tones grey (a near-white accent in dark mode, near black in
light), for apps that bring their own brand colour. `themes/synthwave.css` goes the other way:
hot pink and Miami teal on night-purple greys, with a sunset behind `ntn-ambient`. Magenta (`--ntn-magenta-*`) and cyan
(`--ntn-cyan-*`) exist **only** as chart series two and three — never in chrome. The one cyan
glint in the processing ring goes through `--ntn-processing-glint`, so a theme can retint it. Semantic hues are green / amber / red / blue, each with a 14–15% alpha tint for
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
ground. The exception is a theme whose fill itself must flip: `themes/mono.css` sets 500–900
and `--ntn-accent-fg` for light mode as well. Write for dark, then check light — if something breaks, a token value is wrong, not a
component.

## Depth

Four flat surfaces stack: `--ntn-bg-sunken` (sidebar) → `--ntn-bg-app` (canvas) → `--ntn-surface-1` (cards)
→ `--ntn-surface-2` / `--ntn-surface-3` (inputs, menus, hovers). Elevation is lit:
a translucent hairline (`--ntn-edge-line-strong`, the ink at 8%), a dark separation ring just
outside it (`--ntn-shadow-ring`), a faint top-lit sheen over the fill
(`--ntn-surface-sheen`), a lit rim along the top edge (`--ntn-edge-light`), and a wide, faint
drop (`--ntn-shadow-md`). The rim is always centred on the top edge, as if lit from above; never
park it in a corner, where it reads as a bracket. In light mode the ring, the rim, the sheen
and the groove are off: a white surface is already the brightest thing on the page. Never a bright glow
or heavy blur. The only glows are
`ntn-btn--glow` and `ntn-edge--glow`, each kept to the one element a page wants read first.
Gradients appear in exactly five places: the brand mark tile, avatar initials, slider/progress
fill, chart area fills, and filled accent buttons (primary button, primary icon button, FAB),
which are lit from the top. One opt-in exception: `ntn-gradient` washes a surface in a tone that
fades down into it. Keep washes quiet: neutral across a set of cards, and a status tone
(`--strong --line` at most) only on the one card that needs attention. Never a rainbow of tones.

Transparency and blur exist in two places only: the sticky top bar (72% app colour + 20px blur)
and the modal scrim (72% black + 6px blur). Cards are opaque, with one opt-in exception:
`ntn-glass` glazes cards, stats, accordions and the sidebar for a page that sits over artwork or
the `ntn-ambient` glow. Use it only where there is something behind to show through, and never
on controls. (`--ntn-surface-filter` and `--ntn-pop-filter` exist for apps that skin the kit
into a different look. Leave them at `none` when building to the Nocturne brand.)

## Type

Inter for everything: the variable font with its optical-size axis, so large type
takes the display cut by itself, and the alternate 1 and open digits switched on (`cv01`,
`ss03`). Weights sit just off the grid: medium 510, semibold 590. JetBrains Mono for every number
a user compares — currency, deltas, counts, IDs, page numbers. Use `.ntn-num` on a numeric cell
or span; figures in tables and stats are tabular. Tracking tightens with size: display
`-0.022em`, headings `-0.012em`, body `-0.011em`. Display sizes are semibold with
`--ntn-tracking-display`; UI runs 13–14px; 11px is reserved for uppercase section labels with
`--ntn-tracking-caps`. Line height 1.5 body, 1.15 display.

## Shape and border

Radii climb with the size of the thing: 4px checkbox, 6px chip, 8px control, 10px menu, 14px
card, 18px dialog, full for pills and avatars. Raised surfaces (cards, stats, accordions,
modals, menus, toasts) are framed in a hairline, `--ntn-hairline`: 1px, half a pixel on a 2x
screen. Its colour is translucent ink, `--ntn-edge-line-strong` (8%) for the frame and
`--ntn-edge-line` (5%) for the rules inside (card feet, divided heads, accordion items); a rule
under a head is engraved with a dark line beneath it (`--ntn-edge-groove`). Controls keep solid
1px borders: `--ntn-border-default` outlines interactive surfaces, `--ntn-border-subtle` draws
table rows and dividers, `--ntn-border-strong` marks hover. There is no coloured-left-border
pattern anywhere in this system.

## Motion

80ms press, 140ms hover/focus/tooltip, 200ms switch/accordion/menu, 320ms progress. Entrances
use `--ntn-ease-out` with a 6px rise and a fade (`ntn-rise`). Nothing bounces, nothing
overshoots, nothing spins except spinners. Under `prefers-reduced-motion` nothing travels:
entrances fade in place, hover lifts stay put, the sidebar rail and phone drawer change at once,
and the indeterminate bar pulses instead of sweeping. Fades and spinners remain.

## States

Hover washes the surface +4% white and brightens the border one step. Press adds +6% and the button
gives to 97% (`scale(.97)`, none under reduced motion). Control faces (buttons, fields, selects,
toggle groups) are bevelled: a lit top inside the border, a dark ring outside it and
a short drop (`--ntn-shadow-bevel`; a plain `--ntn-shadow-xs` in light mode). Focus-visible is a 3px violet ring drawn as an outline (`--ntn-focus-outline`), so a
control's own shadow never hides it and it survives forced-colours mode. Field-style controls
(field, select, combobox, date trigger, tree row) instead switch the border to `--ntn-accent-500`
and add the same ring as a halo (`--ntn-ring-focus`). Disabled is 45% opacity
(`--ntn-disabled-opacity`) plus `not-allowed` on every control, and a disabled control ignores
hover. Rows and nav items follow the same rules as buttons.

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
  to two digits (`+14.06%`, `-09.12%`); magnitudes abbreviated lowercase (`82k`, `2.19m`). All in JetBrains Mono.
- **No emoji.** Not in UI, not in copy, not as icons.
