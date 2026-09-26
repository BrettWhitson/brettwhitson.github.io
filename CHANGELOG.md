# Changelog

## [5.0.0] - 2026-09-25

### Changed

- **New design** - Two-column layout: a sticky intro and numbered section index on the left, content on the
  right. Below 1024px the intro scrolls away and the index becomes a sticky horizontal bar
- **Database-flavored details** - The intro "runs" a SQL query whose result rows are the roles; monospace
  `01 / section` labels; a `skill_group | members` skills table; a faint dot grid behind the intro
- Type: Newsreader for the name, Inter for body text, JetBrains Mono for labels, dates, and code
- Projects and education are rows with the date in its own column; hovering a row quiets the others
- Skills moved directly under Experience
- Profile icons are inline SVG; the devicon font is no longer loaded

### Added

- **Skill linking** - Each role lists the skills it used. Hovering, focusing, or tapping a skill highlights
  the roles that used it, dims the rest, and spells it out under the skills table
- **Copy email** button with inline confirmation
- About section stats (years in university IT, years on Banner and Oracle, roles)
- Organization captions such as "4 roles, 2018 to present", computed from the role dates
- Build validation for unknown skill keys and icon names

### Removed

- Global list margins that doubled up spacing in every list

---

## [4.1.1] - 2026-09-25

### Changed

- Removed BuilderJS from projects and the About text; projects are back to the original five from the resume

### Fixed

- A role with an empty `bullets` array rendered a stray "0"
- Build now fails when required `site` metadata (email, url, description, image, headline) is missing, instead of
  writing empty meta tags

---

## [4.1.0] - 2026-09-25

### Added

- **Hero** - Large portrait, name, role, and resume/email actions above the fold
- **Experience timeline** - Roles at one organization hang off a vertical rail, current role highlighted; the rail
  draws and the dots appear in order when the section scrolls into view
- **Scroll-spy** - The nav underlines the section being read and keeps it visible in the scrolling mobile nav
- **Scroll reveal** - Sections fade up once as they enter the viewport
- Header shows the name and a border only after the hero scrolls away
- Source Serif 4 for the name and section titles

### Changed

- Sections are open blocks with the title in a sticky left column, instead of boxed cards
- Projects are two-up cards; skill tiles are smaller
- Header is a slim bar; profile links move to the hero below 1024px
- Content column narrowed to 60rem for readable line lengths
- Dark mode links use a lighter blue for contrast

### Removed

- Global `* { transition }` rule, hover lift on non-interactive sections, load-time staggered section animations
- Unused card components and color tokens

### Fixed

- Keyframe animations now respect `prefers-reduced-motion`; scripted motion is skipped entirely when reduced motion
  is requested or JavaScript is off, so content is never left hidden

---

## [4.0.0] - 2026-09-25

### Changed

- **Static HTML** - The page is rendered at build time by `scripts/build.mjs` from `data/data.json` and
  `templates/index.html` instead of being assembled in the browser. Search engines, link previews, and no-JS visitors
  now get the full content
- **Runtime script** - `main.js` is down to `ThemeController` and `ResumePreview`; `PortfolioController` and the
  BuilderJS runtime dependency are gone
- Section anchors are now `#about`, `#experience`, etc. (were `#about-section`)
- Semantic markup: `section`/`h2`/`h3` headings, a single `h1`, skip link, list markup for skill tiles and profile links

### Added

- JSON-LD `Person` data, `sitemap.xml`, and `robots.txt`
- Saved theme applied before first paint (no flash of the wrong theme)
- Resume preview falls back to opening the PDF on narrow screens, where mobile browsers can't show a PDF in an iframe
- Tests for the build script (`node --test scripts/`)

---

## [3.1.0] - 2026-09-25

### Added

- **Projects section** - BuilderJS, WebDocker (ACM first place), DockerUI, and the bipartite graph checker
- **Grouped roles** - Experience entries can list several `roles`, each with its own dates and bullet points
- **Resume source** - `resume/whitson_resume.tex`; the built PDF is published as `data/whitson_resume.pdf`
- **Page metadata** - Description, canonical URL, and Open Graph tags for search and link previews
- `noscript` fallback linking the resume PDF

### Changed

- **Content refresh** - Current Oracle DBA role, rewritten About, bullet points for every role, skills refocused on the database stack
- **Resume** - Updated for 2026 and reworked to one page
- **Mobile header** - Two compact rows with a horizontally scrolling nav (218px down to 104px tall)
- **Skill icons** - Data now carries the full devicon class and a display label ("VS Code", not "Vscode")
- **Theme toggle** - Inline SVG icons instead of emoji
- **Portrait** - 192px WebP (7 KB) instead of the 960px JPEG (280 KB)
- devicon pinned to 2.17.0

### Fixed

- Theme stopped following the OS setting after the first visit, because the initial theme was saved as if the user had chosen it
- `themechange` event reported the new theme as `previous`
- Nav links had no `nav-item`/`nav-link` classes, so the nav styles never applied
- Section headings hidden under the sticky header after clicking a nav link
- Desktop header overflowed horizontally between roughly 770px and 1100px wide
- Resume download filename was hardcoded

---

## [3.0.0] - 2025-10-07

### Added

- **Complete style overhaul** - Modern, clean design system
  - CSS custom properties for dynamic theming
  - Light/dark mode with system preference detection
  - Modular SCSS architecture (abstracts, base, layout, components)
  - Responsive design with mobile-first approach
  - Modern button and card components with hover animations
- **ThemeController class** - Comprehensive theme management
  - Automatic system theme detection
  - Manual theme override capability
  - Theme persistence with localStorage
  - Smooth theme transitions
- **Resume preview functionality** - Interactive PDF viewing
  - Download and preview buttons
  - Toggle-able iframe display
  - Responsive iframe sizing
  - Clean event handling with Builder.js utility
- **Enhanced footer** - Professional site footer
  - Responsive grid layout
  - Theme-aware styling
  - Accessibility features

### Changed

- **Design system overhaul** - From cyberpunk to contemporary
  - Replaced glitch effects with smooth animations
  - Updated color palette to professional theme
  - Modernized typography and spacing
  - Simplified navigation design
- **SCSS architecture** - Organized modular structure
  - Separated abstracts (variables, mixins)
  - Base styles (reset, typography, utilities)
  - Layout components (header, main, footer)
  - Reusable component library
- **Resume section** - From auto-preview to user-controlled
  - Buttons for download and preview actions
  - Hidden iframe until user requests preview
  - Improved mobile experience
- **Event handling** - Established Builder.js patterns
  - Created `addEventListenerAfterBuild()` utility
  - Documented proper Builder.js event binding
  - Cleaner, more maintainable code

### Fixed

- Builder.js event handling patterns established
- SCSS compilation warnings addressed
- Responsive design issues resolved
- Theme consistency across all components

---

## [2.0.0] - 2025-10-07 🚀 **Major Architecture Overhaul**

### Added

- **PortfolioController Class**: Complete refactor from procedural to object-oriented architecture
- **BuilderJS v0.0.3**: Enhanced DOM manipulation library with new `scope()` method
- **Professional JSDoc Documentation**: Comprehensive API documentation with automated generation
- **GitHub Pages Documentation**: Auto-generated docs at `/docs/JSDocs/` with compatibility fixes
- **Enhanced Error Handling**: Comprehensive validation and graceful error recovery
- **Automated Documentation Pipeline**: Batch scripts for JSDoc generation and deployment
- **TODOs Section**: Added style overhaul planning with light/dark mode specifications

### Changed

- **Complete Code Refactor**: Migrated from procedural `main.js` to `PortfolioController` class
- **Improved BuilderJS**: Enhanced with better scoping, validation, and memory management
- **Enhanced Data Loading**: Robust JSON data loading with comprehensive error handling
- **Better Section Management**: Modular section builders with type-specific handling
- **Documentation Quality**: Added extensive JSDoc comments throughout codebase

### Technical Improvements

- Removed old BuilderJS v0.0.1 documentation and legacy code
- Updated HTML documentation structure and index page content
- Implemented professional documentation generation workflow
- Enhanced GitHub Pages compatibility with CORS and protocol fixes

---

## [1.3.0] - 2025-02-26 **Content Modernization**

### Changed

- General content updates and data refresh
- Maintenance updates for current information

---

## [1.2.0] - 2024-01-26 **Code Quality Improvements**

### Fixed

- **Tab Handling**: Fixed tab-related JavaScript issues
- Code cleanup and formatting improvements

---

## [1.1.0] - 2023-04-02 to 2023-05-15 **Feature Expansion Period**

### Added

- **Resume Integration**: Added iframe tab navigation for resume viewing
- **Enhanced Navigation**: Implemented new animations and icon tooltips
- **BuilderJS Integration**: Implemented use of new BuilderJS Library
- **Favicon**: Finally added proper favicon support
- **Social Links**: Added icon links to relevant sites above portrait
- **Email Updates**: Updated contact information and resume

### Enhanced

- **Animations**: Added grow animation and fixed navigation animations
- **User Experience**: New hover animations and tooltips for technology icons
- **Performance**: Minified assets and removed defer attributes
- **Content**: Updated resume spelling and content
- **Documentation**: Updated BuilderJS documentation

### Fixed

- **Mobile Compatibility**: Added missing Builder.mod.id code
- **Navigation**: Fixed animation issues with new grow effects

---

## [1.0.0] - 2022-11-08 to 2022-11-11 **First Major Release**

### Added

- **Complete Site Redesign**: Full revamp of portfolio architecture
- **Mobile Responsiveness**: Comprehensive mobile-friendly design implementation
- **README Documentation**: Added proper project documentation

### Enhanced

- **Mobile Optimization**: Multiple iterations to achieve mobile compatibility
- **Layout Responsiveness**: Fixed width identifiers and media queries
- **User Experience**: Prevented automatic PDF downloads on mobile devices

### Fixed

- **Mobile Display Issues**: Resolved media query problems
- **PDF Handling**: Fixed iframe behavior on mobile devices
- **Layout Issues**: Multiple fixes for mobile viewport handling

---

## [0.3.0] - 2022-05-10 to 2022-05-27 **Domain & Infrastructure**

### Added

- **Custom Domain**: Established brettwhitson.dev domain with CNAME configuration
- **GitHub Pages Setup**: Configured proper GitHub Pages deployment
- **README**: Initial project documentation

### Fixed

- **Domain Configuration**: Multiple CNAME adjustments for proper domain routing
- **Spelling Corrections**: Fixed various text content issues
- **Deployment**: Resolved GitHub Pages hosting configuration

---

## [0.2.0] - 2021-04-26 to 2021-04-27 **Content Development**

### Added

- **Resume Integration**: Added PDF resume functionality
- **Content Structure**: Established initial content organization
- **File Management**: Organized project assets and structure

### Enhanced

- **Resume Updates**: Multiple iterations of resume content and formatting
- **Content Quality**: Continuous content refinement and updates
- **File Organization**: Improved project structure and asset management

### Fixed

- **File Cleanup**: Removed unnecessary files (whitson_hw3.pdf)
- **Content Accuracy**: Multiple content updates and corrections

---

## [0.1.0] - 2021-04-26 **Project Genesis**

### Added

- **Initial Commit**: Project foundation and basic structure
- **HTML Structure**: Created initial index.html file
- **Basic Functionality**: Established core portfolio framework
- **File Upload System**: Initial asset management

### Foundation

- Project repository initialization
- Basic HTML/CSS/JS structure
- Initial portfolio concept implementation
- File organization and management system

---

## Project Statistics

**Total Development Period**: April 26, 2021 - October 7, 2025 (4+ years)
**Total Commits**: 60+ commits
**Major Versions**: 3 major releases
**Key Milestones**:

- 2021: Project inception and initial development
- 2022: Major redesign and mobile optimization
- 2023: Feature expansion and library integration
- 2025: Complete architectural overhaul with modern practices

**Technology Evolution**:

- Started with basic HTML/CSS/JS
- Progressed to SCSS and modular architecture
- Integrated custom BuilderJS library
- Achieved professional documentation standards
- Planned migration to modern design systems

---

## Development Patterns

### Commit Frequency

- **High Activity Periods**: April 2021, November 2022, April 2023, October 2025
- **Maintenance Periods**: Regular updates between major releases
- **Recent Focus**: Documentation and architectural improvements

### Feature Development

- **Iterative Approach**: Multiple small commits for feature refinement
- **Quality Focus**: Emphasis on mobile compatibility and user experience
- **Modern Practices**: Progression toward professional development standards

### Technical Debt Management

- **Regular Refactoring**: Continuous improvement of code quality
- **Documentation**: Increased focus on comprehensive documentation
- **Architecture**: Evolution from simple to sophisticated patterns
