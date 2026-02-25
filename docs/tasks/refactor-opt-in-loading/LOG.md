# Task: Refactor to Opt-In Loading Architecture

**Status:** In Progress  
**Branch:** `refactor/opt-in-loading`  
**Worktree:** `../behavior-fn-opt-in-loading`  
**Created:** 2026-02-25  
**Agent:** Architect

## Goal

Remove the all-in-one bundle approach and implement an opt-in loading system where:
1. The auto-loader is a separate, optional module
2. Individual behaviors are loaded on-demand
3. Users explicitly choose what to load (better performance, smaller bundles)
4. No automatic "load everything" bundle

## Context

### Current Architecture (Problems)

1. **All-in-One Bundle (`behavior-fn.all.js`):**
   - Bundles ALL behaviors into one file (~72KB, ~20KB gzipped)
   - Automatically enables auto-loader
   - Users can't opt-out of behaviors they don't use
   - Wastes bandwidth for users who only need 1-2 behaviors

2. **Individual Bundles with Auto-Loader:**
   - Complex loading order requirements (auto-loader must be last)
   - Race condition risks
   - Confusing documentation about load order

3. **Mixed Patterns:**
   - Three different loading patterns confuse users
   - Documentation is complex and error-prone

### Desired Architecture (Benefits)

1. **Core Runtime Bundle (`behavior-fn-core.js`):**
   - Minimal runtime: `behavior-registry`, `behavioral-host`, `behavior-utils`, `types`
   - Required foundation (~5KB)
   - No behaviors included

2. **Individual Behavior Bundles (`reveal.js`, `request.js`, etc.):**
   - Load only what you need
   - Each depends on core
   - Auto-registers behavior when loaded

3. **Optional Auto-Loader (`auto-loader.js`):**
   - Completely optional module
   - Users opt-in explicitly
   - Must be loaded after behaviors (documented clearly)

4. **No All-in-One Bundle:**
   - Forces intentional loading
   - Encourages performance-conscious decisions
   - Clearer mental model

## Design Decisions

### 1. Core Runtime

**File:** `dist/cdn/behavior-fn-core.js` (or `behavior-fn.js`)

**Contents:**
- `behavior-registry.ts`
- `behavioral-host.ts`
- `behavior-utils.ts`
- `types.ts`
- `event-methods.ts`

**Exports:**
```javascript
window.BehaviorFN = {
  registerBehavior,
  getBehavior,
  defineBehavioralHost,
  withBehaviors,
  parseBehaviorNames,
  getObservedAttributes,
};
```

**Size:** ~5-8KB minified (~2-3KB gzipped)

### 2. Individual Behavior Bundles

**Example:** `dist/cdn/reveal.js`

**Contents:**
- Behavior implementation
- Auto-registration code
- Depends on core being loaded first

**Pattern:**
```javascript
// reveal.js
import { revealBehaviorFactory } from './reveal/behavior.ts';

if (typeof window !== 'undefined') {
  if (!window.BehaviorFN) {
    console.error('BehaviorFN core not loaded! Load behavior-fn-core.js first.');
  } else {
    window.BehaviorFN.registerBehavior('reveal', revealBehaviorFactory);
    console.log('✅ BehaviorFN: Loaded "reveal" behavior');
  }
}
```

### 3. Auto-Loader Module

**File:** `dist/cdn/auto-loader.js`

**Contents:**
- MutationObserver logic
- DOM scanning
- Auto `is` attribute addition

**Pattern:**
```javascript
// auto-loader.js
import { enableAutoLoader } from './auto-loader.ts';

if (typeof window !== 'undefined') {
  if (!window.BehaviorFN) {
    console.error('BehaviorFN core not loaded! Load behavior-fn-core.js first.');
  } else {
    window.BehaviorFN.enableAutoLoader = enableAutoLoader;
    // Note: Does NOT auto-enable, user must call it
  }
}
```

**User Activation:**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="auto-loader.js"></script>
<script>
  // Explicit opt-in
  BehaviorFN.enableAutoLoader();
</script>
```

### 4. Removed: All-in-One Bundle

**Breaking Change:** Remove `behavior-fn.all.js`

**Migration Path:**
```html
<!-- Before (v0.1.6) -->
<script src="behavior-fn.all.js"></script>

<!-- After (v0.2.0) -->
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="request.js"></script>
<!-- Optional: -->
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>
```

## Implementation Plan

### Phase 1: Update Build Script ✅

**File:** `scripts/build-cdn.ts`

Tasks:
- [ ] Remove `buildAllInOne()` function
- [ ] Create `buildCore()` function for core runtime bundle
- [ ] Update individual behavior bundles to check for core
- [ ] Update auto-loader bundle to NOT auto-enable
- [ ] Remove all-in-one entry generation

### Phase 2: Update Auto-Loader ✅

**File:** `registry/behaviors/auto-loader.ts`

Tasks:
- [ ] Ensure idempotent behavior (already done)
- [ ] Add clear documentation about opt-in usage
- [ ] Remove any auto-enabling logic from CDN bundle

### Phase 3: Update Documentation ✅

**Files:**
- `CDN-ARCHITECTURE.md`
- `README.md`
- `docs/guides/cdn-usage.md` (create if needed)

Tasks:
- [ ] Rewrite CDN-ARCHITECTURE.md for new patterns
- [ ] Document migration from v0.1.6 to v0.2.0
- [ ] Update examples to show opt-in loading
- [ ] Remove confusing "multiple patterns" documentation
- [ ] Add clear load order requirements

### Phase 4: Update Examples ✅

**Files:**
- `examples/cdn-basic.html`
- `examples/cdn-auto-loader.html`
- `dist/cdn/index.html`

Tasks:
- [ ] Create example showing core + individual behaviors
- [ ] Create example showing explicit `is` attributes (no auto-loader)
- [ ] Create example showing opt-in auto-loader
- [ ] Remove all-in-one examples

### Phase 5: Update Package Files ✅

**Files:**
- `package.json`
- `README.md`

Tasks:
- [ ] Update version to 0.2.0 (breaking change)
- [ ] Update description to mention opt-in loading
- [ ] Add migration guide to README

### Phase 6: Testing ✅

Tasks:
- [ ] Test core bundle loads correctly
- [ ] Test individual behaviors depend on core
- [ ] Test auto-loader works with opt-in pattern
- [ ] Test error messages when core not loaded
- [ ] Test explicit `is` attributes work without auto-loader

## Breaking Changes

### For CDN Users

**Before (v0.1.6):**
```html
<script src="behavior-fn.all.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0):**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>
<dialog behavior="reveal">Content</dialog>
```

**Or (without auto-loader):**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

### For CLI Users

**No Breaking Changes** - CLI still uses copy-paste approach, unaffected by CDN changes.

## Success Criteria

- [ ] Core runtime bundle exists and is minimal (<8KB)
- [ ] Individual behavior bundles check for core
- [ ] Auto-loader is opt-in only (not auto-enabled)
- [ ] No all-in-one bundle exists
- [ ] Documentation is clear and unambiguous
- [ ] Examples demonstrate all valid patterns
- [ ] Migration guide is complete
- [ ] All tests pass

## Migration Guide for Users

### If you used `behavior-fn.all.js`:

**Step 1:** Replace with core + individual bundles
```html
<!-- Remove -->
<script src="behavior-fn.all.js"></script>

<!-- Add -->
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="request.js"></script>
<!-- ... other behaviors you use -->
```

**Step 2:** Choose auto-loader strategy

Option A: Enable auto-loader (like before)
```html
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>
```

Option B: Use explicit `is` attributes (no auto-loader needed)
```html
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

### If you used individual bundles + auto-loader:

**Change:** Auto-loader no longer auto-enables

**Before:**
```html
<script src="request.js"></script>
<script src="auto-loader.js"></script> <!-- Auto-enabled itself -->
```

**After:**
```html
<script src="behavior-fn-core.js"></script> <!-- New: explicit core -->
<script src="request.js"></script>
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script> <!-- Explicit call -->
```

### If you used explicit `is` attributes:

**No changes needed!** Just add core bundle:

**Before:**
```html
<script src="request.js"></script>
<form is="behavioral-request" behavior="request">...</form>
```

**After:**
```html
<script src="behavior-fn-core.js"></script> <!-- New -->
<script src="request.js"></script>
<form is="behavioral-request" behavior="request">...</form>
```

## Timeline

- **Phase 1-2:** 30 minutes (build script + auto-loader changes)
- **Phase 3:** 20 minutes (documentation updates)
- **Phase 4:** 15 minutes (examples)
- **Phase 5:** 5 minutes (package.json)
- **Phase 6:** 20 minutes (testing)

**Total Estimate:** ~90 minutes

## Notes

- This is a **breaking change** → version bump to 0.2.0
- Since we're pre-1.0, this is acceptable per AGENTS.md
- Improves performance and DX in the long run
- Aligns with modern best practices (explicit dependencies)
- Removes confusion around "which loading pattern to use"

## Log

### 2026-02-25 - Initial Planning
- Created task directory and LOG.md
- Analyzed current architecture
- Designed new opt-in architecture
- Ready to begin implementation in worktree

---

**Next Step:** Begin Phase 1 implementation in the `refactor/opt-in-loading` worktree.
