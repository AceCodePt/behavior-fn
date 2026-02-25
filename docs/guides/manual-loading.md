# Manual Loading (v0.2.0+ - ESM Only + Auto-Register)

Load BehaviorFN behaviors directly from a CDN using ESM imports. Behaviors auto-register themselves!

Perfect for:
- Quick prototypes and demos
- Static HTML sites without build tools
- Learning and experimentation
- CodePen, JSFiddle, and similar platforms

---

## Quick Start (Simplest)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BehaviorFN CDN Example</title>
</head>
<body>
  <script type="module">
    // Just import - behaviors auto-register, loader auto-enables!
    import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
    import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
  </script>
  
  <!-- No is attribute needed -->
  <dialog behavior="reveal" id="modal">
    <h2>Hello Modal!</h2>
    <p>Loaded from CDN with auto-registration!</p>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

---

## Loading Patterns

### Pattern 1: Auto-Loader (Recommended)

Load behaviors with auto-loader for cleanest HTML:

```html
<script type="module">
  // Just import - everything auto-registers and auto-enables!
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/logger.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
</script>

<!-- No is attribute needed -->
<dialog behavior="reveal logger" id="modal">
  <h2>Hello!</h2>
</dialog>
<button commandfor="modal" command="--toggle">Toggle</button>
```

**Benefits:**
- ✅ Simplest setup (just imports!)
- ✅ Auto-registration on import
- ✅ Auto-enables on import
- ✅ Clean HTML (no `is` attribute)
- ✅ Works with dynamic content

**Bundle sizes:** ~17KB minified / ~6KB gzipped (total for reveal + auto-loader)

### Pattern 2: Explicit (Best Performance)

Define hosts manually for best performance:

```html
<script type="module">
  import { defineBehavioralHost } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { metadata as revealMeta } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';  // Auto-registers!
  import { metadata as loggerMeta } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/logger.js';  // Auto-registers!
  
  // Define a dialog that can host reveal and logger behaviors
  defineBehavioralHost('dialog', 'behavioral-logger-reveal', 
    [...revealMeta.observedAttributes, ...loggerMeta.observedAttributes]);
</script>

<!-- Add is attribute explicitly -->
<dialog is="behavioral-logger-reveal" behavior="reveal logger" id="modal">
  <h2>Hello!</h2>
</dialog>
<button commandfor="modal" command="--toggle">Toggle</button>
```

**Benefits:**
- ✅ Best performance (no MutationObserver)
- ✅ Smallest bundle size (~5-6KB less)
- ✅ Auto-registration on import
- ⚠️ Requires explicit `is` attribute

**Bundle sizes:** ~11KB minified / ~4KB gzipped (total for reveal + core, no auto-loader)

---

## Multiple Behaviors

Import all behaviors you need - they auto-register themselves:

```html
<script type="module">
  // Import all behaviors you need
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/request.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/logger.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/compute.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
</script>

<!-- Use multiple behaviors -->
<dialog behavior="reveal logger" id="modal">
  <form behavior="request" request-url="/api/signup" request-method="POST">
    <input name="email" type="email">
    <div behavior="compute" compute-formula="email.length">
      Character count: <span></span>
    </div>
    <button type="submit">Sign Up</button>
  </form>
</dialog>
```

---

## Import Maps (Optional Convenience)

Use import maps to simplify import paths:

```html
<script type="importmap">
{
  "imports": {
    "behavior-fn/": "https://unpkg.com/behavior-fn@0.2.0/dist/cdn/"
  }
}
</script>

<script type="module">
  // Cleaner imports!
  import 'behavior-fn/reveal.js';
  import 'behavior-fn/request.js';
  import 'behavior-fn/auto-loader.js';
</script>
```

---

## CDN Providers

### unpkg (Recommended)

```html
<script type="module">
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
</script>
```

### jsDelivr

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/behavior-fn@0.2.0/dist/cdn/reveal.js';
</script>
```

### esm.sh

```html
<script type="module">
  import 'https://esm.sh/behavior-fn@0.2.0/dist/cdn/reveal.js';
</script>
```

---

## Available Behaviors

All behaviors are available as ESM modules with auto-registration:

| Behavior | Import | Size (min/gzip) | Description |
|----------|--------|-----------------|-------------|
| `logger` | `logger.js` | 2.3KB / 976B | Log behavior events |
| `element-counter` | `element-counter.js` | 2.7KB / 1.1KB | Count elements |
| `compound-commands` | `compound-commands.js` | 3.1KB / 1.3KB | Multiple commands |
| `content-setter` | `content-setter.js` | 3.2KB / 1.2KB | Set content |
| `input-watcher` | `input-watcher.js` | 3.8KB / 1.5KB | Watch inputs |
| `compute` | `compute.js` | 5.6KB / 2.2KB | Computed values |
| `json-template` | `json-template.js` | 6.1KB / 2.5KB | Render JSON |
| `reveal` | `reveal.js` | 6.8KB / 2.3KB | Show/hide |
| `request` | `request.js` | 11KB / 3.3KB | HTTP requests |

---

## Version Pinning

### ✅ Recommended: Pin specific version in production

```html
<script type="module">
  // Pin to specific version
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
</script>
```

### ⚠️ Not Recommended: Using @latest

```html
<script type="module">
  // Don't use @latest in production!
  import 'https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js';
</script>
```

---

## Browser Support

**ESM requires modern browsers:**
- ✅ Chrome 61+ (2017)
- ✅ Firefox 60+ (2018)
- ✅ Safari 11+ (2017)
- ✅ Edge 79+ (2020)
- ❌ IE11 not supported

**98%+ browser coverage in 2026!**

For IE11 support, stay on v0.1.x or use a bundler.

---

## Programmatic Control

Add custom logic after imports:

```html
<script type="module">
  // Import behaviors (auto-register)
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
  
  // Your code runs after imports (ES modules are deferred)
  const dialog = document.getElementById('modal');
  
  // Add custom event listeners
  dialog.addEventListener('close', () => {
    console.log('Dialog closed!');
    // Custom logic here
  });
  
  // Programmatic control
  setTimeout(() => {
    dialog.showModal(); // Open after 3 seconds
  }, 3000);
</script>

<dialog behavior="reveal" id="modal">
  <h2>Modal Content</h2>
</dialog>
```

---

## FAQ

### Q: Why ESM-only?

**A:** ESM eliminates registry isolation issues and is the modern web standard (98%+ browser support in 2026).

### Q: What happened to IIFE bundles?

**A:** Removed in v0.2.0. IIFE bundles created isolated registries that couldn't share state.

### Q: Do I need to call `registerBehavior()`?

**A:** No! Behaviors auto-register themselves when imported.

### Q: Do I need to call `enableAutoLoader()`?

**A:** No! The auto-loader auto-enables itself when imported.

### Q: Can I use this without a CDN?

**A:** Yes! Download the files and serve them locally, then import from local paths.

---

## Resources

- [CDN Architecture Guide](../../CDN-ARCHITECTURE.md)
- [CDN Usage Guide](./cdn-usage.md)
- [Complete Examples](../../examples/cdn/)
