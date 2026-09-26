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
 * ScrollSpy - Marks the nav link for the section currently being read
 *
 * A section counts as current while it crosses a thin band just below the sticky header.
 * On phones the nav scrolls sideways, so the active link is also kept in view.
 *
 * @class ScrollSpy
 */
class ScrollSpy {
  /**
   * @param {Object} [options]
   * @param {string} [options.linkSelector=".nav-link"] - Links whose href is "#section-id"
   * @param {string} [options.activeClass="active"]
   */
  constructor({ linkSelector = ".nav-link", activeClass = "active" } = {}) {
    this.activeClass = activeClass;
    this.links = new Map(
      [...document.querySelectorAll(linkSelector)]
        .map((link) => [document.getElementById(link.hash.slice(1)), link])
        .filter(([section]) => section)
    );
    this.current = null;
  }

  init() {
    if (!this.links.size || !("IntersectionObserver" in window)) return;

    // The band sits 25-35% down the viewport, below the header on any screen
    const observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
      rootMargin: "-25% 0px -65% 0px",
    });
    this.links.forEach((_, section) => observer.observe(section));

    // Nothing is active while the intro above the first section is being read
    const intro = document.querySelector(".hero");
    if (intro) observer.observe(intro);

    // The last section is often too short to reach the band before the page ends
    window.addEventListener("scroll", () => this.checkBottom(), { passive: true });

    // A clicked link stays active through the jump, even for a section near the end of the
    // page that can't scroll up to the band; the visitor's own scrolling hands control back
    this.links.forEach((link, section) => {
      link.addEventListener("click", () => {
        this.pinned = section;
        this.setActive(section);
      });
    });
    const unpin = () => (this.pinned = null);
    ["wheel", "touchstart", "keydown"].forEach((type) => window.addEventListener(type, unpin, { passive: true }));
  }

  onIntersect(entries) {
    if (this.pinned || this.checkBottom()) return;
    const entry = entries.filter((e) => e.isIntersecting).at(-1);
    if (entry) this.setActive(entry.target);
  }

  /** @returns {boolean} Whether the page is scrolled to the end (and the last section was made active) */
  checkBottom() {
    if (this.pinned) return false;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) this.setActive([...this.links.keys()].at(-1));
    return atBottom;
  }

  /** @param {HTMLElement} section - A tracked section, or any other element to clear the highlight */
  setActive(section) {
    if (section === this.current) return;
    this.current = section;

    this.links.forEach((link, s) => {
      const active = s === section;
      link.classList.toggle(this.activeClass, active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    // Keep the active tab visible in the horizontally scrolling mobile nav, without moving the page
    const link = this.links.get(section);
    const nav = link?.closest(".navigation");
    if (nav && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
    }
  }
}

/**
 * Reveal - Adds `is-visible` to elements as they scroll into view, once
 *
 * The CSS only hides `.reveal` elements when <html> has `motion-ok`, which the head script
 * sets when JavaScript runs and reduced motion isn't requested.
 *
 * @class Reveal
 */
class Reveal {
  /**
   * @param {Object} [options]
   * @param {string} [options.selector=".reveal"]
   * @param {number} [options.threshold=0.12] - Fraction visible before revealing
   */
  constructor({ selector = ".reveal", threshold = 0.12 } = {}) {
    this.elements = document.querySelectorAll(selector);
    this.threshold = threshold;
  }

  init() {
    const reveal = (el) => el.classList.add("is-visible");

    if (!("IntersectionObserver" in window)) {
      this.elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            reveal(entry.target);
            observer.unobserve(entry.target);
          });
      },
      { threshold: this.threshold, rootMargin: "0px 0px -5% 0px" }
    );
    this.elements.forEach((el) => observer.observe(el));
  }
}

/**
 * Toggle `is-stuck` on the header once the hero has scrolled out from under it.
 * @param {string} [headerSelector=".site-header"]
 * @param {string} [heroSelector=".hero-name"]
 */
function watchHeader(headerSelector = ".site-header", heroSelector = ".hero-name") {
  const header = document.querySelector(headerSelector);
  const hero = document.querySelector(heroSelector);
  if (!header || !hero || !("IntersectionObserver" in window)) {
    header?.classList.add("is-stuck");
    return;
  }

  new IntersectionObserver(([entry]) => header.classList.toggle("is-stuck", !entry.isIntersecting), {
    rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
  }).observe(hero);
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
  new ScrollSpy().init();
  new Reveal().init();
  watchHeader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}
