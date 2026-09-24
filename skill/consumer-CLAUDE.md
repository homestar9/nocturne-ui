# Paste into the consuming project's CLAUDE.md

Copy the block below into `CLAUDE.md` at the root of any repo that installs
`@homestar9/nocturne-ui`. It is the only wiring Claude Code needs.

---

## Design system

This project's UI is built with **Nocturne** (`@homestar9/nocturne-ui`), a dark-first SaaS design
system. Before writing or changing any UI, read:

- `node_modules/@homestar9/nocturne-ui/skill/SKILL.md` — the rules
- `node_modules/@homestar9/nocturne-ui/skill/components.md` — the class reference
- `node_modules/@homestar9/nocturne-ui/skill/patterns.md` — page shells

Non-negotiable:

- One class per element, always a BEM name (`ntn-block__element ntn-block--modifier`).
- No inline styles, no utility classes, no CSS-in-JS, no Tailwind.
- State is an attribute (`disabled`, `aria-current`, `aria-selected`, `data-collapsed`,
  `data-invalid`), never a class.
- Every colour, size, radius, and duration is a `var(--…)` token from the package.
- Icons are Font Awesome Light as bare `<i class="fa-light fa-name">`.
- Light and dark come from `data-theme` on `<html>`. Never write a `[data-theme]` selector or a
  `prefers-color-scheme` query in product code — both themes are the same markup.
- If the system lacks something, say so — propose it as a change to the Nocturne package,
  do not work around it locally.

---

## Optional: mount it as a real skill

```bash
mkdir -p .claude/skills
ln -s ../../node_modules/@homestar9/nocturne-ui/skill .claude/skills/nocturne
```

Committing the symlink gives every developer on the repo the same skill, and it keeps tracking
whatever version of the package is installed.
