#!/usr/bin/env node
/**
 * @fileoverview Renders data/data.json into a static index.html and compiles the SCSS.
 *
 * The page used to be assembled in the browser from JSON, which left search engines and
 * link previews with an empty page. Rendering at build time keeps data.json as the single
 * place to edit content while shipping plain HTML.
 *
 * Usage:
 *   node scripts/build.mjs            build HTML and CSS
 *   node scripts/build.mjs --html     HTML only
 *   node scripts/build.mjs --check    exit 1 if index.html is out of date (no writes)
 */

import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const paths = {
  data: path.join(root, "data", "data.json"),
  template: path.join(root, "templates", "index.html"),
  output: path.join(root, "index.html"),
  sitemap: path.join(root, "sitemap.xml"),
  scss: path.join(root, "styles", "scss", "styles.scss"),
  css: path.join(root, "styles", "css", "styles.css"),
  cssMin: path.join(root, "styles", "min", "styles.min.css"),
};

// === ESCAPING ===

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text for use in HTML content or a quoted attribute. */
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

/** Tagged template that escapes every interpolation unless it is already rendered HTML. */
class Html {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const raw = (value) => new Html(String(value));

export function html(strings, ...values) {
  const render = (value) => {
    if (value instanceof Html) return value.value;
    if (Array.isArray(value)) return value.map(render).join("\n");
    if (value === null || value === undefined || value === false) return "";
    return esc(value);
  };
  return raw(strings.reduce((out, str, i) => out + str + (i < values.length ? render(values[i]) : ""), ""));
}

const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

/**
 * Re-indent rendered markup by nesting depth, since nested templates lose their indentation.
 * Only handles this script's own output: one element or tag per line, no multi-line tags.
 */
export function formatHtml(markup, baseIndent) {
  let depth = 0;
  return String(markup)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const opens = [...line.matchAll(/<([a-z][a-z0-9]*)\b[^>]*>/gi)].filter(([, tag]) => !VOID_TAGS.test(tag)).length;
      const closes = (line.match(/<\//g) || []).length;
      const leadingClose = line.startsWith("</") ? 1 : 0;

      depth -= leadingClose;
      const out = " ".repeat(baseIndent + depth * 2) + line;
      depth += opens - closes + leadingClose;
      return out;
    })
    .join("\n");
}

// === SECTION RENDERERS ===

const renderIcons = (icons = []) => html`
<ul class="icon-list list-no-style-inline">
  ${icons.map(
    ({ icon, label }) => html`<li><i class="devicon-${icon}" aria-hidden="true"></i><span class="icon-label">${label}</span></li>
  `
  )}
</ul>`;

const renderRole = (role) => html`
<div class="list-item-role">
  <h4 class="list-item-role-title">${role.title}</h4>
  ${role.dates && html`<p class="list-item-subsubheader">${role.dates}</p>`}
  ${role.bullets?.length &&
  html`<ul class="list-item-bullets">
    ${role.bullets.map((bullet) => html`<li>${bullet}</li>`)}
  </ul>`}
</div>`;

const renderListItem = (item, data) => html`
<li class="section-list-item">
  ${item.header && html`<h3 class="list-item-header">${item.header}</h3>`}
  ${item.subheader && html`<p class="list-item-subheader">${item.subheader}</p>`}
  ${item.subsubheader && html`<p class="list-item-subsubheader">${item.subsubheader}</p>`}
  ${item.main && html`<div class="list-item-main">${raw(item.main)}</div>`}
  ${item.icons && renderIcons(data.icons?.[item.icons])}
  ${item.roles?.map(renderRole)}
  ${item.link?.href &&
  html`<a class="list-item-link" href="${item.link.href}" target="_blank" rel="noopener noreferrer">${
    item.link.label || item.link.href
  }</a>`}
</li>`;

const bodies = {
  pg: (section) => html`
<div class="section-body section-body-paragraph">
  <p>${section.body}</p>
</div>`,

  ls: (section, data) => html`
<div class="section-body section-body-list">
  <ul class="section-body-list">
    ${section.body.map((item) => renderListItem(item, data))}
  </ul>
</div>`,

  // Preview is a plain link to the PDF; main.js upgrades it to an inline viewer on wide screens
  rs: (section) => html`
<div class="section-body">
  <div class="resume-actions">
    <a class="btn btn-primary" href="${section.file}" download="${path.basename(section.file)}">Download PDF</a>
    <a class="btn btn-secondary" id="resume-preview-btn" href="${section.file}" target="_blank" rel="noopener" aria-controls="resume-preview-container" aria-expanded="false">Preview</a>
  </div>
  <div id="resume-preview-container" class="resume-preview-container hidden"></div>
</div>`,
};

function renderSection(section, data) {
  const body = bodies[section.type];
  if (!body) throw new Error(`Section "${section.section}" has unknown type "${section.type}"`);

  return html`
<section id="${section.section}" class="section" aria-labelledby="${section.section}-title">
  <div class="section-header">
    <h2 id="${section.section}-title" class="section-title">${section.title}</h2>
  </div>
  ${body(section, data)}
</section>`;
}

// === PAGE ===

function validate(data) {
  const problems = [];
  if (!data.site?.name) problems.push("site.name is required");
  if (!Array.isArray(data.sections) || data.sections.length === 0) problems.push("sections must be a non-empty array");

  const ids = new Set();
  data.sections?.forEach((section, i) => {
    ["section", "title", "type"].forEach((field) => {
      if (!section[field]) problems.push(`sections[${i}] is missing "${field}"`);
    });
    if (section.type && !bodies[section.type]) problems.push(`sections[${i}] has unknown type "${section.type}"`);
    if (ids.has(section.section)) problems.push(`duplicate section id "${section.section}"`);
    ids.add(section.section);
    section.body?.forEach?.((item, j) => {
      if (item.icons && !data.icons?.[item.icons]) {
        problems.push(`sections[${i}].body[${j}] references unknown icon group "${item.icons}"`);
      }
    });
  });

  if (problems.length) throw new Error(`Invalid data.json:\n  - ${problems.join("\n  - ")}`);
}

function jsonLd({ site, ext }) {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    image: site.image,
    email: `mailto:${site.email}`,
    jobTitle: site.jobTitle,
    worksFor: site.worksFor && { "@type": "CollegeOrUniversity", name: site.worksFor },
    alumniOf: site.alumniOf && { "@type": "CollegeOrUniversity", name: site.alumniOf },
    sameAs: Object.values(ext ?? {})
      .map((entry) => entry.link)
      .filter((link) => link && link !== site.sourceUrl),
  };
  // "<" is escaped so the JSON can never close the surrounding script tag
  return JSON.stringify(person).replace(/</g, "\\u003c");
}

export function renderPage(data, template) {
  validate(data);
  const { site } = data;

  const slots = {
    title: esc(`${site.name} - ${site.headline}`),
    description: esc(site.description),
    url: esc(site.url),
    image: esc(site.image),
    name: esc(site.name),
    headline: esc(site.headline),
    email: esc(site.email),
    sourceUrl: esc(site.sourceUrl),
    jsonLd: jsonLd(data),
    nav: formatHtml(
      html`${data.sections.map((s) => html`<li class="nav-item"><a class="nav-link" href="#${s.section}">${s.title}</a></li>`)}`,
      10
    ),
    extLinks: formatHtml(
      html`${Object.entries(data.ext ?? {}).map(
        ([label, { icon, link }]) =>
          html`<li><a href="${link}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}"><i class="devicon-${icon}" aria-hidden="true"></i></a></li>`
      )}`,
      10
    ),
    sections: formatHtml(html`${data.sections.map((s) => renderSection(s, data))}`, 8),
  };

  const page = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in slots)) throw new Error(`Template references unknown slot ${match}`);
    return slots[key];
  });

  const banner = "<!-- Generated by scripts/build.mjs from data/data.json and templates/index.html. Edit those, then rebuild. -->\n";
  return page.replace("<!DOCTYPE html>\n", `<!DOCTYPE html>\n${banner}`);
}

export function renderSitemap(data) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(data.site.url)}</loc><lastmod>${today}</lastmod></url>
  <url><loc>${esc(new URL("data/whitson_resume.pdf", data.site.url).href)}</loc><lastmod>${today}</lastmod></url>
</urlset>
`;
}

/** Compile SCSS with the Dart Sass CLI (npm install -g sass). */
function compileCss() {
  // A command string (not execFile) so the npm .cmd shim also launches on Windows
  const run = (style) =>
    execSync(`sass --style=${style} --no-source-map --quiet "${paths.scss}"`, {
      stdio: ["ignore", "pipe", "inherit"],
    }).toString();

  try {
    return { css: run("expanded"), min: run("compressed") };
  } catch (error) {
    throw new Error(`sass failed (is it installed? npm install -g sass): ${error.message}`);
  }
}

async function main(args) {
  const [dataText, template] = await Promise.all([readFile(paths.data, "utf8"), readFile(paths.template, "utf8")]);
  const data = JSON.parse(dataText);
  const page = renderPage(data, template.replace(/\r\n/g, "\n"));

  const current = (await readFile(paths.output, "utf8").catch(() => "")).replace(/\r\n/g, "\n");
  const changed = current !== page;

  if (args.includes("--check")) {
    if (changed) {
      console.error("index.html is out of date. Run: node scripts/build.mjs");
      process.exit(1);
    }
    console.log("index.html is up to date");
    return;
  }

  // Sitemap is only rewritten when the page changes, so its lastmod stays meaningful
  if (changed) {
    await Promise.all([writeFile(paths.output, page), writeFile(paths.sitemap, renderSitemap(data))]);
    console.log(`Wrote index.html (${data.sections.length} sections) and sitemap.xml`);
  } else {
    console.log("index.html unchanged");
  }

  if (!args.includes("--html")) {
    const { css, min } = compileCss();
    await Promise.all([writeFile(paths.css, css), writeFile(paths.cssMin, min)]);
    console.log("Compiled styles/css/styles.css and styles/min/styles.min.css");
  }
}

// Run only when executed directly, so tests can import the renderers
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
