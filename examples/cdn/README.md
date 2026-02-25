# BehaviorFN CDN Examples

This directory contains complete examples demonstrating the three loading patterns for BehaviorFN v0.2.0.

## Examples

### [01-explicit-pattern.html](./01-explicit-pattern.html) (Recommended)

**Best for:** Production apps, maximum control, best performance

Demonstrates using explicit `is` attributes for predictable, performant behavior loading.

**Key features:**
- ✅ Smallest bundle size
- ✅ No MutationObserver overhead
- ✅ Most explicit and debuggable
- ✅ Best performance

**Pattern:**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>

<dialog is="behavioral-reveal" behavior="reveal">
  Content
</dialog>
```

---

### [02-auto-loader-pattern.html](./02-auto-loader-pattern.html) (Convenience)

**Best for:** Prototypes, content-heavy sites, quick demos

Demonstrates using the auto-loader to automatically add `is` attributes.

**Key features:**
- ✅ Cleaner HTML
- ✅ Automatic detection of dynamic content
- ✅ Closer to Alpine.js/HTMX DX
- ⚠️ Adds ~5KB + MutationObserver overhead

**Pattern:**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>

<dialog behavior="reveal">
  Content
</dialog>
```

---

### [03-esm-pattern.html](./03-esm-pattern.html) (Modern)

**Best for:** Modern browsers, bundler setups, tree-shaking

Demonstrates using native ES modules with import/export.

**Key features:**
- ✅ Tree-shakeable
- ✅ Type-safe with TypeScript
- ✅ No global namespace pollution
- ✅ Works with bundlers

**Pattern:**
```html
<script type="module">
  import { registerBehavior, defineBehavioralHost } from './behavior-fn-core.esm.js';
  import { revealBehaviorFactory } from './reveal.esm.js';

  registerBehavior('reveal', revealBehaviorFactory);
  defineBehavioralHost('dialog', 'behavioral-reveal');
</script>

<dialog is="behavioral-reveal" behavior="reveal">
  Content
</dialog>
```

---

## Running Examples Locally

### Option 1: Simple HTTP Server

```bash
# From the project root
cd examples/cdn

# Python 3
python -m http.server 8080

# Node.js (http-server)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

Then open http://localhost:8080 in your browser.

---

### Option 2: Use Provided Demo Server

```bash
# From the project root
pnpm demo
```

This starts a server with all examples available.

---

## Live Examples

All examples are also available online at:
- https://unpkg.com/behavior-fn@0.2.0/dist/cdn/index.html

---

## Pattern Comparison

| Aspect | Explicit | Auto-Loader | ESM |
|--------|----------|-------------|-----|
| **HTML Verbosity** | More (is attribute) | Less | More (is attribute) |
| **Bundle Size** | Smallest | +5.4KB | Smallest (tree-shakeable) |
| **Performance** | Best | MutationObserver overhead | Best |
| **Debugging** | Easy | Harder | Easy |
| **Dynamic Content** | Manual | Automatic | Manual |
| **Browser Support** | All | All | Modern only |
| **Best For** | Production | Prototypes | Modern apps |

---

## Which Pattern Should I Use?

### Use Explicit Pattern If:
- ✅ Building a production app
- ✅ Performance is critical
- ✅ You want the most predictable behavior
- ✅ You prefer explicit over implicit

### Use Auto-Loader Pattern If:
- ✅ Rapid prototyping
- ✅ Content-heavy site with dynamic content
- ✅ You prefer cleaner HTML
- ✅ You're building a demo or example

### Use ESM Pattern If:
- ✅ Using a modern bundler (Vite, Webpack, etc.)
- ✅ Want tree-shaking benefits
- ✅ Building a TypeScript app
- ✅ Prefer no global namespace pollution

---

## Migration from v0.1.x

If you're upgrading from v0.1.x, the all-in-one bundle (`behavior-fn.all.js`) has been removed.

**Before (v0.1.6):**
```html
<script src="behavior-fn.all.js"></script>
<dialog behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 1: Explicit**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**After (v0.2.0) - Option 2: Auto-Loader**
```html
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>
<script src="auto-loader.js"></script>
<script>BehaviorFN.enableAutoLoader();</script>
<dialog behavior="reveal">Content</dialog>
```

See [CHANGELOG.md](../../CHANGELOG.md) for complete migration guide.

---

## Resources

- [CDN Architecture Guide](../../CDN-ARCHITECTURE.md) - Complete loading patterns documentation
- [Main README](../../README.md) - Project overview
- [Changelog](../../CHANGELOG.md) - What's new in v0.2.0
- [GitHub Issues](https://github.com/AceCodePt/behavior-fn/issues) - Report bugs or request features

---

## Questions?

Open an issue on [GitHub](https://github.com/AceCodePt/behavior-fn/issues)!
