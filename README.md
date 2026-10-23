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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@homestar9/nocturne-ui@1.12.1/dist/nocturne.css">
```

```bash
curl -O https://cdn.jsdelivr.net/npm/@homestar9/nocturne-ui@1.12.1/dist/nocturne.css
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

**Cascade layers.** The stylesheet is unlayered, so it sits in the cascade like any other CSS:
specificity and order decide. If your app organises its CSS in `@layer`s, put Nocturne in one
when you import it. Then any rule of yours in a later layer, or outside layers, wins without
fighting Nocturne's selectors:

```css
@layer reset, ntn, app;
@import url("/node_modules/@homestar9/nocturne-ui/dist/nocturne.css") layer(ntn);
```

Nocturne doesn't layer itself. Unlayered CSS beats every layer, so an app with an unlayered reset
(`button { border: 0; background: none }`, Tailwind's preflight, normalize) would silently
restyle every Nocturne control. Opting in at the import keeps that choice with the app.

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

`data-theme` also works on a subtree, so a light panel can sit inside a dark app, or a dark one
inside a light app. The subtree looks exactly as it would on a page of that mode. If you override
a mode-dependent token (a surface, text or border colour, a shadow), write it for
`:root, [data-theme]` too, or a subtree falls back to Nocturne's value.

**Your app owns light/dark?** Tell Nocturne to stay out of it:

```html
<html data-theme="dark" data-ntn-theme-control="manual">
```

Nocturne then never reads or writes `data-theme` or its `ntn-theme` storage key, adds no OS
listener, and ignores its own theme controls. The CSS still follows `data-theme`, which your code
sets. `setTheme()` and `toggleTheme()` still work if you call them. Put the attribute in the
server-rendered HTML: `nocturne.js` starts itself as soon as it is imported and reads it then.

## Density

Comfortable is the default. For a denser app, set `data-density` on `<html>`:

```html
<html data-theme="dark" data-density="compact">   <!-- or "comfortable", the default -->
```

Compact tightens control heights (34px buttons become 28px), the vertical padding of table rows,
menu items, tabs and callouts, the card gutter, and the field and layout gaps. Type, radii and
widths stay the same, and `--sm`/`--lg` stay relative to the new base. It is CSS only: no script,
no storage key. If your users choose, store their choice yourself and print the attribute on the
server, as with `data-theme`.

Like `data-theme`, it works on a subtree. A dense data region can sit in a roomy app, and
`data-density="comfortable"` resets a region inside a compact one:

```html
<div class="ntn-table" data-density="compact">…</div>
```

A menu or popover follows the region it opens from. A toast mounts on `<body>`, so it follows the
page.

Two rules keep it accessible:
- **24px floor.** No control, and no size derived from one, goes below `--ntn-target-min` (24px,
  WCAG 2.2 target size).
- **Touch.** On a touch screen (`pointer: coarse`) compact keeps comfortable control heights;
  rows and surfaces still tighten.

The tokens it sets are listed in [`skill/components.md`](skill/components.md#density). They are
spacing, which products share rather than fork (see Accent below): read them in a custom block so
it follows density, but don't set them. A `:root` override would also beat compact on `<html>`
(same specificity, later rule), and a theme scoped more tightly than `[data-density]` would pin
one value for every density.

## Accent

Accent is the main channel a product may override, and it applies to both themes. Violet is the
default. Four more ship in `themes/`:
- `emerald.css`.
- `amber.css`, a warm gold. Amber also swaps the blue-leaning greys for warmer ones: near-neutral
  graphite in dark mode, warm paper with slate text in light mode.
- `mono.css`, which turns everything grey except the status tones. The accent is near white in
  dark mode and near black in light mode, so an app can add its own brand colour on top without
  it fighting a theme hue.
- `synthwave.css`, Miami Vice after dark: a hot pink accent, Miami teal for the second chart
  series and the edge lights, night-purple greys (pastel pink paper in light mode), hotter glows,
  and a sunset as the `--ntn-ambient-image` behind `ntn-ambient`. Turn the sunset off with
  `--ntn-ambient-image: none`.

Load one after the stylesheet:

```js
import '@homestar9/nocturne-ui';
import '@homestar9/nocturne-ui/themes/amber.css';
```

The kitchen sink (`examples/kitchen-sink.html`) has an accent picker in its top bar for comparing
them. Amber sits close to the warning hue, so keep main actions on `ntn-btn--primary` and use the
`--warning` tone only for real cautions.

Or write your own: copy `themes/emerald.css` and change the hexes. A brand theme needs only the
accent ramp (`--ntn-accent-100` to `-900`) and the ink that sits on it (`--ntn-accent-fg`). Every
accent tint (soft fills, hairlines, glow, focus ring) and the gradient on filled buttons derives
from the ramp. Three details:

- **Light mode:** it darkens the stops used as text (100–400). Declare yours in a
  `:root[data-theme="light"], :root [data-theme="light"]` block, and your dark ramp in
  `:root, :root [data-theme="dark"]`, as emerald does. The light stops then win whatever the
  load order, and the brand follows into `data-theme` subtrees.
- **Dark ink:** if your accent needs dark ink, point the checkbox art at it too:
  `--ntn-check-mark: var(--ntn-check-mark-ink); --ntn-check-dash: var(--ntn-check-dash-ink);`
  If the ink flips between modes, set `--ntn-accent-fg` and the checkbox art in each block. Use
  the `-white` pair where the ink is white, and also set 500–900 in the light block when the fill
  itself changes, as `mono.css` does.
- **Greys (optional):** a theme may also retint the neutral ramp (`--ntn-n-0` to `-900`) and the
  surfaces and borders the light theme sets outright, as `amber.css` does. Set every one you
  change in both blocks, or the dark value leaks into light mode. Check text contrast:
  `--ntn-n-600` is also `--ntn-text-disabled`, which labels and placeholders use.

Semantics, spacing, and type are shared across every product and are not forkable.

### Glass surfaces

For a page that sits over artwork or a gradient, two opt-in classes:

- **`ntn-glass`** makes a `ntn-card`, `ntn-stat`, `ntn-accordion` or `ntn-sidebar` translucent
  and blurred, with a lit top edge. Put it on the surface itself, or on any wrapper (up to
  `.ntn-app`) to glaze every surface inside. Controls, menus and modals stay solid. Add
  **`ntn-glass--flat`** to drop the lit top edge: it looks cleaner over the plain glow, while the
  edge helps surfaces stand off a photo.
- **`ntn-ambient`**, the first child of `.ntn-app`, is the backdrop: a static accent glow behind
  the top of the page that fades into the canvas. Add your own artwork one of two ways:
  - `--ntn-background-image` draws it at full strength, filling the app. Best when the content
    on it is all glass.
  - `--ntn-ambient-image` draws it as atmosphere: dimmed by `--ntn-ambient-opacity` and faded out
    over `--ntn-ambient-size`. Best when headings and other text sit straight on the backdrop.

  It also works inside a single panel, such as a hero: give the panel `position: relative;
  isolation: isolate; overflow: hidden` so the backdrop stays inside it.

  To build your own ambient effect:
  - **Placement.** The glow and the ambient image sit in a band across the top. `--bottom`,
    `--left` and `--right` move the band to that edge. `--top-left`, `--top-right`,
    `--bottom-left` and `--bottom-right` make it a square in that corner. `--center` makes it a
    spotlight. `--ntn-background-image` anchors to the same side.
  - **Colour.** The glow is `--ntn-ambient-glow`, which defaults to the accent, so it follows the
    theme. The tones `--success`, `--warning`, `--danger`, `--info` and `--neutral` tint it, or
    you can set the token to any translucent colour.
  - **Layers.** Stack several ambients for several lights. Only the first draws
    `--ntn-background-image`.

```html
<div class="ntn-app ntn-glass">
  <div class="ntn-ambient"></div>
  …
</div>

<!-- Two lights: the accent top left, info bottom right -->
<div class="ntn-app ntn-glass">
  <div class="ntn-ambient ntn-ambient--top-left"></div>
  <div class="ntn-ambient ntn-ambient--bottom-right ntn-ambient--info"></div>
  …
</div>
```

```css
:root { --ntn-background-image: url(/img/backdrop.avif); }   /* full strength */
:root { --ntn-ambient-image: url(/img/backdrop.avif); }      /* dimmed, fading */
:root { --ntn-ambient-glow: rgb(255 120 60 / 0.35); }        /* any glow colour */
```

Use a root-relative or absolute URL. Browsers disagree on whether a relative `url()` in a custom
property resolves against your stylesheet or against `nocturne.css`. Glass keeps text readable
even over a full-strength photo; the kitchen sink shows all three backdrops.

The rules match the specificity of the components they restyle and come right after them, so
glass beats the base background without `!important`, and state modifiers (an interactive card's
hover, `ntn-edge--glow`, `--processing`) still win. Glass turns solid under
`prefers-reduced-transparency` and for the phone sidebar drawer. Tune it with the `--ntn-glass-*`
and `--ntn-ambient-*` tokens; `themes/amber.css` sets DeployBot's light-mode glass. The droplet button in
the kitchen sink's top bar turns both on.

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

The build renames the compiled stylesheets the package ships in `dist/`, so it needs no Sass and
no other dependency.

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
npm run build      # compiles src/*.scss into dist/ (Sass, a devDependency)
npm run watch      # the same, again on every change under src/
npm test           # compiles src/ fresh, then: every token prefixed, every var() declared, prefix builds
                   # rename everything, and the committed dist/ matches src/
npm run sink       # serves the repo and prints the kitchen sink URL
```

Open the kitchen sink through `npm run sink`, not by double-clicking the file. Browsers block
module scripts on `file://` pages, so `nocturne.js` never loads there: the CSS renders, but the
theme toggle, tabs, dialogs and dropdowns do nothing. It loads `dist/`, so keep `npm run watch`
running while you edit.

Each kitchen-sink section has a **Code** button that shows the markup of its examples, with a
Copy button per snippet; the code button in the top bar opens every section at once. Code is off
on every load. `examples/sink-code.js` reads the snippets from the page's own markup before
`nocturne.js` runs, so they always match the demos. To add one, put `data-sink-example="Label"`
on the element a developer would copy (an empty label is fine for a section's only example).
Elements in one section with the same label show as one snippet. Page chrome is named `sink__*`
and never appears in a snippet; nor do `data-sink-*` attributes.

Edit files in `src/`, never in `dist/`. Commit the rebuilt `dist/` with the source change: the
tests fail when the two disagree. Always spell the namespace `ntn` in source — the prefix build
renames exactly that spelling, so a new class, token, hook or event written any other way would
escape it. Sass-only names (`$variables`, mixins, functions) never reach the CSS and need no prefix.

### Authoring SCSS

- **Tokens stay custom properties.** `src/tokens/` declares `--ntn-*` properties, never Sass
  variables, because themes and apps override them at runtime.
- **One block per partial.** Nest elements, modifiers and states under the block (`&__item`,
  `&--sm`, `&:hover`), and keep a block's rules in cascade order. Never let a nested rule jump past
  another block's rule that it has to beat or lose to.
- **Shared declarations are mixins** in `src/abstracts/`: control and popover surfaces,
  `focus-accent`, `invalid`, `field-label`, `caps-label`, `truncate`, `visually-hidden` and more.
  `tr(color)` writes one transition entry on the motion tokens. Never `@extend`: it merges unrelated
  blocks into one selector list.
- **Tones and breakpoints are maps.** Loop over `$statuses` / `tone($name, $part)` for tone
  modifiers. Media queries use `@include below(md)` / `above(md)`, because a media query can't read
  a custom property.
- **Comments:** `/* */` comments ship in `dist/` and explain the CSS to whoever reads it there;
  `//` comments are for Sass authors. Put a `/* */` comment inside the rule it describes. Sass
  turns one that sits between nested rules into an empty rule.
- The order of the `@use` list in `src/nocturne.scss` is the cascade order.

## Release

The repo follows gitflow: features branch from `develop` as `feature/*`, releases go out through
a `release/X.Y.Z` branch that merges into both `master` and `develop`, and `master` only ever
holds published versions. The git-flow CLI is not required; these are the plain-git equivalents
of `git flow release start` and `finish`.

```bash
git checkout -b release/X.Y.Z develop
npm version minor --no-git-tag-version       # bump package.json and the lockfile only
npm run build                                # dist/ banners carry the new version
npm test
git commit -am "Release X.Y.Z"               # CHANGELOG [Unreleased] → X.Y.Z — date; README CDN links
git checkout master
git merge --no-ff release/X.Y.Z
git tag -a vX.Y.Z -m X.Y.Z
git checkout develop
git merge --no-ff release/X.Y.Z
git branch -d release/X.Y.Z
git checkout master
git push --atomic origin master develop vX.Y.Z   # the tag push publishes (see below)
```

**Publishing is the tag push.** `.github/workflows/publish.yml` runs on any `v*` tag and
publishes through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers):
- GitHub's OIDC token replaces an npm token, so there is no `npm login` and no 2FA prompt.
- npm attaches provenance.
- The job checks that the tag matches `package.json` and is on `master`.
- `prepack` rebuilds `dist/` and runs `npm test` before anything is uploaded.

Watch it under the repo's Actions tab. If it fails, fix the cause, then delete and re-push the
tag:

```bash
git push origin :refs/tags/vX.Y.Z
git push origin vX.Y.Z
```

The trusted publisher is set on npmjs.com under the package's Settings → Trusted Publisher:
- GitHub Actions, user `homestar9`, repository `nocturne-ui`, workflow `publish.yml`.
- `repository.url` in `package.json` must keep naming this repo.

A manual `npm publish` (after `npm login`) still works as a fallback, unless publishing access is
set to disallow tokens. Without a valid session it fails with a misleading
`404 Not Found - PUT …/@homestar9%2fnocturne-ui`, not an auth error.

Bump before building: the
`dist/` banners read the version from `package.json`, so building first commits a `dist/` that
names the previous version. `prepack` rebuilds anyway, so a stale `dist/` is published fresh but
left uncommitted. Merge with `--no-ff` even when master could fast-forward, so every release is
one merge commit on `master`. Tag with `-a`, and push the tag by name with `--atomic`, so the branches and the tag land
together and the job finds the tag already on `master`. Update
the CDN links under Install to the new version. A version that was tagged but never published
keeps its CHANGELOG heading with an `(unpublished)` suffix, and its tag is deleted before it is
pushed.

Hotfixes branch from `master` as `hotfix/X.Y.Z`, bump **patch**, and finish the same way: merge
into `master`, tag, merge into `develop`.

Semver is the contract: **patch** for fixes, **minor** for new components or tokens, **major**
for any renamed or removed class or token. Record every change in `CHANGELOG.md` — consuming
agents read it to know what moved.

## Layout

```
dist/            compiled CSS — what apps load
src/             authored SCSS: nocturne.scss and tokens.scss (entries), tokens/, base/,
                 components/, abstracts/ (mixins, tones, breakpoints; no CSS of their own)
js/              optional behaviours
themes/          accent overrides (plain CSS)
skill/           Claude Code skill: rules, component reference, patterns
examples/        kitchen sink — every block, inside the console shell
scripts/         compile.mjs (src → dist), build.mjs (prefix build, shipped), tests
```

## License

[MIT](LICENSE)
