# Brett Whitson Portfolio

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://home.brettwhitson.dev)

Personal site and resume, live at **[home.brettwhitson.dev](https://home.brettwhitson.dev)**. Content lives in one
JSON file; a zero-dependency Node script renders it to static HTML, so the page is complete for search engines, link
previews, and visitors without JavaScript. The browser script only adds enhancements (theme toggle, inline resume
preview).

| Link                                                      | Description         |
| --------------------------------------------------------- | ------------------- |
| **[Site](https://home.brettwhitson.dev)**                 | Live site           |
| **[Changelog](./CHANGELOG.md)**                           | Version history     |

## Tech Stack

- **Build**: Node.js (no dependencies) renders `data/data.json` into `index.html`
- **Frontend**: Vanilla JavaScript (ES2020+), progressive enhancement only
- **Styling**: SCSS, compiled with Dart Sass; Geist and Geist Mono from Google Fonts
- **Icons**: Inline monochrome SVG
- **Resume**: LaTeX
- **Hosting**: GitHub Pages

## Layout

| Path                         | What                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| `data/data.json`             | All page content: site metadata, intro query, sections, links |
| `templates/index.html`       | Page shell with `{{slot}}` placeholders                       |
| `scripts/build.mjs`          | Renders the page, writes `sitemap.xml`, compiles the SCSS     |
| `index.html`                 | Generated output. Don't edit by hand                          |
| `javascript/main.js`         | Theme, parallax, reveals, query typing, scroll-spy, skills    |
| `styles/scss/`               | Source styles: `layout/_shell.scss` and `components/`         |
| `resume/whitson_resume.tex`  | Resume source, built to `data/whitson_resume.pdf`             |

## Editing content

Everything on the page comes from `data/data.json`.

- `site` - name, headline, org, email, URLs, and description for the intro, meta tags, and JSON-LD.
  `site.query` is the SQL shown in the intro (`sql`, result `column`, and `rows`); `site.stats` are the
  numbers under About
- `ext` - profile links. `icon` is one of `linkedin`, `github`, `code` (inline SVGs in `build.mjs`)
- `sections` - rendered in order, numbered automatically. Each has a `type`:
  - `pg` - a paragraph (`body` is a string)
  - `ls` - a list. Items take `header`, `subheader`, `subsubheader` (shown as the date), `main` (HTML),
    `link` (`{ href, label }`), and `roles` (`[{ title, dates, bullets, stack }]`) for several positions at
    one organization. `"layout": "rows"` puts the date in a column beside each item
  - `skills` - groups of `{ key, name }`. A role's `stack` lists skill keys; hovering or tapping a skill
    highlights the roles that list it. The build fails if a role uses a key the skills section doesn't define
  - `rs` - the resume download and preview (`file` points at the PDF)

## Building

Requires Node 20+ and Dart Sass (`npm install -g sass`).

```bash
node scripts/build.mjs
```

Renders `index.html` and `sitemap.xml` and compiles `styles/min/styles.min.css`.
`--html` skips the CSS; `--check` exits non-zero if `index.html` is out of date.

```bash
node --test scripts/
```

Resume (MiKTeX or TeX Live):

```bash
cd resume && pdflatex whitson_resume.tex && cp whitson_resume.pdf ../data/
```

Preview locally with any static server from the repo root, e.g. `python -m http.server 5501`.
