# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-25

### 🔥 BREAKING CHANGES

#### ESM Only + Auto-Registration - IIFE Bundles Removed

**All CDN bundles are now ESM-only with auto-registration on import.** IIFE bundles have been completely removed to eliminate registry isolation issues and align with modern web standards (ES2020+).

**Why?** 
- Solves registry isolation problems (behaviors couldn't find each other in IIFE)
- Natural singleton sharing through ES modules
- Auto-registration simplifies usage to just imports
- Modern standard (98%+ browser support in 2026)
- Better DX (real imports, type safety, IDE autocomplete)
- Simpler architecture (one format instead of two)

**Browser Support:**
- ✅ Chrome 61+ (2017)
- ✅ Firefox 60+ (2018)
- ✅ Safari 11+ (2017)
- ✅ Edge 79+ (2020)
- ❌ IE11 not supported (use v0.1.x or a bundler)

**Migration:**

**Before (v0.1.6 - IIFE):**
```html
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**After (v0.2.0 - ESM + Auto-Register):**
```html
<script type="module">
  import { defineBehavioralHost } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { metadata } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';  // Auto-registers!
  
  defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
</script>

<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**Simplest (Auto-Loader):**
```html
<script type="module">
  // Just import - behaviors auto-register, loader auto-enables!
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
</script>

<dialog behavior="reveal">Content</dialog>
```

#### Removed All-in-One Bundle

The `behavior-fn.all.js` bundle has been removed in favor of an opt-in loading architecture. This encourages better performance by loading only what you need.

**Note:** This maintains backward compatibility for auto-loader behavior.

#### Individual Bundles No Longer Include Core

Individual behavior bundles (e.g., `reveal.js`, `request.js`) now depend on the core runtime being loaded first. They will log an error if core is not found.

**Before (v0.1.6):**
```html
<script src="reveal.js"></script> <!-- Included core runtime -->
```

**After (v0.2.0):**
```html
<script src="behavior-fn-core.js"></script> <!-- Core required first! -->
<script src="reveal.js"></script>
```

### ✨ Added

- **Core Runtime Bundle** (`behavior-fn-core.js`) - Minimal foundation (~4KB) containing:
  - `registerBehavior` - Register behavior factories
  - `getBehavior` - Lookup registered behaviors
  - `defineBehavioralHost` - Create custom element hosts
  - `parseBehaviorNames` - Parse behavior attributes
  - `getObservedAttributes` - Extract observed attributes from schemas

- **ESM Versions** - All bundles now have `.esm.js` versions for modern bundlers

- **Improved Error Messages** - Individual bundles now check for core and provide clear error messages with instructions

- **Version Export** - Core runtime now exports `version` property

### 🎯 Changed

- **CDN Architecture** - Complete rewrite to opt-in loading model
- **Documentation** - Updated `CDN-ARCHITECTURE.md` with new patterns
- **Build Script** - Refactored `scripts/build-cdn.ts` for new architecture
- **Bundle Sizes** - Reduced from single 72KB bundle to modular 4KB core + individual behaviors

### 📝 Documentation

- Added comprehensive migration guide in `CDN-ARCHITECTURE.md`
- Added FAQ section for common questions
- Added loading pattern examples
- Added architecture diagrams

### 🔧 Fixed

- Removed race condition risks from auto-loader auto-enablement
- Clarified load order requirements
- Made dependency relationships explicit

---

## [0.1.6] - 2026-02-24

### Added
- Multiple behaviors support
- Compound commands behavior
- Content setter behavior
- JSON template behavior

### Changed
- Improved auto-loader idempotency
- Updated behavioral host registration

### Fixed
- Behavior parsing inconsistencies
- Auto-loader duplicate initialization

---

## [0.1.5] - 2026-02-23

### Added
- Request behavior with JSON script support
- Input watcher behavior
- Element counter behavior

### Fixed
- Test harness improvements
- Attribute alignment issues

---

## [0.1.4] - 2026-02-22

### Added
- Auto-loader as opt-in feature
- Behavioral host pattern
- Event methods system

### Changed
- Refactored core behavior attachment
- Improved type safety

---

## [0.1.3] - 2026-02-21

### Added
- Platform detection in init
- Import rewriting
- Test harness to core

---

## [0.1.2] - 2026-02-20

### Added
- Validator strategy pattern
- Zod Mini support
- TypeBox migration

---

## [0.1.1] - 2026-02-19

### Added
- Smart validator detection
- Multi-registry support planning

### Fixed
- Broken tests
- Type safety issues

---

## [0.1.0] - 2026-02-18

### Added
- Initial release
- Core behaviors: reveal, request, compute, logger
- CLI tool with `init`, `add`, `create`, `remove` commands
- TypeBox as canonical schema format
- Support for Zod, Valibot, ArkType, TypeBox validators
- Copy-paste architecture (own your code)
- CDN bundles for all behaviors

---

[0.2.0]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/AceCodePt/behavior-fn/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/AceCodePt/behavior-fn/releases/tag/v0.1.0
