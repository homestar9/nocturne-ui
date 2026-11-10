/* Example page only: the Code view. Each section's head gets a Code button that shows the markup of
   the examples in it. Mark an example's root with data-sink-example="Label" (empty for no label);
   elements in one section that share a label are shown as one snippet.

   This is a classic script loaded at the end of <body>, so it runs before the deferred nocturne.js
   module and copies the markup as written: no chips, calendar cells or tab ink. sink__* classes and
   data-sink-* attributes are page chrome, and are cut from every snippet. Not part of the library.

   Code that isn't markup on the page goes in a hidden textarea, which holds raw text:
   <textarea hidden data-sink-source="Label" data-sink-lang="html|js|sh">…</textarea>. It joins
   the Code panel, or, with data-sink-inline, is shown where it stands. data-sink-ref="slug" on a
   section adds a Reference link to that heading of skill/components.md. */
(function () {
  'use strict';

  const SINK = /^sink__/;
  const REFERENCE = 'https://github.com/homestar9/nocturne-ui/blob/master/skill/components.md';

  /** The markup of one example root, as an author would write it. */
  function snippet(root) {
    const clone = root.cloneNode(true);
    for (const el of [clone, ...clone.querySelectorAll('*')]) {
      for (const name of el.getAttributeNames()) if (name.startsWith('data-sink')) el.removeAttribute(name);
      if (!el.classList.length) continue;
      const own = [...el.classList].filter((c) => !SINK.test(c));
      if (!own.length && el !== clone) {
        // A chrome-only element (a label, a readout): drop it and the indent before it.
        const prev = el.previousSibling;
        if (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev.remove();
        el.remove();
      } else if (own.length) el.className = own.join(' ');
      else el.removeAttribute('class');
    }
    // The serializer writes boolean attributes as attr=""; HTML reads a bare attr the same way.
    const html = clone.outerHTML.replace(/ ([\w:.-]+)=""(?=[\s/>])/g, ' $1');
    const lines = html.split('\n');
    const indents = lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const cut = indents.length ? Math.min(...indents) : 0;
    return lines.map((l, i) => (i ? l.slice(cut) : l)).join('\n').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  }

  /** Append text to a node, wrapped in a token span when a class is given. Text only, never HTML. */
  function put(parent, text, cls) {
    if (!text) return;
    if (!cls) { parent.append(text); return; }
    const span = document.createElement('span');
    span.className = 'sink__tok-' + cls;
    span.textContent = text;
    parent.append(span);
  }

  /** Colour HTML source: comments, tag names, attribute names and values. */
  function highlight(code, source) {
    const TAG = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g;
    const ATTR = /(\s+)([^\s=/>]+)(?:(=)("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let at = 0;
    for (const m of source.matchAll(TAG)) {
      put(code, source.slice(at, m.index));
      at = m.index + m[0].length;
      if (m[0].startsWith('<!--')) { put(code, m[0], 'comment'); continue; }
      const head = m[0].match(/^<\/?[\w-]+/)[0];
      put(code, head, 'tag');
      let rest = m[0].slice(head.length, -1);
      const close = rest.endsWith('/') ? '/>' : '>';
      if (close === '/>') rest = rest.slice(0, -1);
      let last = 0;
      for (const a of rest.matchAll(ATTR)) {
        put(code, rest.slice(last, a.index));
        last = a.index + a[0].length;
        put(code, a[1]);
        put(code, a[2], 'attr');
        if (a[3]) { put(code, '='); put(code, a[4], 'value'); }
      }
      put(code, rest.slice(last));
      put(code, close, 'tag');
    }
    put(code, source.slice(at));
  }

  function icon(name) {
    const i = document.createElement('i');
    i.className = 'fa-light ' + name;
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  const live = document.createElement('p');
  live.className = 'sink__sr';
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);

  async function copy(button, pre) {
    const text = pre.textContent;
    let done = false;
    try { await navigator.clipboard.writeText(text); done = true; } catch (e) { /* not a secure context */ }
    if (!done) {
      // Leave the code selected, so Ctrl+C finishes the job.
      const range = document.createRange();
      range.selectNodeContents(pre);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    live.textContent = done ? 'Copied' : 'Code selected; press Ctrl+C to copy';
    const i = button.querySelector('i');
    i.className = 'fa-light ' + (done ? 'fa-check' : 'fa-i-cursor');
    clearTimeout(button._sinkTimer);
    button._sinkTimer = setTimeout(() => { i.className = 'fa-light fa-copy'; live.textContent = ''; }, 1500);
  }

  const panels = [];
  const allToggle = document.getElementById('code-toggle');
  const syncAll = () => allToggle && allToggle.setAttribute('aria-pressed', String(panels.every((p) => !p.hidden)));

  function setOpen(button, panel, open) {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  /** The text of a verbatim source (a hidden textarea), dedented. */
  function source(area) {
    const lines = area.value.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
    const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const cut = indents.length ? Math.min(...indents) : 0;
    return lines.map((l) => l.slice(cut)).join('\n');
  }

  /** One labelled snippet: a head with a copy button over the code. Only HTML is coloured. */
  function snippetBlock(label, text, lang) {
    const block = document.createElement('div');
    block.className = 'sink__snippet';
    const head = document.createElement('div');
    head.className = 'sink__snippet-head';
    const name = document.createElement('span');
    name.className = 'sink__label';
    name.textContent = label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ntn-icon-btn ntn-icon-btn--sm';
    btn.setAttribute('aria-label', label ? 'Copy code: ' + label : 'Copy code');
    btn.append(icon('fa-copy'));
    head.append(name, btn);
    const pre = document.createElement('pre');
    pre.className = 'sink__pre';
    pre.tabIndex = 0;
    const code = document.createElement('code');
    if (lang === 'html') highlight(code, text);
    else code.textContent = text;
    pre.append(code);
    btn.addEventListener('click', () => copy(btn, pre));
    block.append(head, pre);
    return block;
  }

  for (const section of document.querySelectorAll('.sink')) {
    // A section's reference: its heading in skill/components.md.
    if (section.dataset.sinkRef) {
      const ref = document.createElement('a');
      ref.className = 'ntn-btn ntn-btn--sm ntn-btn--subtle';
      ref.href = REFERENCE + '#' + section.dataset.sinkRef;
      ref.append(icon('fa-book'), 'Reference');
      section.querySelector('.sink__head').append(ref);
    }

    const groups = new Map();
    const add = (label, text, lang) => {
      if (!groups.has(label)) groups.set(label, { lang, parts: [] });
      groups.get(label).parts.push(text);
    };
    // Verbatim sources first: code that isn't markup on the page (a starter page, a script call).
    // An inline one is shown where it stands; the rest lead the Code panel.
    for (const area of section.querySelectorAll('textarea[data-sink-source]')) {
      const lang = area.dataset.sinkLang || 'html';
      if (area.hasAttribute('data-sink-inline')) area.replaceWith(snippetBlock(area.dataset.sinkSource, source(area), lang));
      else add(area.dataset.sinkSource, source(area), lang);
    }
    for (const root of section.querySelectorAll('[data-sink-example]')) {
      // An example nested in another example belongs to the outer one.
      if (root.parentElement.closest('[data-sink-example]')) continue;
      add(root.dataset.sinkExample, snippet(root), 'html');
    }
    if (!groups.size) continue;

    const panel = document.createElement('div');
    panel.className = 'sink__codeview';
    panel.id = section.id + '-code';
    panel.hidden = true;
    for (const [label, { lang, parts }] of groups) panel.append(snippetBlock(label, parts.join('\n\n'), lang));
    section.append(panel);
    panels.push(panel);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ntn-btn ntn-btn--sm ntn-btn--subtle sink__codetoggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panel.id);
    toggle.append(icon('fa-code'), 'Code');
    toggle.addEventListener('click', () => { setOpen(toggle, panel, panel.hidden); syncAll(); });
    section.querySelector('.sink__head').append(toggle);
  }

  if (allToggle) {
    allToggle.addEventListener('click', () => {
      const open = allToggle.getAttribute('aria-pressed') !== 'true';
      for (const panel of panels) {
        setOpen(document.querySelector(`[aria-controls="${panel.id}"]`), panel, open);
      }
      syncAll();
    });
  }
})();
