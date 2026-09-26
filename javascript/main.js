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

    // On narrow screens the intro scrolls above the first section, and nothing is active while
    // it's being read. On wide screens it sits in the sticky sidebar and is always in view.
    this.intro = document.querySelector(".intro");
    this.introInFlow = window.matchMedia("(max-width: 1023px)");
    if (this.intro) observer.observe(this.intro);

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
    const entry = entries
      .filter((e) => e.isIntersecting && (e.target !== this.intro || this.introInFlow.matches))
      .at(-1);
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
 * QueryTyper - Types out the intro's SQL once, then "runs" it to reveal the result rows
 *
 * Untyped characters stay in the DOM as transparent text, so the box is laid out at its
 * final size from the start and nothing below it moves. Skipped under reduced motion.
 *
 * @class QueryTyper
 */
class QueryTyper {
  /**
   * @param {Object} [options]
   * @param {string} [options.selector=".query"]
   * @param {number} [options.duration=900] - Milliseconds to type the whole query
   */
  constructor({ selector = ".query", duration = 900 } = {}) {
    this.figure = document.querySelector(selector);
    this.code = this.figure?.querySelector("code");
    this.duration = duration;
  }

  init() {
    if (!this.figure || !this.code) return;
    if (!document.documentElement.classList.contains("motion-ok")) {
      this.figure.classList.add("is-run");
      return;
    }

    // Split every text node into a typed part and a transparent "ghost" part
    const walker = document.createTreeWalker(this.code, NodeFilter.SHOW_TEXT);
    const parts = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) parts.push(node);

    this.segments = parts.map((node) => {
      const typed = document.createTextNode("");
      const ghost = document.createElement("span");
      ghost.className = "ghost";
      ghost.textContent = node.textContent;
      node.replaceWith(typed, ghost);
      return { typed, ghost, text: ghost.textContent };
    });
    this.total = this.segments.reduce((sum, s) => sum + s.text.length, 0);

    this.caret = document.createElement("span");
    this.caret.className = "caret";
    this.caret.setAttribute("aria-hidden", "true");

    this.start = null;
    requestAnimationFrame((t) => this.frame(t));
  }

  frame(time) {
    this.start ??= time;
    const progress = Math.min(1, (time - this.start) / this.duration);
    let remaining = Math.round(progress * this.total);

    let caretPlaced = false;
    for (const segment of this.segments) {
      const shown = Math.min(segment.text.length, remaining);
      remaining -= shown;
      segment.typed.textContent = segment.text.slice(0, shown);
      segment.ghost.textContent = segment.text.slice(shown);
      // Caret sits at the first character not yet typed
      if (!caretPlaced && shown < segment.text.length) {
        segment.ghost.before(this.caret);
        caretPlaced = true;
      }
    }

    if (progress < 1) {
      requestAnimationFrame((t) => this.frame(t));
    } else {
      this.code.append(this.caret);
      setTimeout(() => {
        this.caret.remove();
        this.figure.classList.add("is-run");
      }, 250);
    }
  }
}

/**
 * CopyButton - Copies a value to the clipboard and confirms it in place
 *
 * The button ships hidden, since it can't work without JavaScript.
 *
 * @class CopyButton
 */
class CopyButton {
  /** @param {HTMLButtonElement} button - Has `data-copy` with the text to copy */
  constructor(button) {
    this.button = button;
    this.status = button.parentElement.querySelector(".copy-status");
  }

  init() {
    this.button.hidden = false;
    this.button.addEventListener("click", () => this.copy());
  }

  async copy() {
    const text = this.button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      this.flash("Copied");
    } catch {
      // Clipboard API missing or refused (older browsers, some embedded views)
      this.flash(CopyButton.legacyCopy(text) ? "Copied" : "Couldn't copy");
    }
  }

  /** @returns {boolean} Whether the pre-Clipboard-API copy command succeeded */
  static legacyCopy(text) {
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

  flash(message) {
    this.button.classList.add("is-copied");
    if (this.status) this.status.textContent = message;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.button.classList.remove("is-copied");
      if (this.status) this.status.textContent = "";
    }, 1800);
  }
}

/**
 * SkillLinks - Connects each skill to the roles where it was used
 *
 * Hovering or focusing a skill chip highlights every chip for that skill and the roles that
 * list it, and dims the rest; tapping or pressing Enter pins the highlight (touch has no
 * hover). A status line under the skills table spells the connection out in words.
 *
 * @class SkillLinks
 */
class SkillLinks {
  /**
   * @param {Object} [options]
   * @param {string} [options.root="#content"] - Element that gets `is-linking` while active
   * @param {string} [options.status=".skills-status"]
   */
  constructor({ root = "#content", status = ".skills-status" } = {}) {
    this.root = document.querySelector(root);
    this.status = document.querySelector(status);
    this.chips = [...document.querySelectorAll(".chip[data-skill]")];
    this.roles = [...document.querySelectorAll(".list-item-role[data-skills]")];
    this.pinned = null;
    this.hint = "Hover or tap a skill to see where I've used it.";
  }

  init() {
    if (!this.root || !this.chips.length) return;

    this.chips.forEach((chip) => {
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("aria-pressed", "false");

      const key = chip.dataset.skill;
      chip.addEventListener("mouseenter", () => this.pinned || this.show(key));
      chip.addEventListener("mouseleave", () => this.pinned || this.clear());
      chip.addEventListener("focus", () => this.pinned || this.show(key));
      chip.addEventListener("blur", () => this.pinned || this.clear());
      chip.addEventListener("click", () => this.toggle(key));
      chip.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.toggle(key);
        } else if (event.key === "Escape") {
          this.unpin();
        }
      });
    });

    // Clicking anywhere else releases a pinned highlight
    document.addEventListener("click", (event) => {
      if (this.pinned && !event.target.closest(".chip")) this.unpin();
    });

    if (this.status) {
      this.status.hidden = false;
      this.status.textContent = this.hint;
    }
  }

  toggle(key) {
    if (this.pinned === key) {
      this.unpin();
    } else {
      this.pinned = key;
      this.show(key);
    }
  }

  unpin() {
    this.pinned = null;
    this.clear();
  }

  /** @param {string} key - Skill key, as in data-skill */
  show(key) {
    const roles = this.roles.filter((role) => role.dataset.skills.split(" ").includes(key));

    this.root.classList.add("is-linking");
    this.chips.forEach((chip) => {
      const linked = chip.dataset.skill === key;
      chip.classList.toggle("is-linked", linked);
      chip.setAttribute("aria-pressed", String(linked && this.pinned === key));
    });
    this.roles.forEach((role) => role.classList.toggle("is-linked", roles.includes(role)));

    if (this.status) {
      const name = this.chips.find((chip) => chip.dataset.skill === key).textContent;
      const titles = roles.map((role) => role.querySelector(".list-item-role-title").textContent);
      this.status.textContent = titles.length
        ? `-- ${name}: ${titles.join("; ")}`
        : `-- ${name}: coursework and side projects`;
    }
  }

  clear() {
    this.root.classList.remove("is-linking");
    this.chips.forEach((chip) => {
      chip.classList.remove("is-linked");
      chip.setAttribute("aria-pressed", "false");
    });
    this.roles.forEach((role) => role.classList.remove("is-linked"));
    if (this.status) this.status.textContent = this.hint;
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

  new QueryTyper().init();
  document.querySelectorAll(".copy-button").forEach((button) => new CopyButton(button).init());
  new ResumePreview().init();
  new ScrollSpy().init();
  new SkillLinks().init();
  new Reveal().init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}
