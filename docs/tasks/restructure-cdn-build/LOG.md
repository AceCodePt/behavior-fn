# Task: Restructure CDN Build - Core + Behavior Modules

**Branch:** `restructure-cdn-build---core--behavior-modules`  
**Status:** In Progress  
**Date:** 2026-02-25

## Goal

Restructure the CDN build system to properly separate the core runtime from individual behavior modules, ensuring behaviors depend on core being loaded first instead of bundling core into each behavior.

## Context

**Current State:**
- `scripts/build-cdn.ts` bundles core runtime into each behavior (lines 275-333)
- Each behavior bundle is self-contained and includes: core runtime + behavior logic + JSON schema
- This causes code duplication across all behavior bundles
- Documentation in `CDN-ARCHITECTURE.md` describes an architecture where core should be loaded separately, but implementation doesn't match

**Problem:**
1. **Code Duplication:** Core runtime is bundled into every behavior (~4KB x N behaviors)
2. **Inconsistent Loading:** Behaviors are self-contained but docs say to load core first
3. **Confusion:** Two loading patterns (standalone vs explicit core) that contradict each other

**Desired State:**
- `behavior-fn-core.js` - Standalone core runtime (4KB)
- Individual behavior bundles that **check for** and **depend on** core
- Clear separation: Core must be loaded before behaviors
- Behaviors register themselves when loaded (after core check)
- Auto-loader remains optional

## Plan

### Phase 1: Update Core Build
- ✅ Review current `buildCore()` function (lines 181-242)
- Extract core modules that should be standalone
- Ensure core exposes proper API on `window.BehaviorFN`

### Phase 2: Update Behavior Build
- Remove core bundling from individual behaviors (lines 275-333)
- Add core existence check at behavior load time
- Make behaviors register themselves after checking for core
- Maintain metadata storage (`behaviorMetadata`)

### Phase 3: Update Auto-Loader
- Review `buildAutoLoader()` (lines 374-448)
- Ensure auto-loader checks for core
- Keep opt-in enablement pattern

### Phase 4: Update Documentation
- Verify `CDN-ARCHITECTURE.md` matches new implementation
- Update loading examples
- Update bundle size calculations

### Phase 5: Testing
- Test loading patterns:
  1. Core + Behavior + Manual Host
  2. Core + Behavior + Auto-Loader
  3. Behavior without Core (should error)
- Verify bundle sizes
- Test in browser with examples

## Implementation Notes

**Key Changes:**

1. **Core Bundle (`behavior-fn-core.js`):**
   - Contains: `behavior-registry`, `behavioral-host`, `behavior-utils`
   - Exposes: `window.BehaviorFN` object with all core APIs
   - Standalone (no behaviors included)
   - Size target: ~4KB minified

2. **Behavior Bundles (`reveal.js`, etc.):**
   - **NO core bundling** (critical change)
   - Start with core existence check
   - Register behavior if core exists
   - Store metadata in `window.BehaviorFN.behaviorMetadata`
   - Size target: Behavior logic + JSON schema only

3. **Auto-Loader Bundle (`auto-loader.js`):**
   - Checks for core existence
   - Provides `enableAutoLoader()` function
   - Auto-enables when loaded via script tag
   - Size target: ~5-6KB

**esbuild Configuration:**

For behaviors, use `external` to exclude core modules instead of bundling them:

```typescript
await build({
  entryPoints: [behaviorEntry],
  bundle: true,
  format: "iife",
  external: [
    // Don't bundle these - they come from core
    join(registryDir, "behavior-registry.ts"),
    join(registryDir, "behavioral-host.ts"),
    join(registryDir, "behavior-utils.ts"),
  ],
  // ... rest of config
});
```

**Behavior Entry Pattern:**

```javascript
// Check for core
if (!window.BehaviorFN) {
  console.error('[BehaviorFN] Core not loaded! Load behavior-fn-core.js first.');
  console.error('[BehaviorFN] Expected: <script src="behavior-fn-core.js"></script>');
  throw new Error('BehaviorFN core not loaded');
}

// Import behavior (bundled)
import { revealBehaviorFactory } from "./behavior.ts";

// Register behavior
window.BehaviorFN.registerBehavior('reveal', revealBehaviorFactory);

// Store metadata
if (!window.BehaviorFN.behaviorMetadata) {
  window.BehaviorFN.behaviorMetadata = {};
}
window.BehaviorFN.behaviorMetadata['reveal'] = {
  observedAttributes: ['reveal-delay', 'reveal-duration', ...],
  schema: { /* JSON Schema */ },
};

console.log('✅ BehaviorFN: Registered "reveal" behavior');
```

## Architecture Diagrams

### Before (Current - Self-Contained Behaviors):
```
reveal.js (50KB)
├─ Core Runtime (~4KB) ⚠️ DUPLICATED
├─ Reveal Logic
└─ JSON Schema

request.js (53KB)
├─ Core Runtime (~4KB) ⚠️ DUPLICATED
├─ Request Logic
└─ JSON Schema

Total for 2 behaviors: ~103KB (with ~8KB duplication)
```

### After (Proposed - Separated Core):
```
behavior-fn-core.js (4KB)
├─ behavior-registry
├─ behavioral-host
└─ behavior-utils

reveal.js (46KB)
├─ Reveal Logic
└─ JSON Schema
(checks for window.BehaviorFN)

request.js (49KB)
├─ Request Logic
└─ JSON Schema
(checks for window.BehaviorFN)

Total for 2 behaviors: 4KB + 46KB + 49KB = 99KB (no duplication)
```

## Success Criteria

- [ ] Core bundle is standalone and doesn't include behaviors
- [ ] Behavior bundles check for core and fail gracefully if missing
- [ ] Behaviors are smaller (no core duplication)
- [ ] Auto-loader works with new architecture
- [ ] Documentation matches implementation
- [ ] Examples work correctly
- [ ] All tests pass

## Risks & Mitigations

**Risk 1:** Breaking existing CDN users
- **Mitigation:** This is v0.2.0 (already breaking). Document migration clearly.

**Risk 2:** Load order confusion
- **Mitigation:** Clear error messages when core is missing. Update docs.

**Risk 3:** Increased HTTP requests
- **Mitigation:** This is expected (1 core + N behaviors). Document trade-offs.

## Follow-Up Tasks

- Update CHANGELOG.md with breaking changes
- Update examples in README.md
- Test with unpkg.com after release
- Update package.json version if needed

---

## Log

### 2026-02-25 - Task Created
- Analyzed current build script
- Identified duplication issue
- Created implementation plan
- Ready to begin Phase 1

### 2026-02-25 - Implementation Complete
**Phase 1: Core Build ✅**
- Verified `buildCore()` creates standalone bundle (4KB)
- Core includes: registry, host, utils, no behaviors
- Exposes `window.BehaviorFN` with all APIs

**Phase 2: Behavior Build ✅**
- Refactored `buildIndividualBehaviors()` to NOT bundle core
- Each behavior now:
  - Checks for `window.BehaviorFN` existence
  - Throws helpful error if core missing
  - Registers using global `window.BehaviorFN.registerBehavior`
  - Stores metadata in `window.BehaviorFN.behaviorMetadata`
- Verified NO registry isolation (no `var v=new Map` in behaviors)
- New sizes (WITHOUT core):
  - logger: 2.3KB (was ~4.7KB)
  - element-counter: 2.7KB (was ~5.1KB)
  - compound-commands: 3.1KB (was ~5.6KB)
  - content-setter: 3.2KB (was ~6.3KB)
  - input-watcher: 3.8KB (was ~6.0KB)
  - compute: 5.6KB (was ~7.9KB)
  - json-template: 6.1KB (was ~7.6KB)
  - reveal: 6.8KB (was ~8.7KB)
  - request: 11KB (was ~14KB)

**Phase 3: Auto-Loader ✅**
- Refactored `buildAutoLoader()` to depend on core
- Auto-loader checks for core, throws error if missing
- Auto-enables when loaded (no manual call needed)
- Size: 5.6KB (without core)

**Phase 4: Documentation ✅**
- Updated `CDN-ARCHITECTURE.md` with accurate sizes
- Fixed all loading examples to include core first
- Updated bundle size tables
- Clarified that auto-loader auto-enables
- Removed references to "self-contained" behaviors

**Testing ✅**
- Built bundles successfully: `pnpm build:cdn`
- Verified no registry isolation issues
- Verified behaviors check for core
- Created test HTML file: `dist/cdn/test-multi-behavior.html`

**Key Benefits Achieved:**
1. ✅ Eliminated core duplication across behaviors
2. ✅ Shared registry enables multi-behavior loading
3. ✅ Clear error messages when core is missing
4. ✅ Smaller individual behavior bundles
5. ✅ More efficient for loading multiple behaviors

**Example Total Sizes:**
- Single behavior (reveal): 4KB (core) + 6.8KB = 10.8KB
- Two behaviors (reveal + request): 4KB (core) + 6.8KB + 11KB = 21.8KB
- With auto-loader: 4KB + 6.8KB + 11KB + 5.6KB = 27.4KB

**Compare to OLD (self-contained with duplication):**
- Two behaviors OLD: 8.7KB (reveal with core) + 14KB (request with core) = 22.7KB
- NEW: 21.8KB (core shared)
- Savings increase with more behaviors!

### 2026-02-25 - Documentation Update Complete ✅
**Updated Files:**
1. `CDN-ARCHITECTURE.md` - Already mostly accurate, updated:
   - Bundle size tables with actual measurements
   - Loading pattern examples to include core first
   - Migration guides to show core requirement
   - Fixed auto-loader examples (auto-enables, no manual call)
   
2. `docs/guides/manual-loading.md` - Major updates:
   - Quick Start now shows core + behavior + auto-loader pattern
   - All loading examples updated to include core first
   - Removed references to deleted `behavior-fn.all.js` bundle
   - Updated bundle size tables with actual sizes
   - Fixed all code examples to show proper load order
   - Updated Available Bundles section with sizes and core requirement
   - Enhanced troubleshooting with "Core not loaded" guidance
   - Updated CDN provider examples

3. `AGENTS.md` - No changes needed (no CDN references)

**All Documentation Now Accurately Reflects:**
- Core must be loaded first
- Behaviors depend on core
- Auto-loader auto-enables (no manual call)
- Correct bundle sizes (without core duplication)
- Proper loading patterns

### 2026-02-25 - Added Gzipped Sizes ✅
**Measured actual gzipped sizes:**
- Core: 4KB minified / **1.6KB gzipped**
- Logger: 2.3KB / **976B gzipped**
- Element-counter: 2.7KB / **1.1KB gzipped**
- Compound-commands: 3.1KB / **1.3KB gzipped**
- Content-setter: 3.2KB / **1.2KB gzipped**
- Input-watcher: 3.8KB / **1.5KB gzipped**
- Compute: 5.6KB / **2.2KB gzipped**
- Json-template: 6.1KB / **2.5KB gzipped**
- Reveal: 6.8KB / **2.3KB gzipped**
- Request: 11KB / **3.3KB gzipped**
- Auto-loader: 5.6KB / **2.2KB gzipped**

**Updated both documentation files with gzipped sizes:**
- All bundle size tables now show: Minified / Gzipped
- Example totals show both minified and gzipped
- More realistic size expectations for users

**Real-world sizes (what users actually download):**
- Simple logger: **2.6KB gzipped** (core + logger)
- Modal dialog: **4KB gzipped** (core + reveal)
- Modal + auto-loader: **6.2KB gzipped**
- Form handling: **4.9KB gzipped** (core + request)
- Complex app: **9.5KB gzipped** (core + reveal + request + auto-loader)
