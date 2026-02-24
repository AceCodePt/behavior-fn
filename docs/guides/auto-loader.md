# Auto-Loader Guide

## Overview

The **auto-loader** is an optional utility that automatically adds `is="behavioral-*"` attributes to elements with `behavior` attributes. This eliminates the need for manual `is` attribute declaration while maintaining the explicit, predictable core architecture of BehaviorFN.

## When to Use

### ✅ Use Auto-Loader When:

- **Prototyping:** Rapid development where DX > explicitness
- **Content-Heavy Sites:** Many elements with behaviors (blogs, documentation sites)
- **Alpine.js/HTMX Migration:** Coming from frameworks with automatic behavior attachment
- **Simple Use Cases:** Static content with behaviors defined at initial page load

### ❌ Avoid Auto-Loader When:

- **Production Apps:** Performance and explicitness matter
- **Complex SPAs:** Heavy DOM manipulation with dynamic behavior changes
- **Performance-Critical:** Every KB and observer matters
- **Debugging Needed:** Want clear, explicit control flow

## Basic Usage

### Installation

The auto-loader is included in the core BehaviorFN registry and copied during `behavior-fn init`.

### Enable Auto-Loader

```typescript
// main.ts or app.ts
import { enableAutoLoader } from "./behaviors/auto-loader";

// Enable auto-loader at application startup
const disconnect = enableAutoLoader();

// Later, if needed (e.g., before hot module reload)
disconnect();
```

### HTML Usage

Once enabled, you can omit the `is` attribute:

```html
<!-- Without auto-loader (explicit) -->
<button is="behavioral-reveal" behavior="reveal" commandfor="modal" command="--toggle">
  Toggle Modal
</button>
<dialog is="behavioral-reveal" id="modal" behavior="reveal">
  Modal content
</dialog>

<!-- With auto-loader (automatic) -->
<button behavior="reveal" commandfor="modal" command="--toggle">
  Toggle Modal
</button>
<dialog id="modal" behavior="reveal">
  Modal content
</dialog>
```

The auto-loader will automatically add:
- `<button is="behavioral-reveal" behavior="reveal">` (for the button)
- `<dialog is="behavioral-reveal" behavior="reveal">` (for the dialog)

## How It Works

### Algorithm

1. **Initial Scan:** Processes all existing elements with `behavior` attribute
2. **Mutation Observer:** Watches for new elements added to the DOM
3. **For Each Element:**
   - Parse `behavior` attribute (space-separated list)
   - Sort behaviors alphabetically for consistency
   - Create custom element name: `behavioral-{sorted-behaviors}`
   - Register behavioral host if not already registered
   - Add `is` attribute to element

### Behavior-Based Host Pattern

The auto-loader uses a **behavior-based host pattern** where the `is` attribute describes **behaviors**, not tag types. This allows multiple tag types to share the same behavioral host.

**Example:**

```html
<!-- Before auto-loader -->
<button behavior="reveal">Toggle</button>
<dialog behavior="reveal">Content</dialog>
<div behavior="reveal logger">Debug</div>

<!-- After auto-loader processes the DOM -->
<button is="behavioral-reveal" behavior="reveal">Toggle</button>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
<div is="behavioral-logger-reveal" behavior="reveal logger">Debug</div>
```

**Note:** `button` and `dialog` share the same behavioral host (`behavioral-reveal`) because they use the same behavior.

## Edge Cases & Limitations

### 1. Existing `is` Attributes

Elements with existing `is` attributes are skipped:

```html
<!-- Auto-loader will skip this element -->
<button is="custom-button" behavior="reveal">
  Click me
</button>
```

**Result:** The `is` attribute remains `custom-button`.

### 2. Empty Behavior Attribute

Empty or whitespace-only `behavior` attributes are skipped:

```html
<!-- Auto-loader will skip these -->
<button behavior="">Click</button>
<button behavior="   ">Click</button>
```

**Result:** No `is` attribute is added.

### 3. Unknown Behaviors

Unknown behaviors trigger a warning but still add the `is` attribute:

```html
<button behavior="unknown-behavior">Click</button>
```

**Console:**
```
[AutoLoader] Unknown behavior "unknown-behavior" on element: HTMLButtonElement {}
```

**Result:** `<button is="behavioral-unknown-behavior" behavior="unknown-behavior">`

### 4. Multiple Behaviors

Behaviors are sorted alphabetically for consistency:

```html
<!-- These produce the same result -->
<div behavior="reveal logger">A</div>
<div behavior="logger reveal">B</div>
```

**Result:** Both elements get `is="behavioral-logger-reveal"`.

### 5. Custom Elements Limitation

**⚠️ IMPORTANT:** Once an element is upgraded with an `is` attribute, it **cannot be re-upgraded**. This is a fundamental limitation of the Custom Elements specification.

```typescript
// This will NOT work as expected
const button = document.createElement("button");
button.setAttribute("behavior", "reveal");
document.body.appendChild(button);

// Auto-loader adds: is="behavioral-reveal"

// Later, trying to change the behavior
button.setAttribute("behavior", "logger");
// ❌ The is attribute will NOT update
// ❌ The element is still using behavioral-reveal
```

**Architectural Principle:** Behaviors are **static** in BehaviorFN. They are defined at element creation time and do not change during the element's lifetime. This is by design:

1. **Predictability:** Behaviors are part of an element's identity, not its state
2. **Performance:** No runtime overhead watching for behavior changes
3. **Simplicity:** Clear separation between element creation and element usage
4. **Web Standards:** Aligns with Custom Elements spec (cannot re-upgrade)

**If You Need Dynamic Behavior:**

Instead of changing behaviors, use behavior **attributes** to control behavior state:

```typescript
// ✅ GOOD: Change behavior state via attributes
const button = document.querySelector("[behavior='reveal']");
button.setAttribute("reveal-when-value", "active"); // Changes behavior state
```

For truly dynamic UI needs, create different elements with different behaviors and show/hide them conditionally:

```typescript
// ✅ GOOD: Show/hide elements with different behaviors
<button behavior="reveal" hidden>Reveal Version</button>
<button behavior="logger" hidden>Logger Version</button>

// Toggle visibility based on need
revealButton.hidden = false;
loggerButton.hidden = true;
```

## Performance Considerations

### Overhead

- **File Size:** ~2KB minified
- **Runtime:** MutationObserver + initial DOM scan
- **Memory:** WeakSet for tracking processed elements (automatic GC)

### Best Practices

1. **Enable Early:** Call `enableAutoLoader()` as early as possible in your app lifecycle
2. **Single Instance:** Only call `enableAutoLoader()` once per page
3. **Cleanup:** Call `disconnect()` before hot module reloading (dev mode)
4. **Static Content:** Works best with content defined at page load time

### Benchmarks

For typical web apps:
- **Initial Scan (100 elements):** < 5ms
- **Dynamic Addition (10 elements):** < 1ms
- **Observer Overhead:** Negligible (native MutationObserver)

## Comparison: Explicit vs. Auto-Loader

| Aspect | Explicit `is` | Auto-Loader |
|--------|---------------|-------------|
| **File Size** | 0 bytes | ~2KB |
| **Runtime Overhead** | None | MutationObserver |
| **HTML Verbosity** | More verbose | Cleaner |
| **Debugging** | Clear and explicit | Requires understanding |
| **Dynamic Behaviors** | Static (by design) | Static (by design) |
| **Type Safety** | Full | Full |
| **Production Ready** | ✅ Yes | ⚠️ Use with caution |

## Migration Guide

### From Explicit to Auto-Loader

**Before:**

```typescript
// main.ts
import { defineBehavioralHost } from "./behaviors/behavioral-host";
import { registerBehavior } from "./behaviors/behavior-registry";
import { revealBehaviorFactory } from "./behaviors/reveal/behavior";
import { getObservedAttributes } from "./behaviors/utils";
import REVEAL_DEFINITION from "./behaviors/reveal/_behavior-definition";

registerBehavior("reveal", revealBehaviorFactory);
defineBehavioralHost(
  "dialog",
  "behavioral-reveal",
  getObservedAttributes(REVEAL_DEFINITION.schema)
);
```

```html
<!-- index.html -->
<dialog is="behavioral-reveal" behavior="reveal">
  Content
</dialog>
```

**After:**

```typescript
// main.ts
import { enableAutoLoader } from "./behaviors/auto-loader";
import { registerBehavior } from "./behaviors/behavior-registry";
import { revealBehaviorFactory } from "./behaviors/reveal/behavior";

registerBehavior("reveal", revealBehaviorFactory);
enableAutoLoader(); // ✨ That's it!
```

```html
<!-- index.html -->
<dialog behavior="reveal">
  Content
</dialog>
```

### From Auto-Loader to Explicit

If you decide the auto-loader isn't right for your use case:

**Before:**

```typescript
import { enableAutoLoader } from "./behaviors/auto-loader";
enableAutoLoader();
```

```html
<dialog behavior="reveal">Content</dialog>
```

**After:**

```typescript
import { defineBehavioralHost } from "./behaviors/behavioral-host";
import { getObservedAttributes } from "./behaviors/utils";
import REVEAL_DEFINITION from "./behaviors/reveal/_behavior-definition";

defineBehavioralHost(
  "dialog",
  "behavioral-reveal",
  getObservedAttributes(REVEAL_DEFINITION.schema)
);
```

```html
<dialog is="behavioral-reveal" behavior="reveal">
  Content
</dialog>
```

## Advanced Usage

### Conditional Auto-Loading

Enable auto-loader only in development:

```typescript
if (import.meta.env.DEV) {
  const { enableAutoLoader } = await import("./behaviors/auto-loader");
  enableAutoLoader();
}
```

### Hot Module Reload Support

Properly cleanup during HMR:

```typescript
// Vite HMR
if (import.meta.hot) {
  const disconnect = enableAutoLoader();
  
  import.meta.hot.accept(() => {
    disconnect(); // Cleanup before reload
  });
}
```

### Framework Integration

#### React

```typescript
// App.tsx
import { useEffect } from "react";
import { enableAutoLoader } from "./behaviors/auto-loader";

function App() {
  useEffect(() => {
    const disconnect = enableAutoLoader();
    return () => disconnect(); // Cleanup on unmount
  }, []);

  return <div>...</div>;
}
```

#### Vue

```typescript
// main.ts
import { createApp } from "vue";
import { enableAutoLoader } from "./behaviors/auto-loader";

const app = createApp(App);

// Enable before mounting
const disconnect = enableAutoLoader();

app.mount("#app");

// Cleanup on unmount (if needed)
window.addEventListener("beforeunload", disconnect);
```

#### Svelte

```typescript
// main.ts
import { enableAutoLoader } from "./behaviors/auto-loader";
import App from "./App.svelte";

const disconnect = enableAutoLoader();

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
```

## Debugging

### Check If Auto-Loader Is Active

```typescript
// Check if MutationObserver is running
const observer = new MutationObserver(() => {});
console.log(observer); // Should show active observer

// Check processed elements
const button = document.querySelector("[behavior]");
console.log(button?.getAttribute("is")); // Should show behavioral-*
```

### Common Issues

#### Issue: `is` attribute not added

**Causes:**
- Auto-loader not enabled
- Element has existing `is` attribute
- Empty `behavior` attribute

**Solution:**
```typescript
// Verify auto-loader is called
enableAutoLoader();

// Check element
const el = document.querySelector("[behavior]");
console.log(el?.getAttribute("behavior")); // Should have value
console.log(el?.getAttribute("is")); // Should be behavioral-*
```

#### Issue: Behaviors not working

**Causes:**
- Behavior not registered
- Timing issue (behavior used before registration)

**Solution:**
```typescript
// Register behaviors BEFORE enabling auto-loader
registerBehavior("reveal", revealBehaviorFactory);
enableAutoLoader(); // ✅ Correct order
```

## FAQ

### Q: Can I use auto-loader in production?

**A:** Yes, but we recommend explicit `is` attributes for production apps. Auto-loader adds runtime overhead and is less explicit, making debugging harder.

### Q: Does auto-loader work with SSR?

**A:** Yes, but the `is` attributes will only be added on the client. If you need `is` attributes in the initial HTML, use explicit attributes.

### Q: Can I disable auto-loader temporarily?

**A:** Yes, call the `disconnect()` function returned by `enableAutoLoader()`:

```typescript
const disconnect = enableAutoLoader();
// Later...
disconnect();
```

### Q: What happens if I change the `behavior` attribute?

**A:** Nothing. Behaviors are **static** in BehaviorFN - they are defined at element creation time and do not change. Once an element is upgraded with an `is` attribute, it cannot be re-upgraded. This is both a Custom Elements limitation and an architectural design principle.

**Why static?** Behaviors define what an element **is**, not what state it's in. Use behavior **attributes** to control behavior state dynamically instead of trying to change behaviors themselves.

### Q: Can I use auto-loader with custom elements?

**A:** The auto-loader only processes built-in elements (div, button, etc.). Custom elements (e.g., `<my-element>`) are skipped.

### Q: Does auto-loader work with Shadow DOM?

**A:** No. The auto-loader only observes the main document. Elements inside Shadow DOM will not be processed.

## Conclusion

The auto-loader is a powerful tool for improving DX when building with BehaviorFN. However, it comes with tradeoffs. For production apps, we recommend using explicit `is` attributes for maximum control, performance, and debuggability.

For prototypes and content-heavy sites where cleaner HTML is prioritized, the auto-loader is an excellent choice.

## Related

- [Behavioral Host Architecture](../architecture/behavioral-host.md)
- [Using Behaviors Guide](./using-behaviors.md)
- [Contributing Behaviors](./contributing-behaviors.md)
