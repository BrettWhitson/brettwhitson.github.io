# Brett Whitson Portfolio

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://brettwhitson.dev)

Personal site and resume, live at **[brettwhitson.dev](https://brettwhitson.dev)**. Content lives in one
JSON file; SvelteKit prerenders it to static HTML, so the page is complete for search engines, link previews, and
visitors without JavaScript. Hydration only adds enhancements (theme toggle, parallax, query typing, inline resume
preview).

| Link                                 | Description     |
| ------------------------------------ | --------------- |
| **[Site](https://brettwhitson.dev)** | Live site       |
| **[Changelog](./CHANGELOG.md)**      | Version history |

## Tech Stack

- **Framework**: SvelteKit 3 with Svelte 5, fully prerendered by `adapter-static` (no SPA fallback)
- **Behavior**: Svelte actions in `src/lib/actions/`, each guarded so a failure leaves the static content in place
- **Styling**: SCSS, compiled by Vite; Geist and Geist Mono from Google Fonts
- **Icons**: Inline monochrome SVG
- **Resume**: LaTeX
- **Hosting**: GitHub Pages, deployed by GitHub Actions (`.github/workflows/deploy.yml`)

## Layout

| Path                        | What                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| `data/data.json`            | All page content: site metadata, intro query, sections, links            |
| `src/app.html`              | Page shell and the pre-paint theme/motion script                         |
| `src/routes/`               | The page (`+page.svelte`, data from `+page.server.js`) and `sitemap.xml` |
| `src/lib/components/`       | Page shell and section components                                        |
| `src/lib/actions/`          | Theme, parallax, reveals, query typing, scroll-spy, skills, copy         |
| `src/lib/data.js`           | Loads and validates `data.json`; JSON-LD and sitemap helpers             |
| `static/`                   | Copied as-is: images, resume PDF, `favicon.ico`, `robots.txt`, `CNAME`   |
| `styles/scss/`              | Source styles: `layout/_shell.scss` and `components/`                    |
| `resume/whitson_resume.tex` | Resume source, published as `static/data/whitson_resume.pdf`             |
