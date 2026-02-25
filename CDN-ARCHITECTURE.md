# BehaviorFN CDN Architecture (v0.2.0)

## Overview

BehaviorFN v0.2.0 introduces an **Opt-In Loading Architecture** where you explicitly choose what to load. This gives you better performance, smaller bundle sizes, and clearer mental models.

## 🔥 Breaking Change from v0.1.x

**⚠️ REMOVED:** The all-in-one bundle (`behavior-fn.all.js`) has been **completely removed** in v0.2.0.

**Why?**
- v0.1.6 all-in-one: 72KB minified (20KB gzipped) with ALL 9 behaviors
- v0.2.0 opt-in: 4.7KB to 14KB per behavior (1.9KB to 4.6KB gzipped)
- **Savings: 77% to 90% for typical use cases**

Users were loading 72KB to use one behavior. Now you load only what you need.

**Migration:** See [Migration from v0.1.x](#migration-from-v01x) section below.

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

**Size:** 4.0KB minified (1.6KB gzipped)

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

**Size:** Varies by behavior (all include core runtime + JSON Schema)

| Behavior | Minified | Gzipped |
|----------|----------|---------|
| `logger.js` | 4.7KB | 1.9KB |
| `element-counter.js` | 5.1KB | 2.0KB |
| `compound-commands.js` | 5.6KB | 2.2KB |
| `input-watcher.js` | 6.0KB | 2.4KB |
| `content-setter.js` | 6.3KB | 2.4KB |
| `json-template.js` | 7.6KB | 3.0KB |
| `compute.js` | 7.9KB | 3.0KB |
| `reveal.js` | 8.7KB | 3.2KB |
| `request.js` | 14KB | 4.6KB |

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

**Size:** 5.7KB minified (2.3KB gzipped)

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

### Pattern 1: Auto-Loader (Recommended - 2 Script Tags)

**Best for:** Most use cases, simplest setup

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. Load behavior (includes core runtime) -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
  
  <!-- 2. Load auto-loader (auto-registers hosts) -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script>
</head>
<body>
  <!-- Clean HTML (auto-loader adds is attribute) -->
  <dialog behavior="reveal" id="modal">
    <h2>Hello!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

**Total:** 14.4KB minified (5.5KB gzipped)

**Pros:**
- ✅ Simplest (just 2 script tags)
- ✅ Clean HTML (no `is` attribute)
- ✅ Auto-registers behavioral hosts
- ✅ Works with dynamic content
- ✅ 73% smaller than v0.1.6 all-in-one

**Cons:**
- ⚠️ Adds 5.7KB (2.3KB gzipped) for auto-loader

---

### Pattern 2: Manual Host (Maximum Control)

**Best for:** Production apps where every KB matters, maximum control

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. Load behavior -->
  <script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
  
  <!-- 2. Define behavioral host manually -->
  <script>
    const meta = BehaviorFN.behaviorMetadata['reveal'];
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', meta.observedAttributes);
  </script>
</head>
<body>
  <!-- Must use explicit is attribute -->
  <dialog is="behavioral-reveal" behavior="reveal" id="modal">
    <h2>Hello!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

**Total:** 8.7KB minified (3.2KB gzipped)

**Pros:**
- ✅ Smallest bundle (no auto-loader)
- ✅ No MutationObserver overhead
- ✅ Most explicit and predictable
- ✅ Best performance
- ✅ 84% smaller than v0.1.6 all-in-one

**Cons:**
- ⚠️ Requires manual `defineBehavioralHost` call
- ⚠️ Must add `is` attribute manually
- ⚠️ More verbose HTML

---

## Migration from v0.1.x

### 🔥 If you used `behavior-fn.all.js` (REMOVED):

**Before (v0.1.6):**
```html
<!-- ❌ REMOVED: All-in-one bundle (72KB / 20KB gzipped) -->
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/behavior-fn.all.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 1: Auto-Loader (Recommended)**
```html
<!-- ✅ NEW: 2 script tags (14.4KB / 5.5KB gzipped) -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script>

<dialog behavior="reveal">Content</dialog>
```

**Savings:** 73% smaller! (5.5KB vs 20KB gzipped)

**After (v0.2.0) - Option 2: Manual Host (Smallest)**
```html
<!-- ✅ NEW: 1 script tag + 1 script block (8.7KB / 3.2KB gzipped) -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script>
  const meta = BehaviorFN.behaviorMetadata['reveal'];
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', meta.observedAttributes);
</script>

<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**Savings:** 84% smaller! (3.2KB vs 20KB gzipped)

---

### If you used individual bundles + auto-loader:

**Before (v0.1.6):**
```html
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/auto-loader.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0):**
```html
<!-- ✅ SAME: No changes needed! -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**Bonus:** Bundles are now 75-90% smaller (TypeBox eliminated)!

---

### If you used explicit `is` attributes with manual host:

**Before (v0.1.6):**
```html
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/reveal.js"></script>
<script>
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', [/* attrs */]);
</script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**After (v0.2.0):**
```html
<!-- ✅ IMPROVED: Use behavior metadata instead of hardcoding -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>
<script>
  const meta = BehaviorFN.behaviorMetadata['reveal'];
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', meta.observedAttributes);
</script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**Bonus:** `observedAttributes` are now in metadata (no need to hardcode)!

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

**A:** Common configurations (all include core runtime + JSON Schema):

| Use Case | Bundles | Minified | Gzipped |
|----------|---------|----------|---------|
| Simple logger | logger.js | 4.7KB | **1.9KB** |
| Modal dialog | reveal.js | 8.7KB | **3.2KB** |
| Modal + auto-loader | reveal + auto-loader | 14.4KB | **5.5KB** |
| Form handling | request.js | 14KB | **4.6KB** |
| Complex app | reveal + request + auto-loader | 28.4KB | **10.1KB** |

**v0.1.6 all-in-one:** 72KB minified (20KB gzipped) but includes ALL 9 behaviors whether you use them or not.

**v0.2.0 savings:** Up to 97% reduction for typical use cases!

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
