# Super Search Builder — Stage 1.1

**Live website:** https://markbeachill.github.io/supersearch-builder
**GitHub repository:** https://github.com/markbeachill/supersearch-builder

A static GitHub Pages website for building standalone **Super Search** pages aimed at
research. A Super Search page takes a single typed query and fans it out into many
searches — one per site, database or engine — each opening that site's own results for
your query.

This builder is a sibling of the
[Personal Start Page Creator](https://github.com/markbeachill/start-page-builder).
It shares the same philosophy: no account, no backend, no framework, no external
library, and a **standalone HTML file you own** as the output.

## Stage 1.5 update — static links (links without a query)

- A search entry can now be a **plain link with no `%s`** — a library homepage, a setup
  page, any fixed destination. Paste a normal URL into the template field and it becomes a
  static link.
- Static links are **always live** on the exported page: they appear as proper links on
  load, with no query needed. Search links (with `%s`) still wait for a typed query.
- Clicking a static link navigates straight away; clicking a search link before typing
  still just focuses the query box.
- Only a genuinely **empty** template is treated as "not set" and skipped.
- In the builder, each row shows a small `search` or `link` badge, and static links are no
  longer flagged as invalid.

## Stage 1.4 update — drag-and-drop searches between sections

- Search rows can now be dragged **between** sections, not just reordered within one.
- Same-section reordering still works.
- Empty sections show a drop target so searches can be moved back into an emptied section.
- Dragging starts only from the row handle, so text fields stay selectable.
- A drop indicator shows where the search will land.
- Drag-and-drop is disabled while the editor is collapsed (no rows are shown to drop onto);
  expand first, then drag.
- A moved search keeps its own colour.
- Drops update the preview immediately and persist to the browser draft, the menu config,
  and the exported page (all serialise from the same model).

## Stage 1.3 update — stable section columns and column-grouped editor

Mirrors the start-page-builder's section-placement model so layout is predictable and the
editor reads like the finished page.

- **Stable stored column placement.** Each section now has a remembered `column` number.
  Sections no longer get auto-rebalanced on every edit — placement stays put unless you
  move it. Templates and older files without column numbers are auto-assigned once
  (emptiest-column balancing), then stay stable.
- **Column-grouped editor.** Section cards are grouped under `Column 1 · N sections`
  dividers, in column order, so the editor matches the exported layout. Empty columns show
  a placeholder so you can see where to move sections.
- **Section movement.** ↑ / ↓ reorder within a column; ← / → move a section one column
  left/right (landing at the bottom of the destination). Drag-and-drop reorders within a
  column. Each card shows a `… · Col 3` badge.
- **Expand all / Collapse all** controls make large menus easy to reorder — collapse hides
  the search rows and add-search panels, leaving section headers and controls visible. This
  is editor-only and never affects the export.
- **Column count changes** clamp sections from removed columns into the last remaining
  column (e.g. column 5 → column 4 when reducing from five to four).
- Menu config JSON and the embedded exported-page config now include section `column`
  values. Templates and examples were regenerated with explicit columns.

## Stage 1.2 update

- **Namespaced exported markup.** Exported pages now prefix every class, CSS variable and
  data attribute with `ss-` (e.g. `ss-btn`, `ss-hdr`, `ss-col`, `--ss-columns`,
  `--ss-c-blue`, `data-ss-columns`). The menu is wrapped in an `.ss-root` element. This
  prevents clashes when an exported Super Search is embedded inside another website.
- **Accessibility.** Section headers are now real `<button type="button">` controls with
  `aria-expanded`; collapse/expand toggles the `hidden` attribute instead of inline
  `display:none`.
- **Embedded config for lossless reloading.** Exported pages include their menu config in
  a `<script type="application/json" id="ss-menu-config">` block. When you load a page back
  into the builder it reads this first, so the round-trip is exact.
- **Robust import order:** embedded `ss-menu-config` JSON → namespaced HTML → legacy
  generic-class HTML (older exports still load).

## Stage 1.1 update

- Searches now start as **plain dark text** and become **blue underlined links** once a
  query is typed — matching how the classic Super Search behaved.
- Added a **centred masthead** with a red "Super Search" prefix in a serif font, to
  distinguish a Super Search page from a start-page menu. The "show title" setting now
  controls this masthead.
- Darker body text, lighter grey backgrounds, and **wider letter-spacing on section
  headings** for readability.
- Queries are now encoded with **`+` for spaces** (e.g. `climate+migration`), matching
  the classic style and reading well in site searches.
- Added a **site search** builder: type a website address (e.g. `economist.com`) and get
  a Google site-search template `…?q=site:economist.com+%s`. Available both on the
  converter page and inside the builder's per-section panel. This is how most news and
  magazine searches work.
- New **How it works** page with a live interactive demo (type a query, get links).
- Renamed throughout: a entry is a **search** (not an "engine"); the old
  "How to add a search engine" guide is now **Add a search** and covers both the
  paste-a-link route and the site-search route.
- Added **Mark's Super Search** template, reconstructed from the classic setup with UEL
  library, Keenious and institutional setup links omitted.

## What a Super Search page does

You type one query, for example `climate migration`, press **Search all**, and the
page opens (or lists) a search on every engine you included:

- Google Scholar `https://scholar.google.com/scholar?q=climate+migration`
- JSTOR `https://www.jstor.org/action/doSearch?Query=climate+migration`
- PubMed `https://pubmed.ncbi.nlm.nih.gov/?term=climate+migration`
- …and as many more as you add.

The clever part is that **search patterns vary** between engines. The query goes in a
different place each time: `?q=`, `?Query=`, `?search=`, `?term=`, `?search_query=`,
sometimes in the path, sometimes `+`-encoded and sometimes `%20`-encoded. The builder
stores each engine as a **search template** with a `%s` token marking where the query
goes, and the exported page substitutes your typed query into every template.

## The two things you build with

- **Search engine** — a single entry: a label, a search-template URL containing `%s`,
  a section and a colour. Example template: `https://core.ac.uk/search?q=%s`.
- **Section** — a labelled group of engines (e.g. *Academic*, *News*, *Repositories*),
  matching the grouped layout of the original UEL Super Search.

## The link converter

Researchers rarely know an engine's template URL. They *do* know how to run a search.
So the builder includes a converter:

1. Run a real search on the target site for a memorable phrase, e.g. `climate migration`.
2. Copy the **full results-page URL** from the address bar.
3. Paste the URL into the converter and tell it the phrase you searched for.
4. The converter finds your phrase inside the URL — in the query string or the path,
   `+`-encoded or `%20`-encoded — replaces it with `%s`, and gives you a ready
   template you can add to a section with one click.

`converter.html` is a standalone page that does this, and the same converter is built
into the builder's "Add engine from a search link" panel.

## How "fan out" works in the exported page

A Super Search page cannot reliably open 40 browser tabs at once — browsers block
bulk `window.open` as pop-ups. So the exported page supports two modes, chosen per
page:

- **Links mode (default, reliable):** typing the query rewrites every engine button's
  `href` live, so each button opens that engine's results for the current query in a
  new tab when clicked. This is exactly how the original UEL Super Search behaves and
  works everywhere with no pop-up issues.
- **Open-all mode (optional):** an extra "Open all in this section" control attempts to
  open a section's engines in new tabs. The page warns that the browser may ask to
  allow pop-ups the first time.

## GitHub Pages

Publish the project website from:

```text
/docs
```

For a user's own published Super Search page, the simplest rule is:

```text
Rename the saved Super Search page to index.html.
```

Then put `index.html` at the top of the chosen GitHub Pages publishing source:

```text
/index.html        if publishing from the repository root
/docs/index.html   if publishing from /docs
```

## Structure

```text
docs/
  index.html              integrated public home page
  builder.html            light-wrapper builder app
  converter.html          standalone search-link → template converter
  how-it-works.html      normal site page with a live interactive demo
  add-a-search.html       guide: paste-a-link route and site-search route
  templates.html          jump-start research template catalogue
  about.html              about this tool
  help.html               help and notes
  assets/site.css         public site styling
  assets/converter.js     shared search-template engine (used by builder + converter)
  templates/*.json        starter Super Search configs
  templates/catalog.json  template catalogue index
  examples/*.html         exported demo Super Search pages
```

## Config format

Menu config is JSON, versioned with a `format` key, the same way the start page
builder versions its configs:

```json
{
  "format": "supersearch-builder-v1",
  "title": "Research Super Search",
  "description": "One query, many research databases.",
  "filename": "supersearch.html",
  "columns": 3,
  "colours": "primary",
  "showTitle": true,
  "openMode": "links",
  "sections": [
    {
      "name": "Academic",
      "colour": "green",
      "column": 1,
      "engines": [
        { "label": "Google Scholar", "template": "https://scholar.google.com/scholar?q=%s" },
        { "label": "JSTOR", "template": "https://www.jstor.org/action/doSearch?Query=%s" }
      ]
    }
  ]
}
```

- `template` is a full URL containing exactly one `%s` token.
- `column` is the section's stored column (1-based). Sections without one are assigned a
  column once, then stay put.
- `openMode` is `"links"` (default) or `"openAll"`.
- Configs without `openMode` load safely and default to `"links"`.
- `colours` defaults to `"primary"`, `showTitle` to `true`, `columns` to `3`.

## File concepts

- **Super Search page:** the finished `.html` page used in a browser or published online.
- **Menu config:** the `.json` file that lets the builder reload sections, engines,
  colours, columns and settings later.
- **Search template:** a full URL with a `%s` token where the query is inserted.

## Local testing

```bash
cd docs
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Design rule

Public informational pages use the integrated site design. The builder uses only a
light top-navigation wrapper. Exported Super Search pages remain standalone HTML and
do not depend on the website design. The grouped section / coloured button / search-row
layout is preserved from the original Super Search and the start page builder.

## Relationship to the start page builder

This repository deliberately reuses the start page builder's structure, CSS approach,
JSON config style, localStorage drafts, import/export pattern and standalone-export
mechanism. The essential difference is that a link is a **search template** with a
`%s` token rather than a fixed destination, and the exported page rewrites every link
from one shared query box.
