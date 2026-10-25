/**
 * @fileoverview Upgrades the resume "Preview" link to an inline PDF viewer.
 * Without JavaScript, or on narrow screens where mobile
 * browsers can't render a PDF inside an iframe, the link simply opens the PDF.
 */

import { guard } from "./guard.js";
/**
 * Svelte action for the preview link; its `aria-controls` names the viewer container.
 * @param {HTMLAnchorElement} button
 * @param {{ inlineQuery?: string }} [options]
 */
function resumePreview(button, { inlineQuery = "(min-width: 769px)" } = {}) {
  const container = document.getElementById(button.getAttribute("aria-controls"));
  if (!container) return;
  const inline = window.matchMedia(inlineQuery);

  // The label is the link's first text node; the "(opens in a new tab)" note after it is only
  // true when the link isn't being upgraded to an inline preview
  const label = button.firstChild;
  const newTabNote = button.querySelector(".visually-hidden");

  const isOpen = () => !container.classList.contains("hidden");

  function toggle() {
    if (isOpen()) {
      container.classList.add("hidden");
      container.replaceChildren();
    } else {
      const iframe = document.createElement("iframe");
      iframe.src = `${button.getAttribute("href")}#toolbar=0`;
      iframe.id = "pdfFrame";
      iframe.title = "Resume PDF";
      container.replaceChildren(iframe);
      container.classList.remove("hidden");
    }

    label.nodeValue = isOpen() ? "Hide Preview" : "Preview";
    button.setAttribute("aria-expanded", String(isOpen()));
  }

  // Match the link's semantics to what a click will do at the current width
  function syncMode() {
    if (inline.matches) {
      button.setAttribute("role", "button");
      newTabNote?.remove();
    } else {
      if (isOpen()) toggle();
      button.removeAttribute("role");
      if (newTabNote) button.append(newTabNote);
    }
  }

  function onClick(event) {
    if (!inline.matches) return; // let the link open the PDF
    event.preventDefault();
    toggle();
  }

  syncMode();
  inline.addEventListener("change", syncMode);
  button.addEventListener("click", onClick);

  return {
    destroy() {
      inline.removeEventListener("change", syncMode);
      button.removeEventListener("click", onClick);
    },
  };
}

const guarded = guard("resumePreview", resumePreview);
export { guarded as resumePreview };
