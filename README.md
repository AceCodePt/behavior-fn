# BehaviorFN

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.9%2B-blue)
![Version](https://img.shields.io/badge/version-0.2.2-green)

**Copy-paste behavior mixins for Web Components.** Own your code, not your dependencies. Opt-in loading for better performance.

Part of the **JOHF (JavaScript Once, HTML Forever)** philosophy—write logic once, reuse it everywhere with zero runtime overhead.

---

## 🎯 Philosophy

Traditional component libraries force you into their ecosystem. BehaviorFN takes a different approach:

1. **📦 Owned Code** — Don't install a dependency. Copy the behavior into your project. You own it, modify it, ship it.
2. **🔌 Decoupled Logic** — Behaviors are standalone modules. They don't know about your app until you wire them up.
3. **🛡️ Type-Safe** — Every behavior exports a runtime schema (Zod, Valibot, TypeBox, etc.) that drives validation and TypeScript intellisense.
4. **🎨 Headless** — Pure logic. No styles. No opinions. Bring your own design system.
5. **⚡ Zero Runtime** — Behaviors compile away. No framework tax. Just vanilla JavaScript.
6. **🎯 Opt-In Loading** — Load only what you need. From 4KB to 100KB, you decide.

---

## 🚀 Quick Start

### CDN Usage (v0.2.0+ - ESM Only + Auto-Register)

**⚠️ Breaking Change:** All bundles are now **ESM-only** with **auto-registration on import**.

**Option 1: Auto-Loader (Simplest - Recommended)**

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
  <!-- No is attribute needed with auto-loader -->
  <dialog behavior="reveal" id="modal">
    <h2>Hello World!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

**Total:** ~17KB minified (~6KB gzipped)  
**Best for:** Most use cases, cleanest code

---

**Option 2: Explicit (Best Performance)**

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { defineBehavioralHost } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
    import { metadata } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';  // Auto-registers!
    
    // Define host manually for best performance
    defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
  </script>
</head>
<body>
  <!-- Explicit is attribute required -->
  <dialog is="behavioral-reveal" behavior="reveal" id="modal">
    <h2>Hello World!</h2>
    <button commandfor="modal" command="--hide">Close</button>
  </dialog>
  
  <button commandfor="modal" command="--toggle">Open Modal</button>
</body>
</html>
```

**Total:** ~11KB minified (~4KB gzipped)  
**Best for:** Production apps, best performance

**📚 [View Complete CDN Examples](examples/cdn/)** | **📖 [CDN Architecture Guide](CDN-ARCHITECTURE.md)**

---

## 🆕 What's New in v0.2.0?

### 🔥 Breaking Changes

**⚠️ ESM ONLY + AUTO-REGISTER: IIFE Bundles Removed**

All CDN bundles are now **ESM-only** with **auto-registration on import**. This eliminates registry isolation issues, simplifies usage, and aligns with modern web standards (ES2020+).

**Browser Support:** Chrome 61+, Firefox 60+, Safari 11+, Edge 79+ (98%+ coverage in 2026)

**Migration:**
```html
<!-- ❌ v0.1.6: IIFE format -->
<script src="behavior-fn-core.js"></script>
<script src="reveal.js"></script>

<!-- ✅ v0.2.0: ESM format with auto-registration -->
<script type="module">
  // Just import - auto-registers and auto-enables!
  import './reveal.js';
  import './auto-loader.js';
</script>
```

**New: Auto-Registration on Import**
- Behaviors automatically register themselves when imported
- Auto-loader automatically enables itself when imported
- No more manual `registerBehavior()` or `enableAutoLoader()` calls needed
- Simpler, cleaner code

**⚠️ REMOVED: All-in-One Bundle (`behavior-fn.all.js`)**

The 72KB all-in-one bundle has been **completely removed**. You now load only the behaviors you need.

### ✨ Benefits

- **Massive Size Reduction:** 73% to 90% smaller for typical use cases
- **TypeBox Eliminated:** Transformed to JSON Schema at build time (0 bytes in bundles)
- **Opt-In Loading:** Load only what you need (1.9KB to 4.6KB gzipped per behavior)
- **Simple Usage:** Just 2 script tags with auto-loader
- **Backward Compatible:** Individual bundle pattern still works

**📋 [Migration Guide](CHANGELOG.md)** | **🔄 [Full Changelog](CHANGELOG.md)**

---

### CLI Installation

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

The generated `behavior.config.json` includes optional path aliases for cleaner imports. If you want to use these aliases (recommended), configure them in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "~types": ["./src/types"],
      "~utils": ["./src/behavior-utils"],
      "~registry": ["./src/behaviors/behavior-registry"],
      "~host": ["./src/behavioral-host"],
      "~test-utils": ["./tests/utils/command-test-harness"]
    }
  }
}
```

> **Note:** If you don't configure aliases, the CLI will generate relative imports instead (e.g., `../../types`). You can also remove the `alias` fields from `behavior.config.json` to always use relative imports.

### List Available Behaviors

```bash
# npm
npx behavior-fn list

# pnpm
pnpm dlx behavior-fn list

# bun
bunx behavior-fn list

# yarn
yarn dlx behavior-fn list
```

This displays all available behaviors in the registry with their attributes and commands. Use `--json` flag for machine-readable output.

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
import definition from "./behaviors/reveal/_behavior-definition";
import { getObservedAttributes } from "./behaviors/behavior-utils";

// Register the reveal behavior with its definition
registerBehavior(definition, revealBehaviorFactory);

// Register dialog as a behavioral host for the "reveal" behavior
defineBehavioralHost("dialog", "behavioral-reveal", getObservedAttributes(definition.schema));
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

// Automatically discovers elements with behavior attributes,
// registers behavioral hosts if needed, and adds is="behavioral-*" attributes
// Note: Behaviors must be registered BEFORE enabling auto-loader
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

### 📏 **auto-grow**
Automatically adjusts textarea height to fit content as the user types, eliminating internal scrolling.

**Attributes:**
- None (zero-config behavior)

**Features:**
- Automatically grows textarea to fit content
- Disables internal scrolling (`overflow-y: hidden`)
- Disables manual resize handles (`resize: none`)
- Updates height on every input event
- Works only on `<textarea>` elements (warns if attached to others)

**Example:**
```html
<!-- Simple auto-growing textarea -->
<textarea 
  is="behavioral-auto-grow"
  behavior="auto-grow"
  placeholder="Type here and watch the textarea expand..."
></textarea>
```

**Common Use Cases:**
- Comment boxes that expand as users type
- Message input fields (like chat applications)
- Note-taking interfaces
- Any textarea where you want to avoid scrolling

**How It Works:**
1. On connect: Sets `overflow-y: hidden` and `resize: none`
2. On input: Sets height to `auto` then to `scrollHeight` (allows both growing and shrinking)

**Browser Compatibility:**
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Requires `HTMLTextAreaElement` support

---

### 📡 **request**
Declarative HTTP requests with loading states, error handling, and Server-Sent Events (SSE) [HTMX-inspired].

**Attributes:**
- `request-url` — Target URL for the request
- `request-method` — HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- `request-trigger` — Event(s) that trigger the request (can be complex trigger configuration)
- `request-target` — Selector for where to inject the response HTML
- `request-swap` — Swap strategy (`innerHTML`, `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none`)
- `request-indicator` — Loading indicator selector (element to show during request)
- `request-confirm` — Confirmation message before sending request
- `request-push-url` — Push URL to browser history (boolean or URL string)
- `request-vals` — Additional values to include in request

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
  request-swap="innerHTML"
>

<div id="results"></div>
```

**Features:**
- Support for complex trigger configurations (delay, throttle, SSE)
- Multiple swap strategies for DOM manipulation
- Loading indicators and confirmation dialogs
- Browser history integration
- Server-Sent Events (SSE) support

---

### 👁️ **input-watcher**
Watch form inputs and update the element's content with their values.

**Attributes:**
- `input-watcher-target` — Selector or comma-separated list of input IDs to watch
- `input-watcher-format` — Format string (e.g., `"Value: {value}"`)
- `input-watcher-events` — Comma-separated list of events to listen to (default: `input, change`)
- `input-watcher-attr` — Attribute to read from target input (default: uses `value` property)

**Example:**
```html
<input type="text" id="username" placeholder="Enter username">

<p 
  is="behavioral-input-watcher"
  behavior="input-watcher" 
  input-watcher-target="username"
  input-watcher-format="Hello, {value}!"
>
  Hello, Guest!
</p>
```

**Features:**
- Watch single or multiple inputs
- Custom format strings with `{value}` placeholder
- Configurable event listeners
- Updates element's `textContent` with formatted value

---

### 📝 **content-setter**
Set or modify attributes and properties on elements programmatically.

**Attributes:**
- `content-setter-attribute` — The attribute to modify (use `textContent` for text content)
- `content-setter-value` — The value to set
- `content-setter-mode` — How to apply: `set` (default), `toggle`, or `remove`

**Example:**
```html
<button 
  is="behavioral-content-setter"
  behavior="content-setter" 
  content-setter-attribute="data-theme"
  content-setter-value="dark"
  content-setter-mode="toggle"
>
  Toggle Theme
</button>
```

**Features:**
- Set attributes, data attributes, or text content
- Toggle mode for boolean-like attributes
- Remove mode to delete attributes
- Works with ARIA attributes for accessibility

---

### 📋 **set-value**
Set form input values from command sources (typically buttons), useful for auto-complete, templates, and quick-fill workflows.

**Attributes:**
- None (zero-config behavior)

**Commands:**
- `--set-value` — Set input value from command source's `innerText`
- `--set-value-and-submit` — Set value and submit parent form

**Features:**
- Works only on form input elements (`<input>`, `<textarea>`, `<select>`)
- Throws error if attached to non-form elements
- Dispatches both `input` and `change` events to trigger reactive systems
- Uses `requestSubmit()` for form submission (respects validation)
- Button's `innerText` becomes the input value

**Example:**
```html
<!-- Suggestion buttons set textarea value -->
<div>
  <button commandfor="message" command="--set-value">Thanks for your help!</button>
  <button commandfor="message" command="--set-value">I'll get back to you soon.</button>
  <button commandfor="message" command="--set-value-and-submit">Looks good to me!</button>
</div>

<form>
  <textarea 
    is="behavioral-set-value"
    id="message"
    behavior="set-value"
    placeholder="Type a message or use a template..."
  ></textarea>
  <button type="submit">Send</button>
</form>
```

**Common Use Cases:**
- Auto-complete or suggestion systems (click to fill)
- Template insertion (canned responses in chat)
- Quick-fill buttons for common form values
- Copy-paste workflows with visual feedback

**How It Works:**
1. Button with `commandfor="input-id"` dispatches command event
2. Behavior reads button's `innerText` and sets it as input value
3. Dispatches `input` and `change` events for reactive updates
4. If `--set-value-and-submit` is used and input has parent form, calls `form.requestSubmit()`

**Browser Compatibility:**
- All modern browsers with Custom Elements support
- Works with native Invoker Commands API or polyfill

---

### 🧮 **compute**
Reactive computed values from watched inputs with mathematical formulas.

**Attributes:**
- `compute-formula` — Mathematical expression using `#id` syntax to reference inputs (e.g., `#price * #qty + 10`)

**Example:**
```html
<input type="number" id="price" value="100">
<input type="number" id="qty" value="2">

<output 
  is="behavioral-compute"
  behavior="compute" 
  compute-formula="#price * #qty"
>
  200
</output>
```

**Features:**
- Supports basic arithmetic operators: `+`, `-`, `*`, `/`
- Uses `#id` syntax to reference input values
- Automatically detects dependencies and watches for changes
- Handles checkboxes (checked=1, unchecked=0)
- Works with input, textarea, select, and output elements
- Updates on `input` and `change` events
- Circular dependency detection

---

### 📊 **element-counter**
Count matching elements in the DOM and display the count reactively.

**Attributes:**
- `element-counter-root` — ID of the root element to watch for changes
- `element-counter-selector` — CSS selector for elements to count within the root

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
  element-counter-root="todo-list"
  element-counter-selector="li"
>
  3
</span>
```

**Features:**
- Uses MutationObserver to watch for DOM changes
- Updates automatically when elements are added or removed
- Updates `textContent` for regular elements
- Updates `value` for input/textarea/select/output elements
- Counts elements within the specified root

---

### 🎨 **json-template**
Data binding and template rendering for JSON data sources using intuitive curly brace interpolation.

> 📚 **[Complete Guide](docs/guides/json-template-behavior.md)** - Detailed documentation with examples

**Attributes:**
- `json-template-for` — ID of the `<script type="application/json">` element containing the data (like `for` in `<label>`)

**Template Syntax:**
- `{path}` — Interpolate values in text content or attributes
- `{path || "fallback"}` — Use fallback if value is falsy (0, false, "", null, undefined)
- `{path ?? "fallback"}` — Use fallback only if value is nullish (null or undefined)
- `{path && "value"}` — Use value if path is truthy
- `data-array="path"` — Mark nested `<template>` for array rendering

**Example:**
```html
<!-- Data source -->
<script type="application/json" id="user-data">
  {
    "name": "Sagi",
    "role": "admin",
    "verified": true,
    "projects": [
      {"title": "BehaviorFN", "stars": 100},
      {"title": "AutoWC", "stars": 50}
    ]
  }
</script>

<!-- Renderer with curly brace syntax -->
<div 
  is="behavioral-json-template"
  behavior="json-template" 
  json-template-for="user-data"
>
  <template>
    <div data-role="{role}">
      <h2>{name || "Anonymous"} {verified && "✓"}</h2>
      
      <!-- Array with data-array marker -->
      <ul>
        <template data-array="projects">
          <li>{title || "Untitled"}: {stars ?? 0} ⭐</li>
        </template>
      </ul>
    </div>
  </template>
</div>
```

**Fallback Operator Examples:**
```html
<!-- || (logical OR) - fallback for ANY falsy value -->
<p>{count || 10}</p>        <!-- 0 → "10", undefined → "10" -->
<p>{active || "N/A"}</p>    <!-- false → "N/A", null → "N/A" -->
<p>{message || ""}</p>       <!-- "" → "", undefined → "" -->

<!-- ?? (nullish coalescing) - fallback only for null/undefined -->
<p>{count ?? 10}</p>        <!-- 0 → "0", undefined → "10" -->
<p>{active ?? "N/A"}</p>    <!-- false → "false", null → "N/A" -->
<p>{message ?? "None"}</p>   <!-- "" → "", undefined → "None" -->

<!-- && (logical AND) - use value if condition is truthy -->
<p>{premium && "⭐ Pro"}</p>  <!-- true → "⭐ Pro", false → "false" -->
<p>{verified && "✓"}</p>     <!-- true → "✓", undefined → "" -->
<p>{count && "items"}</p>    <!-- 5 → "items", 0 → "0" -->

<!-- Advanced: Literal values (quoted strings) on left side -->
<p>{"&&" && "||"}</p>        <!-- "&&" is truthy → "||" -->
<p>{"||" || "&&"}</p>        <!-- "||" is truthy → "||" (keeps value) -->
<p>{"??" ?? "||"}</p>        <!-- "??" is not nullish → "??" -->
<p>{"" || "empty"}</p>       <!-- "" is falsy → "empty" -->
<p>{"" ?? "N/A"}</p>         <!-- "" is not nullish → "" (empty string) -->
```

**Operator Symbols as Data:**
```html
<!-- You can use operator symbols as literal data -->
<p>{"&&" && "Use && for AND"}</p>    <!-- Shows "Use && for AND" -->
<p>{"||" && "Use || for OR"}</p>     <!-- Shows "Use || for OR" -->
<p>{"??" && "Use ?? for nullish"}</p><!-- Shows "Use ?? for nullish" -->
```

**Important: Quoted vs Unquoted Keywords:**
```html
<!-- Unquoted = Path (property lookup) -->
<p>{undefined ?? "fallback"}</p>     <!-- Looks for data.undefined property -->
<p>{null ?? "N/A"}</p>               <!-- Looks for data.null property -->

<!-- Quoted = Literal string -->
<p>{"undefined" ?? "fallback"}</p>   <!-- Literal string "undefined" (truthy) → "undefined" -->
<p>{"null" ?? "N/A"}</p>             <!-- Literal string "null" (truthy) → "null" -->
```

**Safe Deep Path Access:**
```html
<!-- Safe traversal - no errors if intermediate properties missing -->
<p>{user.profile.email || "no-email"}</p>        <!-- Safe even if profile is undefined -->
<p>{app.settings.theme.color ?? "blue"}</p>      <!-- Safe even if settings.theme is undefined -->
<p>{data.nested.deep.value || "default"}</p>     <!-- Safe at any depth -->

<!-- Equivalent to JavaScript optional chaining: data?.nested?.deep?.value -->
```

**Features:**
- **Text interpolation:** `{name}`, `Username: {firstName} {lastName}`
- **Attribute interpolation:** `data-type="{type}"`, `class="user-{role}"`
- **Nested paths:** `{user.profile.name}`, `{items[0].title}`
- **Fallback operators:** `{name || "Guest"}`, `{count ?? 0}`, `{premium && "Pro"}`
  - `||` (logical OR): Use fallback for falsy values (0, false, "", null, undefined)
  - `??` (nullish coalescing): Use fallback only for null/undefined
  - `&&` (logical AND): Use value if condition is truthy
- **Root array support:** If root data is an array, template repeats automatically (no `data-array` needed)
- **Nested arrays:** Use `data-array="path"` on nested `<template>` for arrays within objects
- **Web component support:** Preserves `is=""` attributes for behavioral hosts
- **Reactive:** Watches data source for changes (MutationObserver)
- **Graceful:** Missing values render as empty strings (no errors)

---

### 🪵 **logger**
Debug helper that logs interaction events to the console.

**Attributes:**
- `logger-trigger` — Event type to log (`click` or `mouseenter`)

**Example:**
```html
<button 
  is="behavioral-logger"
  behavior="logger" 
  logger-trigger="click"
>
  Click Me
</button>
```

**Features:**
- Simple console logging for debugging
- Supports `click` and `mouseenter` events
- Logs element tag name and event object

---

## ⚡ Compound Commands Behavior

The **compound-commands** behavior extends buttons with support for **compound commands**—triggering multiple commands on multiple elements with a single button click.

### Basic Usage

Add the behavior to your button:

```html
<button 
  is="behavioral-compound-commands"
  behavior="compound-commands"
  commandfor="modal, form" 
  command="--toggle, --clear">
  Toggle & Clear
</button>
```

### Syntax

Use comma-separated values in `commandfor` and `command` attributes:

```html
<!-- Multiple commands to single target -->
<button 
  is="behavioral-compound-commands"
  behavior="compound-commands"
  commandfor="modal" 
  command="--show, --focus">
  Show & Focus
</button>

<!-- Single command to multiple targets (broadcast) -->
<button 
  is="behavioral-compound-commands"
  behavior="compound-commands"
  commandfor="modal, panel" 
  command="--hide">
  Hide Both
</button>

<!-- Exact mapping (N targets : N commands) -->
<button 
  is="behavioral-compound-commands"
  behavior="compound-commands"
  commandfor="modal, form" 
  command="--toggle, --clear">
  Toggle & Clear
</button>
```

### Valid States

| Pattern | Example | Behavior |
|---------|---------|----------|
| **Single target + multiple commands** | `commandfor="modal"` + `command="--show, --focus"` | Target receives all commands sequentially |
| **Multiple targets + single command** | `commandfor="modal, panel"` + `command="--hide"` | All targets receive same command (broadcast) |
| **Equal counts (N:N mapping)** | `commandfor="modal, form"` + `command="--toggle, --clear"` | Paired dispatch: `modal` gets `--toggle`, `form` gets `--clear` |

### Invalid State

**Mismatched counts (both > 1, different lengths):**
```html
<!-- ❌ Invalid: 3 targets, 2 commands -->
<button commandfor="a, b, c" command="--x, --y">...</button>
```
→ Logs error and prevents dispatch

### Installation

```bash
# Add the behavior to your project
npx behavior-fn add compound-commands
```

Then register it:

```typescript
import { registerBehavior } from "./behaviors/behavior-registry";
import { compoundCommandsBehaviorFactory } from "./behaviors/compound-commands/behavior";
import definition from "./behaviors/compound-commands/_behavior-definition";

registerBehavior(definition, compoundCommandsBehaviorFactory);
```

### Features

- ✅ Zero dependencies
- ✅ Standard behavior pattern
- ✅ Comprehensive error handling
- ✅ TypeScript support
- ✅ Works with all target behaviors
- ✅ Automatic event source tracking

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

Every behavior consists of four core files:

```
behaviors/my-behavior/
├── _behavior-definition.ts  # Metadata (name, commands, schema)
├── schema.ts                 # Runtime schema (Zod/Valibot/TypeBox)
├── behavior.ts               # Implementation (factory function)
└── behavior.test.ts          # Test suite
```

Some behaviors may also include additional helper files like `constants.ts` for shared values.

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
import { getCommandTestHarness } from "~test-utils";
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
