# Brett Whitson Portfolio

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://home.brettwhitson.dev)
[![JSDoc](https://img.shields.io/badge/JSDoc-Documentation-blue)](https://home.brettwhitson.dev/docs/JSDocs)
[![BuilderJS](https://img.shields.io/badge/BuilderJS-v0.0.3-orange)](https://github.com/BrettWhitson/Builder-JS)

Personal site and resume, live at **[home.brettwhitson.dev](https://home.brettwhitson.dev)**. A data-driven single
page built with vanilla JavaScript and [BuilderJS](https://github.com/BrettWhitson/Builder-JS), with light and dark
themes.

| Link                                                      | Description         |
| --------------------------------------------------------- | ------------------- |
| **[Site](https://home.brettwhitson.dev)**                 | Live site           |
| **[API Docs](https://home.brettwhitson.dev/docs/JSDocs)** | JSDoc documentation |
| **[Changelog](./CHANGELOG.md)**                           | Version history     |

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), BuilderJS v0.0.3
- **Styling**: SCSS, compiled with Dart Sass
- **Icons**: devicon 2.17.0
- **Resume**: LaTeX
- **Docs**: JSDoc 4.0.3
- **Hosting**: GitHub Pages

## Layout

| Path                         | What                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `index.html`                 | Page shell and metadata                                |
| `data/data.json`             | All page content: sections, skill icons, profile links |
| `javascript/main.js`         | `PortfolioController` and `ThemeController`            |
| `styles/scss/`               | Source styles (abstracts, base, layout, components)    |
| `styles/min/styles.min.css`  | Compiled stylesheet the page loads                     |
| `resume/whitson_resume.tex`  | Resume source                                          |
| `data/whitson_resume.pdf`    | Built resume served by the site                        |

## Editing content

Everything on the page comes from `data/data.json`. Each section has a `type`:

- `pg` - a paragraph (`body` is a string)
- `ls` - a list of cards. Each item takes `header`, `subheader`, `subsubheader`, `main` (HTML), an optional
  `link` (`{ href, label }`), and optional `roles` (`[{ title, dates, bullets }]`) for several positions at one
  organization
- `rs` - the resume download and preview (`file` points at the PDF)

Skill icons are `{ "icon": "<devicon class suffix>", "label": "<display name>" }`, e.g.
`{ "icon": "python-plain", "label": "Python" }`.

## Building

Styles:

```bash
sass --no-source-map --style=compressed styles/scss/styles.scss styles/min/styles.min.css
sass --no-source-map styles/scss/styles.scss styles/css/styles.css
```

Resume (MiKTeX or TeX Live):

```bash
cd resume && pdflatex whitson_resume.tex && cp whitson_resume.pdf ../data/
```

Preview locally with any static server from the repo root, e.g. `python -m http.server 5501`.
