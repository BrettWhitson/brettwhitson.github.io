/**
 * @fileoverview Renders CHANGELOG.md to HTML at build time. Server-only, so the Markdown parser
 * never reaches the browser; the page and the modal both read the prerendered result.
 */

import { marked } from "marked";
import source from "../../CHANGELOG.md?raw";

// The modal and the page supply their own "Changelog" heading
export const changelogHtml = () => marked.parse(source.replace(/^# Changelog\s*/, ""));
