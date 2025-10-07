/**
 * @fileoverview Main portfolio controller implementing a modern JavaScript architecture
 * @description This file contains the PortfolioController class which manages the entire
 * portfolio site lifecycle including data loading, DOM manipulation, and responsive behavior.
 * Built with vanilla JavaScript and the custom BuilderJS DOM manipulation library.
 *
 * @author Brett Whitson
 * @version 1.0.0
 * @since 1.0.0
 * @license MIT
 *
 * @requires BuilderJS - Custom DOM manipulation library
 * @see {@link https://brettwhitson.github.io} Portfolio Site
 * @see {@link https://github.com/BrettWhitson/brettwhitson.github.io} Source Code
 *
 * @example
 * // Initialize the portfolio controller
 * const portfolio = new PortfolioController({
 *   debug: true,
 *   dataUrl: "./data/data.json"
 * });
 *
 * // Initialize the portfolio
 * await portfolio.init();
 */

/**
 * PortfolioController - Main controller class for managing the portfolio site
 *
 * This class provides a complete architecture for managing a data-driven portfolio site.
 * It handles data loading, DOM caching, section building, responsive behavior, and error handling.
 *
 * @class PortfolioController
 * @classdesc Professional portfolio site controller with comprehensive error handling and modern DOM manipulation
 * @since 1.0.0
 *
 * @example
 * // Create a new portfolio instance
 * const portfolio = new PortfolioController({
 *   debug: true,
 *   dataUrl: "./data/portfolio.json",
 *   mobileBreakpoint: 768
 * });
 *
 * // Initialize and build the portfolio
 * try {
 *   await portfolio.init();
 *   console.log('Portfolio loaded successfully');
 * } catch (error) {
 *   console.error('Portfolio failed to load:', error);
 * }
 */
class PortfolioController {
  /**
   * Create a new PortfolioController instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.dataUrl="./data/data.json"] - URL to portfolio data
   * @param {number} [options.mobileBreakpoint=980] - Mobile breakpoint in pixels
   */
  constructor(options = {}) {
    // Validate options
    if (typeof options !== "object" || options === null) {
      throw new TypeError("Options must be an object");
    }

    this.debug = Boolean(options.debug);
    this.dataUrl = typeof options.dataUrl === "string" ? options.dataUrl : "./data/data.json";
    this.mobileBreakpoint = typeof options.mobileBreakpoint === "number" ? options.mobileBreakpoint : 980;

    // DOM cache
    this.dom = {};
    this.data = null;

    // Configuration
    this.config = Object.freeze({
      selectors: Object.freeze({
        linklist: ".linklist",
        content: "#content",
        extIcons: ".ext-icon-list",
        langIcons: ".lang-icon-list",
        toolIcons: ".tool-icon-list",
      }),
      classes: Object.freeze({
        section: "section",
        sectionTitle: "section-title",
        sectionBody: "section-body",
        sectionBodyList: "section-body-list",
        sectionListItem: "section-list-item",
        listItemHeader: "list-item-header",
        listItemSubheader: "list-item-subheader",
        listItemSubsubheader: "list-item-subsubheader",
        listItemMain: "list-item-main",
        mobileHide: "mobile-hide",
        mobile: "mobile",
        bounce: "bounce",
        sectionBodyIframe: "section-body-iframe",
      }),
    });

    // Section builder registry
    this.sectionBuilders = Object.freeze({
      pg: this.buildPgSection.bind(this),
      ls: this.buildLsSection.bind(this),
      rs: this.buildRsSection.bind(this),
    });

    // Bind methods to maintain context (only public methods that might be called externally)
    this.init = this.init.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  // === UTILITY METHODS ===

  /**
   * Query selector wrapper with validation
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null}
   * @throws {TypeError} If selector is not a string
   */
  get(selector) {
    if (typeof selector !== "string" || !selector.trim()) {
      throw new TypeError("Selector must be a non-empty string");
    }

    try {
      return document.querySelector(selector);
    } catch (error) {
      this.logError(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Query selector all wrapper with validation
   * @param {string} selector - CSS selector
   * @returns {NodeList}
   * @throws {TypeError} If selector is not a string
   */
  getAll(selector) {
    if (typeof selector !== "string" || !selector.trim()) {
      throw new TypeError("Selector must be a non-empty string");
    }

    try {
      return document.querySelectorAll(selector);
    } catch (error) {
      this.logError(`Invalid selector: ${selector}`, error);
      return document.querySelectorAll(""); // Returns empty NodeList
    }
  }

  /**
   * Debug logging utility - only logs in debug mode
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debug && args.length > 0) {
      console.log("Portfolio:", ...args);
    }
  }

  /**
   * Error logging utility - always logs errors
   * @param {string} message - Error message
   * @param {Error} [error] - Error object for additional context
   */
  logError(message, error = null) {
    if (typeof message !== "string") {
      console.error("Portfolio Error: Invalid error message type");
      return;
    }

    if (error instanceof Error) {
      console.error(`Portfolio Error: ${message}`, error);
    } else if (error !== null) {
      console.error(`Portfolio Error: ${message}`, "Additional context:", error);
    } else {
      console.error(`Portfolio Error: ${message}`);
    }
  }

  // === INITIALIZATION ===

  /**
   * Initialize the portfolio controller
   * @returns {Promise<void>}
   * @throws {Error} If initialization fails
   */
  async init() {
    if (this.data !== null) {
      this.log("Controller already initialized");
      return;
    }

    try {
      this.log("Initializing portfolio controller...");

      // Check if BuilderJS is available
      if (typeof Builder === "undefined") {
        throw new Error("BuilderJS is not available. Please ensure builder.js is loaded.");
      }

      // Configure BuilderJS
      Builder.setValidationMode(this.debug ? "warn" : "silent");

      await this.loadPageData();
      this.cacheDOMElements();
      this.validateDOM();

      await this.buildPage();

      this.log("Portfolio initialization complete");
    } catch (error) {
      this.logError("Failed to initialize portfolio", error);
      // Reset state on failure
      this.data = null;
      this.dom = {};
      throw error;
    }
  }

  /**
   * Load page data from JSON with proper error handling
   * @returns {Promise<Object>} The loaded data object
   * @throws {Error} If data loading or validation fails
   */
  async loadPageData() {
    try {
      this.log("Loading page data...");

      if (!this.dataUrl) {
        throw new Error("No data URL configured");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(this.dataUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        this.log("Warning: Response may not be JSON");
      }

      this.data = await response.json();
      this.log("Data loaded successfully");

      // Validate data structure
      this.validateDataStructure();

      return this.data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out while loading data");
      }
      this.logError("Failed to load page data", error);
      throw error;
    }
  }

  /**
   * Cache DOM elements for reuse with error handling
   * @throws {Error} If critical DOM elements are missing
   */
  cacheDOMElements() {
    this.log("Caching DOM elements...");

    try {
      const newDom = {};
      const missingSelectors = [];

      Object.entries(this.config.selectors).forEach(([key, selector]) => {
        try {
          const element = this.get(selector);
          newDom[key] = element;

          if (!element) {
            missingSelectors.push(`${key} (${selector})`);
          }
        } catch (error) {
          this.logError(`Failed to query selector for ${key}: ${selector}`, error);
          newDom[key] = null;
          missingSelectors.push(`${key} (${selector})`);
        }
      });

      // Update DOM cache
      this.dom = newDom;

      if (missingSelectors.length > 0) {
        this.log(`Missing DOM elements: ${missingSelectors.join(", ")}`);
      }

      this.log("DOM elements cached");
    } catch (error) {
      this.logError("Failed to cache DOM elements", error);
      throw error;
    }
  }

  /**
   * Refresh/rebuild the DOM cache - useful when new elements are created dynamically
   */
  refreshCache() {
    this.log("Refreshing DOM cache...");
    this.cacheDOMElements();
  }

  /**
   * Validate required DOM elements exist
   * @throws {Error} If required DOM elements are missing
   */
  validateDOM() {
    const required = ["linklist", "content"];
    const missing = required.filter((key) => !this.dom[key]);

    if (missing.length > 0) {
      const missingDetails = missing
        .map((key) => {
          const selector = this.config.selectors[key];
          return `${key} (${selector})`;
        })
        .join(", ");

      throw new Error(`Required DOM elements missing: ${missingDetails}`);
    }

    this.log("DOM validation passed");
  }

  /**
   * Validate data structure with comprehensive checks
   * @throws {Error} If data structure is invalid
   */
  validateDataStructure() {
    if (!this.data) {
      throw new Error("No data loaded");
    }

    if (typeof this.data !== "object") {
      throw new Error("Data must be an object");
    }

    // Validate sections
    if (!this.data.sections || !Array.isArray(this.data.sections)) {
      throw new Error("Invalid data structure: sections missing or not array");
    }

    if (this.data.sections.length === 0) {
      throw new Error("No sections found in data");
    }

    // Validate each section
    this.data.sections.forEach((section, index) => {
      if (!section || typeof section !== "object") {
        throw new Error(`Section ${index} is not an object`);
      }

      const requiredFields = ["section", "title", "type"];
      const missingFields = requiredFields.filter((field) => !section[field]);

      if (missingFields.length > 0) {
        throw new Error(`Section ${index} missing required fields: ${missingFields.join(", ")}`);
      }

      const validTypes = ["pg", "ls", "rs"];
      if (!validTypes.includes(section.type)) {
        throw new Error(`Section ${index} has invalid type: ${section.type}. Valid types: ${validTypes.join(", ")}`);
      }
    });

    // Validate icons (optional)
    if (this.data.icons) {
      if (typeof this.data.icons !== "object") {
        throw new Error("Icons data must be an object");
      }
    }

    // Validate external links (optional)
    if (this.data.ext) {
      if (typeof this.data.ext !== "object") {
        throw new Error("External links data must be an object");
      }
    }

    this.log("Data structure validation passed");
  }

  // === PAGE BUILDING ===

  /**
   * Build the entire page with comprehensive error handling
   * @returns {Promise<void>}
   * @throws {Error} If page building fails
   */
  async buildPage() {
    if (!this.data) {
      throw new Error("No data available for building page");
    }

    this.log("Building page...");

    try {
      const buildSteps = [
        { name: "navigation", fn: () => this.buildNavigation() },
        { name: "sections", fn: () => this.buildSections() },
        { name: "cache refresh", fn: () => this.refreshCache() },
        { name: "external links", fn: () => this.buildExternalLinks() },
        { name: "dev icons", fn: () => this.buildDevIcons() },
      ];

      for (const step of buildSteps) {
        try {
          this.log(`Building ${step.name}...`);
          step.fn();
        } catch (error) {
          this.logError(`Failed to build ${step.name}`, error);
          // Continue with other steps even if one fails
        }
      }

      this.log("Page building complete");
    } catch (error) {
      this.logError("Critical error during page building", error);
      throw error;
    }
  }

  /**
   * Build navigation links with validation
   */
  buildNavigation() {
    if (!this.data?.sections || !Array.isArray(this.data.sections)) {
      this.log("No sections data available for navigation");
      return;
    }

    if (!this.dom.linklist) {
      this.log("Navigation container not found");
      return;
    }

    this.log(`Building navigation with ${this.data.sections.length} items...`);

    let successCount = 0;
    let errorCount = 0;

    this.data.sections.forEach((section, index) => {
      try {
        // Validate section data
        if (!section?.section || !section?.title) {
          throw new Error(`Invalid section data at index ${index}`);
        }

        // Create the li element and use scope to add the a child
        const listItem = new Builder("li").scope((listItem) => {
          listItem.addChild("a", {
            href: `#${section.section}-section`,
            innerText: section.title,
            "data-text": section.title,
          });
        });

        // Append the li element to the ul container
        listItem.appendTo(this.dom.linklist);
        successCount++;
      } catch (error) {
        this.logError(`Failed to build nav link for section ${index} (${section?.section || "unknown"})`, error);
        errorCount++;
      }
    });

    this.log(`Navigation building complete: ${successCount} success, ${errorCount} errors`);
  }

  /**
   * Build content sections with validation and error handling
   */
  buildSections() {
    if (!this.data?.sections || !Array.isArray(this.data.sections)) {
      this.log("No sections data available");
      return;
    }

    if (!this.dom.content) {
      this.log("Content container not found");
      return;
    }

    this.log(`Building ${this.data.sections.length} content sections...`);

    let successCount = 0;
    let errorCount = 0;

    this.data.sections.forEach((section, index) => {
      try {
        // Validate section data
        if (!section || typeof section !== "object") {
          throw new Error(`Section ${index} is not an object`);
        }

        if (!section.type) {
          throw new Error(`Section ${index} missing type`);
        }

        const builder = this.sectionBuilders[section.type];

        if (!builder) {
          throw new Error(`Unknown section type: ${section.type}`);
        }

        if (typeof builder !== "function") {
          throw new Error(`Invalid builder for type: ${section.type}`);
        }

        builder(section);
        successCount++;
        this.log(`Built section: ${section.section} (${section.type})`);
      } catch (error) {
        this.logError(`Failed to build section ${index} (${section?.section || "unknown"})`, error);
        errorCount++;
      }
    });

    this.log(`Section building complete: ${successCount} success, ${errorCount} errors`);
  }

  /**
   * Build external links
   */
  buildExternalLinks() {
    if (!this.data.ext || !this.dom.extIcons) return;

    this.log("Building external links...");

    Object.entries(this.data.ext).forEach(([key, entry]) => {
      if (!entry.link || !entry.icon) {
        this.log(`Invalid external link data for ${key}`);
        return;
      }

      try {
        // Create the complete link structure
        const linkElement = new Builder("a", {
          class: this.config.classes.bounce,
          href: entry.link,
          target: "_blank",
          rel: "noopener noreferrer",
          "aria-label": `Visit ${key}`,
        }).scope((icon) => {
          icon.addChild("i", {
            class: `devicon-${entry.icon}`,
            "aria-hidden": "true",
          });
        });

        // Append the complete link to the container
        linkElement.appendTo(this.dom.extIcons);
      } catch (error) {
        this.logError(`Failed to build external link for ${key}`, error);
      }
    });
  }

  /**
   * Build dev icons (languages and tools)
   */
  buildDevIcons() {
    if (!this.data.icons) return;

    this.log("Building dev icons...");

    // Build language icons
    if (this.data.icons.languages && this.dom.langIcons) {
      this.log("Building language icons");
      this.buildIconSet(this.data.icons.languages, this.dom.langIcons);
    } else {
      this.log("Language icons container not found or no language data");
    }

    // Build tool icons
    if (this.data.icons.tools && this.dom.toolIcons) {
      this.log("Building tool icons");
      this.buildIconSet(this.data.icons.tools, this.dom.toolIcons);
    } else {
      this.log("Tool icons container not found or no tool data");
    }
  }

  /**
   * Build a set of icons
   * @param {Array} icons - Array of icon names
   * @param {HTMLElement} container - Container element
   */
  buildIconSet(icons, container) {
    icons.forEach((icon) => {
      try {
        const iconBuilder = new Builder("span").scope((span) => {
          span.addChild("i", {
            class: `devicon-${icon}-plain`,
            title: icon,
          });
          span.addChild("span", {
            class: "icon-label",
            innerText: icon.charAt(0).toUpperCase() + icon.slice(1),
          });
        });

        iconBuilder.appendTo(container);
      } catch (error) {
        this.logError(`Failed to build icon for ${icon}`, error);
      }
    });
  }

  // === SECTION BUILDERS ===

  /**
   * Build paragraph section
   * @param {Object} section - Section data
   */
  buildPgSection(section) {
    this.log(`Building paragraph section: ${section.section}`);

    const sectionBuilder = new Builder("div", {
      id: `${section.section}-section`,
      class: this.config.classes.section,
    }).scope((div) => {
      // Section header
      div.addChild(
        "div",
        {
          class: "section-header",
        },
        (header) => {
          header.addChild("h2", {
            class: "section-title",
            innerText: section.title,
          });
        }
      );

      // Section body
      div.addChild(
        "div",
        {
          class: "section-body section-body-paragraph",
        },
        (body) => {
          body.addChild("p", {
            innerText: section.body,
          });
        }
      );
    });

    sectionBuilder.appendTo(this.dom.content);
  }

  /**
   * Build list section
   * @param {Object} section - Section data
   */
  buildLsSection(section) {
    this.log(`Building list section: ${section.section}`);

    const sectionBuilder = new Builder("div", {
      id: `${section.section}-section`,
      class: this.config.classes.section,
    }).scope((div) => {
      // Section header
      div.addChild(
        "div",
        {
          class: "section-header",
        },
        (header) => {
          header.addChild("h2", {
            class: "section-title",
            innerText: section.title,
          });
        }
      );

      // Section body
      div.addChild(
        "div",
        {
          class: "section-body section-body-list",
        },
        (body) => {
          body.addChild(
            "ul",
            {
              class: this.config.classes.sectionBodyList,
            },
            (listBuilder) => {
              // Build list items using scoped building
              section.body.forEach((item) => {
                listBuilder.addChild(
                  "li",
                  {
                    class: this.config.classes.sectionListItem,
                  },
                  (itemBuilder) => {
                    // Add item elements conditionally
                    if (item.header) {
                      itemBuilder.addChild("div", {
                        class: this.config.classes.listItemHeader,
                        innerText: item.header,
                      });
                    }

                    if (item.subheader) {
                      itemBuilder.addChild("div", {
                        class: this.config.classes.listItemSubheader,
                        innerText: item.subheader,
                      });
                    }

                    if (item.subsubheader) {
                      itemBuilder.addChild("div", {
                        class: this.config.classes.listItemSubsubheader,
                        innerText: item.subsubheader,
                      });
                    }

                    if (item.main) {
                      itemBuilder.addChild("div", {
                        class: this.config.classes.listItemMain,
                        innerHTML: item.main,
                      });
                    }
                  }
                );
              });
            }
          );
        }
      );
    });

    sectionBuilder.appendTo(this.dom.content);
  }

  /**
   * Build resume section (with responsive behavior)
   * @param {Object} section - Section data
   */
  buildRsSection(section) {
    this.log(`Building resume section: ${section.section}`);

    const sectionBuilder = new Builder("div", {
      id: `${section.section}-section`,
      class: this.config.classes.section,
    }).scope((div) => {
      // Section header
      div.addChild(
        "div",
        {
          class: "section-header",
        },
        (header) => {
          header.addChild("h2", {
            class: "section-title",
            innerText: section.title,
          });
        }
      );

      // Section body with buttons
      div.addChild(
        "div",
        {
          class: "section-body",
        },
        (body) => {
          // Button container
          body.addChild(
            "div",
            {
              class: "resume-actions",
            },
            (actions) => {
              // Download button
              actions.addChild("a", {
                href: section.file,
                innerText: "Download PDF",
                download: "whitson_resume_25.pdf",
                class: "btn btn-primary",
              });

              // Preview button
              actions.addChild("button", {
                innerText: "Preview",
                class: "btn btn-secondary",
                id: "resume-preview-btn",
              });

              // Add event listener after DOM is built
              this.addEventListenerAfterBuild("resume-preview-btn", "click", () => {
                this.toggleResumePreview(section.file);
              });
            }
          );

          // Hidden iframe container (will be shown when preview is clicked)
          body.addChild("div", {
            id: "resume-preview-container",
            class: "resume-preview-container hidden",
          });
        }
      );
    });

    sectionBuilder.appendTo(this.dom.content);
  }

  /**
   * Toggle resume preview iframe
   * @param {string} fileUrl - URL of the resume file
   */
  toggleResumePreview(fileUrl) {
    const container = document.getElementById("resume-preview-container");
    const button = document.getElementById("resume-preview-btn");

    if (!container || !button) {
      this.logError("Resume preview elements not found");
      return;
    }

    if (container.classList.contains("hidden")) {
      // Show preview
      container.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src = `${fileUrl}#toolbar=0`;
      iframe.id = "pdfFrame";
      iframe.title = "Resume PDF";
      container.appendChild(iframe);

      container.classList.remove("hidden");
      button.innerText = "Hide Preview";
      this.log("Resume preview shown");
    } else {
      // Hide preview
      container.classList.add("hidden");
      container.innerHTML = "";
      button.innerText = "Preview";
      this.log("Resume preview hidden");
    }
  } 
  // === PUBLIC API ===

  /**
   * Get current data
   * @returns {Object|null}
   */
  getData() {
    return this.data;
  }

  /**
   * Get DOM cache
   * @returns {Object}
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Refresh the page (reload data and rebuild) with proper cleanup
   * @returns {Promise<void>}
   * @throws {Error} If refresh fails
   */
  async refresh() {
    try {
      this.log("Refreshing portfolio...");

      // Clear existing content safely
      this.clearContent();

      // Reset state
      this.data = null;
      this.dom = {};

      // Rebuild everything
      await this.init();

      this.log("Portfolio refresh complete");
    } catch (error) {
      this.logError("Failed to refresh portfolio", error);
      throw error;
    }
  }

  /**
   * Clear existing content from DOM containers
   * @private
   */
  clearContent() {
    try {
      const containersToClear = ["content", "linklist"];

      containersToClear.forEach((containerKey) => {
        const container = this.dom[containerKey];
        if (container && typeof container.innerHTML !== "undefined") {
          container.innerHTML = "";
          this.log(`Cleared ${containerKey} container`);
        }
      });
    } catch (error) {
      this.logError("Error clearing content", error);
    }
  }

  /**
   * Add event listener to element after DOM is built (utility for Builder.js)
   * @param {string} elementId - ID of the element to add listener to
   * @param {string} event - Event type (e.g., 'click', 'change')
   * @param {Function} handler - Event handler function
   */
  addEventListenerAfterBuild(elementId, event, handler) {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener(event, handler);
        this.log(`Event listener added to ${elementId} for ${event} event`);
      } else {
        this.logError(`Element not found: ${elementId}`);
      }
    }, 0);
  }
}

/**
 * ThemeController - Manages light/dark theme switching
 *
 * This class handles theme detection, switching, and persistence using CSS custom properties
 * and data attributes. It respects system preferences and remembers user choices.
 *
 * @class ThemeController
 * @since 1.0.0
 */
class ThemeController {
  /**
   * Create a new ThemeController instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.storageKey="theme"] - localStorage key for theme preference
   */
  constructor(options = {}) {
    this.debug = Boolean(options.debug);
    this.storageKey = options.storageKey || "theme";

    this.themes = Object.freeze({
      LIGHT: "light",
      DARK: "dark",
    });

    // Bind methods
    this.init = this.init.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
  }

  /**
   * Debug logging utility
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debug && args.length > 0) {
      console.log("ThemeController:", ...args);
    }
  }

  /**
   * Initialize the theme controller
   */
  init() {
    try {
      this.log("Initializing theme controller...");

      // Set initial theme
      this.initializeTheme();

      // Set up theme toggle button
      this.setupThemeToggle();

      // Listen for system theme changes
      this.setupSystemThemeListener();

      this.log("Theme controller initialized");
    } catch (error) {
      console.error("Failed to initialize theme controller:", error);
    }
  }

  /**
   * Initialize theme based on user preference or system setting
   */
  initializeTheme() {
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemTheme();
    const theme = savedTheme || systemTheme;

    this.log(`Initializing theme: saved=${savedTheme}, system=${systemTheme}, final=${theme}`);
    this.setTheme(theme);
  }

  /**
   * Get saved theme from localStorage
   * @returns {string|null} Saved theme or null if not found
   */
  getSavedTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && Object.values(this.themes).includes(saved)) {
        return saved;
      }
    } catch (error) {
      console.warn("Could not read theme from localStorage:", error);
    }
    return null;
  }

  /**
   * Get system theme preference
   * @returns {string} System theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return this.themes.DARK;
    }
    return this.themes.LIGHT;
  }

  /**
   * Get current active theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    return current || this.getSystemTheme();
  }

  /**
   * Set the active theme
   * @param {string} theme - Theme to set (light or dark)
   */
  setTheme(theme) {
    if (!Object.values(this.themes).includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }

    this.log(`Setting theme to: ${theme}`);

    // Set data attribute for CSS
    document.documentElement.setAttribute("data-theme", theme);

    // Save to localStorage
    this.saveTheme(theme);

    // Update theme toggle button
    this.updateThemeToggleButton(theme);

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme, previous: this.getCurrentTheme() },
      })
    );
  }

  /**
   * Save theme preference to localStorage
   * @param {string} theme - Theme to save
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn("Could not save theme to localStorage:", error);
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.themes.DARK ? this.themes.LIGHT : this.themes.DARK;
    this.setTheme(newTheme);
  }

  /**
   * Set up theme toggle button event listeners
   */
  setupThemeToggle() {
    const toggleButton = document.querySelector(".theme-toggle-btn");
    if (!toggleButton) {
      console.warn("Theme toggle button not found");
      return;
    }

    toggleButton.addEventListener("click", this.toggleTheme);

    // Add keyboard support
    toggleButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.toggleTheme();
      }
    });

    this.log("Theme toggle button configured");
  }

  /**
   * Update theme toggle button appearance
   * @param {string} theme - Current theme
   */
  updateThemeToggleButton(theme) {
    const button = document.querySelector(".theme-toggle-btn");
    if (!button) return;

    // Update button title/aria-label
    const newLabel = theme === this.themes.DARK ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", newLabel);
    button.setAttribute("title", newLabel);
  }

  /**
   * Set up system theme change listener
   */
  setupSystemThemeListener() {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", this.handleSystemThemeChange);

    this.log("System theme listener configured");
  }

  /**
   * Handle system theme changes
   * @param {MediaQueryListEvent} event - Media query change event
   */
  handleSystemThemeChange(event) {
    // Only respond to system changes if user hasn't set a manual preference
    const savedTheme = this.getSavedTheme();
    if (savedTheme) {
      this.log("Ignoring system theme change - user has manual preference");
      return;
    }

    const newSystemTheme = event.matches ? this.themes.DARK : this.themes.LIGHT;
    this.log(`System theme changed to: ${newSystemTheme}`);
    this.setTheme(newSystemTheme);
  }

  /**
   * Reset theme to system preference
   */
  resetToSystemTheme() {
    try {
      localStorage.removeItem(this.storageKey);
      const systemTheme = this.getSystemTheme();
      this.setTheme(systemTheme);
      this.log("Theme reset to system preference");
    } catch (error) {
      console.warn("Could not reset theme:", error);
    }
  }
}

// === INITIALIZATION ===

/**
 * Initialize portfolio when DOM is ready with comprehensive error handling
 *
 * This function serves as the main entry point for the portfolio application.
 * It performs environment checks, prevents duplicate initialization, creates
 * the global portfolio controller instance, and provides user-friendly error
 * handling with visual feedback.
 *
 * @function initializePortfolio
 * @global
 * @since 1.0.0
 * @author Brett Whitson
 *
 * @description
 * - Checks for browser environment compatibility
 * - Prevents duplicate initialization attempts
 * - Creates global PortfolioController instance with debug enabled
 * - Provides visual error notifications for users
 * - Handles both synchronous and asynchronous initialization errors
 *
 * @example
 * // Function is called automatically when DOM loads
 * // Manual call (if needed):
 * initializePortfolio();
 *
 * @example
 * // Access the global controller after initialization
 * if (window.portfolioController) {
 *   console.log('Portfolio data:', window.portfolioController.getData());
 *   await window.portfolioController.refresh();
 * }
 *
 * @throws {Error} Critical initialization errors are logged but don't stop execution
 *
 * @see {@link PortfolioController} Main controller class
 * @see {@link PortfolioController#init} Controller initialization method
 */
function initializePortfolio() {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("Portfolio: Not in browser environment, skipping initialization");
      return;
    }

    // Check if already initialized
    if (window.portfolioController) {
      console.log("Portfolio: Already initialized");
      return;
    }

    // Determine debug mode: auto-detect localhost or override with URL params
    const urlParams = new URLSearchParams(window.location.search);
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const debugMode = urlParams.has("debug")
      ? urlParams.get("debug") !== "false" // ?debug or ?debug=true enables, ?debug=false disables
      : isLocalhost; // Default to true on localhost, false in production

    // Create global portfolio controller instance
    window.portfolioController = new PortfolioController({
      debug: debugMode,
    });

    // Create global theme controller instance
    window.themeController = new ThemeController({
      debug: debugMode,
    });

    // Initialize both controllers
    const initPromises = [
      window.portfolioController.init(),
      Promise.resolve(window.themeController.init()), // Theme controller init is synchronous
    ];

    Promise.all(initPromises).catch((error) => {
      console.error("Failed to initialize portfolio:", error);

      // Attempt to show user-friendly error
      const errorMessage = document.createElement("div");
      errorMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 12px;
        border-radius: 4px;
        z-index: 9999;
        font-family: monospace;
        max-width: 300px;
      `;
      errorMessage.textContent = `Portfolio failed to load: ${error.message}`;
      document.body.appendChild(errorMessage);

      // Auto-remove error after 10 seconds
      setTimeout(() => {
        if (errorMessage.parentNode) {
          errorMessage.parentNode.removeChild(errorMessage);
        }
      }, 10000);
    });
  } catch (error) {
    console.error("Critical error during portfolio initialization:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePortfolio);
} else {
  // DOM is already ready
  initializePortfolio();
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = PortfolioController;
}
