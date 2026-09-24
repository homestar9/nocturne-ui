# Nocturne page patterns

Three shells cover nearly every screen in a Nocturne product. Start from one; do not invent a
fourth without asking.

## 1. Console (sidebar + sticky top bar)

The default for any signed-in screen. 244px sidebar, 56px top bar, 24px gutters, 14px gaps,
1360px content max.

```html
<div class="ntn-app">
  <aside class="ntn-sidebar">…</aside>
  <div class="ntn-app__main">
    <header class="ntn-navbar">…</header>
    <div class="ntn-app__scroll">
      <main class="ntn-page">…</main>
    </div>
  </div>
</div>
```

Rules of the shell:

- The sidebar owns product navigation; the top bar owns search, notifications, and the account.
- Never put primary navigation in both.
- The page header (`ntn-page__head`) carries the H1 and the page's own actions — one primary
  button at most.
- Collapse to the rail with `data-ntn-toggle=".ntn-sidebar"` on a top-bar icon button.

## 2. Dashboard body

A row of stats, then a 1.9 / 1 split, then a 1 / 1.9 split. This rhythm is what makes a Nocturne
dashboard recognisable.

```html
<main class="ntn-page">
  <div class="ntn-page__head">…</div>
  <div class="ntn-grid ntn-grid--4">
    <div class="ntn-stat">…</div>  <!-- ×4 -->
  </div>
  <div class="ntn-grid ntn-grid--split">
    <section class="ntn-card">…chart…</section>
    <section class="ntn-card">…list…</section>
  </div>
  <div class="ntn-grid ntn-grid--split-reverse">
    <section class="ntn-card">…activity…</section>
    <section class="ntn-card ntn-card--flush">…table…</section>
  </div>
</main>
```

The dashboard is the only screen that greets the user, once: "Welcome back, Michael" as the page
title with "Last updated 30 sec ago" as the subtitle.

## 3. Table page

Filters above, table inside a flush card, pagination in the card footer. Never paginate outside
the card.

```html
<main class="ntn-page">
  <div class="ntn-page__head">…</div>
  <div class="ntn-row ntn-row--between">
    <div class="ntn-row">
      <div class="ntn-search ntn-search--sm">…</div>
      <label class="ntn-select ntn-select--sm">…</label>
    </div>
    <button class="ntn-btn ntn-btn--primary ntn-btn--sm"><i class="fa-light fa-plus"></i>Add member</button>
  </div>
  <section class="ntn-card ntn-card--flush">
    <div class="ntn-table">…</div>
    <footer class="ntn-card__foot"><div class="ntn-pager">…</div></footer>
  </section>
</main>
```

## 4. Settings page

Tabs across the top, then stacked cards — one card per concern, each with a title, a subtitle,
and its own save action in the card footer. Never one giant form with a single save button at
the bottom of the page.

```html
<main class="ntn-page">
  <div class="ntn-page__head">…</div>
  <div class="ntn-tabs" role="tablist">…</div>
  <section class="ntn-card">
    <header class="ntn-card__head">
      <div>
        <h3 class="ntn-card__title">Workspace</h3>
        <p class="ntn-card__sub">Name and region for this workspace.</p>
      </div>
    </header>
    <div class="ntn-card__body ntn-stack">
      <label class="ntn-field">…</label>
      <label class="ntn-select">…</label>
    </div>
    <footer class="ntn-card__foot ntn-row ntn-row--end">
      <button class="ntn-btn ntn-btn--primary ntn-btn--sm">Save changes</button>
    </footer>
  </section>
</main>
```

## Empty, loading, error

- **Empty:** `ntn-empty` with a Light icon, a one-line title, a one-line explanation, and at
  most one action. "No invoices yet." not "Oops, nothing here!"
- **Loading:** skeleton nothing. Show `ntn-loading` with a verb — "Loading invoices" — or an
  indeterminate `ntn-progress` at the top of the card being filled.
- **Error:** `ntn-alert ntn-alert--danger` inside the card that failed, never a page-level
  takeover. Name what failed and what the user can do.

## Density

Comfortable is the default. Use `ntn-table--compact` only when a screen's job is scanning more
than 25 rows at a time. Never mix densities on one page.
