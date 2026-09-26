/**
 * @fileoverview Progressive enhancements for the static portfolio page.
 * @description The page content is rendered to HTML at build time (scripts/build.mjs), so
 * everything here is optional behavior layered on top: the theme toggle and the inline
 * resume preview. The page is fully readable with this script disabled.
 *
 * @author Brett Whitson
 * @license MIT
 * @see {@link https://github.com/BrettWhitson/brettwhitson.github.io} Source Code
 */

/**
 * ThemeController - Manages light/dark theme switching
 *
 * Follows the operating system's color scheme until the visitor picks a theme with the
 * toggle; that explicit choice is saved and wins from then on. The initial saved theme is
 * applied by an inline script in the document head, before first paint.
 *
 * @class ThemeController
 * @example
 * const theme = new ThemeController();
 * theme.init();
 * window.addEventListener("themechange", (e) => console.log(e.detail.theme));
 */
class ThemeController {
  /**
   * @param {Object} [options]
   * @param {string} [options.storageKey="theme"] - localStorage key for the saved choice
   * @param {string} [options.toggleSelector=".theme-toggle-btn"] - Toggle button selector
   */
  constructor({ storageKey = "theme", toggleSelector = ".theme-toggle-btn" } = {}) {
    this.storageKey = storageKey;
    this.toggleSelector = toggleSelector;
    this.themes = Object.freeze({ LIGHT: "light", DARK: "dark" });
    this.media = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  }

  /** Wire up the toggle button and the OS color-scheme listener. */
  init() {
    this.setTheme(this.getSavedTheme() || this.getSystemTheme(), { persist: false });

    this.button = document.querySelector(this.toggleSelector);
    this.button?.addEventListener("click", () => this.toggleTheme());

    this.media?.addEventListener("change", (event) => {
      if (this.getSavedTheme()) return;
      this.setTheme(event.matches ? this.themes.DARK : this.themes.LIGHT, { persist: false });
    });
  }

  /** @returns {string|null} The saved theme, or null if the visitor never chose one */
  getSavedTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return Object.values(this.themes).includes(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  /** @returns {string} The operating system's preferred theme */
  getSystemTheme() {
    return this.media?.matches ? this.themes.DARK : this.themes.LIGHT;
  }

  /** @returns {string} The theme currently applied to the page */
  getCurrentTheme() {
    return document.documentElement.dataset.theme || this.getSystemTheme();
  }

  /**
   * Apply a theme and announce it with a `themechange` event on window.
   * @param {string} theme - "light" or "dark"
   * @param {Object} [options]
   * @param {boolean} [options.persist=true] - Save the choice to localStorage
   */
  setTheme(theme, { persist = true } = {}) {
    if (!Object.values(this.themes).includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }

    const previous = this.getCurrentTheme();
    document.documentElement.dataset.theme = theme;

    if (persist) {
      try {
        localStorage.setItem(this.storageKey, theme);
      } catch {
        // Private mode or blocked storage: the choice just won't survive a reload
      }
    }

    const label = theme === this.themes.DARK ? "Switch to light mode" : "Switch to dark mode";
    this.button?.setAttribute("aria-label", label);
    this.button?.setAttribute("title", label);

    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme, previous } }));
  }

  /** Switch between light and dark, saving the choice. */
  toggleTheme() {
    this.setTheme(this.getCurrentTheme() === this.themes.DARK ? this.themes.LIGHT : this.themes.DARK);
  }

  /** Forget the saved choice and follow the operating system again. */
  resetToSystemTheme() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Nothing saved to remove
    }
    this.setTheme(this.getSystemTheme(), { persist: false });
  }
}

/**
 * ResumePreview - Upgrades the resume "Preview" link to an inline PDF viewer
 *
 * Without JavaScript, or on narrow screens where mobile browsers can't render a PDF inside
 * an iframe, the link simply opens the PDF.
 *
 * @class ResumePreview
 */
class ResumePreview {
  /**
   * @param {Object} [options]
   * @param {string} [options.buttonId="resume-preview-btn"]
   * @param {string} [options.containerId="resume-preview-container"]
   * @param {string} [options.inlineQuery="(min-width: 769px)"] - When to preview inline
   */
  constructor({
    buttonId = "resume-preview-btn",
    containerId = "resume-preview-container",
    inlineQuery = "(min-width: 769px)",
  } = {}) {
    this.button = document.getElementById(buttonId);
    this.container = document.getElementById(containerId);
    this.inline = window.matchMedia(inlineQuery);
  }

  init() {
    if (!this.button || !this.container) return;

    this.button.addEventListener("click", (event) => {
      if (!this.inline.matches) return; // let the link open the PDF
      event.preventDefault();
      this.toggle();
    });
  }

  /** @returns {boolean} Whether the inline preview is showing */
  get isOpen() {
    return !this.container.classList.contains("hidden");
  }

  toggle() {
    if (this.isOpen) {
      this.container.classList.add("hidden");
      this.container.replaceChildren();
    } else {
      const iframe = document.createElement("iframe");
      iframe.src = `${this.button.getAttribute("href")}#toolbar=0`;
      iframe.id = "pdfFrame";
      iframe.title = "Resume PDF";
      this.container.replaceChildren(iframe);
      this.container.classList.remove("hidden");
    }

    this.button.textContent = this.isOpen ? "Hide Preview" : "Preview";
    this.button.setAttribute("aria-expanded", String(this.isOpen));
  }
}

/**
 * Start the page enhancements once the DOM is parsed.
 * @function initializePage
 * @global
 */
function initializePage() {
  window.themeController = new ThemeController();
  window.themeController.init();

  new ResumePreview().init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}
