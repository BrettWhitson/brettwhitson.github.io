/**
 * @fileoverview Copy-to-clipboard button.
 * The button ships hidden, since it can't work without JavaScript.
 */

import { guard } from "./guard.js";
// Pre-Clipboard-API copy command; returns whether it succeeded
function legacyCopy(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

/**
 * Svelte action for a button with `data-copy`; confirms in the sibling `.copy-status`.
 * @param {HTMLButtonElement} button
 */
function copy(button) {
  const status = button.parentElement.querySelector(".copy-status");
  let timer;

  function flash(message) {
    button.classList.add("is-copied");
    if (status) status.textContent = message;
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.classList.remove("is-copied");
      if (status) status.textContent = "";
    }, 1800);
  }

  async function onClick() {
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      flash("Copied");
    } catch {
      // Clipboard API missing or refused (older browsers, some embedded views)
      flash(legacyCopy(text) ? "Copied" : "Couldn't copy");
    }
  }

  button.hidden = false;
  button.addEventListener("click", onClick);

  return {
    destroy() {
      clearTimeout(timer);
      button.removeEventListener("click", onClick);
    },
  };
}

const guarded = guard("copy", copy);
export { guarded as copy };
