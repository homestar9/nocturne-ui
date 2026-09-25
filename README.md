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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@homestar9/nocturne-ui@1.5.0/dist/nocturne.css">
```

```bash
curl -O https://cdn.jsdelivr.net/npm/@homestar9/nocturne-ui@1.5.0/dist/nocturne.css
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

**Your app owns light/dark?** Tell Nocturne to stay out of it:

```html
<html data-theme="dark" data-ntn-theme-control="manual">
```

Nocturne then never reads or writes `data-theme` or its `ntn-theme` storage key, adds no OS
listener, and ignores its own theme controls. The CSS still follows `data-theme`, which your code
sets. `setTheme()` and `toggleTheme()` still work if you call them. Put the attribute in the
server-rendered HTML: `nocturne.js` starts itself as soon as it is imported and reads it then.

## Accent

Accent is the only channel a product may override, and it applies to both themes. Load a theme
after the stylesheet:

```js
import '@homestar9/nocturne-ui';
import '@homestar9/nocturne-ui/themes/emerald.css';
```

Or write your own: copy `themes/emerald.css` and change the hexes. A brand theme sets only the
accent ramp (`--ntn-accent-100` to `-900`) and the ink that sits on it (`--ntn-accent-fg`). Every
accent tint (soft fills, hairlines, glow, focus ring) derives from the ramp. Two details:

- **Light mode:** it darkens the stops used as text (100–400). Declare yours in a
  `:root[data-theme="light"]` block, as emerald does, so they win whatever the load order.
- **Dark ink:** if your accent needs dark ink, point the checkbox art at it too:
  `--ntn-check-mark: var(--ntn-check-mark-ink); --ntn-check-dash: var(--ntn-check-dash-ink);`

Neutrals, semantics, spacing, and type are shared across every product and are not forkable.

### Glass hooks

Nocturne's cards are opaque. An app that uses the kit as the base of a different look (a frosted
"glass" skin, say) can blur what sits behind its surfaces with two tokens. Both default to `none`,
which costs nothing:

| Token | Read by |
| --- | --- |
| `--ntn-surface-filter` | `ntn-card`, `ntn-sidebar` |
| `--ntn-pop-filter` | `ntn-modal`, `ntn-menu`, `ntn-popover`, the date-range panel, tooltip bubbles |

Pair them with translucent surface colours, or the blur has nothing to show through:

```css
:root {
  --ntn-surface-1: rgb(20 22 30 / 0.6);
  --ntn-surface-filter: blur(16px) saturate(1.3);
  --ntn-pop-filter: blur(24px);
}
```

Any value other than `none` makes the element a containing block for `position: fixed`
descendants, and a nested blurred element only blurs its blurred ancestor. The top bar already
blurs, via `--ntn-blur-panel`.

## Namespace and prefix

Everything Nocturne defines lives in one namespace, `ntn`: classes (`.ntn-card`), design tokens
(`--ntn-accent`, `--ntn-surface-1`), behaviour hooks (`data-ntn-open`), events (`ntn:tabchange`),
the theme storage key and keyframe names. Nothing collides with your own CSS or another library.

An app that wants its **own** class names can rebuild Nocturne under a different prefix. Every
identifier is renamed together, so the output is the same stylesheet and script with a new
namespace:

```bash
npx nocturne-build --prefix app --out vendor/nocturne     # .app-card, --app-accent, data-app-open, app:tabchange
```

```js
import { build } from '@homestar9/nocturne-ui/build';
await build({ prefix: 'app', outDir: 'vendor/nocturne' });  // nocturne.css, tokens.css, nocturne.js, themes/
```

A prefix is lowercase letters and digits, starting with a letter, because `data-app-open` has to map
to `dataset.appOpen` in the script. This is how an app can own its markup vocabulary and still
swap in a different UI kit later: any kit that can be built to the same prefix and block names
drops in without touching a template.

**Keep the design tokens kit-named** with `--token-prefix` (`tokenPrefix` in Node). Classes, hooks
and events take your prefix, and tokens stay `--ntn-*`. Your own CSS can then map them onto a
contract of your own without mixing up the two:

```bash
npx nocturne-build --prefix app --token-prefix ntn --out vendor/nocturne   # .app-card, but var(--ntn-accent)
```

A few custom properties belong to the markup rather than the kit, and always take the class
prefix. These are the **state variables** the script writes (`--ntn-slider-pct` and
`--ntn-progress` on their blocks, and `--ntn-tab-x/-y/-w/-h` for the tab indicator), plus the
**knob** `--ntn-tree-indent` that you may set yourself. Any kit styling the same markup reads them.

### Icons the script draws

`nocturne.js` renders a few icons itself: chip remove, calendar arrows and the theme toggle. By
default they are Font Awesome Light. An app with its own icon system swaps the renderer. Keys are
`close`, `prev`, `next`, `theme-light` and `theme-dark`:

```js
import { configure, refresh } from '@homestar9/nocturne-ui/js';
configure({
  icon: (key) => {
    const i = document.createElement('i');
    i.className = 'app-icon';
    i.dataset.icon = key;
    return i;
  },
});
refresh();   // re-render anything drawn before configure()
```

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
npm test           # namespace checks: every token prefixed, every var() declared, prefix builds rename everything
open examples/kitchen-sink.html
```

Edit files in `src/`, never in `dist/`. `dist/` is regenerated (and tested) on `prepack`.
Always spell the namespace `ntn` in source — the prefix build renames exactly that spelling, so a
new class, token, hook or event written any other way would escape it.

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
