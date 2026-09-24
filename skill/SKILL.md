---
name: nocturne
description: Build UI with Nocturne, a dark-first SaaS design system. Use whenever adding or changing any interface in a project that depends on @homestar9/nocturne-ui — components, pages, states, copy. Contains the class reference, visual rules, and content voice.
user-invocable: true
---

# Nocturne

A dark-first interface system for data-dense SaaS: consoles, dashboards, admin tools, billing
and settings surfaces. Dark by default, neutral by construction, synthwave only at the edges.
Eleven cool greys carry the chrome; one violet accent channel carries every interactive signal.

**Read [`components.md`](components.md) before writing markup.** It is the class contract.
[`brand.md`](brand.md) holds the visual and voice rules. [`patterns.md`](patterns.md) holds
page-level recipes.

## The five rules

1. **One class per element, and it is always a BEM name.** `class="ntn-card__title"`, never
   `class="card-title text-lg bold"`. Block `ntn-x`, element `ntn-x__y`, modifier `ntn-x--z`.
   A modifier sits alongside its block (`ntn-btn ntn-btn--primary`) and is the only case where
   an element carries two classes.
2. **No inline styles. Ever.** No `style="…"`, no utility classes, no Tailwind, no CSS-in-JS.
   If a value is missing from the system, it is a gap in the system — add it to `src/` and
   version it, do not patch it at the call site.
3. **State is an attribute, not a class.** `disabled`, `aria-current="page"`,
   `aria-selected="true"`, `aria-sort`, `[open]`, `data-collapsed`, `data-invalid`,
   `data-loading`. Never `.is-active` or `--active` modifiers for state.
4. **Semantic children are styled by tag.** Inside `.ntn-table` the `th`/`td` need no classes;
   inside `.ntn-accordion__item` the `summary` needs none; icons are bare
   `<i class="fa-light fa-x">` and the parent block sizes them. This is what keeps the markup clean.
5. **Tokens only.** Every colour, size, radius, duration is a `var(--…)` defined in
   `src/tokens/`. Never a raw hex, never a magic pixel value. This is also what makes the
   light theme work: it remaps token values and nothing else. A hardcoded colour anywhere in a
   component is a bug — it will not flip.
6. **Never branch on theme.** No `[data-theme="light"]` selectors in product code, no
   `prefers-color-scheme` media queries, no light-only classes. If something reads wrong in
   one theme, the fix is a token value in `src/tokens/theme-light.css`, not a component rule.

## Quick orientation

- `dist/nocturne.css` is the only stylesheet to load. It contains tokens, reset, components.
- `js/nocturne.js` is optional. It powers tabs, `<dialog>` open/close, sidebar collapse,
  slider fill, alert dismissal, and table select-all via `data-ntn-*` attributes.
- Icons: Font Awesome **Light**. Never an emoji, never a hand-rolled SVG, never a second family.
- Accent is the only themeable channel. To rebrand, override `--accent-*` — never fork a component.
- Themes: `data-theme="dark"` (default), `"light"`, or `"auto"`. `nocturne.js` resolves `auto`,
  persists the choice, and drives any `[data-ntn-theme-toggle]` button.
- Sizes exist as modifiers (`--sm`, `--lg`); if a size is not offered, the design wants the default.

## When asked to build a screen

1. Pick the shell from `patterns.md` (sidebar console, centred page, settings list).
2. Compose from existing blocks. If a block does not exist, say so before inventing one — new
   blocks belong in `src/components/`, named and documented like the rest, in their own release.
3. Write the copy to `brand.md`'s voice: plain, factual, specific. Buttons are verbs. No emoji.
4. Check contrast and the 44px hit-target minimum on anything touch-reachable.
