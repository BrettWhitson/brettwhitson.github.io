# Brett Whitson Portfolio

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://home.brettwhitson.dev)
[![JSDoc](https://img.shields.io/badge/JSDoc-Documentation-blue)](https://home.brettwhitson.dev/docs/JSDocs)

Personal site and resume, live at **[home.brettwhitson.dev](https://home.brettwhitson.dev)**. Content lives in one
JSON file; a zero-dependency Node script renders it to static HTML, so the page is complete for search engines, link
previews, and visitors without JavaScript. The browser script only adds enhancements (theme toggle, inline resume
preview).

| Link                                                      | Description         |
| --------------------------------------------------------- | ------------------- |
| **[Site](https://home.brettwhitson.dev)**                 | Live site           |
| **[API Docs](https://home.brettwhitson.dev/docs/JSDocs)** | JSDoc documentation |
| **[Changelog](./CHANGELOG.md)**                           | Version history     |

## Tech Stack

- **Build**: Node.js (no dependencies) renders `data/data.json` into `index.html`
- **Frontend**: Vanilla JavaScript (ES2020+), progressive enhancement only
- **Styling**: SCSS, compiled with Dart Sass
- **Icons**: devicon 2.17.0
- **Resume**: LaTeX
- **Hosting**: GitHub Pages

## Layout

| Path                         | What                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `data/data.json`             | All page content: site metadata, sections, icons, links     |
| `templates/index.html`       | Page shell with `{{slot}}` placeholders                     |
| `scripts/build.mjs`          | Renders the page, writes `sitemap.xml`, compiles the SCSS   |
| `index.html`                 | Generated output. Don't edit by hand                        |
| `javascript/main.js`         | `ThemeController` and `ResumePreview`                       |
| `styles/scss/`               | Source styles (abstracts, base, layout, components)         |
| `resume/whitson_resume.tex`  | Resume source, built to `data/whitson_resume.pdf`           |

## Editing content

Everything on the page comes from `data/data.json`. `site` holds the name, headline, description, and URLs used for
the header, meta tags, and JSON-LD. Each entry in `sections` has a `type`:

- `pg` - a paragraph (`body` is a string)
- `ls` - a list of cards. Each item takes `header`, `subheader`, `subsubheader`, `main` (HTML), `icons` (the name of
  a group in `icons`), `link` (`{ href, label }`), and `roles` (`[{ title, dates, bullets }]`) for several positions at
  one organization. All optional
- `rs` - the resume download and preview (`file` points at the PDF)

Skill icons are `{ "icon": "<devicon class suffix>", "label": "<display name>" }`.

## Building

Requires Node 20+ and Dart Sass (`npm install -g sass`).

```bash
node scripts/build.mjs
```

Renders `index.html` and `sitemap.xml` and compiles `styles/css/styles.css` and `styles/min/styles.min.css`.
`--html` skips the CSS; `--check` exits non-zero if `index.html` is out of date.

```bash
node --test scripts/
```

Resume (MiKTeX or TeX Live):

```bash
cd resume && pdflatex whitson_resume.tex && cp whitson_resume.pdf ../data/
```

Preview locally with any static server from the repo root, e.g. `python -m http.server 5501`.
