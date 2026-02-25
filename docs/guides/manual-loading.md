# CDN Usage

Load BehaviorFN behaviors directly from a CDN using `<script>` tags.

Perfect for:
- Quick prototypes and demos
- Static HTML sites without build tools
- Learning and experimentation
- CodePen, JSFiddle, and similar platforms

---

## Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BehaviorFN CDN Example</title>
</head>
<body>
  <!-- 1. Load core runtime (required) -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
  
  <!-- 2. Load behavior -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  
  <!-- 3. Load auto-loader (auto-adds is attributes) -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
  
  <dialog behavior="reveal" id="modal">
    <h2>Hello Modal!</h2>
    <p>Loaded from CDN</p>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

---

## Loading Options

### Individual Behaviors (Recommended)

Load only what you need. **Core is required first**, then behaviors:

```html
<!-- 1. Load core runtime (required) -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>

<!-- 2. Load specific behaviors -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>

<!-- 3. Load auto-loader (enables automatic is attribute addition) -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>

<!-- Now just use behavior attribute (no is needed!) -->
<dialog behavior="reveal logger" id="modal">
  <h2>Hello!</h2>
</dialog>
<button commandfor="modal" command="--toggle">Toggle</button>
```

**Bundle sizes:** Core (4KB / 1.6KB gzipped) is shared. Individual behaviors: 2.3-11KB minified / 976B-3.3KB gzipped.

**Without auto-loader**, use explicit `is` attributes and define behavioral hosts:

```html
<!-- 1. Load core runtime (required) -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>

<!-- 2. Load behaviors -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>

<!-- 3. Define behavioral hosts manually -->
<script>
  // Get metadata for behaviors
  const revealMeta = window.BehaviorFN.behaviorMetadata['reveal'];
  const loggerMeta = window.BehaviorFN.behaviorMetadata['logger'];
  
  // Define a dialog that can host reveal and logger behaviors
  window.BehaviorFN.defineBehavioralHost('dialog', 'behavioral-logger-reveal', 
    [...revealMeta.observedAttributes, ...loggerMeta.observedAttributes]);
</script>

<!-- Add is attribute explicitly -->
<dialog is="behavioral-logger-reveal" behavior="reveal logger" id="modal">
  <h2>Hello!</h2>
</dialog>
```

**Note:** The auto-loader automatically calls `defineBehavioralHost()` for you. Without it, you must define hosts manually for each tag+behavior combination you use.

---

### Manual Registration (Advanced)

For explicit control over registration:

```html
<!-- 1. Load core -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>

<!-- 2. Load behavior -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<!-- 3. Define behavioral host manually -->
<script>
  const meta = BehaviorFN.behaviorMetadata['reveal'];
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', meta.observedAttributes);
</script>

<dialog is="behavioral-reveal" behavior="reveal" id="modal">
  Content
</dialog>
```

Use when you need explicit control over behavioral host registration.

---

### ES Modules

```html
<script type="module">
  // Import core
  import { 
    registerBehavior, 
    defineBehavioralHost 
  } from 'https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.esm.js';
  
  // Behaviors auto-register when imported, but you can also import their factories
  import 'https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.esm.js';
  
  // Define host with metadata
  const meta = window.BehaviorFN.behaviorMetadata['reveal'];
  defineBehavioralHost('dialog', 'behavioral-reveal', meta.observedAttributes);
</script>
```

Modern import syntax with tree-shaking support.

---

## Examples

### Modal Dialog

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modal Dialog</title>
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
  
  <!-- Load core + behavior + auto-loader -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
  
  <button commandfor="my-modal" command="--toggle">
    Open Modal
  </button>
  
  <dialog id="my-modal" behavior="reveal">
    <h2>🎉 Success!</h2>
    <p>This modal is powered by BehaviorFN from CDN.</p>
    <button commandfor="my-modal" command="--hide">Close</button>
  </dialog>
</body>
</html>
```

---

### Popover Menu

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Popover Menu</title>
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
  
  <!-- Load core + behavior + auto-loader -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
  
  <button commandfor="menu" command="--toggle">
    Show Menu
  </button>
  
  <div id="menu" behavior="reveal" popover="auto">
    <h3>Menu</h3>
    <ul>
      <li>📄 New Document</li>
      <li>💾 Save</li>
      <li>⚙️ Settings</li>
    </ul>
  </div>
</body>
</html>
```

---

### HTMX-Style Requests

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Request Behavior</title>
</head>
<body>
  <h1>Search with Request Behavior</h1>
  
  <!-- Load core + behavior + auto-loader -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/request.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
  
  <input 
    behavior="request"
    type="search"
    placeholder="Search..."
    request-url="/api/search"
    request-trigger="input"
    request-target="#results"
    request-debounce="300"
  >
  
  <div id="results"></div>
</body>
</html>
```

---

### Multiple Behaviors

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Multiple Behaviors</title>
</head>
<body>
  <h1>Dialog with Multiple Behaviors</h1>
  
  <!-- Load core + behaviors + auto-loader -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
  
  <button commandfor="logged-modal" command="--toggle">
    Open Modal
  </button>
  
  <dialog id="logged-modal" 
          behavior="reveal logger"
          log-events="command,click"
          log-prefix="[Modal]">
    <h2>Logged Modal</h2>
    <p>This modal has both reveal and logger behaviors.</p>
    <p>Check your browser console to see logged events!</p>
    <button commandfor="logged-modal" command="--hide">Close</button>
  </dialog>
</body>
</html>
```

---

## Available Bundles

All bundles are available on unpkg and jsdelivr:

**Core Runtime (Required):**
- `https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js` (4KB / 1.6KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.esm.js` (ESM)

**Individual Behaviors:**
- `https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js` (2.3KB / 976B gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/element-counter.js` (2.7KB / 1.1KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/compound-commands.js` (3.1KB / 1.3KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/content-setter.js` (3.2KB / 1.2KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/input-watcher.js` (3.8KB / 1.5KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/compute.js` (5.6KB / 2.2KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/json-template.js` (6.1KB / 2.5KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js` (6.8KB / 2.3KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/request.js` (11KB / 3.3KB gzipped)

**Auto-Loader (Optional):**
- `https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js` (5.6KB / 2.2KB gzipped)
- `https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.esm.js` (ESM)

**ES Modules:**
- Add `.esm.js` extension for any bundle (e.g., `reveal.esm.js`)

**Note:** Sizes shown are minified / gzipped without core. Add core (4KB / 1.6KB gzipped) for total.

---

## API Reference

### Global Object

CDN bundles expose `window.BehaviorFN`:

```javascript
BehaviorFN.registerBehavior(name, factory)
BehaviorFN.getBehavior(name)
BehaviorFN.defineBehavioralHost(tagName, customElementName, observedAttributes)
```

### Register Behavior

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

### Define Behavioral Host

```javascript
BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
```

Parameters:
- `tagName` - Base HTML element
- `customElementName` - Custom element name (must be `behavioral-*`)
- `observedAttributes` - Array of attributes to observe (optional)

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

### Invoker Commands

BehaviorFN uses the [Invoker Commands API](https://open-ui.org/components/invokers.explainer/):

```html
<button commandfor="modal" command="--toggle">Toggle Modal</button>
<dialog id="modal" behavior="reveal">Content</dialog>
```

**Reveal commands:**
- `--show` - Show element
- `--hide` - Hide element
- `--toggle` - Toggle visibility

**Request commands:**
- `--trigger` - Trigger HTTP request
- `--close-sse` - Close SSE connection

### Event Handlers

Behaviors return objects with event handlers:

```javascript
BehaviorFN.registerBehavior('click-counter', (el) => {
  let count = 0;
  
  return {
    onClick() {
      count++;
      el.textContent = `Clicks: ${count}`;
    }
  };
});
```

Handler naming: `onClick` → `'click'` event, `onCommand` → `'command'` event

---

## Advanced Usage

### Custom Behaviors

Define behaviors inline:

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.js"></script>

<script>
  BehaviorFN.registerBehavior('click-counter', (el) => {
    let count = 0;
    return {
      onClick() {
        count++;
        el.textContent = `Clicks: ${count}`;
      }
    };
  });
  
  BehaviorFN.defineBehavioralHost('div', 'behavioral-click-counter', []);
</script>

<div is="behavioral-click-counter" behavior="click-counter">
  Click me!
</div>
```

### Import Maps

```html
<script type="importmap">
{
  "imports": {
    "behavior-fn": "https://unpkg.com/behavior-fn@0.1.0/dist/cdn/behavior-fn.esm.js",
    "behavior-fn/reveal": "https://unpkg.com/behavior-fn@0.1.0/dist/cdn/reveal.esm.js"
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

---

## Browser Compatibility

**Custom Built-in Elements:**
Safari requires polyfill for `is` attribute:

```html
<script src="https://unpkg.com/@ungap/custom-elements@latest"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
```

**Invoker Commands API:**
Limited support (Chrome 114+). Fallback:

```html
<button id="trigger">Open Modal</button>
<dialog id="modal" behavior="reveal">Content</dialog>

<script>
  document.getElementById('trigger').addEventListener('click', () => {
    document.getElementById('modal').dispatchEvent(
      new CustomEvent('command', {
        bubbles: true,
        detail: { command: '--toggle' }
      })
    );
  });
</script>
```

---

## Troubleshooting

**Behaviors not working:**
- **Check load order:** Core must be loaded before behaviors
- Check browser console for errors (look for "Core not loaded")
- Verify scripts loaded before DOM elements
- For Safari, add custom elements polyfill

**Commands not working:**
- Verify `commandfor` matches element `id`
- Check command name (e.g., `--toggle`)
- Try manual event dispatching (see Browser Compatibility)

**"Core not loaded" error:**
- Make sure `behavior-fn-core.js` is loaded before any behavior bundles
- Check script tag order in your HTML

---

## Bundle Sizes

Minified / gzipped sizes (add core for total):

| Bundle | Minified | Gzipped | Notes |
|--------|----------|---------|-------|
| Core runtime | 4KB | 1.6KB | Required, shared across all behaviors |
| Individual behaviors | 2-11KB | 976B-3.3KB | See Available Bundles for details |
| Auto-loader | 5.6KB | 2.2KB | Optional convenience feature |

**Example totals:**
- Core + Reveal + Auto-loader = **16.4KB** minified / **6.2KB gzipped**
- Core + Request = **15KB** minified / **4.9KB gzipped**
- Core + Reveal + Logger = **13.1KB** minified / **4.5KB gzipped**

---

## 🚀 CDN Providers

BehaviorFN is available on multiple CDNs:

### unpkg (Recommended)
```html
<!-- Load core + behaviors -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
```

**Why unpkg:**
- Official npm CDN
- Automatic updates from npm registry  
- Reliable and fast
- Simple URL structure

### jsdelivr (Alternative)
```html
<!-- Load core + behaviors -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn-core.js"></script>
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
```

**Why jsdelivr:**
- Global CDN with edge nodes
- Bundle size analytics
- Automatic minification

### Versioning

**Recommended:** Pin to a specific version in production:

```html
<!-- unpkg: Pin to exact version -->
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>

<!-- jsdelivr: Pin to exact version -->
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://cdn.jsdelivr.net/npm/behavior-fn@0.2.0/dist/cdn/reveal.js"></script>

<!-- Use semver range (both CDNs support this) -->
<script src="https://unpkg.com/behavior-fn@0/dist/cdn/behavior-fn-core.js"></script>
<script src="https://unpkg.com/behavior-fn@0/dist/cdn/reveal.js"></script>
```

---

## CDN vs CLI

**Use CDN for:**
- Quick prototypes and demos
- Static HTML sites
- Learning and experimentation
- CodePen, JSFiddle

**Use CLI for:**
- Production applications
- TypeScript projects
- Build tool integration
- Code customization
