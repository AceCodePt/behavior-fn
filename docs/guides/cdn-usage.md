# CDN Usage Guide

> **Quick and dirty** - BehaviorFN behaviors loaded directly from CDN with zero build tools.

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
</head>
<body>
  <!-- Pure declarative - no JavaScript needed -->
  <dialog behavior="reveal" id="modal">
    <h2>Hello from BehaviorFN!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Toggle Modal</button>
</body>
</html>
```

That's it! The dialog opens and closes using native Invoker Commands API - no JavaScript required.

## Priority: Write Declarative Code First

**The best CDN code is no code at all.** Prioritize pure HTML with `behavior` and `commandfor` attributes:

### ✅ Recommended: Pure Declarative

```html
<!-- Load behavior from CDN -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<!-- Use behaviors declaratively -->
<dialog behavior="reveal" id="modal">
  <h2>Sign Up</h2>
  <form>...</form>
  <button commandfor="modal" command="--hide">Cancel</button>
</dialog>

<button commandfor="modal" command="--show">Open Sign Up</button>
```

**Benefits:**
- ✅ Zero JavaScript to maintain
- ✅ Works immediately
- ✅ No reference issues
- ✅ Resilient to DOM changes
- ✅ Declarative and readable

## When You Need JavaScript

If you need programmatic control (event listeners, dynamic manipulation), use **one of these safe patterns**:

### Option 1: ES Module with `type="module"` (Recommended)

ES modules execute **after** the DOM is parsed and auto-loader has run:

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<dialog behavior="reveal" id="modal">
  <h2>Modal Content</h2>
</dialog>

<script type="module">
  // ✅ SAFE: ES modules run after DOM is ready and auto-loader completes
  const dialog = document.getElementById('modal');
  
  // Add custom event listeners
  dialog.addEventListener('close', () => {
    console.log('Dialog closed!');
    // Your custom logic here
  });
  
  // Programmatic control
  setTimeout(() => {
    dialog.showModal(); // Open after 3 seconds
  }, 3000);
</script>
```

**Why this works:**
- ES modules are **deferred by default** - they execute after HTML parsing
- Auto-loader runs during script load
- By the time your module runs, elements are already upgraded

### Option 2: `window.addEventListener('load')`

Wait for the full page to load:

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<dialog behavior="reveal" id="modal">
  <h2>Modal Content</h2>
</dialog>

<script>
  window.addEventListener('load', () => {
    // ✅ SAFE: Runs after auto-loader completes
    const dialog = document.getElementById('modal');
    
    dialog.addEventListener('close', () => {
      console.log('Dialog closed!');
    });
  });
</script>
```

## Available Bundles

### Individual Behaviors

Load only what you need:

```html
<!-- Individual behaviors -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/compute.js"></script>
```

Available behaviors:
- `reveal.js` - Show/hide dialogs, popovers, elements
- `logger.js` - Console logging with trigger events
- `compute.js` - Reactive calculations
- `request.js` - HTTP requests with declarative controls
- `input-watcher.js` - Watch and format input values
- `element-counter.js` - Count elements matching selector

### All-in-One Bundle

Load everything at once:

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

All behaviors are loaded and ready to use.

### ESM Versions

For modern browsers with `type="module"`:

```html
<script type="module">
  import 'https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.esm.js';
  
  // Your code here - runs after auto-loader
</script>
```

## How CDN Auto-Loader Works

When you load a CDN bundle, it automatically:

1. **Registers the behavior** (e.g., `reveal`)
2. **Enables auto-loader** - watches for elements with `behavior` attribute
3. **Upgrades elements** - replaces them with properly upgraded custom elements

### The Element Replacement Process

The CDN auto-loader **replaces** elements in the DOM to properly upgrade them:

```html
<!-- Original HTML -->
<dialog behavior="reveal" id="modal">Content</dialog>

<!-- After auto-loader processes (internally) -->
<dialog is="behavioral-reveal" behavior="reveal" id="modal">Content</dialog>
```

**Important:** The element in the DOM is *replaced* with a new upgraded element that has the same attributes and children.

## ⚠️ Important Limitation: Element References

**Rule: Don't capture element references before the auto-loader runs.**

### ❌ WRONG: Reference Before Auto-Loader

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<dialog behavior="reveal" id="modal">Content</dialog>

<script>
  // ❌ BAD: Element captured BEFORE auto-loader runs
  const dialog = document.getElementById('modal');
  
  // Auto-loader runs and replaces the element...
  
  // Now `dialog` points to the OLD disconnected element
  dialog.showModal(); // Won't work! Element is not in DOM
</script>
```

**Problem:** The `dialog` variable points to the original element, but auto-loader replaced it with a new upgraded element.

### ✅ CORRECT: Safe Patterns

**Pattern 1: ES Module (Recommended)**
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<dialog behavior="reveal" id="modal">Content</dialog>

<script type="module">
  // ✅ GOOD: Query after auto-loader completes
  const dialog = document.getElementById('modal');
  dialog.showModal(); // Works!
</script>
```

**Pattern 2: Load Event**
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<dialog behavior="reveal" id="modal">Content</dialog>

<script>
  window.addEventListener('load', () => {
    // ✅ GOOD: Query after auto-loader completes
    const dialog = document.getElementById('modal');
    dialog.showModal(); // Works!
  });
</script>
```

**Pattern 3: No References (Best for CDN)**
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<!-- ✅ BEST: Pure declarative, no references -->
<dialog behavior="reveal" id="modal">Content</dialog>
<button commandfor="modal" command="--toggle">Toggle</button>
```

## Why Element Replacement?

You might wonder: "Why replace the element instead of just adding the `is` attribute?"

**Answer:** This is a fundamental Web Standards limitation. According to the Custom Elements specification:

```javascript
// This WORKS - `is` attribute present at creation
const dialog = document.createElement('dialog', { is: 'behavioral-reveal' });

// This DOESN'T WORK - adding `is` to existing element does nothing
const dialog = document.createElement('dialog');
dialog.setAttribute('is', 'behavioral-reveal'); // Element not upgraded!
```

The `is` attribute must be present when the element is **created** to properly upgrade it. The only way to upgrade existing elements is to replace them with new elements created with the `is` attribute.

**Trade-off:** This is acceptable for CDN use because:
- ✅ Quick demos don't need JavaScript references
- ✅ Declarative usage (commandfor) works perfectly
- ✅ If you need references, use safe patterns (ES modules or load event)
- ✅ Proper custom element lifecycle (connectedCallback, etc.) works correctly

## Attribute Preservation

All attributes are preserved during element replacement:

```html
<!-- Original element with many attributes -->
<dialog 
  behavior="reveal" 
  id="modal"
  class="fancy-modal"
  data-theme="dark"
  aria-label="Important Dialog">
  Content
</dialog>

<!-- After auto-loader (all attributes preserved) -->
<dialog 
  is="behavioral-reveal"
  behavior="reveal" 
  id="modal"
  class="fancy-modal"
  data-theme="dark"
  aria-label="Important Dialog">
  Content
</dialog>
```

## Examples

### Example 1: Simple Modal

```html
<!DOCTYPE html>
<html>
<head>
  <title>Simple Modal</title>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
</head>
<body>
  <button commandfor="modal" command="--toggle">
    Open Settings
  </button>
  
  <dialog behavior="reveal" id="modal">
    <h2>Settings</h2>
    <form method="dialog">
      <label>
        Theme:
        <select>
          <option>Light</option>
          <option>Dark</option>
        </select>
      </label>
      <button>Save</button>
    </form>
  </dialog>
</body>
</html>
```

### Example 2: Multiple Behaviors

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>

<!-- Element with multiple behaviors -->
<dialog behavior="reveal logger" id="debug-modal">
  <h2>Debug Info</h2>
  <pre id="logs"></pre>
  <button commandfor="debug-modal" command="--hide">Close</button>
</dialog>

<button commandfor="debug-modal" command="--toggle">
  Toggle Debug
</button>
```

### Example 3: Programmatic Control

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<dialog behavior="reveal" id="welcome">
  <h2>Welcome!</h2>
  <p>Thanks for visiting.</p>
  <button commandfor="welcome" command="--hide">Got it</button>
</dialog>

<script type="module">
  // Wait 3 seconds then show welcome dialog
  setTimeout(() => {
    const dialog = document.getElementById('welcome');
    dialog.showModal();
  }, 3000);
  
  // Track when user closes it
  const dialog = document.getElementById('welcome');
  dialog.addEventListener('close', () => {
    console.log('User dismissed welcome dialog');
    localStorage.setItem('welcomed', 'true');
  });
</script>
```

## Comparison: CLI vs CDN

| Feature | CLI (`behavior-fn add`) | CDN (unpkg) |
|---------|------------------------|-------------|
| **Setup** | Requires build tools | Just `<script>` tag |
| **File Size** | Optimized (tree-shaken) | Larger (~55KB per behavior) |
| **Customization** | Full control | Limited |
| **Type Safety** | Full TypeScript | No types |
| **Best For** | Production apps | Demos, prototypes |
| **JavaScript Refs** | Safe anytime | Use safe patterns |
| **Auto-loader** | Optional | Enabled by default |

## Best Practices

### DO:
- ✅ Use pure declarative HTML whenever possible
- ✅ Load scripts in `<head>` or before elements
- ✅ Use `type="module"` for JavaScript code
- ✅ Query elements inside `load` event if not using modules
- ✅ Use specific behavior bundles (not all-in-one) for better performance

### DON'T:
- ❌ Capture references to elements before auto-loader runs
- ❌ Use CDN for production apps (use CLI instead)
- ❌ Modify `behavior` attribute after page load (behaviors are static)
- ❌ Mix CDN bundles with CLI-installed behaviors

## Troubleshooting

### Behavior Not Working

**Check:**
1. Is the script loaded? (Check Network tab)
2. Does element have `behavior` attribute?
3. Is `is` attribute added? (Inspect element after page load)
4. Any console errors?

**Debug:**
```html
<script type="module">
  const element = document.getElementById('modal');
  console.log('behavior attr:', element.getAttribute('behavior'));
  console.log('is attr:', element.getAttribute('is'));
  console.log('constructor:', element.constructor.name);
</script>
```

### References Not Working

**Problem:** Element reference captured too early.

**Solution:** Use ES modules or load event (see safe patterns above).

### Console Error: "Unknown behavior"

**Problem:** Behavior script not loaded or typo in behavior name.

**Solution:**
```html
<!-- Make sure script is loaded -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<!-- Check spelling -->
<dialog behavior="reveal">...</dialog> <!-- ✅ Correct -->
<dialog behavior="revela">...</dialog> <!-- ❌ Typo -->
```

## When to Use CLI Instead

Consider using `behavior-fn add` (CLI) when:
- Building a production application
- Need TypeScript and type safety
- Want smaller bundle sizes (tree-shaking)
- Need to customize behavior implementations
- Working with a build tool (Vite, Webpack, etc.)

See [CLI Installation Guide](./installation.md) for details.

## Related

- [Auto-Loader Guide](./auto-loader.md) - How auto-loading works internally
- [Using Behaviors](./using-behaviors.md) - General behavior usage guide
- [Reveal Behavior](../behaviors/reveal.md) - Reveal behavior reference
- [Invoker Commands API](../architecture/command-protocol.md) - Native command protocol
