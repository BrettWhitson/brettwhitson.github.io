/**
 * @fileoverview Pure helpers shared by the components.
 * Anything here that returns HTML is rendered with {@html}, so it must escape its input.
 */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text for use in HTML content or a quoted attribute. */
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

const SQL_TOKENS = /('(?:[^']|'')*')|\b(SELECT|FROM|WHERE|IN|AND|OR|ORDER|BY|AS)\b/gi;

/** Wrap SQL keywords and string literals in spans for highlighting; everything else is escaped. */
export function highlightSql(sql) {
  let out = "";
  let last = 0;
  for (const match of sql.matchAll(SQL_TOKENS)) {
    out += esc(sql.slice(last, match.index));
    out += `<span class="${match[1] ? "sql-string" : "sql-keyword"}">${esc(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return out + esc(sql.slice(last));
}

/** Lookup of skill key to display name, from the skills section. */
export const skillNames = (data) =>
  new Map(data.sections.filter((s) => s.type === "skills").flatMap((s) => s.body.flatMap((g) => g.items.map((i) => [i.key, i.name]))));

/** "4 roles, 2018 to present" for an organization with several positions. */
export function roleSpan(roles) {
  if (!roles || roles.length < 2) return null;
  const years = roles.flatMap((r) => (r.dates ?? "").match(/\d{4}/g) ?? []).map(Number);
  const current = isCurrent(roles[0].dates);
  if (!years.length) return `${roles.length} roles`;
  return `${roles.length} roles, ${Math.min(...years)} to ${current ? "present" : Math.max(...years)}`;
}

export const isCurrent = (dates) => /present/i.test(dates ?? "");

export const sectionIndex = (i) => String(i + 1).padStart(2, "0");

export const basename = (file) => String(file).split(/[\\/]/).pop();
