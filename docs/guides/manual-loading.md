# Manual Loading via CDN

This guide explains how to use BehaviorFN behaviors **without the CLI** by loading them directly from a CDN using simple `<script>` tags.

Perfect for:
- **Quick prototypes** and demos
- **Static HTML sites** without build tools
- **Learning** how behaviors work
- **CodePen, JSFiddle**, and similar platforms
- **No npm, no bundler, no CLI**

---

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BehaviorFN CDN Example</title>
</head>
<body>
  <!-- Your HTML with behaviors -->
  <dialog is="behavioral-reveal" id="modal" behavior="reveal">
    <h2>Hello Modal!</h2>
    <p>Loaded from CDN—no build tools!</p>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">
    Open Modal
  </button>

  <!-- Load BehaviorFN from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
  
  <!-- Initialize -->
  <script>
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
  </script>
</body>
</html>
```

**That's it!** Save this HTML file, open it in a browser, and it works.

---

## 📦 CDN Options

### Option 1: All-in-One Bundle (Easiest)

Load everything at once:

```html
<!-- Loads core + all behaviors (~20KB gzipped) -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>

<script>
  // All behaviors are pre-registered
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

**Pros:**
- ✅ Single script tag
- ✅ All behaviors included
- ✅ Simple setup

**Cons:**
- ⚠️ Larger file size (loads all behaviors even if you don't use them)

---

### Option 2: Core + Individual Behaviors (Optimized)

Load only what you need:

```html
<!-- Load core runtime first (~5KB gzipped) -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.js"></script>

<!-- Load specific behaviors you need -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/logger.js"></script>

<script>
  // Behaviors auto-register when loaded
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-logger-reveal', []);
</script>
```

**Pros:**
- ✅ Smaller file size
- ✅ Only load what you need
- ✅ Better performance

**Cons:**
- ⚠️ Multiple script tags

---

### Option 3: ES Modules from CDN

Use modern ES modules:

```html
<script type="module">
  import { 
    registerBehavior, 
    defineBehavioralHost 
  } from 'https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.esm.js';
  
  import { revealBehaviorFactory } from 'https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/reveal.esm.js';
  
  registerBehavior('reveal', revealBehaviorFactory);
  defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

**Pros:**
- ✅ Modern standard
- ✅ Tree-shakeable
- ✅ Works with import maps

**Cons:**
- ⚠️ Requires module support (all modern browsers)

---

## 🎯 Complete Examples

### Example 1: Modal Dialog

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modal Dialog Example</title>
  <style>
    dialog {
      padding: 30px;
      border: 2px solid #2563eb;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.6);
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <h1>Modal Dialog with Reveal Behavior</h1>
  
  <button commandfor="my-modal" command="--toggle">
    Open Modal
  </button>
  
  <dialog is="behavioral-reveal" id="my-modal" behavior="reveal">
    <h2>🎉 Success!</h2>
    <p>This modal is powered by BehaviorFN loaded from CDN.</p>
    <button commandfor="my-modal" command="--hide">Close</button>
  </dialog>

  <!-- Load from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
  
  <script>
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
  </script>
</body>
</html>
```

---

### Example 2: Popover Menu

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Popover Menu Example</title>
  <style>
    [popover] {
      padding: 20px;
      border: 2px solid #2563eb;
      border-radius: 8px;
      background: white;
    }
  </style>
</head>
<body>
  <h1>Popover Menu</h1>
  
  <button commandfor="menu" command="--toggle">
    Show Menu
  </button>
  
  <div is="behavioral-reveal" 
       id="menu" 
       behavior="reveal" 
       popover="auto">
    <h3>Menu</h3>
    <ul>
      <li>📄 New Document</li>
      <li>💾 Save</li>
      <li>⚙️ Settings</li>
    </ul>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
  
  <script>
    BehaviorFN.defineBehavioralHost('div', 'behavioral-reveal', []);
  </script>
</body>
</html>
```

---

### Example 3: HTMX-Style Requests

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Request Behavior Example</title>
</head>
<body>
  <h1>Search with Request Behavior</h1>
  
  <input 
    is="behavioral-request"
    behavior="request"
    type="search"
    placeholder="Search..."
    request-url="/api/search"
    request-trigger="input"
    request-target="#results"
    request-debounce="300"
  >
  
  <div id="results"></div>

  <script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
  
  <script>
    BehaviorFN.defineBehavioralHost('input', 'behavioral-request', [
      'request-url',
      'request-method',
      'request-trigger',
      'request-target',
      'request-debounce',
    ]);
  </script>
</body>
</html>
```

---

### Example 4: Multiple Behaviors

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Multiple Behaviors Example</title>
</head>
<body>
  <h1>Dialog with Multiple Behaviors</h1>
  
  <button commandfor="logged-modal" command="--toggle">
    Open Modal
  </button>
  
  <!-- Multiple behaviors: reveal + logger -->
  <dialog is="behavioral-logger-reveal" 
          id="logged-modal" 
          behavior="reveal logger"
          log-events="command,click"
          log-prefix="[Modal]">
    <h2>Logged Modal</h2>
    <p>This modal has both reveal and logger behaviors.</p>
    <p>Check your browser console to see logged events!</p>
    <button commandfor="logged-modal" command="--hide">Close</button>
  </dialog>

  <script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
  
  <script>
    // Note: behaviors sorted alphabetically in is="behavioral-logger-reveal"
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-logger-reveal', [
      'log-events',
      'log-prefix',
      'log-attrs',
    ]);
  </script>
</body>
</html>
```

---

## 🧩 Available CDN Bundles

All bundles are available on jsdelivr and unpkg:

### Core Runtime
```html
<!-- UMD/IIFE bundle -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.js"></script>

<!-- ES Module -->
<script type="module">
  import * as BehaviorFN from 'https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.esm.js';
</script>
```

### Individual Behaviors
```html
<!-- reveal -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/reveal.js"></script>

<!-- logger -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/logger.js"></script>

<!-- request -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/request.js"></script>

<!-- input-watcher -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/input-watcher.js"></script>

<!-- compute -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/compute.js"></script>

<!-- element-counter -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/element-counter.js"></script>
```

### All-in-One
```html
<!-- Everything -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

---

## 📚 API Reference

When loaded via CDN, BehaviorFN exposes a global `BehaviorFN` object:

### `BehaviorFN.registerBehavior(name, factory)`

Register a behavior factory function:

```javascript
BehaviorFN.registerBehavior('my-behavior', (el) => {
  return {
    connectedCallback() {
      console.log('Connected!');
    },
    onClick() {
      console.log('Clicked!');
    },
  };
});
```

### `BehaviorFN.getBehavior(name)`

Get a registered behavior factory:

```javascript
const factory = BehaviorFN.getBehavior('reveal');
if (factory) {
  console.log('Reveal behavior is registered');
}
```

### `BehaviorFN.defineBehavioralHost(tagName, customElementName, observedAttributes)`

Define a custom element that can host behaviors:

```javascript
BehaviorFN.defineBehavioralHost(
  'dialog',              // Base HTML element
  'behavioral-reveal',   // Custom element name
  []                     // Observed attributes (optional)
);
```

**Parameters:**
- `tagName` - HTML element to extend (`dialog`, `div`, `button`, etc.)
- `customElementName` - Name for the custom element (must match `is` attribute)
- `observedAttributes` - Array of attribute names to observe (optional)

### `BehaviorFN.behaviors`

(All-in-one bundle only) Access to all behavior factories:

```javascript
console.log(BehaviorFN.behaviors);
// {
//   reveal: Function,
//   logger: Function,
//   request: Function,
//   ...
// }
```

---

## 🎨 Important Concepts

### The `is` Attribute Requirement

The `is` attribute is **required** for behaviors to load:

```html
<!-- ❌ Won't work - missing is attribute -->
<dialog behavior="reveal">Content</dialog>

<!-- ✅ Works - has is attribute -->
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

**For multiple behaviors**, sort alphabetically:

```html
<!-- Multiple behaviors - names sorted alphabetically -->
<dialog is="behavioral-logger-reveal" behavior="reveal logger">
```

### Invoker Commands API

BehaviorFN uses the native [Invoker Commands API](https://open-ui.org/components/invokers.explainer/):

```html
<!-- Trigger button (no behavior needed) -->
<button commandfor="modal" command="--toggle">
  Toggle Modal
</button>

<!-- Target element (has behavior) -->
<dialog is="behavioral-reveal" id="modal" behavior="reveal">
  Content
</dialog>
```

**Available commands** (behavior-specific):

**Reveal behavior:**
- `--show` - Show the element
- `--hide` - Hide the element
- `--toggle` - Toggle visibility

**Request behavior:**
- `--trigger` - Trigger the HTTP request
- `--close-sse` - Close SSE connection

### Event Handlers

Behaviors can define event handlers that are automatically wired:

```javascript
BehaviorFN.registerBehavior('click-counter', (el) => {
  let count = 0;
  
  return {
    connectedCallback() {
      el.textContent = `Clicks: ${count}`;
    },
    
    // onClick -> 'click' event
    onClick() {
      count++;
      el.textContent = `Clicks: ${count}`;
    },
    
    // onCommand -> 'command' event
    onCommand(e) {
      if (e.detail.command === '--reset') {
        count = 0;
        el.textContent = `Clicks: ${count}`;
      }
    },
  };
});
```

**Naming convention:**
- `onCommand` → `command` event
- `onClick` → `click` event
- `onMouseenter` → `mouseenter` event
- `onInput` → `input` event

---

## 🛠️ Advanced Usage

### Creating Custom Behaviors

You can define custom behaviors inline:

```html
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.js"></script>

<script>
  // Define a custom click counter behavior
  BehaviorFN.registerBehavior('click-counter', (el) => {
    let count = 0;
    
    return {
      connectedCallback() {
        el.textContent = `Clicks: ${count}`;
      },
      
      onClick() {
        count++;
        el.textContent = `Clicks: ${count}`;
      },
    };
  });
  
  // Define host
  BehaviorFN.defineBehavioralHost('div', 'behavioral-click-counter', []);
</script>

<!-- Use it -->
<div is="behavioral-click-counter" behavior="click-counter">
  Click me!
</div>
```

### Using with Import Maps

For better control over CDN URLs:

```html
<script type="importmap">
{
  "imports": {
    "behavior-fn": "https://cdn.jsdelivr.net/npm/behavior-fn@0.1.0/dist/cdn/behavior-fn.esm.js",
    "behavior-fn/reveal": "https://cdn.jsdelivr.net/npm/behavior-fn@0.1.0/dist/cdn/reveal.esm.js"
  }
}
</script>

<script type="module">
  import { registerBehavior, defineBehavioralHost } from 'behavior-fn';
  import { revealBehaviorFactory } from 'behavior-fn/reveal';
  
  registerBehavior('reveal', revealBehaviorFactory);
  defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

### Auto-Loader with CDN

Use the auto-loader to avoid specifying `is` attributes:

```html
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>

<script>
  // Enable auto-loader
  BehaviorFN.enableAutoLoader();
</script>

<!-- No is attribute needed! -->
<dialog id="modal" behavior="reveal">
  Content here
</dialog>

<button commandfor="modal" command="--toggle">Toggle</button>
```

**Note:** Auto-loader adds ~2KB and uses MutationObserver. See [Auto-Loader Guide](./auto-loader.md) for details.

---

## 🌐 Browser Compatibility

### ES Modules (Option 3)
✅ All modern browsers support ES modules

### Custom Built-in Elements (Required for `is` attribute)
⚠️ **Safari doesn't support `is` attribute**

**Workaround:** Use the polyfill:

```html
<!-- Load polyfill before BehaviorFN -->
<script src="https://unpkg.com/@ungap/custom-elements"></script>

<!-- Then load BehaviorFN -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

### Invoker Commands API
⚠️ Limited support (Chrome 114+, experimental)

**Workaround:** Manual command dispatching:

```html
<button id="trigger">Open Modal</button>
<dialog is="behavioral-reveal" id="modal" behavior="reveal">Content</dialog>

<script>
  document.getElementById('trigger').addEventListener('click', () => {
    const modal = document.getElementById('modal');
    modal.dispatchEvent(new CustomEvent('command', {
      bubbles: true,
      detail: { command: '--toggle' }
    }));
  });
</script>
```

---

## 🐛 Troubleshooting

### Behaviors Not Working

**Check:**
1. ✅ Is the `is` attribute present?
2. ✅ Did you call `defineBehavioralHost()`?
3. ✅ Is the script loaded before the element?
4. ✅ Check browser console for errors

**Solution:** Initialize after DOM is ready:

```html
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
  });
</script>
```

### Commands Not Working

**Check:**
1. ✅ Does `commandfor` match the element `id`?
2. ✅ Is the `command` attribute correct (e.g., `--toggle`)?
3. ✅ Does the browser support Invoker Commands API?

**Solution:** Use manual dispatching (see Browser Compatibility above)

### `BehaviorFN is not defined`

**Cause:** Script not loaded or script tag order is wrong

**Solution:** Ensure the core script loads first:

```html
<!-- Load core first -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.js"></script>

<!-- Then load behaviors -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/reveal.js"></script>

<!-- Then initialize -->
<script>
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
</script>
```

---

## 📊 Bundle Sizes

Approximate gzipped sizes:

| Bundle | Size (gzipped) |
|--------|----------------|
| `behavior-fn.js` (core) | ~5 KB |
| `reveal.js` | ~2 KB |
| `logger.js` | ~1 KB |
| `request.js` | ~3 KB |
| `input-watcher.js` | ~2 KB |
| `compute.js` | ~2 KB |
| `element-counter.js` | ~1 KB |
| `behavior-fn.all.js` (everything) | ~18 KB |

---

## 🚀 CDN Providers

BehaviorFN is available on multiple CDNs:

### unpkg (Recommended)
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

**Why unpkg:**
- Official npm CDN
- Automatic updates from npm registry  
- Reliable and fast
- Simple URL structure

### jsdelivr (Alternative)
```html
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

**Why jsdelivr:**
- Global CDN with edge nodes
- Bundle size analytics
- Automatic minification

### Versioning

**Recommended:** Pin to a specific version in production:

```html
<!-- unpkg: Pin to exact version -->
<script src="https://unpkg.com/behavior-fn@0.1.0/dist/cdn/behavior-fn.all.js"></script>

<!-- jsdelivr: Pin to exact version -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@0.1.0/dist/cdn/behavior-fn.all.js"></script>

<!-- Use semver range (both CDNs support this) -->
<script src="https://unpkg.com/behavior-fn@0/dist/cdn/behavior-fn.all.js"></script>
```

---

## 💡 When to Use CDN vs CLI

### Use CDN (Manual Loading) When:
- ✅ Simple HTML projects without build tools
- ✅ Quick prototypes and demos
- ✅ Learning and experimenting
- ✅ CodePen, JSFiddle, or similar platforms
- ✅ You want zero configuration

### Use CLI When:
- ✅ You have a build tool (Vite, Webpack, etc.)
- ✅ You want customization and control
- ✅ You need TypeScript support
- ✅ You want schema transformation (TypeBox → Zod)
- ✅ Production applications

---

## 📖 Next Steps

- **[Using Behaviors Guide](./using-behaviors.md)** - Learn more about behaviors
- **[Auto-Loader Guide](./auto-loader.md)** - Skip the `is` attribute
- **[Architecture Overview](../architecture/behavior-system.md)** - How it works
- **[Contributing Guide](./contributing-behaviors.md)** - Create your own behaviors

---

**Happy coding with CDN! 🎉**
