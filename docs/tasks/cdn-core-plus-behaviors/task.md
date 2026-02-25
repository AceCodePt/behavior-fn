# Task: Restructure CDN Build - Core + Behavior Modules

## Goal

Fix the CDN build so behavior bundles depend on a shared core instead of each being self-contained, eliminating registry isolation and enabling multiple behaviors to work together.

## Context

**Current Architecture (Broken for Multi-Behavior):**

Each behavior bundle (`json-template.js`, `request.js`, etc.) is **self-contained** and includes:
- Full BehaviorRegistry with its own `Map` instances
- Full BehavioralHost class
- All utility functions
- The behavior implementation

**The Problem:**

When loading multiple behaviors:
```html
<script src="behavior-fn-core.js"></script>
<script src="json-template.js"></script>
<script src="request.js"></script>
```

Each behavior bundle:
1. Creates its own local registry Maps: `var v=new Map` (inside IIFE closure)
2. Either overwrites or creates isolated `window.BehaviorFN` object
3. Registers to its own local Map, not the shared global registry

**Result:**
- Core creates registry ✅
- json-template creates its OWN registry and registers to it ❌
- request creates its OWN registry and registers to it ❌
- When behavioral-host (from core) tries to get behaviors, it looks in core's registry (empty!) ❌
- `[BehaviorRegistry] No loader found for behavior: "json-template"` ❌

**Evidence:**
```javascript
// In browser console:
window.BehaviorFN.getBehavior('json-template')  // undefined ❌
window.BehaviorFN.getBehavior('request')        // undefined ❌
// Behaviors registered to their own isolated Maps, not the global one!
```

---

## Current State Analysis

### What Works ✅

**Loading ONE behavior standalone:**
```html
<script src="json-template.js"></script>  <!-- Self-contained, works alone -->
```

This works because the single bundle has everything it needs.

### What's Broken ❌

**Loading MULTIPLE behaviors with core:**
```html
<script src="behavior-fn-core.js"></script>
<script src="json-template.js"></script>
<script src="request.js"></script>
```

This breaks because each behavior bundle creates its own isolated registry instead of using the core's shared registry.

### Why Existing Examples Work

**examples/cdn/02-auto-loader-pattern.html:**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="logger.js"></script>
```

**This example SHOULD be broken** based on the current build, unless reveal.js and logger.js are different from json-template.js and request.js.

**Need to verify:** Are the existing CDN examples actually working, or are they also broken?

---

## Requirements

### Phase 1: Behavior Bundles Should NOT Include Core

Behavior bundles must:
1. **Assume `window.BehaviorFN` exists** (loaded by core)
2. **NOT create their own registry Maps**
3. **NOT include BehavioralHost class**
4. **Only contain:**
   - The behavior factory function
   - Registration call to global `window.BehaviorFN.registerBehavior`
   - Metadata assignment to `window.BehaviorFN.behaviorMetadata`

**Expected output:**
```javascript
// json-template.js
(function() {
  if (!window.BehaviorFN) {
    throw new Error('BehaviorFN core not loaded. Load behavior-fn-core.js first.');
  }

  const jsonTemplateBehaviorFactory = (el) => {
    // ... behavior implementation ...
  };

  window.BehaviorFN.registerBehavior('json-template', jsonTemplateBehaviorFactory);
  window.BehaviorFN.behaviorMetadata['json-template'] = {
    observedAttributes: ['json-template-for'],
    schema: { /* ... */ }
  };
  
  console.log('✅ BehaviorFN: Loaded "json-template" behavior');
})();
```

### Phase 2: Build Script Updates

**Modify `scripts/build-cdn.ts`:**

1. **Create behavior entry files** that import only the behavior, not the infrastructure:
   ```typescript
   // Temporary file: _json-template-cdn-entry.ts
   import { jsonTemplateBehaviorFactory } from './behavior';
   
   if (!window.BehaviorFN) {
     throw new Error('BehaviorFN core not loaded');
   }
   
   window.BehaviorFN.registerBehavior('json-template', jsonTemplateBehaviorFactory);
   // ... metadata ...
   ```

2. **Build behaviors with external core dependencies:**
   ```typescript
   await build({
     entryPoints: ['_json-template-cdn-entry.ts'],
     bundle: true,
     format: 'iife',
     outfile: 'dist/cdn/json-template.js',
     external: [
       // Mark all core imports as external
       '../behavior-registry',
       '../behavioral-host', 
       '../behavior-utils',
       // ... etc
     ],
     plugins: [inlineTypeBoxPlugin],
   });
   ```

3. **OR: Use `inject` to provide globals:**
   ```typescript
   await build({
     inject: ['./scripts/use-global-behaviorfn.js'],
     // This file provides:
     // const registerBehavior = window.BehaviorFN.registerBehavior;
     // const getBehavior = window.BehaviorFN.getBehavior;
     // etc.
   });
   ```

### Phase 3: Maintain Self-Contained Option

For users who want single-file convenience, provide both:
- `json-template.js` - Requires core (smaller)
- `json-template-standalone.js` - Self-contained (larger)

---

## Definition of Done

- [ ] Behavior bundles do NOT include registry code
- [ ] Behavior bundles do NOT include BehavioralHost class
- [ ] Behavior bundles assume `window.BehaviorFN` exists
- [ ] Behavior bundles throw error if core not loaded
- [ ] Multiple behaviors can be loaded together without conflicts
- [ ] Chat demo works with core + json-template + request
- [ ] `window.BehaviorFN.getBehavior('json-template')` returns the factory ✅
- [ ] `window.BehaviorFN.getBehavior('request')` returns the factory ✅
- [ ] Behavioral hosts can find and attach behaviors ✅
- [ ] Templates render correctly ✅
- [ ] All tests pass
- [ ] Existing CDN examples still work
- [ ] Optional: Standalone bundles provided for single-behavior use
- [ ] Documentation updated
- [ ] **User Review**: Changes verified and commit authorized

---

## Testing Plan

### Manual Test

```bash
# Rebuild CDN
pnpm build:cdn

# Check bundle sizes (should be smaller)
ls -lh dist/cdn/*.js

# Check for isolated registries (should be none)
grep "var v=new Map" dist/cdn/json-template.js  # Should NOT exist
grep "var v=new Map" dist/cdn/request.js         # Should NOT exist

# Test in browser
cd examples/chat-demo
node server.js
# Open http://localhost:3000
```

**Browser console verification:**
```javascript
// Should return the factory function
window.BehaviorFN.getBehavior('json-template')  
window.BehaviorFN.getBehavior('request')

// Should have both behaviors
document.getElementById('chat-form')._behaviors.size  // Should be 2
```

### Automated Test

Verify existing examples still work:
```bash
# Test each CDN example
cd examples/cdn
# Open 01-explicit-pattern.html
# Open 02-auto-loader-pattern.html  
# Open 03-esm-pattern.html
# All should work
```

---

## Related Issues

- Fixes: Registry isolation preventing multi-behavior loading
- Fixes: Chat demo not working
- Enables: Clean CDN usage pattern
- Reduces: Bundle sizes significantly

---

## Notes

The core already exists (`behavior-fn-core.js`) and works correctly. The problem is the behavior bundles still include ALL the infrastructure instead of depending on the core.

This task restructures the build so behaviors are lightweight modules that depend on the shared core, similar to how React components depend on the React core library.
