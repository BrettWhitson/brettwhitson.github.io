import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { esc, html, raw, formatHtml, highlightSql, renderPage } from "./build.mjs";

const template = "<!DOCTYPE html>\n<title>{{title}}</title>\n<nav>{{nav}}</nav>\n<main>{{sections}}</main>\n<script>{{jsonLd}}</script>\n";

const minimal = (overrides = {}) => ({
  site: {
    name: "Jane Doe",
    headline: "Engineer",
    email: "jane@example.com",
    url: "https://example.com/",
    description: "Jane's site",
    image: "https://example.com/me.jpg",
    ...overrides.site,
  },
  sections: overrides.sections ?? [
    { section: "about", title: "About", type: "pg", body: "Hello" },
    { section: "resume", title: "Resume", type: "rs", file: "./cv.pdf" },
  ],
  ext: overrides.ext ?? {},
});

test("esc escapes every HTML-significant character", () => {
  assert.equal(esc(`<a href="x">Tom & Jerry's</a>`), "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
  assert.equal(esc(null), "");
});

test("html escapes interpolations but not nested html or raw values", () => {
  const inner = html`<b>${"<i>"}</b>`;
  assert.equal(String(html`<p>${inner}${raw("<br>")}${"&"}</p>`), "<p><b>&lt;i&gt;</b><br>&amp;</p>");
});

test("html drops empty optional values", () => {
  assert.equal(String(html`<p>${undefined}${null}${false}</p>`), "<p></p>");
});

test("formatHtml indents by nesting depth and skips void tags", () => {
  const out = formatHtml("<ul>\n<li>\n<img src=x>\n<p>a</p>\n</li>\n</ul>", 2);
  assert.equal(out, "  <ul>\n    <li>\n      <img src=x>\n      <p>a</p>\n    </li>\n  </ul>");
});

test("section text is escaped in the rendered page", () => {
  const page = renderPage(minimal({ sections: [{ section: "about", title: "A & B", type: "pg", body: "<script>x</script>" }, { section: "r", title: "R", type: "rs", file: "x.pdf" }] }), template);
  assert.match(page, /A &amp; B/);
  assert.doesNotMatch(page, /<script>x<\/script>/);
});

test("JSON-LD cannot close its script tag", () => {
  const page = renderPage(minimal({ site: { name: "</script><b>" } }), template);
  const jsonLd = page.match(/<script>(.*)<\/script>/)[1];
  assert.doesNotMatch(jsonLd, /<\//);
  assert.equal(JSON.parse(jsonLd).name, "</script><b>");
});

test("invalid data is rejected with every problem listed", () => {
  const data = minimal({
    sections: [
      { section: "a", title: "A", type: "rs", file: "x.pdf" },
      { section: "a", title: "", type: "nope" },
      { section: "exp", title: "Exp", type: "ls", body: [{ roles: [{ title: "R", stack: ["cobol"] }] }] },
      { section: "skills", title: "Skills", type: "skills", body: [{ group: "G", items: [{ key: "sql", name: "SQL" }] }] },
    ],
    ext: { Mastodon: { icon: "mastodon", link: "https://example.com" } },
  });
  assert.throws(() => renderPage(data, template), (error) => {
    assert.match(error.message, /duplicate section id "a"/);
    assert.match(error.message, /missing "title"/);
    assert.match(error.message, /unknown type "nope"/);
    assert.match(error.message, /uses skill "cobol", which isn't in the skills section/);
    assert.match(error.message, /unknown icon "mastodon"/);
    return true;
  });
});

test("highlightSql marks keywords and strings and escapes the rest", () => {
  const out = String(highlightSql("SELECT a FROM t WHERE x IN ('<b>', 'it''s') AND y < 2;"));
  assert.match(out, /<span class="sql-keyword">SELECT<\/span> a <span class="sql-keyword">FROM<\/span>/);
  assert.match(out, /<span class="sql-string">&#39;&lt;b&gt;&#39;<\/span>/);
  assert.match(out, /<span class="sql-string">&#39;it&#39;&#39;s&#39;<\/span>/);
  assert.match(out, /y &lt; 2;/);
  assert.doesNotMatch(out, /<b>/);
});

test("roles get their skill chips and the organization gets a span caption", () => {
  const data = minimal({
    sections: [
      {
        section: "exp",
        title: "Experience",
        type: "ls",
        body: [
          {
            header: "Org",
            roles: [
              { title: "Senior", dates: "June 2025 - Present", stack: ["sql"] },
              { title: "Junior", dates: "April 2018 - August 2020" },
            ],
          },
        ],
      },
      { section: "skills", title: "Skills", type: "skills", body: [{ group: "G", items: [{ key: "sql", name: "SQL" }] }] },
      { section: "resume", title: "Resume", type: "rs", file: "./cv.pdf" },
    ],
  });
  const page = renderPage(data, "{{sections}}");
  assert.match(page, /<p class="list-item-caption">2 roles, 2018 to present<\/p>/);
  assert.match(page, /<div class="list-item-role is-current" style="--i: 0" data-skills="sql">/);
  assert.match(page, /<span class="chip" data-skill="sql">SQL<\/span>/);
  assert.match(page, /<div class="list-item-role" style="--i: 1" data-skills="">/);
});

test("unknown template slots fail loudly", () => {
  assert.throws(() => renderPage(minimal(), "{{nope}}"), /unknown slot \{\{nope\}\}/);
});

test("the real data.json renders every section", async () => {
  const [data, tpl] = await Promise.all([
    readFile(new URL("../data/data.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../templates/index.html", import.meta.url), "utf8"),
  ]);
  const page = renderPage(data, tpl.replace(/\r\n/g, "\n"));
  for (const section of data.sections) {
    assert.match(page, new RegExp(`<section id="${section.section}"`));
    assert.match(page, new RegExp(`href="#${section.section}"`));
  }
  assert.doesNotMatch(page, /\{\{\w+\}\}/);
});

test("missing site metadata is reported instead of rendering empty tags", () => {
  assert.throws(() => renderPage(minimal({ site: { email: "", url: undefined } }), template), (error) => {
    assert.match(error.message, /site\.email is required/);
    assert.match(error.message, /site\.url is required/);
    return true;
  });
});

test("a role with an empty bullet list renders no list and no stray text", () => {
  const data = minimal({
    sections: [
      { section: "exp", title: "Experience", type: "ls", body: [{ header: "Org", roles: [{ title: "Role", bullets: [] }] }] },
      { section: "resume", title: "Resume", type: "rs", file: "./cv.pdf" },
    ],
  });
  const role = renderPage(data, "{{sections}}").match(/<div class="list-item-role"[\s\S]*?<\/div>/)[0];
  assert.doesNotMatch(role, /list-item-bullets/);
  assert.doesNotMatch(role, />\s*0\s*</);
});

test("multi-line SQL keeps its alignment on a single source line", () => {
  const out = String(highlightSql("SELECT a\n       FROM t;"));
  assert.doesNotMatch(out, /\n/);
  assert.match(out, /a&#10;       <span class="sql-keyword">FROM<\/span>/);
});
