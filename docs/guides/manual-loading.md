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
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  
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

### Individual Behaviors

Load only what you need:

```html
<!-- Load specific behaviors -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>

<!-- Load auto-loader (enables automatic is attribute addition) -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>

<!-- Now just use behavior attribute (no is needed!) -->
<dialog behavior="reveal logger" id="modal">
  <h2>Hello!</h2>
</dialog>
<button commandfor="modal" command="--toggle">Toggle</button>
```

Each behavior bundle (~10KB) is self-contained and works independently.

**Without auto-loader**, use explicit `is` attributes and define behavioral hosts:

```html
<!-- Load behaviors only -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>

<!-- Define behavioral hosts manually -->
<script>
  // Define a dialog that can host reveal and logger behaviors
  window.BehaviorFN.defineBehavioralHost('dialog', 'behavioral-logger-reveal', []);
</script>

<!-- Add is attribute explicitly -->
<dialog is="behavioral-logger-reveal" behavior="reveal logger" id="modal">
  <h2>Hello!</h2>
</dialog>
```

**Note:** The auto-loader automatically calls `defineBehavioralHost()` for you. Without it, you must define hosts manually for each tag+behavior combination you use.

---

### All-in-One Bundle

Load all behaviors at once:

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>

<dialog behavior="reveal" id="modal">Content</dialog>
<button commandfor="modal" command="--toggle">Toggle</button>
```

Single bundle (~20KB gzipped) with all behaviors included.

---

### Manual Registration (Advanced)

For explicit control over registration:

```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.js"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>

<script>
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
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
  import { 
    registerBehavior, 
    defineBehavioralHost 
  } from 'https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.esm.js';
  
  import { revealBehaviorFactory } from 'https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.esm.js';
  
  registerBehavior('reveal', revealBehaviorFactory);
  defineBehavioralHost('dialog', 'behavioral-reveal', []);
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
  
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  
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
  
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  
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
  
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/request.js"></script>
  
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
  
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js"></script>
  
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

**Individual Behaviors:**
- `https://unpkg.com/behavior-fn@latest/dist/cdn/reveal.js`
- `https://unpkg.com/behavior-fn@latest/dist/cdn/logger.js`
- `https://unpkg.com/behavior-fn@latest/dist/cdn/request.js`
- `https://unpkg.com/behavior-fn@latest/dist/cdn/input-watcher.js`
- `https://unpkg.com/behavior-fn@latest/dist/cdn/compute.js`
- `https://unpkg.com/behavior-fn@latest/dist/cdn/element-counter.js`

**All-in-One:**
- `https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js`

**Core Runtime (for manual registration):**
- `https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.js`

**ES Modules:**
- Add `.esm.js` extension for any bundle (e.g., `reveal.esm.js`)

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
- Check browser console for errors
- Verify script loaded before DOM elements
- For Safari, add custom elements polyfill

**Commands not working:**
- Verify `commandfor` matches element `id`
- Check command name (e.g., `--toggle`)
- Try manual event dispatching (see Browser Compatibility)

---

## Bundle Sizes

Approximate gzipped sizes:

| Bundle | Size |
|--------|------|
| Individual behaviors | ~10 KB each |
| `behavior-fn.all.js` | ~20 KB |
| Core only | ~7 KB |

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
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
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
