# @homestar9/nocturne-ui

Nocturne is a dark-first design system for data-dense SaaS interfaces. This package ships it
as three layers that version together:

| Layer | What it is | Who consumes it |
| --- | --- | --- |
| **CSS** | `dist/nocturne.css` — tokens, reset, and BEM component classes | any stack, no build step |
| **JS** | `js/nocturne.js` — optional, dependency-free behaviours | apps that want tabs/dialogs/sliders working out of the box |
| **Skill** | `skill/` — the design rules, written for an agent | Claude Code, in every repo that installs the package |

Nothing here is framework-specific. There is no React dependency, no build pipeline, no
CSS-in-JS. Plain HTML gets the same result as Svelte, Vue, Rails, Django, or Next.

---

## Install

```bash
npm install @homestar9/nocturne-ui
```

No bundler? Load it from a CDN, or vendor the one file — `dist/nocturne.css` is self-contained:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@homestar9/nocturne-ui@1.4.0/dist/nocturne.css">
```

```bash
curl -O https://cdn.jsdelivr.net/npm/@homestar9/nocturne-ui@1.4.0/dist/nocturne.css
```

## Use

```html
<link rel="stylesheet" href="/node_modules/@homestar9/nocturne-ui/dist/nocturne.css">
<script type="module" src="/node_modules/@homestar9/nocturne-ui/js/nocturne.js"></script>
```

Or from a bundler entry point:

```js
import '@homestar9/nocturne-ui';        // full stylesheet
import '@homestar9/nocturne-ui/js';     // optional behaviours
```

Tokens without the reset or the components: `import '@homestar9/nocturne-ui/tokens'`.

Icons are **Font Awesome**, Light weight — Nocturne does not bundle them. Load your kit before
the stylesheet and write icons as bare `<i>` elements; components size them.

```html
<script src="https://kit.fontawesome.com/YOURKIT.js" crossorigin="anonymous"></script>
```

The Light weight is part of **Font Awesome Pro**. Without Pro, load Font Awesome Free and map
`fa-light` onto the Solid faces — `examples/kitchen-sink.html` shows the shim. Everything works;
icons are just heavier.

## Write markup

One class per element, always a BEM name, state in attributes:

```html
<article class="ntn-card">
  <header class="ntn-card__head">
    <div>
      <h3 class="ntn-card__title">Monthly spend</h3>
      <p class="ntn-card__sub">Billing period to date</p>
    </div>
    <button class="ntn-btn ntn-btn--sm"><i class="fa-light fa-download"></i>Export CSV</button>
  </header>
  <div class="ntn-card__body">…</div>
</article>
```

The full class reference lives in [`skill/components.md`](skill/components.md) — it is written
for both humans and agents.

## Light and dark

Dark is the default. The light theme is a token remap in the same stylesheet — no second CSS
file to load, no component overrides. Set `data-theme` on `<html>`:

```html
<html data-theme="dark">   <!-- "light", or "auto" to follow the OS -->
```

`nocturne.js` resolves `auto`, persists the choice in `localStorage` under `ntn-theme`, and
wires any button carrying `data-ntn-theme-toggle`. To avoid a dark flash for light users, paint
the stored value before the first paint:

```html
<script>try{var p=localStorage.getItem('ntn-theme')||'dark';document.documentElement.setAttribute('data-theme',p==='auto'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p)}catch(e){}</script>
```

Programmatically:

```js
import { setTheme, toggleTheme, getTheme } from '@homestar9/nocturne-ui/js';
setTheme('auto');          // 'dark' | 'light' | 'auto'
document.addEventListener('ntn:themechange', (e) => console.log(e.detail.theme));
```

`data-theme` also works on a subtree, so a light panel can sit inside a dark app.

## Accent

Accent is the only channel a product may override, and it applies to both themes. Load a theme
after the stylesheet:

```js
import '@homestar9/nocturne-ui';
import '@homestar9/nocturne-ui/themes/emerald.css';
```

Or write your own eleven lines — copy `themes/emerald.css` and change the hexes. Neutrals,
semantics, spacing, and type are shared across every product and are not forkable.

## Claude Code

The package carries its own skill. In a consuming repo, add this to `CLAUDE.md`:

```md
## Design system
This project's UI is built with Nocturne (@homestar9/nocturne-ui).
Before writing or changing any UI, read:
- node_modules/@homestar9/nocturne-ui/skill/SKILL.md
- node_modules/@homestar9/nocturne-ui/skill/components.md
Never invent colors, spacing, or component markup outside that reference.
```

Prefer it as a first-class skill? Symlink it once:

```bash
mkdir -p .claude/skills
ln -s ../../node_modules/@homestar9/nocturne-ui/skill .claude/skills/nocturne
```

Because the skill ships inside the package, `npm update @homestar9/nocturne-ui` updates the rules
and the CSS in the same commit — the agent can never be briefed on a version you aren't running.

## Develop

```bash
npm run build      # flattens src/ into dist/ — no dependencies
open examples/kitchen-sink.html
```

Edit files in `src/`, never in `dist/`. `dist/` is regenerated on `prepack`.

## Release

```bash
npm version minor          # bump + tag
npm run build
npm publish                # → npmjs.com (public)
git push --follow-tags
```

Semver is the contract: **patch** for fixes, **minor** for new components or tokens, **major**
for any renamed or removed class or token. Record every change in `CHANGELOG.md` — consuming
agents read it to know what moved.

## Layout

```
dist/            built CSS — what apps load
src/             authored CSS: tokens/ + components/
js/              optional behaviours
themes/          accent overrides
skill/           Claude Code skill: rules, component reference, patterns
examples/        kitchen sink — every block, inside the console shell
scripts/build.mjs
```

## License

[MIT](LICENSE)
