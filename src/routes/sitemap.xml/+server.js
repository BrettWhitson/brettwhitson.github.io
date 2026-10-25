import { execSync } from "node:child_process";
import { loadContent, sitemap } from "#lib/data.js";

export const prerender = true;

/** Date of the last commit that touched page content, so lastmod only moves when the page does. */
function lastmod() {
  try {
    const date = execSync("git log -1 --format=%cs -- data/data.json src static", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

export const GET = () =>
  new Response(sitemap(loadContent(), lastmod()), {
    headers: { "content-type": "application/xml" },
  });
