import { loadContent } from "#lib/data.js";

// Server-only, so validation never runs (or fails) in the browser and data.json's loader
// stays out of the client bundle; the prerendered page embeds the result for hydration
export const load = () => ({ content: loadContent() });
