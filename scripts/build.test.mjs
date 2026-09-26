import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { esc, html, raw, formatHtml, renderPage } from "./build.mjs";

const template = "<!DOCTYPE html>\n<title>{{title}}</title>\n<nav>{{nav}}</nav>\n<main>{{sections}}</main>\n<script>{{jsonLd}}</script>\n";

const minimal = (overrides = {}) => ({
  site: { name: "Jane Doe", headline: "Engineer", url: "https://example.com/", ...overrides.site },
  sections: overrides.sections ?? [{ section: "about", title: "About", type: "pg", body: "Hello" }],
  icons: overrides.icons ?? {},
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
  const page = renderPage(minimal({ sections: [{ section: "about", title: "A & B", type: "pg", body: "<script>x</script>" }] }), template);
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
      { section: "a", title: "A", type: "pg", body: "" },
      { section: "a", title: "", type: "nope", body: [{ icons: "missing" }] },
    ],
  });
  assert.throws(() => renderPage(data, template), (error) => {
    assert.match(error.message, /duplicate section id "a"/);
    assert.match(error.message, /missing "title"/);
    assert.match(error.message, /unknown type "nope"/);
    assert.match(error.message, /unknown icon group "missing"/);
    return true;
  });
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
