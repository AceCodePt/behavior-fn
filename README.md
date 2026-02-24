# BehaviorFN

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.9%2B-blue)

**Copy-paste behavior mixins for Web Components.** Own your code, not your dependencies.

Part of the **JOHF (JavaScript Once, HTML Forever)** philosophy—write logic once, reuse it everywhere with zero runtime overhead.

---

## 🎯 Philosophy

Traditional component libraries force you into their ecosystem. BehaviorFN takes a different approach:

1. **📦 Owned Code** — Don't install a dependency. Copy the behavior into your project. You own it, modify it, ship it.
2. **🔌 Decoupled Logic** — Behaviors are standalone modules. They don't know about your app until you wire them up.
3. **🛡️ Type-Safe** — Every behavior exports a runtime schema (Zod, Valibot, TypeBox, etc.) that drives validation and TypeScript intellisense.
4. **🎨 Headless** — Pure logic. No styles. No opinions. Bring your own design system.
5. **⚡ Zero Runtime** — Behaviors compile away. No framework tax. Just vanilla JavaScript.

---

## 🚀 Quick Start

### Installation

```bash
# npm
npx behavior-fn init

# pnpm  
pnpm dlx behavior-fn init

# bun
bunx behavior-fn init

# yarn
yarn dlx behavior-fn init
```

This initializes the core infrastructure in your project and asks you two questions:

1. **Which schema validator?** (Zod, Valibot, TypeBox, ArkType, Zod-Mini)
2. **Where to install behaviors?** (e.g., `src/behaviors`)

### Add a Behavior

```bash
# npm
npx behavior-fn add reveal

# pnpm
pnpm dlx behavior-fn add reveal

# bun
bunx behavior-fn add reveal

# yarn
yarn dlx behavior-fn add reveal
```

This copies the `reveal` behavior into your project at the configured path.

### Use It

```typescript
import { defineBehavioralHost } from "./behaviors/behavioral-host";
import { registerBehavior } from "./behaviors/behavior-registry";
import { revealBehaviorFactory } from "./behaviors/reveal/behavior";
import { getObservedAttributes } from "./behaviors/utils";

// Register the reveal behavior
registerBehavior("reveal", revealBehaviorFactory);

// Register dialog as a behavioral host for the "reveal" behavior
defineBehavioralHost("dialog", "behavioral-reveal", getObservedAttributes(revealSchema));
```

Then in your HTML:

```html
<!-- Button uses Invoker Commands API to trigger dialog -->
<button commandfor="modal" command="--toggle">
  Toggle Modal
</button>

<!-- Dialog has the reveal behavior (needs is attribute with behavior names) -->
<dialog is="behavioral-reveal" id="modal" behavior="reveal">
  This content will be revealed!
</dialog>
```

> **⚠️ Important:** The `is` attribute is **required** on elements with the `behavior` attribute to activate behavior loading. The `is` value should be `behavioral-{behavior-names}` where behavior names are sorted alphabetically and joined with hyphens.
>
> **Examples:**
> - `behavior="reveal"` → `is="behavioral-reveal"`
> - `behavior="reveal logger"` → `is="behavioral-logger-reveal"` (sorted alphabetically)
> - `behavior="request"` → `is="behavioral-request"`
>
> **Invoker Commands:** Trigger buttons use the native `commandfor` and `command` attributes (Invoker Commands API) and do NOT need the `is` attribute.

### Optional: Auto-Loader

Prefer cleaner HTML without the `is` attribute? You can enable the **auto-loader**:

```typescript
import { enableAutoLoader } from "./behaviors/auto-loader";

// Automatically discovers behaviors and registers behavioral hosts
// Then adds is="behavioral-*" to elements with behavior attribute
enableAutoLoader();
```

Now you can write:

```html
<!-- Trigger (no is needed - uses Invoker Commands) -->
<button commandfor="modal" command="--toggle">Toggle</button>

<!-- Target with auto-loader (adds is="behavioral-reveal" automatically) -->
<dialog id="modal" behavior="reveal">Content here</dialog>
```

**How it works:**
1. Scans DOM for all elements with `behavior` attribute
2. Parses and sorts behaviors alphabetically for each element
3. Creates custom element name: `behavioral-{sorted-behaviors}` (e.g., `behavioral-logger-reveal`)
4. Registers the behavioral host if not already registered: `defineBehavioralHost(tagName, customElementName)`
5. Adds appropriate `is` attribute to the element

**Examples:**
- `<div behavior="reveal">` → `<div is="behavioral-reveal" behavior="reveal">`
- `<button behavior="reveal logger">` → `<button is="behavioral-logger-reveal" behavior="reveal logger">`
- Multiple tags can share the same host: both `<button>` and `<dialog>` with `behavior="reveal"` use `is="behavioral-reveal"`

**Tradeoffs:**
- ✅ Cleaner HTML syntax
- ✅ Closer to Alpine.js/HTMX patterns
- ⚠️ Adds ~2KB + MutationObserver overhead
- ⚠️ Less explicit (harder to debug)
- ⚠️ May have timing issues with dynamic UIs
- ⚠️ Cannot change behaviors after initial load (Custom Elements limitation)

**Important Limitation:** Once an element is upgraded with an `is` attribute, it cannot be re-upgraded. This means changing the `behavior` attribute after the element is processed will NOT update its behaviors. This is both a Custom Elements spec limitation and an architectural design principle - **behaviors are static** and define what an element **is**, not what state it's in.

**Recommendation:** Use explicit `is` attributes for production apps. Use auto-loader for prototypes or content-heavy sites where DX > explicitness.

---

## 📚 Available Behaviors

### 🔍 **reveal**
Show/hide elements with popovers, dialogs, or hidden attribute. Supports focus management and animations.

**Attributes:**
- `reveal-delay` — CSS time value for delay before showing
- `reveal-duration` — CSS time value for animation duration
- `reveal-anchor` — ID of anchor element for positioning
- `reveal-auto` — Auto-handle popover/dialog states
- `reveal-when-target` — Selector for target element to watch
- `reveal-when-attribute` — Attribute name on target to watch
- `reveal-when-value` — Value that triggers reveal
- `popover` — Use native Popover API (`auto` or `manual`)
- `hidden` — Standard hidden attribute
- `open` — For dialog/details elements

**Commands:**
- `--show` — Show the element
- `--hide` — Hide the element
- `--toggle` — Toggle visibility

**Example:**
```html
<!-- Trigger button (uses Invoker Commands API - no is needed) -->
<button commandfor="modal" command="--toggle">
  Open Modal
</button>

<!-- Dialog with reveal behavior (needs is="behavioral-reveal") -->
<dialog is="behavioral-reveal" id="modal" behavior="reveal">
  <p>Modal content here</p>
  <button commandfor="modal" command="--hide">Close</button>
</dialog>
```

---

### 📡 **request**
Declarative HTTP requests with loading states, error handling, and Server-Sent Events (SSE) [HTMX].

**Attributes:**
- `request-url` — Target URL for the request
- `request-method` — HTTP method (GET, POST, PUT, DELETE)
- `request-trigger` — Element/event that triggers the request
- `request-target` — Where to inject the response HTML
- `request-loading` — Element to show during loading
- `request-error` — Element to show on error
- `request-indicator` — Loading indicator selector
- `request-debounce` — Debounce delay (ms)
- `request-swap` — Swap strategy (innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend)
- `request-mode` — Request mode (fetch, sse)

**Commands:**
- `--trigger` — Manually trigger the request
- `--close-sse` — Close active SSE connection

**Example:**
```html
<input 
  is="behavioral-request"
  behavior="request" 
  request-url="/api/search" 
  request-trigger="input" 
  request-target="#results"
  request-debounce="300"
>

<div id="results"></div>
```

---

### 👁️ **input-watcher**
Watch form inputs and synchronize their values across multiple elements.

**Attributes:**
- `watch-selector` — CSS selector for inputs to watch
- `watch-attr` — Attribute to update with input value
- `watch-property` — Property to update with input value
- `watch-event` — Event to listen for (default: `input`)

**Example:**
```html
<input type="text" id="username" placeholder="Enter username">

<p 
  is="behavioral-input-watcher"
  behavior="input-watcher" 
  watch-selector="#username" 
  watch-property="textContent"
>
  Hello, <span>Guest</span>
</p>
```

---

### 🧮 **compute**
Reactive computed values from watched inputs with custom expressions.

**Attributes:**
- `compute-expr` — JavaScript expression to evaluate
- `compute-watch` — Comma-separated list of input IDs to watch
- `compute-target` — Target attribute/property to update
- `compute-format` — Optional formatting function

**Example:**
```html
<input type="number" id="price" value="100">
<input type="number" id="quantity" value="2">

<p 
  is="behavioral-compute"
  behavior="compute" 
  compute-expr="price * quantity" 
  compute-watch="price,quantity"
  compute-target="textContent"
>
  Total: $0
</p>
```

---

### 📊 **element-counter**
Count matching elements in the DOM and display the count.

**Attributes:**
- `counter-selector` — CSS selector for elements to count
- `counter-target` — Attribute/property to update with count
- `counter-format` — Optional format string (e.g., "Found {count} items")

**Example:**
```html
<ul id="todo-list">
  <li>Task 1</li>
  <li>Task 2</li>
  <li>Task 3</li>
</ul>

<span 
  is="behavioral-element-counter"
  behavior="element-counter" 
  counter-selector="#todo-list li"
  counter-target="textContent"
  counter-format="{count} tasks remaining"
>
</span>
```

---

### 🪵 **logger**
Debug helper that logs events and attribute changes to the console.

**Attributes:**
- `log-events` — Comma-separated list of events to log
- `log-attrs` — Comma-separated list of attributes to watch
- `log-prefix` — Prefix for log messages

**Example:**
```html
<button 
  is="behavioral-logger"
  behavior="logger" 
  log-events="click,dblclick"
  log-prefix="[Debug Button]"
>
  Click Me
</button>
```

---

## 🎛️ CLI Reference

### `behavior-fn init`

Initialize BehaviorFN in your project. Installs core infrastructure.

**Flags:**
- `-d, --defaults` — Use default settings (skip prompts)
- `--validator=<name>` — Specify validator (zod, valibot, typebox, arktype, zod-mini)
- `--path=<path>` — Specify installation path (default: auto-detected)
- `--pm=<manager>` — Override package manager (npm, pnpm, bun, yarn)
- `--no-ts` — Disable TypeScript even if detected

**Examples:**
```bash
# Interactive mode (default)
behavior-fn init

# Use defaults with Zod
behavior-fn init -d

# Custom validator and path
behavior-fn init --validator=valibot --path=lib/behaviors

# Skip TypeScript
behavior-fn init --no-ts
```

---

### `behavior-fn add <name>`

Add a behavior to your project.

**Flags:**
- `-t, --with-tests` — Include test files (default: false)

**Examples:**
```bash
# Add behavior (production mode - no tests)
behavior-fn add reveal

# Add behavior with test files
behavior-fn add reveal --with-tests
behavior-fn add request -t
```

---

### `behavior-fn create <name>`

Create a new behavior in the registry (for contributors).

**Example:**
```bash
behavior-fn create my-custom-behavior
```

This scaffolds:
- `registry/behaviors/my-custom-behavior/_behavior-definition.ts`
- `registry/behaviors/my-custom-behavior/schema.ts`
- `registry/behaviors/my-custom-behavior/behavior.ts`
- `registry/behaviors/my-custom-behavior/behavior.test.ts`

---

### `behavior-fn remove <name>`

Remove a behavior from the registry (for contributors).

**Example:**
```bash
behavior-fn remove my-custom-behavior
```

⚠️ **Warning:** This is destructive and cannot be undone. Commit your work first.

---

## 🧩 Package Manager Support

BehaviorFN works with all major package managers:

| Manager | Command |
|---------|---------|
| **npm** | `npx behavior-fn <command>` |
| **pnpm** | `pnpm dlx behavior-fn <command>` |
| **bun** | `bunx behavior-fn <command>` |
| **yarn** | `yarn dlx behavior-fn <command>` |

Auto-detection based on lockfiles:
- `pnpm-lock.yaml` → pnpm
- `bun.lockb` → bun
- `yarn.lock` → yarn
- `package-lock.json` → npm

---

## 🔗 JOHF: JavaScript Once, HTML Forever

BehaviorFN is part of the **JOHF philosophy**:

> Write your logic once in JavaScript. Use it everywhere in HTML. Forever.

### Core Principles

1. **HTML-First** — Declarative syntax. No JavaScript imports in templates.
2. **Progressive Enhancement** — Works without JavaScript. Enhanced with it.
3. **Zero Lock-In** — Copy-paste code you own. No framework dependency.
4. **Web Standards** — Built on Web Components, Custom Elements, and standard DOM APIs.
5. **Type Safety** — Full TypeScript support with runtime validation.

### Why JOHF?

Modern frameworks force you to rewrite your UI every 2-3 years. JOHF behaviors are:

- ✅ **Future-proof** — Based on web standards, not framework APIs
- ✅ **Portable** — Works in any framework or no framework
- ✅ **Maintainable** — Plain JavaScript/TypeScript, no magic
- ✅ **Performant** — Compiles to vanilla JS, no runtime overhead

---

## 🏗️ Architecture

### Behavioral Host Activation

Behaviors **do not load automatically**. To activate behaviors on an element, you must:

1. **Register the element as a behavioral host** using `defineBehavioralHost()`:
   ```typescript
   // Register a dialog that can use the "reveal" behavior
   defineBehavioralHost("dialog", "behavioral-reveal", observedAttributes);
   ```

2. **Use the `is` attribute** in your HTML to activate the host:
   ```html
   <dialog is="behavioral-reveal" behavior="reveal">
   ```

**Important:** The `is` attribute value is based on the **behavior names**, not the tag name:
- Single behavior: `is="behavioral-{behaviorName}"` (e.g., `is="behavioral-reveal"`)
- Multiple behaviors: `is="behavioral-{sorted-behaviors}"` (e.g., `is="behavioral-logger-reveal"`)
- Behaviors are sorted alphabetically to ensure consistency

Without the `is` attribute, the `behavior` attribute will be ignored. This is by design—behavioral hosts must be explicitly activated to ensure predictable behavior loading.

**Behaviors Are Static:**

Behaviors are defined at element creation time and **do not change** during the element's lifetime. This is an architectural principle:
- Behaviors define what an element **is** (its identity)
- Attributes define what state an element is **in** (its state)
- Once set, behaviors cannot be added, removed, or changed at runtime

To control behavior dynamically, use behavior-specific **attributes** instead of trying to change the behaviors themselves.

**Alternative: Auto-Loader**

If you prefer automatic activation, use the opt-in `enableAutoLoader()` utility. It watches for elements with `behavior` attributes and adds the `is` attribute automatically using MutationObserver. See the [Auto-Loader section](#optional-auto-loader) for details.

### Behavior Structure

Every behavior consists of three files:

```
behaviors/my-behavior/
├── _behavior-definition.ts  # Metadata (name, commands, schema)
├── schema.ts                 # Runtime schema (Zod/Valibot/TypeBox)
└── behavior.ts               # Implementation (factory function)
```

### Behavior Factory Pattern

Behaviors export a factory function that returns event handlers:

```typescript
export const myBehaviorFactory = (el: HTMLElement) => {
  // Setup state
  const state = { count: 0 };

  // Return event handlers (camelCase)
  return {
    onClick(e: MouseEvent) {
      state.count++;
      el.textContent = `Clicked ${state.count} times`;
    },
    
    onCommand(e: CommandEvent) {
      if (e.detail.command === "--reset") {
        state.count = 0;
        el.textContent = "Reset!";
      }
    },
  };
};
```

Event handlers starting with `on` are automatically wired by the host.

---

## 🧪 Testing

BehaviorFN includes a test harness for behavior testing:

```typescript
import { describe, it, expect } from "vitest";
import { getCommandTestHarness } from "@/test-utils";
import { revealBehaviorFactory } from "./behavior";

describe("reveal behavior", () => {
  it("toggles visibility on click", () => {
    const host = getCommandTestHarness(revealBehaviorFactory);
    const target = document.createElement("div");
    target.hidden = true;

    host.element.setAttribute("reveal-target", "#target");
    document.body.appendChild(target);

    host.element.click();
    expect(target.hidden).toBe(false);
  });
});
```

---

## 🤝 Contributing

Want to add a behavior to the registry?

1. **Fork the repo**
2. **Create a behavior:**
   ```bash
   pnpm build
   node dist/index.js create my-behavior
   ```
3. **Implement it** — Follow the PDSRTDD workflow:
   - **P**lan — Design the behavior API
   - **D**ata — Define state requirements
   - **S**chema — Write the runtime schema
   - **R**egistry — Register in `behaviors-registry.json`
   - **T**est — Write failing tests
   - **D**evelop — Implement to pass tests
4. **Test it:**
   ```bash
   pnpm test
   ```
5. **Submit a PR**

See [Contributing Guide](docs/guides/contributing-behaviors.md) for details.

---

## 📄 License

MIT © [Sagi Carmel](https://github.com/AceCodePt)

---

## 🔗 Links

- **GitHub:** [github.com/AceCodePt/behavior-fn](https://github.com/AceCodePt/behavior-fn)
- **Issues:** [github.com/AceCodePt/behavior-fn/issues](https://github.com/AceCodePt/behavior-fn/issues)
- **Discussions:** [github.com/AceCodePt/behavior-fn/discussions](https://github.com/AceCodePt/behavior-fn/discussions)

---

## 🌟 Related Projects

- **[auto-wc](https://github.com/AceCodePt/auto-wc)** — Type-safe Web Components with automatic event wiring (the foundation for BehaviorFN hosts)

---

**Built with ❤️ by developers who believe in owning their code.**
