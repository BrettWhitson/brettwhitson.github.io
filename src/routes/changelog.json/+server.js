import { json } from "@sveltejs/kit";
import { changelogHtml } from "#lib/changelog.js";

// Fetched by the changelog modal, so the main page doesn't carry the whole changelog
export const prerender = true;

export const GET = () => json({ html: changelogHtml() });
