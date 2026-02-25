# BehaviorFN CDN Architecture (v0.2.0)

## Overview

BehaviorFN v0.2.0 introduces an **Opt-In Loading Architecture** where you explicitly choose what to load. This gives you better performance, smaller bundle sizes, and clearer mental models.

## Breaking Change from v0.1.x

**Removed:** The all-in-one bundle (`behavior-fn.all.js`) has been removed.

**Why?** To encourage intentional loading and prevent users from bundling behaviors they don't use. This results in better performance and forces explicit dependency management.

---

## Bundle Types

### 1. Core Runtime Bundle (Required)

**Files:** `behavior-fn-core.js` / `behavior-fn-core.esm.js`

**What it contains:**
- `behavior-registry` - Behavior registration and lookup
- `behavioral-host` - Custom element host logic
- `behavior-utils` - Utility functions (parseBehaviorNames, getObservedAttributes)
- `types` - TypeScript types
- `event-methods` - Event handler utilities

**Exports:**
```javascript
window.BehaviorFN = {
  registerBehavior,     // Register a behavior factory
  getBehavior,          // Get a registered behavior
  defineBehavioralHost, // Define a custom element host
  parseBehaviorNames,   // Parse behavior attribute
  getObservedAttributes,// Extract observed attributes from schema
  version,              // Current version
};
```

**Size:** ~4KB minified (~1.5KB gzipped)

**Usage:**
```html
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
```

---

### 2. Individual Behavior Bundles

**Files:** `reveal.js`, `request.js`, `json-template.js`, etc.

**What they do:**
- Check that core is loaded (throws error if not)
- Auto-register the behavior factory
- Log registration confirmation

**Example:**
```javascript
// reveal.js (conceptual)
if (!window.BehaviorFN) {
  console.error('[BehaviorFN] Core not loaded! Load behavior-fn-core.js first.');
} else {
  window.BehaviorFN.registerBehavior('reveal', revealBehaviorFactory);
  console.log('✅ BehaviorFN: Registered "reveal" behavior');
}
```

**Size:** Varies by behavior
- `logger.js`: ~750 bytes
- `element-counter.js`: ~1.2KB
- `reveal.js`: ~50KB (includes Popper.js for positioning)
- `request.js`: ~53KB (includes validation logic)

**Usage:**
```html
<!-- Load core first! -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>

<!-- Then load behaviors you need -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/request.js"></script>
```

---

### 3. Auto-Loader (Optional)

**Files:** `auto-loader.js` / `auto-loader.esm.js`

**What it does:**
- Automatically adds `is="behavioral-*"` attributes to elements with `behavior` attributes
- Scans DOM on load (when you call `enableAutoLoader()`)
- Watches for new elements (MutationObserver)
- Registers behavioral hosts automatically

**Important:** Automatically enables itself when loaded via `<script>` tag.

**Size:** ~5.4KB minified (~2KB gzipped)

**Usage:**
```html
<!-- Load core -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>

<!-- Load behaviors -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>

<!-- Load auto-loader (auto-enables itself) -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script>

<!-- Now you can omit the is attribute -->
<dialog behavior="reveal">Content</dialog>
```

---

## Loading Patterns

### Pattern 1: Explicit (Recommended)

**Best for:** Production apps, maximum control, best performance

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. Load core runtime -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
  
  <!-- 2. Load behaviors you need -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
</head>
<body>
  <!-- 3. Use explicit is attributes -->
  <dialog is="behavioral-reveal" behavior="reveal" id="modal">
    <h2>Hello!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

**Pros:**
- ✅ Smallest bundle size
- ✅ No MutationObserver overhead
- ✅ Most explicit and predictable
- ✅ Best performance
- ✅ No JavaScript required to activate behaviors

**Cons:**
- ⚠️ Must add `is` attribute manually
- ⚠️ More verbose HTML

---

### Pattern 2: Auto-Loader (Convenience)

**Best for:** Prototypes, content-heavy sites, quick demos

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. Load core runtime -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
  
  <!-- 2. Load behaviors you need -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/request.js"></script>
  
  <!-- 3. Load auto-loader (auto-enables itself) -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script>
</head>
<body>
  <!-- 4. Omit is attributes (auto-loader adds them) -->
  <dialog behavior="reveal" id="modal">
    <h2>Hello!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

**Pros:**
- ✅ Cleaner HTML
- ✅ Closer to Alpine.js/HTMX DX
- ✅ Good for content-heavy sites

**Cons:**
- ⚠️ Adds ~5KB + MutationObserver overhead
- ⚠️ Requires explicit enablement
- ⚠️ Less explicit (harder to debug)
- ⚠️ May have timing issues with dynamic UIs

---

## Migration from v0.1.x

### If you used `behavior-fn.all.js`:

**Before (v0.1.6):**
```html
<!-- Single bundle, auto-loader auto-enabled -->
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/behavior-fn.all.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 1: Explicit**
```html
<!-- Explicit core + behaviors, explicit is -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 2: Auto-Loader**
```html
<!-- Explicit core + behaviors + auto-loader -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>
<dialog behavior="reveal">Content</dialog>
```

---

### If you used individual bundles + auto-loader:

**Before (v0.1.6):**
```html
<!-- Individual bundles included core, auto-loader auto-enabled -->
<script src="reveal.js"></script>
<script src="auto-loader.js"></script> <!-- auto-enabled itself -->
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0):**
```html
<!-- Explicit core, explicit auto-loader enablement -->
<script src="behavior-fn-core.js"></script> <!-- NEW: explicit core -->
<script src="reveal.js"></script>
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script> <!-- NEW: explicit call -->
<dialog behavior="reveal">Content</dialog>
```

---

### If you used explicit `is` attributes:

**Before (v0.1.6):**
```html
<script src="reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**After (v0.2.0):**
```html
<script src="behavior-fn-core.js"></script> <!-- NEW: explicit core -->
<script src="reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

---

## Architecture Diagrams

### Pattern 1: Explicit (Recommended)

```
behavior-fn-core.js
├─ Exposes: window.BehaviorFN
├─ Registers: (none - just the runtime)
└─ Size: ~4KB

reveal.js
├─ Checks: window.BehaviorFN exists
├─ Registers: 'reveal' behavior
└─ Size: ~50KB

HTML:
<dialog is="behavioral-reveal" behavior="reveal">
  ↑ Explicit is attribute - browser upgrades immediately
</dialog>
```

---

### Pattern 2: Auto-Loader

```
behavior-fn-core.js
├─ Exposes: window.BehaviorFN
└─ Size: ~4KB

reveal.js
├─ Registers: 'reveal' behavior
└─ Size: ~50KB

auto-loader.js
├─ Exposes: window.BehaviorFN.enableAutoLoader
└─ Size: ~5.4KB

<script>BehaviorFN.enableAutoLoader();</script>
├─ Scans: DOM for [behavior] attributes
├─ Adds: is="behavioral-*" dynamically
└─ Observes: New elements via MutationObserver

HTML:
<dialog behavior="reveal">
  ↓ Auto-loader adds is attribute
<dialog is="behavioral-reveal" behavior="reveal">
  ↑ Browser upgrades element
</dialog>
```

---

## Load Order Requirements

**Critical:** Always load in this order:

1. **Core Runtime** (`behavior-fn-core.js`)
2. **Behaviors** (`reveal.js`, `request.js`, etc.)
3. **Auto-Loader** (optional, `auto-loader.js`)
4. **Enable Auto-Loader** (optional, `BehaviorFN.enableAutoLoader()`)

**Why?**
- Individual behaviors check for `window.BehaviorFN` (provided by core)
- Auto-loader checks for `window.BehaviorFN` and registered behaviors
- If loaded out of order, you'll get console errors

**Example: Wrong Order ❌**
```html
<!-- ❌ BAD: Behavior before core -->
<script src="reveal.js"></script>  <!-- Error: BehaviorFN not defined -->
<script src="behavior-fn-core.js"></script>
```

**Example: Correct Order ✅**
```html
<!-- ✅ GOOD: Core first -->
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
```

---

## Available Behaviors

All behaviors are available as individual bundles:

| Behavior | Size | Description |
|----------|------|-------------|
| `logger.js` | ~750 bytes | Log behavior events to console |
| `element-counter.js` | ~1.2KB | Count matching elements |
| `compound-commands.js` | ~1.7KB | Execute multiple commands |
| `input-watcher.js` | ~1.7KB | Watch input changes |
| `json-template.js` | ~3.6KB | Render JSON data |
| `compute.js` | ~4.2KB | Computed properties |
| `content-setter.js` | ~47KB | Set element content |
| `reveal.js` | ~50KB | Show/hide elements with positioning |
| `request.js` | ~53KB | HTTP requests with validation |

---

## ESM Support

All bundles have ESM versions (`.esm.js`) for modern bundlers:

```javascript
// Import core
import { registerBehavior, defineBehavioralHost } from 'behavior-fn/dist/cdn/behavior-fn-core.esm.js';

// Import behaviors
import { revealBehaviorFactory } from 'behavior-fn/dist/cdn/reveal.esm.js';

// Register manually
registerBehavior('reveal', revealBehaviorFactory);
defineBehavioralHost('dialog', 'behavioral-reveal');
```

---

## Best Practices

### ✅ DO: Use explicit `is` attributes in production
```html
<dialog is="behavioral-reveal" behavior="reveal">
```

### ✅ DO: Load only behaviors you need
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script> <!-- Only reveal, not all behaviors -->
```

### ✅ DO: Pin versions in production
```html
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
```

### ✅ DO: Load core before behaviors
```html
<script src="behavior-fn-core.js"></script> <!-- First! -->
<script src="reveal.js"></script>
```

### ⚠️ AVOID: Loading behaviors before core
```html
<!-- ❌ BAD ORDER -->
<script src="reveal.js"></script>
<script src="behavior-fn-core.js"></script>
```

### ⚠️ AVOID: Using auto-loader in production
Auto-loader is convenient for prototypes, but explicit `is` attributes are faster and more predictable.

### ⚠️ AVOID: Using @latest in production
```html
<!-- ❌ Don't use @latest -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>

<!-- ✅ Pin specific version -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
```

---

## FAQ

### Q: Why was the all-in-one bundle removed?

**A:** To encourage intentional loading and better performance. Users should only load what they need, not bundle everything by default. This also reduces confusion about "which loading pattern to use."

---

### Q: Do I need the auto-loader?

**A:** No! Use explicit `is` attributes for better performance. Auto-loader is a convenience feature for prototyping or content-heavy sites where DX > explicitness.

---

### Q: What if I forget to load core?

**A:** Individual behavior bundles will log an error to the console:
```
[BehaviorFN] Core not loaded! Load behavior-fn-core.js before reveal.js
[BehaviorFN] Expected: <script src="behavior-fn-core.js"></script>
```

---

### Q: Can I use ESM imports?

**A:** Yes! All bundles have `.esm.js` versions:
```javascript
import { registerBehavior } from 'behavior-fn/dist/cdn/behavior-fn-core.esm.js';
import { revealBehaviorFactory } from 'behavior-fn/dist/cdn/reveal.esm.js';
```

---

### Q: How do I enable auto-loader?

**A:** Load `auto-loader.js` and explicitly call `BehaviorFN.enableAutoLoader()`:
```html
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>
```

---

### Q: What's the total size for a typical setup?

**A:** Example: Core + Reveal + Request (no auto-loader)
- Core: ~4KB
- Reveal: ~50KB
- Request: ~53KB
- **Total: ~107KB (~30KB gzipped)**

Compare to v0.1.6 all-in-one: ~72KB (~20KB gzipped) but includes ALL behaviors.

---

## Resources

- [GitHub Repository](https://github.com/AceCodePt/behavior-fn)
- [Documentation](https://github.com/AceCodePt/behavior-fn/blob/main/README.md)
- [Report Issues](https://github.com/AceCodePt/behavior-fn/issues)
- [Changelog](https://github.com/AceCodePt/behavior-fn/blob/main/CHANGELOG.md)

---

## Summary

**v0.2.0 Architecture:**
1. Load core runtime (`behavior-fn-core.js`) - Required
2. Load individual behaviors you need - Required
3. Optionally load auto-loader (`auto-loader.js`) - Optional
4. Optionally enable auto-loader (`BehaviorFN.enableAutoLoader()`) - Optional

**Key Principle:** Explicit is better than implicit. Load only what you need.
