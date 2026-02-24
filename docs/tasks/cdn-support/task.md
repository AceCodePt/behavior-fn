# Task: CDN Support with Dual Package Strategy

**Type:** Feature (New Capability)  
**Priority:** High  
**Estimated Complexity:** Medium-High

## Goal

Enable BehaviorFN behaviors to be loaded directly from CDN via `<script src="...">` tags, allowing users to use behaviors without build tools, CLI, or npm installation.

## Context

Currently, BehaviorFN requires:
1. CLI installation (`npx behavior-fn init`)
2. Behavior installation (`npx behavior-fn add reveal`)
3. Module bundler or build tool

This creates barriers for:
- **Quick prototypes** and demos
- **Static HTML sites** without build tools
- **Learning** and experimentation
- **CodePen/JSFiddle** environments
- **Simple HTML/JS** projects

By adding CDN support, users can simply do:

```html
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
<script>
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

## Strategy: Option 3 - Dual Package

We will maintain **two parallel distribution formats**:

1. **TypeScript Source** (for CLI transformation)
   - Location: `dist/registry/` (existing)
   - Format: `.ts` files
   - Purpose: CLI reads these to transform schemas (TypeBox → Zod/Valibot/etc.)
   - Users: CLI users who run `behavior-fn add`

2. **JavaScript Bundles** (for CDN usage)
   - Location: `dist/cdn/` (new)
   - Format: `.js` files (IIFE and ESM)
   - Purpose: Browser-ready JavaScript that loads via `<script>` tags
   - Users: CDN users who don't want build tools

**Key Insight:** jiti is still needed by CLI for runtime schema transformation. CDN bundles are pre-compiled and don't need jiti.

## Requirements

### 1. CDN Bundle Build System

Create `scripts/build-cdn.ts` that uses esbuild to compile behaviors:

**Bundles to create:**

1. **Core Runtime** (`behavior-fn.js`)
   - `registerBehavior()`
   - `getBehavior()`
   - `defineBehavioralHost()`
   - Basic registry functionality

2. **Individual Behaviors** (e.g., `reveal.js`, `logger.js`)
   - Each behavior as standalone bundle
   - Auto-registers when loaded
   - Depends on core being loaded first

3. **All-in-One Bundle** (`behavior-fn.all.js`)
   - Core + all behaviors in one file
   - Simplest option for users (single script tag)

4. **ES Module Versions** (e.g., `reveal.esm.js`)
   - Modern `import` syntax
   - Tree-shakeable
   - Works with import maps

**Output structure:**
```
dist/
├── cdn/
│   ├── behavior-fn.js          # Core (IIFE)
│   ├── behavior-fn.esm.js      # Core (ESM)
│   ├── behavior-fn.all.js      # Everything (IIFE)
│   ├── behavior-fn.all.esm.js  # Everything (ESM)
│   ├── reveal.js               # Individual (IIFE)
│   ├── reveal.esm.js           # Individual (ESM)
│   ├── logger.js
│   ├── logger.esm.js
│   ├── request.js
│   ├── request.esm.js
│   ├── input-watcher.js
│   ├── input-watcher.esm.js
│   ├── compute.js
│   ├── compute.esm.js
│   ├── element-counter.js
│   ├── element-counter.esm.js
│   └── index.html              # Demo/examples page
└── registry/                   # TypeScript source (existing)
    └── behaviors/
        └── reveal/
            ├── behavior.ts
            └── schema.ts
```

### 2. Build Configuration

**esbuild settings for IIFE bundles:**
```typescript
{
  bundle: true,
  format: "iife",
  globalName: "BehaviorFN" | "BehaviorFN_{BehaviorName}",
  platform: "browser",
  target: "es2020",
  minify: true,
  sourcemap: true,
}
```

**esbuild settings for ESM bundles:**
```typescript
{
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  sourcemap: true,
  splitting: true, // Code splitting for shared dependencies
}
```

### 3. Auto-Registration Footer

Individual behavior bundles should auto-register when loaded:

```javascript
// Auto-injected footer for reveal.js
if (typeof window !== 'undefined' && window.BehaviorFN) {
  window.BehaviorFN.registerBehavior('reveal', BehaviorFN_Reveal.revealBehaviorFactory);
  console.log('✅ Registered behavior: reveal');
}
```

### 4. Global API Surface

When loaded via CDN, expose:

```typescript
window.BehaviorFN = {
  // Core registry functions
  registerBehavior(name: string, factory: BehaviorFactory): void;
  getBehavior(name: string): BehaviorFactory | undefined;
  ensureBehavior(name: string): Promise<void> | void;
  
  // Host definition
  defineBehavioralHost(
    tagName: string, 
    customElementName: string, 
    observedAttributes?: string[]
  ): void;
  
  // All-in-one bundle includes:
  behaviors: {
    reveal: BehaviorFactory,
    logger: BehaviorFactory,
    request: BehaviorFactory,
    // ... etc
  }
};
```

### 5. Package.json Updates

**Update build script to include CDN build:**
```json
{
  "scripts": {
    "build": "tsup index.ts --format esm --clean --external jiti --onSuccess \"cp -r registry dist/ && chmod +x dist/index.js && tsx scripts/build-cdn.ts\"",
    "test": "vitest run",
    "prepublishOnly": "pnpm build && pnpm test"
  }
}
```

**Note:** CDN build is integrated into the main build process via `--onSuccess` hook, not a separate command.

**Add to files array:**
```json
{
  "files": [
    "dist",
    "registry"
  ]
}
```
(Already includes `dist` which will contain `dist/cdn/`)

**Move auto-wc to dependencies (required at runtime for CDN bundles):**
```json
{
  "dependencies": {
    "@standard-schema/spec": "^1.1.0",
    "auto-wc": "^0.1.4",  // Move from devDependencies
    "jiti": "^2.6.1",
    "prompts": "^2.4.2"
  },
  "devDependencies": {
    "@sinclair/typebox": "^0.34.48",
    "@types/node": "^25.2.3",
    "@types/prompts": "^2.4.9",
    "esbuild": "^0.27.3",  // Already installed
    "jsdom": "^28.1.0",
    "tsup": "^8.5.1",
    "tsx": "^4.21.0",  // Already installed
    "typescript": "^5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.0.18"
  }
}
```

**Critical:** `auto-wc` must be a runtime dependency because:
- `behavioral-host.ts` imports from `auto-wc`
- CDN bundles need to include `auto-wc` code
- Users don't install dependencies when using CDN

### 6. Documentation

Create/update documentation:

1. **`docs/guides/manual-loading.md`** (new/updated)
   - CDN usage examples
   - IIFE vs ESM comparison
   - Browser compatibility notes
   - Import maps examples
   - Complete working examples

2. **`README.md`** (updated)
   - Add CDN quick start at top
   - Link to manual loading guide

3. **`examples/cdn-usage/`** (new)
   - `index.html` - Working demo
   - Multiple examples (modal, popover, request, etc.)

4. **`dist/cdn/index.html`** (auto-generated)
   - Live examples using CDN bundles
   - Copy-paste ready code snippets

### 7. TypeScript Handling

**Problem:** Registry contains TypeScript (`.ts`) files, but CDN needs JavaScript (`.js`)

**Solution:** esbuild handles TypeScript → JavaScript compilation during bundling:
- Input: `registry/behaviors/reveal/behavior.ts` (TypeScript)
- Output: `dist/cdn/reveal.js` (JavaScript)
- No intermediate compilation step needed

**CLI still needs TypeScript source:**
- CLI uses jiti to import `.ts` files at runtime
- Transforms schemas based on user's validator choice
- This is independent of CDN build

### 8. auto-wc Bundling Strategy

**Dependency:** BehaviorFN uses `auto-wc` for creating custom built-in elements

**Where it's used:**
```typescript
// behavioral-host.ts
import { defineAutoWebComponent, type TagName } from "auto-wc";

export function defineBehavioralHost<K extends TagName>(
  tagName: K,
  name?: string,
  observedAttributes: string[] = [],
) {
  // Uses auto-wc to create custom built-in elements
  defineAutoWebComponent(customElementName, tagName, withBehaviors, {
    observedAttributes: observedAttributes,
  });
}
```

**Bundling approach:**

**Option A: Bundle auto-wc into core (Recommended)**
- esbuild bundles `auto-wc` code into `behavior-fn.js`
- Users get everything in one file
- Pros: Simpler for users, one script tag
- Cons: Slightly larger bundle (~2-3KB extra)

**Option B: External auto-wc**
- Mark `auto-wc` as external in esbuild config
- Users must load `auto-wc` separately
- Pros: Smaller behavior-fn bundle
- Cons: Users need two script tags, more complex

**Decision: Use Option A (bundle auto-wc)**

**Rationale:**
- CDN users prioritize simplicity over size
- ~2-3KB is acceptable for convenience
- Single script tag better DX

**Configuration:**
```typescript
// In build-cdn.ts
await build({
  entryPoints: ['registry/behaviors/behavior-registry.ts'],
  bundle: true,
  // auto-wc will be bundled automatically (not external)
  external: [], // Don't mark auto-wc as external
  format: "iife",
  globalName: "BehaviorFN",
  // ...
});
```

**Verification:**
```bash
# After build, verify auto-wc is bundled
grep -q "defineAutoWebComponent" dist/cdn/behavior-fn.js
```

**Impact on dependencies:**
- Move `auto-wc` from `devDependencies` to `dependencies`
- Ensures it's available when esbuild bundles
- Users installing via npm also get correct dependencies

### 9. Browser Compatibility

**Target:** ES2020 (all modern browsers)

**Required polyfills (user responsibility):**
- Custom built-in elements (Safari): `@ungap/custom-elements`
- Invoker Commands API (limited support): Manual command dispatching fallback

**Document in guide:**
```html
<!-- Safari polyfill -->
<script src="https://unpkg.com/@ungap/custom-elements"></script>

<!-- Then load BehaviorFN -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

## Success Criteria

- [ ] Build script (`scripts/build-cdn.ts`) creates all bundles successfully
- [ ] IIFE bundles expose `window.BehaviorFN` global
- [ ] ESM bundles work with `import` statements
- [ ] Individual behaviors auto-register when loaded
- [ ] All-in-one bundle includes all behaviors
- [ ] Sourcemaps generated for debugging
- [ ] Bundle sizes are reasonable (<20KB gzipped for all-in-one)
- [ ] CLI functionality unchanged (still uses TypeScript source)
- [ ] jiti still works for schema transformation
- [ ] Documentation complete with working examples
- [ ] Examples run in browser without build tools
- [ ] Published to npm with CDN bundles included

## Definition of Done

- [ ] `scripts/build-cdn.ts` implemented and tested
- [ ] `pnpm build:cdn` generates all bundles correctly
- [ ] `dist/cdn/` contains all IIFE and ESM bundles
- [ ] Individual behaviors auto-register on load
- [ ] Global `BehaviorFN` API documented
- [ ] Working examples in `examples/cdn-usage/`
- [ ] `docs/guides/manual-loading.md` complete
- [ ] README updated with CDN quick start
- [ ] Browser compatibility documented
- [ ] Bundle sizes measured and documented
- [ ] All existing tests pass
- [ ] CLI transformation still works (TypeBox → Zod/Valibot)
- [ ] **User Review:** Changes verified and commit authorized

## Implementation Plan

### Phase 1: Build Infrastructure

1. **Move auto-wc to runtime dependencies:**
   ```bash
   # Edit package.json to move auto-wc from devDependencies to dependencies
   # Then run:
   pnpm install
   ```

2. **Create `scripts/build-cdn.ts`:**
   - Discover all behaviors in `registry/behaviors/`
   - Build core runtime bundle (IIFE + ESM)
   - Build individual behavior bundles (IIFE + ESM)
   - Build all-in-one bundle (IIFE + ESM)
   - Generate auto-registration footers
   - Create demo HTML file

3. **Update `package.json`:**
   - Integrate CDN build into main `build` script via `--onSuccess` hook
   - Move `auto-wc` from `devDependencies` to `dependencies`

4. **Test build:**
   ```bash
   pnpm build
   ls -lh dist/cdn/
   ```

### Phase 2: Core Runtime Bundle

Build the core registry and host system:

**Input files:**
- `registry/behaviors/behavior-registry.ts`
- `registry/behaviors/behavioral-host.ts`
- `registry/behaviors/behavior-utils.ts`

**Output:**
- `dist/cdn/behavior-fn.js` (IIFE)
- `dist/cdn/behavior-fn.esm.js` (ESM)

**Global API:**
```javascript
window.BehaviorFN = {
  registerBehavior,
  getBehavior,
  ensureBehavior,
  defineBehavioralHost,
};
```

### Phase 3: Individual Behavior Bundles

For each behavior in registry:

**Input:** `registry/behaviors/{name}/behavior.ts`

**Output:**
- `dist/cdn/{name}.js` (IIFE with auto-registration)
- `dist/cdn/{name}.esm.js` (ESM)

**Auto-registration footer:**
```javascript
if (typeof window !== 'undefined' && window.BehaviorFN) {
  window.BehaviorFN.registerBehavior('{name}', {Factory});
}
```

### Phase 4: All-in-One Bundle

**Strategy:** Create temporary entry file that imports everything

```typescript
// _all-in-one-entry.ts (temporary)
import * as core from './behavior-registry';
import { defineBehavioralHost } from './behavioral-host';
import { revealBehaviorFactory } from './reveal/behavior';
import { loggerBehaviorFactory } from './logger/behavior';
// ... import all behaviors

window.BehaviorFN = {
  ...core,
  defineBehavioralHost,
  behaviors: {
    reveal: revealBehaviorFactory,
    logger: loggerBehaviorFactory,
    // ...
  }
};

// Auto-register all
core.registerBehavior('reveal', revealBehaviorFactory);
core.registerBehavior('logger', loggerBehaviorFactory);
// ...
```

**Output:**
- `dist/cdn/behavior-fn.all.js` (IIFE)
- `dist/cdn/behavior-fn.all.esm.js` (ESM)

### Phase 5: Documentation

1. **Create `docs/guides/manual-loading.md`:**
   - Quick start with CDN
   - IIFE vs ESM comparison
   - Option 1: All-in-one bundle
   - Option 2: Core + individual behaviors
   - Option 3: ES modules with import maps
   - Browser compatibility
   - Troubleshooting
   - Complete examples

2. **Update `README.md`:**
   - Add CDN section at top of Quick Start
   - Show one-liner example
   - Link to detailed guide

3. **Create `examples/cdn-usage/index.html`:**
   - Working modal dialog example
   - Popover example
   - Multiple behaviors example
   - Custom inline behavior example

4. **Generate `dist/cdn/index.html`:**
   - Auto-generated during build
   - Lists all available bundles
   - Shows usage examples
   - Includes live demos

### Phase 6: Testing

1. **Manual testing:**
   - Serve `dist/cdn/index.html` with local server
   - Test each bundle individually
   - Test all-in-one bundle
   - Test in different browsers
   - Test with Safari polyfill

2. **Automated testing:**
   - Add test that verifies bundles exist after build
   - Check bundle sizes
   - Verify sourcemaps generated

3. **CLI regression testing:**
   - Ensure `behavior-fn init` still works
   - Ensure `behavior-fn add reveal` still works
   - Ensure schema transformation still works (TypeBox → Zod)
   - Verify jiti still loads TypeScript files

## Files to Create/Modify

### New Files

- `scripts/build-cdn.ts` - CDN build script
- `docs/guides/manual-loading.md` - CDN usage guide
- `examples/cdn-usage/index.html` - CDN examples
- `examples/cdn-usage/README.md` - Example documentation

### Modified Files

- `package.json` - Add build scripts and dependencies
- `README.md` - Add CDN quick start
- `.gitignore` - Ensure `dist/cdn/` is tracked (not ignored)

### Generated Files (during build)

- `dist/cdn/*.js` - All bundles
- `dist/cdn/*.esm.js` - ESM bundles
- `dist/cdn/*.map` - Sourcemaps
- `dist/cdn/index.html` - Demo page

## Bundle Size Targets

| Bundle | Size (minified + gzipped) |
|--------|---------------------------|
| `behavior-fn.js` (core + auto-wc) | ~7 KB |
| `reveal.js` | ~2 KB |
| `logger.js` | ~1 KB |
| `request.js` | ~3 KB |
| `input-watcher.js` | ~2 KB |
| `compute.js` | ~2 KB |
| `element-counter.js` | ~1 KB |
| `behavior-fn.all.js` (everything) | ~20 KB |

**Note:** Core bundle includes `auto-wc` (~2KB) for custom element functionality.

**Optimization strategies if sizes too large:**
- Remove unnecessary dependencies
- Use esbuild's tree-shaking
- Consider making `auto-wc` external (users load separately)
- Split behavioral-host into separate bundle

## Testing Strategy

### 1. Build Verification

```bash
# Run full build (includes CDN via --onSuccess hook)
pnpm build

# Verify outputs exist
test -f dist/cdn/behavior-fn.js
test -f dist/cdn/behavior-fn.esm.js
test -f dist/cdn/reveal.js
test -f dist/cdn/behavior-fn.all.js

# Check bundle sizes
du -h dist/cdn/*.js

# Verify auto-wc is bundled
grep -q "defineAutoWebComponent" dist/cdn/behavior-fn.js && echo "✅ auto-wc bundled"
```

### 2. Browser Testing

Create `tests/cdn-integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('CDN Bundles', () => {
  const cdnDir = join(__dirname, '../dist/cdn');
  
  it('should generate core bundle', () => {
    expect(existsSync(join(cdnDir, 'behavior-fn.js'))).toBe(true);
    expect(existsSync(join(cdnDir, 'behavior-fn.esm.js'))).toBe(true);
  });
  
  it('should generate individual behavior bundles', () => {
    const behaviors = ['reveal', 'logger', 'request'];
    behaviors.forEach(name => {
      expect(existsSync(join(cdnDir, `${name}.js`))).toBe(true);
      expect(existsSync(join(cdnDir, `${name}.esm.js`))).toBe(true);
    });
  });
  
  it('should generate all-in-one bundle', () => {
    expect(existsSync(join(cdnDir, 'behavior-fn.all.js'))).toBe(true);
  });
  
  it('should include auto-registration in individual bundles', () => {
    const revealBundle = readFileSync(join(cdnDir, 'reveal.js'), 'utf-8');
    expect(revealBundle).toContain('registerBehavior');
    expect(revealBundle).toContain('reveal');
  });
  
  it('should expose global BehaviorFN in IIFE bundles', () => {
    const coreBundle = readFileSync(join(cdnDir, 'behavior-fn.js'), 'utf-8');
    expect(coreBundle).toContain('window.BehaviorFN');
  });
});
```

### 3. Manual Browser Testing

```html
<!-- test.html -->
<!DOCTYPE html>
<html>
<head>
  <title>CDN Test</title>
</head>
<body>
  <dialog is="behavioral-reveal" id="test-modal" behavior="reveal">
    Test Content
  </dialog>
  <button commandfor="test-modal" command="--toggle">Toggle</button>
  
  <script src="../dist/cdn/behavior-fn.all.js"></script>
  <script>
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
    console.log('BehaviorFN loaded:', !!window.BehaviorFN);
    console.log('Reveal registered:', !!BehaviorFN.getBehavior('reveal'));
  </script>
</body>
</html>
```

Serve and test:
```bash
python -m http.server 8000
# Visit http://localhost:8000/test.html
```

### 4. CLI Regression Testing

Ensure CLI still works after CDN changes:

```bash
# Test init
cd /tmp/test-project
npx behavior-fn init -d

# Test add
npx behavior-fn add reveal

# Test transformation
# Should generate Zod schemas if Zod detected
grep -r "z\." src/behaviors/reveal/
```

## Dependencies

**Already installed (no new installations needed):**
- `esbuild`: ^0.27.3 - Already installed, used for CDN bundling
- `tsx`: ^4.21.0 - Already installed, used to run build script

**Dependency changes:**
- `auto-wc`: Move from `devDependencies` to `dependencies`
  - **Reason:** CDN bundles need `auto-wc` code bundled in
  - **Impact:** Slightly larger npm package, but necessary for runtime
  - `behavioral-host.ts` imports `defineAutoWebComponent` from `auto-wc`
  - When esbuild bundles `behavioral-host.ts`, it needs to include `auto-wc` code

**Existing dependencies (no changes):**
- `jiti`: Still needed for CLI schema transformation
- `@sinclair/typebox`: Still needed for registry source
- All other dependencies remain unchanged

## Risks & Mitigation

### Risk 1: Bundle Size Too Large

**Mitigation:**
- Set size budgets per bundle
- Use esbuild's tree-shaking
- Split behavioral-host if needed
- Monitor bundle sizes in CI

### Risk 2: Breaking CLI Functionality

**Mitigation:**
- Keep TypeScript source in `dist/registry/`
- Don't modify CLI code paths
- Comprehensive regression testing
- Test jiti transformation separately

### Risk 3: Browser Compatibility Issues

**Mitigation:**
- Target ES2020 (widely supported)
- Document required polyfills
- Provide fallback examples
- Test in multiple browsers

### Risk 4: Auto-Registration Conflicts

**Mitigation:**
- Check if `window.BehaviorFN` exists before registering
- Log registration to console for debugging
- Document load order requirements

### Risk 5: auto-wc Bundling Issues

**Risk:** `auto-wc` may not bundle correctly or may increase bundle size significantly

**Mitigation:**
- Test bundle size with and without `auto-wc`
- Verify `defineAutoWebComponent` is included in core bundle
- Consider making `auto-wc` external if size is prohibitive (users would need to load separately)
- Document `auto-wc` as a peer dependency if external

## Protocol Checklist

- [ ] **Plan:** Document architectural decisions in `LOG.md`
- [ ] **Data:** Define bundle structure and API surface
- [ ] **Schema:** No schema changes (using existing TypeScript types)
- [ ] **Registry:** No registry changes (source of truth unchanged)
- [ ] **Test:** Write bundle verification tests
- [ ] **Develop:** Implement build script and bundles
- [ ] **Verify:** Test in browser and CLI regression tests
- [ ] **Document:** Complete manual loading guide

## Prohibited Patterns

- ❌ Modifying TypeScript source structure (breaks CLI)
- ❌ Changing how jiti loads schemas (breaks transformation)
- ❌ Making CDN bundles depend on CLI code
- ❌ Using `any` types in build script
- ❌ Hardcoding behavior names (discover dynamically)
- ❌ Skipping sourcemap generation
- ❌ Not testing in actual browsers
- ❌ Breaking existing CLI workflows

## References

- **esbuild documentation:** https://esbuild.github.io/
- **Custom built-in elements polyfill:** https://github.com/ungap/custom-elements
- **Invoker Commands API:** https://open-ui.org/components/invokers.explainer/
- **jsdelivr CDN:** https://www.jsdelivr.com/
- **Import maps specification:** https://github.com/WICG/import-maps

## Open Questions

1. **Should we support subresource integrity (SRI) hashes?**
   - Could auto-generate in documentation
   - Adds security for CDN users

2. **Should we create minified + non-minified versions?**
   - Non-minified for debugging
   - Minified for production

3. **Should we support older browsers (ES5)?**
   - Would significantly increase bundle size
   - Decision: No, ES2020 minimum (2026 standard)

4. **Should we publish to unpkg separately?**
   - jsdelivr and unpkg both mirror npm automatically
   - Decision: No extra work needed

## Success Metrics

After implementation, track:
- CDN bundle download counts (npm stats)
- GitHub issues related to CDN usage
- Community feedback on DX
- Bundle size trends over time
- CLI usage vs CDN usage ratio

## Timeline Estimate

- **Phase 1 (Build Infrastructure):** 4 hours
- **Phase 2 (Core Bundle):** 3 hours
- **Phase 3 (Individual Bundles):** 4 hours
- **Phase 4 (All-in-One Bundle):** 2 hours
- **Phase 5 (Documentation):** 6 hours
- **Phase 6 (Testing):** 4 hours

**Total:** ~23 hours (~3 days)

## Follow-up Tasks

After this task is complete:

1. **Add SRI Hash Generation** (optional)
2. **Create CDN Usage Analytics** (optional)
3. **Add More Examples** (community-driven)
4. **Create Video Tutorial** (documentation)
5. **Publish Blog Post** (marketing)
