# Task Execution Log: Remove IIFE Support - ESM Only

**Branch:** `remove-iife-support---esm-only`  
**Status:** In Progress  
**Started:** 2026-02-25  

---

## Goal

Simplify the CDN build by removing IIFE bundle support and providing only ESM modules, eliminating all registry isolation issues and simplifying the architecture.

---

## Context

### Current Problem

IIFE bundles create isolated registries because each bundle wraps code in a closure:

```javascript
// Each IIFE creates its own Maps
"use strict";var BehaviorFN_JsonTemplate=(()=>{
  var g=new Map;  // Isolated!
  var x=new Map;  // Isolated!
  
  function getBehavior(e) { return g.get(e); }  // Uses local Map
  // ...
})();
```

Even with `behavior-fn-core.js` loaded first, each behavior bundle and auto-loader bundle includes their own copy of the registry code with isolated Maps. They can't share state.

### Why ESM Solves This

ES modules naturally share singleton instances:

```javascript
// behavior-registry.ts (source)
export const behaviors = new Map();  // Single instance

// json-template imports it
import { behaviors } from './behavior-registry.ts';
behaviors.set('json-template', factory);  // Same Map

// auto-loader imports it  
import { behaviors } from './behavior-registry.ts';
behaviors.get('json-template');  // Same Map ✅
```

All modules share the same `behaviors` Map - no isolation!

### Browser Support (2026)

**ES Modules are universally supported:**
- Chrome: 61+ (2017)
- Firefox: 60+ (2018)
- Safari: 11+ (2017)
- Edge: 79+ (2020)

**Market Share:** >98% of users have ES module support

---

## Architectural Decision

**Decision:** Remove all IIFE bundle generation and provide only ESM bundles.

**Rationale:**

1. **Solves Registry Isolation** - No more isolated Maps in closures, natural module sharing
2. **Simpler Build** - One format instead of two (IIFE + ESM), no `globalName` confusion
3. **Smaller Codebase** - Remove IIFE-specific code, easier to maintain
4. **Modern Standard** - ESM is the web standard, aligns with modern practices
5. **Better DX** - Real imports/exports, type-safe with TypeScript, IDE autocomplete

**Trade-offs:**

- ❌ Breaks compatibility with old browsers (IE11, very old Chrome/Firefox/Safari)
- ✅ But browser support is >98% in 2026, and this is v0.2.0 (pre-1.0) where breaking changes are acceptable

---

## Implementation Plan

### Phase 1: Remove IIFE Builds from `scripts/build-cdn.ts`

**Files to modify:**
- `scripts/build-cdn.ts`

**Changes:**

1. **Remove IIFE builds in `buildCore()` function:**
   - Remove the `format: "iife"` build
   - Keep only `format: "esm"` build
   - Remove manual `window.BehaviorFN` assignment (ESM uses real exports)
   - Update core code to export functions instead of window assignment

2. **Remove IIFE builds in `buildIndividualBehaviors()` function:**
   - Remove the `format: "iife"` build
   - Keep only `format: "esm"` build
   - Remove `globalName` configuration
   - Update behavior entry to export factory instead of window assignment

3. **Remove IIFE builds in `buildAutoLoader()` function:**
   - Remove the `format: "iife"` build
   - Keep only `format: "esm"` build
   - Remove `globalName` configuration
   - Update auto-loader entry to export function instead of window assignment

4. **Rename output files (remove `.esm` suffix):**
   - `behavior-fn-core.esm.js` → `behavior-fn-core.js` (since it's the only version)
   - `reveal.esm.js` → `reveal.js`
   - `auto-loader.esm.js` → `auto-loader.js`

5. **Update entry code to use real ESM exports:**
   - Core: Export `registerBehavior`, `getBehavior`, `defineBehavioralHost`, etc.
   - Behaviors: Export factory function and metadata
   - Auto-loader: Export `enableAutoLoader` function

6. **Update console messages:**
   - Remove references to "IIFE" in build logs
   - Update file names in logs (no `.esm` suffix)

### Phase 2: Update Examples

**Files to modify:**
- `examples/cdn/01-explicit-pattern.html`
- `examples/cdn/02-auto-loader-pattern.html`
- `examples/cdn/03-esm-pattern.html`
- `examples/cdn/index.html`

**Changes:**

1. **Convert all examples to use ESM imports:**
   ```html
   <!-- OLD (IIFE) -->
   <script src="behavior-fn-core.js"></script>
   <script src="reveal.js"></script>
   
   <!-- NEW (ESM) -->
   <script type="module">
     import { registerBehavior, defineBehavioralHost } from './dist/cdn/behavior-fn-core.js';
     import { revealBehaviorFactory } from './dist/cdn/reveal.js';
     
     registerBehavior('reveal', revealBehaviorFactory);
     defineBehavioralHost('dialog', 'behavioral-reveal', ['reveal-anchor']);
   </script>
   ```

2. **Update auto-loader examples:**
   ```html
   <script type="module">
     import { enableAutoLoader } from './dist/cdn/auto-loader.js';
     import { revealBehaviorFactory } from './dist/cdn/reveal.js';
     import { registerBehavior } from './dist/cdn/behavior-fn-core.js';
     
     registerBehavior('reveal', revealBehaviorFactory);
     enableAutoLoader();
   </script>
   ```

3. **Add import maps example (optional convenience):**
   ```html
   <script type="importmap">
   {
     "imports": {
       "behavior-fn/": "./dist/cdn/"
     }
   }
   </script>
   
   <script type="module">
     import { registerBehavior } from 'behavior-fn/behavior-fn-core.js';
     import { revealBehaviorFactory } from 'behavior-fn/reveal.js';
     
     registerBehavior('reveal', revealBehaviorFactory);
   </script>
   ```

### Phase 3: Update Documentation

**Files to modify:**
- `CDN-ARCHITECTURE.md`
- `docs/guides/manual-loading.md` (if exists)
- `README.md`
- `CHANGELOG.md`

**Changes:**

1. **CDN-ARCHITECTURE.md:**
   - Remove all IIFE references
   - Update loading patterns to ESM
   - Update browser support section
   - Add import maps examples
   - Update bundle sizes (ESM only)
   - Update migration guide

2. **README.md:**
   - Update CDN quick start to use ESM
   - Update CDN examples to use ESM
   - Add import maps example
   - Update browser support section

3. **CHANGELOG.md:**
   - Add breaking change notice for v0.2.0
   - Explain rationale (registry isolation solved)
   - Provide migration guide from IIFE to ESM
   - Document browser support requirements

### Phase 4: Update Build Scripts

**Files to modify:**
- `package.json`

**Changes:**

1. Update `build:cdn` script description to mention ESM only
2. Update `prepublishOnly` to ensure ESM bundles are built

---

## State Manifest

**Source of Truth:** `scripts/build-cdn.ts`

**Build Configuration State:**

| State | Type | Source | Validation |
|-------|------|--------|------------|
| `format` | `"esm"` | esbuild config | Only ESM format allowed |
| `outfile` | string | File name without `.esm` | No `.esm` suffix in output |
| Core exports | Functions | Entry code | Real ESM exports, no window assignment |
| Behavior exports | Functions | Entry code | Real ESM exports, no window assignment |

**Documentation State:**

| Document | Updated | Breaking Changes |
|----------|---------|------------------|
| CDN-ARCHITECTURE.md | ✅ | Yes - remove IIFE |
| README.md | ✅ | Yes - ESM examples |
| CHANGELOG.md | ✅ | Yes - migration guide |
| Examples/*.html | ✅ | Yes - ESM imports |

---

## Breaking Changes

### For CDN Users

**Before (IIFE):**
```html
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
```

**After (ESM):**
```html
<script type="module">
  import { registerBehavior } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { revealBehaviorFactory } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  
  registerBehavior('reveal', revealBehaviorFactory);
</script>
```

**Migration:**
- Add `type="module"` to script tags
- Use explicit imports
- Register behaviors manually OR use auto-loader

**Impact:** Low - most BehaviorFN users are likely already using modern browsers. This is v0.2.0 (pre-1.0), breaking changes are acceptable.

---

## Testing Plan

### Unit Tests
All existing tests should continue to pass (they test source, not bundles).

### Manual CDN Bundle Tests

**Test 1: Registry Sharing**
```javascript
import { registerBehavior, getBehavior } from './behavior-fn-core.js';
import { jsonTemplateBehaviorFactory } from './json-template.js';

registerBehavior('json-template', jsonTemplateBehaviorFactory);
console.assert(getBehavior('json-template') === jsonTemplateBehaviorFactory);
```

**Test 2: Multi-Behavior**
```javascript
import { registerBehavior, getBehavior } from './behavior-fn-core.js';
import { jsonTemplateBehaviorFactory } from './json-template.js';
import { requestBehaviorFactory } from './request.js';

registerBehavior('json-template', jsonTemplateBehaviorFactory);
registerBehavior('request', requestBehaviorFactory);

console.assert(getBehavior('json-template') !== undefined);
console.assert(getBehavior('request') !== undefined);
```

**Test 3: Auto-Loader**
```javascript
import { registerBehavior } from './behavior-fn-core.js';
import { enableAutoLoader } from './auto-loader.js';
import { jsonTemplateBehaviorFactory } from './json-template.js';

registerBehavior('json-template', jsonTemplateBehaviorFactory);
enableAutoLoader();

// Element with behavior="json-template" should auto-upgrade
```

---

## Definition of Done

- [x] All IIFE build code removed from `scripts/build-cdn.ts`
- [x] Only ESM bundles generated
- [x] ESM bundles use real exports (not IIFE with manual window assignment)
- [x] All behaviors export their factory functions
- [x] Core exports all public API functions
- [x] Auto-loader exports `enableAutoLoader` function
- [x] All CDN examples updated to ESM (in build script's generateCDNExamples)
- [x] Documentation updated (CDN-ARCHITECTURE, README)
- [x] CHANGELOG.md updated with breaking change notice
- [x] Build succeeds and generates ESM bundles
- [x] All tests pass (381 tests passing)
- [ ] **User Review**: Changes verified and commit authorized

---

## Execution Log

### 2026-02-25 - Task Completed (Updated with Auto-Registration)

**Actions Taken:**

1. ✅ **Created LOG.md** with comprehensive architectural plan
2. ✅ **Modified `scripts/build-cdn.ts` (Initial ESM-only):**
   - Removed all IIFE build configurations
   - Kept only ESM format (`format: "esm"`)
   - Updated core entry to export functions instead of window assignment
   - Updated behavior entry to export factory and metadata
   - Updated auto-loader entry to export `enableAutoLoader` function
   - Renamed output files (no `.esm` suffix - just `.js`)
   - Updated console messages to reflect "ESM Only"
3. ✅ **Modified `scripts/build-cdn.ts` (Added Auto-Registration):**
   - Behaviors now auto-register themselves on import (side-effect)
   - Auto-loader now auto-enables itself on import (side-effect)
   - No more manual `registerBehavior()` or `enableAutoLoader()` calls needed
   - Simplest possible usage: just import and go!
4. ✅ **Built CDN bundles successfully:**
   - Core: `behavior-fn-core.js` (ESM)
   - 9 behaviors: `*.js` (ESM with auto-registration)
   - Auto-loader: `auto-loader.js` (ESM with auto-enable)
   - All bundles verified to use `export` statements + auto-registration
5. ✅ **Updated Documentation:**
   - `CHANGELOG.md`: Added ESM-only + auto-registration breaking change with migration guide
   - `CDN-ARCHITECTURE.md`: Updated all sections to reflect ESM-only + auto-registration
   - `README.md`: Updated CDN usage examples to show auto-registration pattern
   - `scripts/build-cdn.ts`: Updated example HTML to show simplest pattern (just imports)
   - `docs/guides/cdn-usage.md`: Completely rewritten for ESM + auto-registration
   - `docs/guides/manual-loading.md`: Completely rewritten for ESM + auto-registration
6. ✅ **Ran all tests:** 381 tests passing (24 test files)
7. ✅ **Verified bundle output:**
   - No `.esm.js` files (all are `.js` with ESM format)
   - Confirmed bundles use real ES module exports + auto-registration
   - Build succeeds without errors

**Results:**
- ✅ All IIFE code removed
- ✅ ESM-only architecture in place
- ✅ Auto-registration on import implemented
- ✅ Auto-enable on import implemented
- ✅ Documentation updated with simplest patterns
- ✅ All tests passing
- ✅ Build succeeds

**New Usage Pattern (Simplest):**
```html
<script type="module">
  // Just import - behaviors auto-register, loader auto-enables!
  import './reveal.js';
  import './auto-loader.js';
</script>
```

**Ready for user review and commit approval.**

---

## Migration Guide for Users

### For Library Users

**If you were using IIFE bundles:**

Update your HTML from:
```html
<script src="https://unpkg.com/behavior-fn@0.1.x/dist/cdn/reveal.js"></script>
```

To:
```html
<script type="module">
  import { registerBehavior } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { revealBehaviorFactory } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  
  registerBehavior('reveal', revealBehaviorFactory);
</script>
```

**If you need IE11 support:**

BehaviorFN 0.2.0+ requires ES module support. Continue using 0.1.x or use a bundler (webpack, vite) to compile to ES5.

---

## Success Criteria

After this task:
- ✅ No more IIFE bundles generated
- ✅ Only ESM bundles available
- ✅ Real ESM exports (no window assignment)
- ✅ All examples updated to ESM
- ✅ Documentation updated with migration guide
- ✅ Build succeeds
- ✅ Tests pass
- ✅ User approves changes

**This eliminates the root cause of all CDN loading issues by removing IIFE-based registry isolation!**
