# CDN Support Implementation Log

**Task:** Implement CDN support with dual package strategy (Option 3)  
**Created:** 2026-02-24  
**Status:** Planned

---

## Context & Decision History

### Problem Statement

Users cannot easily use BehaviorFN without:
- Installing CLI (`npx behavior-fn init`)
- Setting up build tools
- Managing npm dependencies

This creates barriers for:
- Quick prototypes and demos
- Static sites without build systems
- Learning and experimentation
- CodePen/JSFiddle environments

### Solution: CDN Support with Dual Package Strategy

After exploring three options, we chose **Option 3: Dual Package** which maintains two parallel distribution formats:

1. **TypeScript Source** (`dist/registry/`) - For CLI transformation
2. **JavaScript Bundles** (`dist/cdn/`) - For CDN usage

### Why Not Other Options?

**Option 1: Compile Registry to JavaScript**
- ❌ Would require separate JS registry
- ❌ CLI couldn't transform schemas from compiled JS
- ❌ Would duplicate files (TS + JS versions)

**Option 2: CDN Build Only**
- ❌ No ES module support
- ❌ No tree-shaking
- ❌ No import maps support
- ❌ Less flexible for modern users

**Option 3: Dual Package (CHOSEN)**
- ✅ Supports both `<script src>` and `<script type="module">`
- ✅ CLI still has TypeScript for transformations
- ✅ Tree-shakeable for modern bundlers
- ✅ Import maps compatible
- ✅ Future-proof

---

## Key Architectural Decisions

### 1. Integrate CDN Build into Main Build Process

**Decision:** CDN build runs as part of the main build via `--onSuccess` hook

**Rationale:**
- Simplifies workflow (no separate `build:cdn` command)
- Ensures CDN bundles are always in sync with CLI
- Single `pnpm build` generates everything
- Cleaner for CI/CD pipelines

**Implementation:**
```json
{
  "scripts": {
    "build": "tsup index.ts --format esm --clean --external jiti --onSuccess \"cp -r registry dist/ && chmod +x dist/index.js && tsx scripts/build-cdn.ts\""
  }
}
```

**Alternative Considered:** Separate `build:cdn` command
- ❌ Would require remembering to run both commands
- ❌ Could result in out-of-sync bundles
- ❌ More complex for contributors

### 2. Move auto-wc to Runtime Dependencies

**Decision:** Move `auto-wc` from `devDependencies` to `dependencies`

**Rationale:**
- `behavioral-host.ts` imports from `auto-wc`
- CDN bundles need `auto-wc` code included
- esbuild can't bundle dependencies from devDependencies
- Users don't install dependencies when using CDN

**Impact:**
- Slightly larger npm package (~2KB)
- Correct dependency resolution
- CDN bundles are self-contained

**Alternative Considered:** Keep in devDependencies and mark as external
- ❌ Users would need to load auto-wc separately
- ❌ More complex: two script tags instead of one
- ❌ Worse DX for CDN users

### 3. Bundle auto-wc into Core Bundle

**Decision:** Bundle `auto-wc` into `behavior-fn.js` (not external)

**Rationale:**
- CDN users prioritize simplicity over size
- ~2-3KB overhead is acceptable for convenience
- Single script tag better DX
- No dependency management for users

**Configuration:**
```typescript
// In build-cdn.ts
await build({
  entryPoints: ['registry/behaviors/behavior-registry.ts'],
  bundle: true,
  external: [], // Don't mark auto-wc as external
  // auto-wc will be bundled automatically
});
```

**Alternative Considered:** External auto-wc
- ❌ Users need two script tags: `<script src="auto-wc.js">` + `<script src="behavior-fn.js">`
- ❌ More complex setup
- ❌ Dependency ordering issues

### 4. jiti Remains Necessary

**Decision:** Keep jiti as a dependency (no changes)

**Why jiti can't be removed:**
- CLI needs to load TypeScript source at runtime
- Transforms schemas based on user's validator choice
- Example: User runs `behavior-fn add reveal` with Zod → CLI reads TypeBox schema from `dist/registry/reveal/schema.ts` and converts to Zod

**CDN vs CLI:**
```
┌─────────────────────────────────────────────┐
│ CDN Users (no jiti needed)                  │
├─────────────────────────────────────────────┤
│ <script src="cdn/behavior-fn.all.js">      │
│ ↓                                           │
│ Pre-compiled JavaScript (esbuild)           │
│ ✅ Works immediately in browser             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ CLI Users (jiti needed)                     │
├─────────────────────────────────────────────┤
│ $ behavior-fn add reveal --validator=zod   │
│ ↓                                           │
│ jiti.import('dist/registry/reveal/schema.ts')│
│ ↓                                           │
│ validator.transformSchema(schema, content)  │
│ ↓                                           │
│ Writes Zod version to user's project        │
└─────────────────────────────────────────────┘
```

### 5. Output Both IIFE and ESM Formats

**Decision:** Generate both IIFE (`.js`) and ESM (`.esm.js`) versions

**IIFE bundles:**
```html
<script src="https://cdn.../behavior-fn.js"></script>
<script>
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

**ESM bundles:**
```html
<script type="module">
  import { defineBehavioralHost } from 'https://cdn.../behavior-fn.esm.js';
  defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

**Rationale:**
- IIFE: Simple `<script src>` usage (broadest compatibility)
- ESM: Modern import syntax (tree-shakeable, import maps)
- Different users have different needs
- File size overhead is minimal

---

## Technical Implementation Details

### Build System Architecture

```
┌────────────────────────────────────────────────────┐
│ Main Build Process (tsup)                          │
├────────────────────────────────────────────────────┤
│ 1. Compile CLI: index.ts → dist/index.js          │
│ 2. Copy registry: registry/ → dist/registry/      │
│ 3. --onSuccess hook: Run build-cdn.ts             │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ CDN Build Process (esbuild via build-cdn.ts)      │
├────────────────────────────────────────────────────┤
│ 1. Discover behaviors in registry/behaviors/      │
│ 2. Build core bundle (registry + host + utils)    │
│ 3. Build individual behavior bundles              │
│ 4. Build all-in-one bundle                        │
│ 5. Generate both IIFE and ESM formats             │
│ 6. Create demo HTML file                          │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│ Output: dist/cdn/                                  │
├────────────────────────────────────────────────────┤
│ behavior-fn.js (Core IIFE)                         │
│ behavior-fn.esm.js (Core ESM)                      │
│ reveal.js (Individual IIFE)                        │
│ reveal.esm.js (Individual ESM)                     │
│ behavior-fn.all.js (Everything IIFE)               │
│ behavior-fn.all.esm.js (Everything ESM)            │
│ *.map (Sourcemaps)                                 │
│ index.html (Demo/examples)                         │
└────────────────────────────────────────────────────┘
```

### Auto-Registration Pattern

Individual behavior bundles auto-register when loaded:

```javascript
// Generated footer for reveal.js
(function() {
  // Behavior code here...
  
  // Auto-register when loaded
  if (typeof window !== 'undefined' && window.BehaviorFN) {
    window.BehaviorFN.registerBehavior('reveal', revealBehaviorFactory);
    console.log('✅ Registered behavior: reveal');
  } else {
    console.warn('⚠️ BehaviorFN core not loaded. Load behavior-fn.js first.');
  }
})();
```

### Bundle Composition

**Core bundle (`behavior-fn.js`):**
- `behavior-registry.ts` → Registry functions
- `behavioral-host.ts` → Host mixin
- `behavior-utils.ts` → Utility functions
- `auto-wc` (bundled) → Custom element helpers

**Individual bundle (`reveal.js`):**
- `reveal/behavior.ts` → Behavior implementation
- `reveal/schema.ts` → Schema definition
- `reveal/_behavior-definition.ts` → Metadata
- Auto-registration footer

**All-in-one bundle (`behavior-fn.all.js`):**
- Everything from core
- All individual behaviors
- Auto-registers all behaviors
- Single script tag solution

---

## Bundle Size Analysis

### Estimated Sizes (minified + gzipped)

| Bundle | Size | Contents |
|--------|------|----------|
| `behavior-fn.js` | ~7 KB | Core + auto-wc |
| `reveal.js` | ~2 KB | Reveal behavior |
| `logger.js` | ~1 KB | Logger behavior |
| `request.js` | ~3 KB | Request behavior |
| `input-watcher.js` | ~2 KB | Input watcher |
| `compute.js` | ~2 KB | Compute behavior |
| `element-counter.js` | ~1 KB | Element counter |
| **Total (all-in-one)** | **~20 KB** | Everything |

**Size breakdown:**
- Core runtime: ~3 KB
- auto-wc: ~2 KB
- behavioral-host: ~2 KB
- All behaviors: ~11 KB
- **Total: ~18-20 KB**

**Comparison:**
- Alpine.js: ~15 KB (similar functionality)
- HTMX: ~14 KB (less features)
- Petite-vue: ~6 KB (fewer features)

**Conclusion:** 20 KB is reasonable for the feature set.

---

## CDN Usage Patterns

### Pattern 1: All-in-One (Simplest)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
</head>
<body>
  <dialog is="behavioral-reveal" id="modal" behavior="reveal">
    Content
  </dialog>
  <button commandfor="modal" command="--toggle">Toggle</button>
  
  <script>
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
  </script>
</body>
</html>
```

**Use case:** Quick prototypes, demos, learning

### Pattern 2: Core + Individual Behaviors (Optimized)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.../behavior-fn.js"></script>
  <script src="https://cdn.../reveal.js"></script>
  <script src="https://cdn.../logger.js"></script>
</head>
<body>
  <!-- Usage same as above -->
  <script>
    // Behaviors auto-registered
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-logger-reveal', []);
  </script>
</body>
</html>
```

**Use case:** Production sites, optimized loading

### Pattern 3: ES Modules (Modern)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { 
      registerBehavior, 
      defineBehavioralHost 
    } from 'https://cdn.../behavior-fn.esm.js';
    
    import { revealBehaviorFactory } from 'https://cdn.../reveal.esm.js';
    
    registerBehavior('reveal', revealBehaviorFactory);
    defineBehavioralHost('dialog', 'behavioral-reveal', []);
  </script>
</head>
<body>
  <!-- Usage same as above -->
</body>
</html>
```

**Use case:** Modern projects, tree-shaking, import maps

---

## Testing Strategy

### 1. Build Verification
- Verify all bundles generated
- Check bundle sizes
- Verify auto-wc bundled correctly
- Verify sourcemaps generated

### 2. Browser Testing
- Test in Chrome, Firefox, Safari (with polyfill)
- Test IIFE bundles with `<script src>`
- Test ESM bundles with `<script type="module">`
- Test auto-registration works

### 3. Integration Testing
- Test all-in-one bundle
- Test core + individual bundles
- Test multiple behaviors
- Test custom inline behaviors

### 4. CLI Regression Testing
- Ensure `behavior-fn init` still works
- Ensure `behavior-fn add reveal` still works
- Ensure schema transformation still works
- Verify jiti still imports TypeScript

---

## Documentation Updates

### Files to Create
1. `docs/guides/manual-loading.md` - Complete CDN guide
2. `examples/cdn-usage/index.html` - Working examples
3. `examples/cdn-usage/README.md` - Example documentation

### Files to Update
1. `README.md` - Add CDN quick start
2. `docs/guides/using-behaviors.md` - Link to CDN guide

### Auto-Generated
1. `dist/cdn/index.html` - Live demo page

---

## Risk Mitigation

### Risk 1: Bundle Size Too Large
**Mitigation:**
- Set size budgets (20 KB max for all-in-one)
- Monitor sizes in CI
- Consider external auto-wc if needed

### Risk 2: Breaking CLI
**Mitigation:**
- Don't touch TypeScript source structure
- Comprehensive regression tests
- Keep jiti unchanged

### Risk 3: Browser Compatibility
**Mitigation:**
- Target ES2020 (widely supported)
- Document required polyfills
- Provide fallback examples

---

## Success Metrics

After implementation:
- [ ] CDN bundles available on npm
- [ ] jsdelivr and unpkg automatically mirror
- [ ] Documentation complete with examples
- [ ] Bundle sizes within targets
- [ ] CLI functionality unchanged
- [ ] All tests passing

---

## Timeline

**Estimated:** 3 days (~23 hours)

**Breakdown:**
- Build infrastructure: 4 hours
- Core bundle: 3 hours
- Individual bundles: 4 hours
- All-in-one bundle: 2 hours
- Documentation: 6 hours
- Testing: 4 hours

---

## Open Questions

1. **Should we version-pin jsdelivr URLs in docs?**
   - Recommendation: Show both `@latest` and `@0.1.0` patterns

2. **Should we generate SRI hashes?**
   - Recommendation: Yes, auto-generate in documentation

3. **Should we support ES5 for older browsers?**
   - Recommendation: No, ES2020 minimum (2026 standard)

---

## Follow-up Tasks

1. Add SRI hash generation (optional)
2. Create video tutorial (documentation)
3. Publish blog post (marketing)
4. Add CDN usage analytics (optional)
5. Community examples (ongoing)

---

## References

- [esbuild documentation](https://esbuild.github.io/)
- [auto-wc repository](https://github.com/AceCodePt/auto-wc)
- [Custom elements polyfill](https://github.com/ungap/custom-elements)
- [Invoker Commands API](https://open-ui.org/components/invokers.explainer/)
- [jsdelivr CDN](https://www.jsdelivr.com/)

---

**Next Steps:** Begin implementation following task.md specifications.
