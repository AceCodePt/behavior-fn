# Changelog

All notable changes to BehaviorFN will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-05-21

### Added

**Command Behavior**
- New `command` behavior enables any element to dispatch commands
- Supports custom event triggers: `commandby="input"`, `commandby="mouseenter"`, etc.
- Supports multiple targets: `commandfor="modal panel sidebar"` (space-separated)
- Supports multiple commands: `command="show focus"` (space-separated)
- Delay support: `commanddelay="300"` (milliseconds)
- Throttle support: `commandthrottle="500"` (milliseconds)
- No commas allowed - use spaces for separation
- Proper lifecycle management (connectedCallback, disconnectedCallback)

**New Behaviors**
- `condition` - Conditional command dispatch based on element state
- `format` - Number, date, and currency formatting for inputs
- `paste-transform` - Transform pasted text with regex patterns
- `no-propagate` - Stop event propagation for nested interactive elements
- `set-attribute` - Set/toggle/remove attributes via commands
- `set-content` - Set element text content via commands

**Enhancements**
- `set-value` now supports `reset` command to restore original value
- `storage` behavior for localStorage/sessionStorage sync
- `dirty-input` tracks whether form inputs have changed from baseline
- `element-counter` counts and tracks elements matching a selector
- All behaviors now follow consistent 4-file structure
- Zero-config behaviors (e.g., `auto-grow`) now include schema.ts for consistency

### Changed

**Command Protocol**
- Commands use space-separated values (no commas): `commandfor="a b c"`
- Command names cannot contain spaces
- Attribute names simplified (no hyphens):
  - `command-by` → `commandby`
  - `command-delay` → `commanddelay`
  - `command-throttle` → `commandthrottle`
- Triggers must have `behavior="command"` attribute
- Commands no longer use `--` prefix: `command="show"` (not `command="--show"`)

**File Structure**
- Moved `auto-loader` to `registry/utils/` (infrastructure, not a behavior)
- Removed empty placeholder directories (`content-setter`, `input-watcher`)
- All behaviors must have 4 files: `schema.ts`, `_behavior-definition.ts`, `behavior.ts`, `behavior.test.ts`

**Code Quality**
- Fixed missing `registerBehavior()` calls in `auto-grow`, `json-template`, `logger`
- Fixed event listener cleanup in `command` behavior
- Reduced code comments to focus on "why" not "what"
- Consistent use of `attributes[...]` pattern across all behaviors

### Fixed

- `request` behavior: renamed `close-sse` command to `abort`
- `command` behavior: proper attribute access via `attributes["command-by"]`
- `auto-grow` behavior: added missing schema and registration
- Event listener memory leaks in multiple behaviors

### Documentation

- Updated `AGENTS.md` with command naming convention
- Updated `behavior-definition-standard.md` to remove `--` prefix examples
- Added "Command Protocol Architecture" section to README
- Created `command-dispatcher-basic.html` example
- Updated all CDN examples to v0.3.0
- Documented native API delegation logic

### Developer Experience

- CDN build now includes `command-dispatcher.js` and `auto-loader.js` in utilities phase
- Build script provides clear loading pattern examples
- All tests passing (17 behaviors + command dispatcher)

---

## Version Naming

- **Major (X.0.0)**: Breaking changes to public API
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible
