/**
 * @fileoverview Loads and validates data/data.json, the single source of page content.
 * Validation runs during prerender, so a bad data.json fails the build instead of shipping
 * a page with empty tags.
 */

import content from "../../data/data.json";
import { ICONS } from "./icons.js";
import { skillNames } from "./render.js";

const SECTION_TYPES = ["pg", "ls", "skills", "rs"];

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
    if (section.type && !SECTION_TYPES.includes(section.type)) problems.push(`sections[${i}] has unknown type "${section.type}"`);
    if (ids.has(section.section)) problems.push(`duplicate section id "${section.section}"`);
    ids.add(section.section);

    if (section.type === "rs" && !section.file) problems.push(`sections[${i}] (resume) is missing "file"`);

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
  return data;
}

/** The schema.org Person as a string safe to place inside a <script> element. */
export function jsonLd({ site, ext }) {
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

export function sitemap(data, lastmod) {
  const loc = (href) => href.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${loc(data.site.url)}</loc><lastmod>${lastmod}</lastmod></url>
  <url><loc>${loc(new URL("data/whitson_resume.pdf", data.site.url).href)}</loc><lastmod>${lastmod}</lastmod></url>
</urlset>
`;
}

/** The validated content, read once at build time. */
export const loadContent = () => validate(structuredClone(content));
