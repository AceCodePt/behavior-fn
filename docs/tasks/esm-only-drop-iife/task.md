# Task: Remove IIFE Support - ESM Only

## Goal

Simplify the CDN build by removing IIFE bundle support and providing only ESM modules, eliminating all registry isolation issues and simplifying the architecture.

## Context

**Current Problem:**

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

**Why ESM Solves This:**

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

**Unsupported:** IE11 and very old browsers (negligible usage in 2026)

---

## Requirements

### Phase 1: Remove IIFE Builds

1. **Delete IIFE bundle generation:**
   - Remove `format: "iife"` builds from `scripts/build-cdn.ts`
   - Remove `globalName` configurations
   - Keep only `format: "esm"` builds

2. **Output only ESM files:**
   - `dist/cdn/behavior-fn-core.esm.js`
   - `dist/cdn/json-template.esm.js`
   - `dist/cdn/request.esm.js`
   - `dist/cdn/auto-loader.esm.js`
   - Remove `.js` files (IIFE), keep only `.esm.js`

3. **Optionally rename:**
   - `behavior-fn-core.esm.js` → `behavior-fn-core.js` (since it's the only version)
   - `json-template.esm.js` → `json-template.js`
   - Makes imports cleaner

### Phase 2: Update Loading Pattern

**Old (IIFE):**
```html
<script src="behavior-fn-core.js"></script>
<script src="json-template.js"></script>
<script src="auto-loader.js"></script>
```

**New (ESM):**
```html
<script type="module">
  import { registerBehavior, defineBehavioralHost, enableAutoLoader } 
    from './behavior-fn-core.js';
  import { jsonTemplateBehaviorFactory } 
    from './json-template.js';
    
  registerBehavior('json-template', jsonTemplateBehaviorFactory);
  defineBehavioralHost('div', 'behavioral-json-template', ['json-template-for']);
  enableAutoLoader();
</script>
```

**OR with import maps (cleaner):**
```html
<script type="importmap">
{
  "imports": {
    "behavior-fn/": "https://unpkg.com/behavior-fn@0.2.0/dist/cdn/"
  }
}
</script>

<script type="module">
  import { registerBehavior, enableAutoLoader } from 'behavior-fn/core.js';
  import { jsonTemplateBehaviorFactory } from 'behavior-fn/json-template.js';
  
  registerBehavior('json-template', jsonTemplateBehaviorFactory);
  enableAutoLoader();
</script>
```

### Phase 3: Update Examples

Update all examples in `examples/cdn/`:
- `01-explicit-pattern.html` → Use ESM imports
- `02-auto-loader-pattern.html` → Use ESM imports
- `03-esm-pattern.html` → Already ESM, just update to simplified pattern
- `index.html` → Use ESM

### Phase 4: Update Documentation

1. **CDN-ARCHITECTURE.md:**
   - Remove IIFE references
   - Update loading patterns to ESM
   - Update browser support section

2. **docs/guides/manual-loading.md:**
   - All examples use ESM
   - Add import maps examples
   - Remove IIFE patterns

3. **README.md:**
   - Quick start uses ESM
   - Update CDN examples

4. **CHANGELOG.md:**
   - Document breaking change
   - Explain rationale (registry isolation solved)
   - Provide migration guide

---

## Benefits

### 1. Solves Registry Isolation ✅
- No more isolated Maps in closures
- Natural module sharing
- Behaviors can find each other

### 2. Simpler Build ✅
- One format instead of two (IIFE + ESM)
- No `globalName` confusion
- Clearer architecture

### 3. Smaller Codebase ✅
- Remove IIFE-specific code
- Remove wrapper logic
- Easier to maintain

### 4. Modern Standard ✅
- ESM is the web standard
- Aligns with modern practices
- Better for bundlers (tree-shaking)

### 5. Better DX ✅
- Real imports/exports
- Type-safe with TypeScript
- IDE autocomplete works

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
  import { registerBehavior } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/core.js';
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

## Definition of Done

- [ ] All IIFE build code removed from `scripts/build-cdn.ts`
- [ ] Only ESM bundles generated
- [ ] ESM bundles use real exports (not IIFE with manual window assignment)
- [ ] All behaviors export their factory functions
- [ ] Core exports all public API functions
- [ ] Auto-loader exports `enableAutoLoader` function
- [ ] Chat demo works with ESM imports
- [ ] All CDN examples updated to ESM
- [ ] Documentation updated (CDN-ARCHITECTURE, manual-loading, README)
- [ ] CHANGELOG.md updated with breaking change notice
- [ ] Migration guide created
- [ ] All tests pass
- [ ] **User Review**: Changes verified and commit authorized

---

## Implementation Notes

### ESM Bundle Structure

**Core (behavior-fn-core.js):**
```javascript
// Real ESM exports
export const behaviors = new Map();
export function registerBehavior(name, factory) { behaviors.set(name, factory); }
export function getBehavior(name) { return behaviors.get(name); }
export function defineBehavioralHost(...) { ... }
export function enableAutoLoader() { ... }
```

**Behavior (json-template.js):**
```javascript
// Real ESM exports
export function jsonTemplateBehaviorFactory(el) {
  // Implementation
}

export const metadata = {
  observedAttributes: ['json-template-for'],
  schema: { ... }
};
```

**No window assignments needed** - just pure ES modules!

### Auto-Loader Pattern

**Option A: Manual Enable**
```javascript
import { enableAutoLoader } from './auto-loader.js';
enableAutoLoader();
```

**Option B: Auto-Enable in Separate File**
```javascript
// auto-loader-auto.js
import { enableAutoLoader } from './auto-loader.js';
enableAutoLoader();
```

Then users can choose:
```html
<script type="module" src="auto-loader-auto.js"></script>  <!-- Auto-enables -->
<!-- OR -->
<script type="module">
  import { enableAutoLoader } from './auto-loader.js';
  enableAutoLoader();  <!-- Manual -->
</script>
```

---

## Testing Plan

### Unit Tests
All existing tests should continue to pass (they test source, not bundles).

### CDN Bundle Tests

**Test 1: Registry Sharing**
```javascript
import { registerBehavior, getBehavior } from './core.js';
import { jsonTemplateBehaviorFactory } from './json-template.js';

registerBehavior('json-template', jsonTemplateBehaviorFactory);
console.assert(getBehavior('json-template') === jsonTemplateBehaviorFactory);
```

**Test 2: Multi-Behavior**
```javascript
import { registerBehavior, getBehavior } from './core.js';
import { jsonTemplateBehaviorFactory } from './json-template.js';
import { requestBehaviorFactory } from './request.js';

registerBehavior('json-template', jsonTemplateBehaviorFactory);
registerBehavior('request', requestBehaviorFactory);

console.assert(getBehavior('json-template') !== undefined);
console.assert(getBehavior('request') !== undefined);
```

**Test 3: Auto-Loader**
```javascript
import { registerBehavior, enableAutoLoader } from './core.js';
import { jsonTemplateBehaviorFactory } from './json-template.js';

registerBehavior('json-template', jsonTemplateBehaviorFactory);
enableAutoLoader();

// Element with behavior="json-template" should auto-upgrade
```

### Browser Tests

- Test in Chrome, Firefox, Safari, Edge
- Verify imports work
- Verify behaviors attach
- Verify templates render
- Test chat demo

---

## Migration Guide

### For Library Users

**If you were using IIFE bundles:**

Update your HTML from:
```html
<script src="https://unpkg.com/behavior-fn@0.1.x/dist/cdn/reveal.js"></script>
```

To:
```html
<script type="module">
  import { registerBehavior } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/core.js';
  import { revealBehaviorFactory } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  
  registerBehavior('reveal', revealBehaviorFactory);
</script>
```

**If you need IE11 support:**

BehaviorFN 0.2.0+ requires ES module support. Continue using 0.1.x or use a bundler (webpack, vite) to compile to ES5.

---

## Rationale

**Why drop IIFE support:**

1. **Technical:** Solves unfixable registry isolation in IIFE
2. **Practical:** ES modules have 98%+ browser support in 2026
3. **Standard:** ESM is the web standard, IIFE is legacy
4. **Simpler:** One build target, clearer architecture
5. **Better DX:** Real imports, type safety, IDE support

**Why now:**

- Project is v0.2.0 (pre-1.0) - breaking changes acceptable
- Registry isolation blocks core functionality (multi-behavior loading)
- ESM support is nearly universal
- Simplifies maintenance going forward

---

## Follow-Up Tasks

- [ ] Update package.json exports to point to ESM bundles
- [ ] Update unpkg.com configuration
- [ ] Test with CDN providers (unpkg, jsdelivr, esm.sh)
- [ ] Create migration guide for v0.1.x users
- [ ] Update CHANGELOG.md

---

## Success Criteria

After this task:
- ✅ Chat demo works perfectly with ESM imports
- ✅ Multiple behaviors can be loaded together
- ✅ Auto-loader finds all registered behaviors
- ✅ No registry isolation issues
- ✅ Cleaner, simpler codebase
- ✅ Better developer experience

**This eliminates the root cause of all CDN loading issues!**
