# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-25

### 🔥 BREAKING CHANGES

#### Removed All-in-One Bundle

The `behavior-fn.all.js` bundle has been removed in favor of an opt-in loading architecture. This encourages better performance by loading only what you need.

**Migration:**

**Before (v0.1.6):**
```html
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/behavior-fn.all.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 1: Explicit (Recommended):**
```html
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 2: Auto-Loader:**
```html
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script> <!-- Auto-enables itself -->
<dialog behavior="reveal">Content</dialog>
```

#### Auto-Loader Automatically Enables When Loaded

The auto-loader module (`auto-loader.js`) automatically enables itself when loaded via `<script>` tag. No explicit `enableAutoLoader()` call is needed.

**Before (v0.1.6):**
```html
<script src="auto-loader.js"></script> <!-- Auto-enabled itself -->
```

**After (v0.2.0):**
```html
<script src="auto-loader.js"></script> <!-- Still auto-enables itself -->
```

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
