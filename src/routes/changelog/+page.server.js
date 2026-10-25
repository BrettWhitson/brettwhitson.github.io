import { changelogHtml } from "#lib/changelog.js";
import { loadContent } from "#lib/data.js";

// The no-JavaScript fallback for the changelog modal, so it ships no JavaScript either
export const csr = false;

export const load = () => ({ html: changelogHtml(), name: loadContent().site.name });
