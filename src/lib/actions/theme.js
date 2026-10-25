/**
 * @fileoverview Light/dark theme toggle.
 * Follows the operating system's color scheme until the visitor picks a theme with the toggle;
 * that explicit choice is saved and wins from then on. The saved theme is first applied by the
 * inline script in app.html, before first paint.
 */

import { guard } from "./guard.js";
export const STORAGE_KEY = "theme";
const THEMES = ["light", "dark"];

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Svelte action for the theme toggle button. Announces every change with a `themechange`
 * event on window ({ theme, previous }).
 * @param {HTMLButtonElement} button
 */
function theme(button) {
  const root = document.documentElement;
  const media = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;

  const getSystemTheme = () => (media?.matches ? "dark" : "light");
  const getCurrentTheme = () => root.dataset.theme || getSystemTheme();

  function setTheme(next, { persist = true } = {}) {
    if (!THEMES.includes(next)) {
      console.warn(`Invalid theme: ${next}`);
      return;
    }

    const previous = getCurrentTheme();
    root.dataset.theme = next;

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode or blocked storage: the choice just won't survive a reload
      }
    }

    const label = next === "dark" ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);

    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next, previous } }));
  }

  function toggleTheme() {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    const motionOk = root.classList.contains("motion-ok");

    if (!document.startViewTransition || !motionOk) {
      setTheme(next);
      return;
    }

    // Grow the new theme outward from the toggle button in a circle
    const { left, top, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(() => setTheme(next));
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }

  // Forget the saved choice and follow the operating system again
  function resetToSystemTheme() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing saved to remove
    }
    setTheme(getSystemTheme(), { persist: false });
  }

  const onMediaChange = (event) => {
    if (getSavedTheme()) return;
    setTheme(event.matches ? "dark" : "light", { persist: false });
  };

  setTheme(getSavedTheme() || getSystemTheme(), { persist: false });
  button.addEventListener("click", toggleTheme);
  media?.addEventListener("change", onMediaChange);

  // Console handle for poking at the theme from devtools
  const controller = { setTheme, toggleTheme, resetToSystemTheme, getCurrentTheme };
  window.themeController = controller;

  return {
    destroy() {
      button.removeEventListener("click", toggleTheme);
      media?.removeEventListener("change", onMediaChange);
      if (window.themeController === controller) delete window.themeController;
    },
  };
}

const guarded = guard("theme", theme);
export { guarded as theme };
