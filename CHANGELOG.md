# Changelog

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

## [2.0.0] - 2025-10-07

### Added

- PortfolioController class architecture
- BuilderJS v0.0.3 with `scope()` method
- JSDoc documentation with automated generation
- Enhanced error handling and validation

### Changed

- Refactored from procedural to OOP architecture
- Improved DOM building with enhanced BuilderJS
- Better data loading with error handling

### Fixed

- GitHub Pages CSS/JS loading issues
- Documentation whitespace cleanup
- Mobile responsiveness with viewport tags

---

## BuilderJS Versions

### [0.0.3] - 2025-10-07

- Added `scope()` method for cleaner DOM building
- Enhanced error handling and validation
- Improved memory management
- Better Emmet syntax parsing
