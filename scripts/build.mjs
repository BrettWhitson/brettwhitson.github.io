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
      const opens = [...line.matchAll(/<([a-z][a-z0-9]*)\b[^>]*>/gi)].filter(
        ([tag, name]) => !VOID_TAGS.test(name) && !tag.endsWith("/>")
      ).length;
      const closes = (line.match(/<\//g) || []).length;
      const leadingClose = line.startsWith("</") ? 1 : 0;

      depth -= leadingClose;
      const out = " ".repeat(baseIndent + depth * 2) + line;
      depth += opens - closes + leadingClose;
      return out;
    })
    .join("\n");
}

// === ICONS ===

// Monochrome inline SVGs, so the page needs no icon font
const ICONS = {
  linkedin: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z"/></svg>`,
  github: `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`,
  download: `<svg class="btn-glyph" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>`,
  code: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
};

const icon = (name) => {
  if (!ICONS[name]) throw new Error(`Unknown icon "${name}"`);
  return raw(ICONS[name]);
};

// === HERO QUERY ===

const SQL_TOKENS = /('(?:[^']|'')*')|\b(SELECT|FROM|WHERE|IN|AND|OR|ORDER|BY|AS)\b/gi;

/**
 * Wrap SQL keywords and string literals in spans for highlighting; everything else is escaped.
 * Line breaks become &#10; so the query stays on one source line and formatHtml can't strip
 * the alignment spaces inside the <pre>.
 */
export function highlightSql(sql) {
  let out = "";
  let last = 0;
  for (const match of sql.matchAll(SQL_TOKENS)) {
    out += esc(sql.slice(last, match.index));
    out += `<span class="${match[1] ? "sql-string" : "sql-keyword"}">${esc(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return raw((out + esc(sql.slice(last))).replace(/\r?\n/g, "&#10;"));
}

// Decorative: the role line above already says the same thing in plain words, so it's hidden from assistive tech
const renderQuery = (query) =>
  query &&
  html`
<figure class="query" style="--i: 4" aria-hidden="true">
  <pre class="query-sql"><code>${highlightSql(query.sql)}</code></pre>
  <table class="query-result">
    <thead>
      <tr><th>${query.column}</th></tr>
    </thead>
    <tbody>
      ${query.rows.map((row, i) => html`<tr style="--i: ${i}"><td>${row}</td></tr>`)}
    </tbody>
  </table>
  <figcaption class="query-caption">${query.rows.length} ${query.rows.length === 1 ? "row" : "rows"} selected.</figcaption>
</figure>`;

// === SECTION RENDERERS ===

/** Lookup of skill key to display name, from the skills section. */
const skillNames = (data) =>
  new Map(data.sections.filter((s) => s.type === "skills").flatMap((s) => s.body.flatMap((g) => g.items.map((i) => [i.key, i.name]))));

const renderChip = (key, name) => html`<li><span class="chip" data-skill="${key}">${name}</span></li>`;

// --i orders the timeline animation (see components/_timeline.scss)
const renderRole = (role, index, names) => html`
<div class="list-item-role${/present/i.test(role.dates ?? "") ? " is-current" : ""}" style="--i: ${index}" data-skills="${(role.stack ?? []).join(" ")}">
  <h4 class="list-item-role-title">${role.title}</h4>
  ${role.dates && html`<p class="list-item-date">${role.dates}</p>`}
  ${role.bullets?.length > 0 &&
  html`<ul class="list-item-bullets">
    ${role.bullets.map((bullet) => html`<li>${bullet}</li>`)}
  </ul>`}
  ${role.stack?.length > 0 &&
  html`<ul class="chips" aria-label="Used in this role">
    ${role.stack.map((key) => renderChip(key, names.get(key)))}
  </ul>`}
</div>`;

/** "4 roles, 2018 to present" for an organization with several positions. */
function roleSpan(roles) {
  if (!roles || roles.length < 2) return null;
  const years = roles.flatMap((r) => (r.dates ?? "").match(/\d{4}/g) ?? []).map(Number);
  const current = /present/i.test(roles[0].dates ?? "");
  if (!years.length) return `${roles.length} roles`;
  return `${roles.length} roles, ${Math.min(...years)} to ${current ? "present" : Math.max(...years)}`;
}

const renderListItem = (item, names) => html`
<li class="section-list-item">
  ${item.subsubheader && html`<p class="list-item-date">${item.subsubheader}</p>`}
  <div class="list-item-body">
    ${item.header && html`<h3 class="list-item-header">${item.header}</h3>`}
    ${roleSpan(item.roles) && html`<p class="list-item-caption">${roleSpan(item.roles)}</p>`}
    ${item.subheader && html`<p class="list-item-subheader">${item.subheader}</p>`}
    ${item.main && html`<div class="list-item-main">${raw(item.main)}</div>`}
    ${item.roles?.length > 0 &&
    html`<div class="roles">
      ${item.roles.map((role, i) => renderRole(role, i, names))}
    </div>`}
    ${item.link?.href &&
    html`<a class="list-item-link" href="${item.link.href}" target="_blank" rel="noopener noreferrer">${
      item.link.label || item.link.href
    }</a>`}
  </div>
</li>`;

const renderStats = (stats) =>
  stats?.length > 0 &&
  html`
<dl class="stats" data-stagger>
  ${stats.map((s) => html`<div class="stat"><dt>${s.label}</dt><dd>${s.value}</dd></div>`)}
</dl>`;

const bodies = {
  pg: (section, data) => html`
<div class="section-body section-body-paragraph">
  <p>${section.body}</p>
  ${section.section === "about" && renderStats(data.site.stats)}
</div>`,

  ls: (section, data) => html`
<div class="section-body">
  <ul class="section-body-list${section.layout === "rows" ? " rows" : ""}" data-stagger>
    ${section.body.map((item) => renderListItem(item, skillNames(data)))}
  </ul>
</div>`,

  skills: (section) => html`
<div class="section-body">
  <table class="skills-table">
    <thead>
      <tr><th scope="col">skill_group</th><th scope="col">members</th></tr>
    </thead>
    <tbody data-stagger>
      ${section.body.map(
        (group) => html`<tr>
        <th scope="row">${group.group}</th>
        <td>
          <ul class="chips">
            ${group.items.map((item) => renderChip(item.key, item.name))}
          </ul>
        </td>
      </tr>`
      )}
    </tbody>
  </table>
  <p class="skills-status" aria-live="polite" hidden></p>
</div>`,

  // Preview is a plain link to the PDF; main.js upgrades it to an inline viewer on wide screens
  rs: (section) => html`
<div class="section-body">
  <div class="resume-actions">
    <a class="btn btn-primary btn-download" href="${section.file}" download="${path.basename(section.file)}">Download PDF${icon("download")}</a>
    <a class="btn btn-secondary" id="resume-preview-btn" href="${section.file}" target="_blank" rel="noopener" aria-controls="resume-preview-container" aria-expanded="false">Preview</a>
  </div>
  <div id="resume-preview-container" class="resume-preview-container hidden"></div>
</div>`,
};

const sectionIndex = (i) => String(i + 1).padStart(2, "0");

function renderSection(section, index, data) {
  const body = bodies[section.type];
  if (!body) throw new Error(`Section "${section.section}" has unknown type "${section.type}"`);

  return html`
<section id="${section.section}" class="section reveal" aria-labelledby="${section.section}-title">
  <h2 id="${section.section}-title" class="section-title"><span class="section-index" aria-hidden="true">${sectionIndex(index)} /</span> ${section.title}</h2>
  ${body(section, data)}
</section>`;
}

// === PAGE ===

function validate(data) {
  const problems = [];
  ["name", "headline", "email", "url", "description", "image"].forEach((field) => {
    if (!data.site?.[field]) problems.push(`site.${field} is required`);
  });
  if (!data.sections?.some?.((s) => s.type === "rs")) problems.push('a resume section (type "rs") is required for the download link');
  if (!Array.isArray(data.sections) || data.sections.length === 0) problems.push("sections must be a non-empty array");
  Object.entries(data.ext ?? {}).forEach(([label, entry]) => {
    if (!ICONS[entry.icon]) problems.push(`ext "${label}" uses unknown icon "${entry.icon}" (known: ${Object.keys(ICONS).join(", ")})`);
  });

  const skills = Array.isArray(data.sections) ? skillNames(data) : new Map();
  const ids = new Set();
  data.sections?.forEach((section, i) => {
    ["section", "title", "type"].forEach((field) => {
      if (!section[field]) problems.push(`sections[${i}] is missing "${field}"`);
    });
    if (section.type && !bodies[section.type]) problems.push(`sections[${i}] has unknown type "${section.type}"`);
    if (ids.has(section.section)) problems.push(`duplicate section id "${section.section}"`);
    ids.add(section.section);

    if (section.type === "ls") {
      section.body?.forEach((item, j) =>
        item.roles?.forEach((role, k) =>
          role.stack?.forEach((key) => {
            if (!skills.has(key)) problems.push(`sections[${i}].body[${j}].roles[${k}] uses skill "${key}", which isn't in the skills section`);
          })
        )
      );
    }
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

const renderProfileLinks = (entries) => html`${entries.map(
  ([label, { icon: name, link }]) =>
    html`<li><a class="icon-button" href="${link}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon(name)}</a></li>`
)}`;

export function renderPage(data, template) {
  validate(data);
  const { site } = data;
  const resume = data.sections.find((s) => s.type === "rs");

  const slots = {
    title: esc(`${site.name} - ${site.headline}`),
    description: esc(site.description),
    url: esc(site.url),
    image: esc(site.image),
    name: esc(site.name),
    headline: esc(site.headline),
    org: esc(site.org),
    email: esc(site.email),
    sourceUrl: esc(site.sourceUrl),
    resumeFile: esc(resume.file),
    jsonLd: jsonLd(data),
    query: formatHtml(renderQuery(site.query) || "", 10),
    nav: formatHtml(
      html`${data.sections.map(
        (s, i) =>
          html`<li><a class="nav-link" href="#${s.section}"><span class="nav-index">${sectionIndex(i)}</span><span class="nav-line"></span><span class="nav-label">${s.title}</span></a></li>`
      )}`,
      12
    ),
    profileLinks: formatHtml(renderProfileLinks(Object.entries(data.ext ?? {})), 12),
    sections: formatHtml(html`${data.sections.map((s, i) => renderSection(s, i, data))}`, 8),
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
