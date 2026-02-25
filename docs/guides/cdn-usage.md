# CDN Usage Guide (v0.2.0+ - ESM Only + Auto-Register)

> **Quick and clean** - BehaviorFN behaviors loaded directly from CDN with zero build tools. Auto-registers on import!

## Quick Start (Simplest)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    // Just import - behaviors auto-register, loader auto-enables!
    import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
    import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
  </script>
</head>
<body>
  <!-- Pure declarative - no manual registration needed -->
  <dialog behavior="reveal" id="modal">
    <h2>Hello from BehaviorFN!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Toggle Modal</button>
</body>
</html>
```

That's it! Just 2 imports - behaviors auto-register themselves, auto-loader enables itself automatically.

## ⚠️ Breaking Change from v0.1.x

v0.2.0 removes IIFE bundles completely. All bundles are now **ESM-only** with **auto-registration on import**.

**Before (v0.1.x - IIFE):**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
```

**After (v0.2.0 - ESM + Auto-Register):**
```html
<script type="module">
  import './reveal.js';       // Auto-registers!
  import './auto-loader.js';  // Auto-enables!
</script>
```

## Loading Patterns

### Pattern 1: Auto-Loader (Recommended)

**Best for:** Most use cases, cleanest code

```html
<script type="module">
  // Just import - everything happens automatically!
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
</script>

<!-- No is attribute needed -->
<dialog behavior="reveal" id="modal">
  <h2>Sign Up</h2>
  <form>...</form>
  <button commandfor="modal" command="--hide">Cancel</button>
</dialog>

<button commandfor="modal" command="--show">Open Sign Up</button>
```

**Benefits:**
- ✅ Simplest setup (just 2 imports!)
- ✅ Auto-registration on import
- ✅ Auto-enables on import
- ✅ No manual `registerBehavior()` calls
- ✅ No manual `enableAutoLoader()` calls
- ✅ Clean HTML (no `is` attribute)
- ✅ Works with dynamic content

### Pattern 2: Explicit (Best Performance)

**Best for:** Production apps, maximum control, smallest size

```html
<script type="module">
  import { defineBehavioralHost } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { metadata } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';  // Auto-registers!
  
  // Define host manually for best performance
  defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
</script>

<!-- Must use explicit is attribute -->
<dialog is="behavioral-reveal" behavior="reveal" id="modal">
  <h2>Sign Up</h2>
  <form>...</form>
  <button commandfor="modal" command="--hide">Cancel</button>
</dialog>

<button commandfor="modal" command="--show">Open Sign Up</button>
```

**Benefits:**
- ✅ Smallest bundle size (~6KB less)
- ✅ No MutationObserver overhead
- ✅ Best performance
- ✅ Auto-registration on import
- ⚠️ Requires explicit `is` attribute

## Multiple Behaviors

Load multiple behaviors by importing each one:

```html
<script type="module">
  // Import all behaviors you need - they auto-register!
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/request.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/logger.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
</script>

<!-- Use multiple behaviors on same element -->
<dialog behavior="reveal logger" id="modal">
  <form behavior="request" request-url="/api/signup" request-method="POST">
    <input name="email" type="email">
    <button type="submit">Sign Up</button>
  </form>
</dialog>
```

## Programmatic Control

If you need programmatic control (event listeners, dynamic manipulation):

```html
<script type="module">
  // Import behaviors (auto-register)
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
  
  // Your code runs after imports complete (ES modules are deferred)
  const dialog = document.getElementById('modal');
  
  // Add custom event listeners
  dialog.addEventListener('close', () => {
    console.log('Dialog closed!');
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

**Why this works:**
- ES modules are **deferred by default** - they execute after HTML parsing
- Auto-loader runs during import
- By the time your code runs, elements are already upgraded

## Import Maps (Optional)

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
  import 'behavior-fn/auto-loader.js';
</script>
```

## Available Behaviors

All behaviors are available as ESM modules with auto-registration:

| Behavior | File | Size (minified/gzipped) | Description |
|----------|------|-------------------------|-------------|
| `logger` | `logger.js` | 2.3KB / 976B | Log behavior events to console |
| `element-counter` | `element-counter.js` | 2.7KB / 1.1KB | Count matching elements |
| `compound-commands` | `compound-commands.js` | 3.1KB / 1.3KB | Execute multiple commands |
| `content-setter` | `content-setter.js` | 3.2KB / 1.2KB | Set element content |
| `input-watcher` | `input-watcher.js` | 3.8KB / 1.5KB | Watch input changes |
| `compute` | `compute.js` | 5.6KB / 2.2KB | Computed properties |
| `json-template` | `json-template.js` | 6.1KB / 2.5KB | Render JSON data |
| `reveal` | `reveal.js` | 6.8KB / 2.3KB | Show/hide with positioning |
| `request` | `request.js` | 11KB / 3.3KB | HTTP requests with validation |

## Bundle Sizes

**Pattern 1 (Auto-Loader):** ~17KB minified (~6KB gzipped)
- Core + Behavior + Auto-loader

**Pattern 2 (Explicit):** ~11KB minified (~4KB gzipped)
- Core + Behavior (no auto-loader)

## Browser Support

**ESM requires modern browsers:**
- ✅ Chrome 61+ (2017)
- ✅ Firefox 60+ (2018)
- ✅ Safari 11+ (2017)
- ✅ Edge 79+ (2020)
- ❌ IE11 not supported

**98%+ browser coverage in 2026!**

## Best Practices

### ✅ DO: Use import maps for cleaner paths

```html
<script type="importmap">
{
  "imports": {
    "behavior-fn/": "https://unpkg.com/behavior-fn@0.2.0/dist/cdn/"
  }
}
</script>

<script type="module">
  import 'behavior-fn/reveal.js';
  import 'behavior-fn/auto-loader.js';
</script>
```

### ✅ DO: Pin versions in production

```html
<script type="module">
  // ✅ Pin specific version
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  
  // ❌ Don't use @latest in production
  import 'https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js';
</script>
```

### ✅ DO: Load only what you need

```html
<script type="module">
  // ✅ Only load reveal
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
</script>
```

### ⚠️ AVOID: Using auto-loader in production if possible

Auto-loader is convenient but adds ~5KB and MutationObserver overhead. For best performance, use explicit `is` attributes:

```html
<script type="module">
  import { defineBehavioralHost } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { metadata } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  
  defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
</script>

<dialog is="behavioral-reveal" behavior="reveal">...</dialog>
```

## FAQ

### Q: Why ESM-only?

**A:** ESM eliminates registry isolation issues (behaviors can find each other), provides better DX (real imports, type safety, IDE autocomplete), and is the modern web standard (98%+ browser support).

### Q: What happened to IIFE bundles?

**A:** Removed in v0.2.0. IIFE bundles created isolated registries that couldn't share state. ESM modules naturally share singletons, solving this problem.

### Q: Do I need to call `registerBehavior()`?

**A:** No! Behaviors auto-register themselves when you import them. Just import and use.

### Q: Do I need to call `enableAutoLoader()`?

**A:** No! The auto-loader auto-enables itself when you import it. Just import and use.

### Q: Can I use this with a bundler?

**A:** Yes! All bundles are ESM-compatible. Import them in your bundler (webpack, vite, etc.) and they'll work. Note that auto-registration happens at import time, which is perfect for bundlers.

### Q: What if I need IE11 support?

**A:** Stay on v0.1.x or use a bundler (webpack, vite) to compile to ES5.

## Resources

- [CDN Architecture Guide](../../CDN-ARCHITECTURE.md)
- [Manual Loading Guide](./manual-loading.md)
- [Complete Examples](../../examples/cdn/)
