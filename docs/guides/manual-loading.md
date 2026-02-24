# Manual Loading Without CLI

This guide explains how to use behaviors **without** the `behavior-fn` CLI tool. This is useful for:

- **Simple projects** without a build system or module bundler
- **Script tag imports** in vanilla HTML/JS projects
- **Direct integration** where you want full control over the loading process
- **Prototyping** or testing behaviors quickly

## Overview

The BehaviorFN library works through three core concepts:

1. **Behavior Registration** - Register behavior factory functions in a central registry
2. **Host Definition** - Define which HTML elements can host behaviors
3. **HTML Declaration** - Use the `behavior` and `is` attributes in your HTML

## Prerequisites

You'll need these core files from the BehaviorFN library:

```
src/
├── behaviors/
│   ├── behavior-registry.ts      # Core registry system
│   ├── behavioral-host.ts        # Host mixin system
│   ├── behavior-utils.ts         # Utility functions
│   └── [behavior-name]/          # Individual behaviors
│       ├── _behavior-definition.ts
│       ├── schema.ts
│       └── behavior.ts
```

You can either:
- Copy these files from the [GitHub repository](https://github.com/saghul/behavior-fn)
- Use the CLI once to generate them: `npx behavior-fn init && npx behavior-fn add reveal`
- Download individual behavior folders as needed

## Method 1: Direct Registration (Simplest)

This method is best for **simple, inline behaviors** or **quick prototyping**.

### Step 1: Import Core Infrastructure

```typescript
import { registerBehavior } from "./behaviors/behavior-registry";
import { defineBehavioralHost } from "./behaviors/behavioral-host";
```

### Step 2: Define Your Behavior Inline

```typescript
// Define a simple click counter behavior
const clickCounterFactory = (el: HTMLElement) => {
  let count = 0;
  
  return {
    connectedCallback() {
      // Initialize when element connects to DOM
      el.textContent = `Clicks: ${count}`;
    },
    
    onClick(e: MouseEvent) {
      // Handle click events (automatically wired up)
      count++;
      el.textContent = `Clicks: ${count}`;
    },
  };
};
```

### Step 3: Register the Behavior

```typescript
registerBehavior("click-counter", clickCounterFactory);
```

### Step 4: Define a Behavioral Host

```typescript
// Register <div> as a behavioral host with custom element name
defineBehavioralHost("div", "behavioral-click-counter", []);
```

### Step 5: Use in HTML

```html
<div is="behavioral-click-counter" behavior="click-counter">
  Click me!
</div>
```

### Complete Example

```typescript
// app.ts
import { registerBehavior } from "./behaviors/behavior-registry";
import { defineBehavioralHost } from "./behaviors/behavioral-host";

// Define behavior
const clickCounterFactory = (el: HTMLElement) => {
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
};

// Register
registerBehavior("click-counter", clickCounterFactory);
defineBehavioralHost("div", "behavioral-click-counter", []);
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./app.ts"></script>
</head>
<body>
  <div is="behavioral-click-counter" behavior="click-counter">
    Click me!
  </div>
</body>
</html>
```

## Method 2: Import Pre-built Behaviors

This method is best for **using existing behaviors** from the registry without the CLI.

### Step 1: Copy Behavior Files

Copy the behavior folder you want from `registry/behaviors/` to your project:

```
src/
└── behaviors/
    ├── behavior-registry.ts
    ├── behavioral-host.ts
    ├── behavior-utils.ts
    └── reveal/                    # Copied from registry
        ├── _behavior-definition.ts
        ├── schema.ts
        └── behavior.ts
```

### Step 2: Import and Register

```typescript
// app.ts
import { registerBehavior } from "./behaviors/behavior-registry";
import { defineBehavioralHost } from "./behaviors/behavioral-host";
import { getObservedAttributes } from "./behaviors/behavior-utils";

// Import the behavior
import { revealBehaviorFactory } from "./behaviors/reveal/behavior";
import REVEAL_DEFINITION from "./behaviors/reveal/_behavior-definition";

// Register the behavior
registerBehavior(REVEAL_DEFINITION.name, revealBehaviorFactory);

// Define behavioral host with observed attributes
defineBehavioralHost(
  "dialog",
  "behavioral-reveal",
  getObservedAttributes(REVEAL_DEFINITION.schema)
);
```

### Step 3: Use in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./app.ts"></script>
</head>
<body>
  <!-- The dialog with reveal behavior -->
  <dialog is="behavioral-reveal" id="modal" behavior="reveal">
    <h2>Modal Content</h2>
    <p>This is a modal dialog with reveal behavior.</p>
  </dialog>
  
  <!-- Button to control the dialog (uses Invoker Commands API) -->
  <button commandfor="modal" command="--toggle">
    Toggle Modal
  </button>
</body>
</html>
```

### Multiple Behaviors Example

```typescript
// app.ts
import { registerBehavior } from "./behaviors/behavior-registry";
import { defineBehavioralHost } from "./behaviors/behavioral-host";
import { getObservedAttributes } from "./behaviors/behavior-utils";

// Import multiple behaviors
import { revealBehaviorFactory } from "./behaviors/reveal/behavior";
import REVEAL_DEFINITION from "./behaviors/reveal/_behavior-definition";

import { loggerBehaviorFactory } from "./behaviors/logger/behavior";
import LOGGER_DEFINITION from "./behaviors/logger/_behavior-definition";

// Register all behaviors
registerBehavior(REVEAL_DEFINITION.name, revealBehaviorFactory);
registerBehavior(LOGGER_DEFINITION.name, loggerBehaviorFactory);

// Define hosts with combined observed attributes
const dialogAttrs = [
  ...getObservedAttributes(REVEAL_DEFINITION.schema),
  ...getObservedAttributes(LOGGER_DEFINITION.schema),
];

defineBehavioralHost("dialog", "behavioral-logger-reveal", dialogAttrs);
```

```html
<!-- Multiple behaviors on one element (sorted alphabetically) -->
<dialog is="behavioral-logger-reveal" 
        id="modal" 
        behavior="reveal logger">
  Content
</dialog>
```

## Method 3: Script Tag Integration (No Bundler)

For projects without a build system, you can use browser modules directly.

### Step 1: Convert to Browser Modules

Make sure your behavior files use browser-compatible imports:

```typescript
// behaviors/behavior-registry.ts
// (Ensure all imports use relative paths with .js extensions)
export const factoryRegistry = new Map();
export const loaderRegistry = new Map();
export const loadingStates = new Map();

export function registerBehavior(name, factory) {
  if (factoryRegistry.has(name)) {
    console.warn(`Behavior "${name}" is already registered.`);
    return;
  }
  factoryRegistry.set(name, factory);
}

export function getBehavior(name) {
  return factoryRegistry.get(name);
}
```

### Step 2: Create Registration Script

```typescript
// behaviors/register-all.js
import { registerBehavior } from "./behavior-registry.js";
import { defineBehavioralHost } from "./behavioral-host.js";

// Inline simple behaviors
const clickCounterFactory = (el) => {
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
};

// Register
registerBehavior("click-counter", clickCounterFactory);
defineBehavioralHost("div", "behavioral-click-counter", []);
```

### Step 3: Use in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./behaviors/register-all.js"></script>
</head>
<body>
  <div is="behavioral-click-counter" behavior="click-counter">
    Click me!
  </div>
</body>
</html>
```

## Understanding the System

### The Registry Pattern

BehaviorFN uses three registries:

```typescript
// Registered behavior factories
const factoryRegistry = new Map<string, BehaviorFactory>();

// Lazy loaders (for code splitting)
const loaderRegistry = new Map<string, BehaviorLoader>();

// In-progress loading states
const loadingStates = new Map<string, Promise<void>>();
```

### The Behavioral Host System

The `defineBehavioralHost` function creates custom built-in elements that can host behaviors:

```typescript
defineBehavioralHost(
  "dialog",              // Base HTML element
  "behavioral-reveal",   // Custom element name
  ["reveal-delay"]       // Observed attributes
);
```

This registers a custom element that:
1. Extends the native `<dialog>` element
2. Can be used via `is="behavioral-reveal"`
3. Loads behaviors specified in the `behavior` attribute
4. Observes the specified attributes

### The Behavior Instance

A behavior factory returns an instance object with lifecycle hooks and event handlers:

```typescript
const behaviorFactory = (el: HTMLElement) => {
  // Private state
  let count = 0;
  
  // Return instance with hooks
  return {
    // Lifecycle hooks
    connectedCallback() {
      // Called when element connects to DOM
    },
    disconnectedCallback() {
      // Called when element disconnects from DOM
    },
    attributeChangedCallback(name, oldValue, newValue) {
      // Called when observed attributes change
    },
    
    // Event handlers (automatically wired up via addEventListener)
    onClick(e: MouseEvent) {
      // Handles click events
    },
    onCommand(e: CommandEvent) {
      // Handles command events from Invoker Commands API
    },
    onMouseenter(e: MouseEvent) {
      // Handles mouseenter events
    },
  };
};
```

**Event Handler Convention:**
- Methods starting with `on` followed by a capital letter are event handlers
- `onCommand` → `command` event
- `onClick` → `click` event  
- `onMouseenter` → `mouseenter` event

### The `is` Attribute Requirement

The `is` attribute is **required** for behaviors to load:

```html
<!-- ❌ Won't work - no is attribute -->
<dialog behavior="reveal">Content</dialog>

<!-- ✅ Works - has is attribute -->
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>
```

The `is` value format for multiple behaviors is `behavioral-{sorted-names}`:

```html
<!-- Multiple behaviors - names sorted alphabetically -->
<div is="behavioral-logger-reveal" behavior="reveal logger">
```

### The Invoker Commands API

BehaviorFN leverages the native **Invoker Commands API** for declarative control:

```html
<!-- Trigger button (no is attribute needed) -->
<button commandfor="modal" command="--toggle">
  Toggle Modal
</button>

<!-- Target element (needs is + behavior) -->
<dialog is="behavioral-reveal" id="modal" behavior="reveal">
  Content
</dialog>
```

Commands are handled via the `onCommand` event handler in behaviors:

```typescript
const behaviorFactory = (el: HTMLElement) => {
  return {
    onCommand(e: CommandEvent) {
      switch (e.command) {
        case "--show":
          el.showModal();
          break;
        case "--hide":
          el.close();
          break;
        case "--toggle":
          el.open ? el.close() : el.showModal();
          break;
      }
    },
  };
};
```

## Common Patterns

### Pattern 1: Central Registration File

Create a single file to register all behaviors:

```typescript
// behaviors/index.ts
import { registerBehavior } from "./behavior-registry";
import { defineBehavioralHost } from "./behavioral-host";
import { getObservedAttributes } from "./behavior-utils";

// Import all behaviors
import { revealBehaviorFactory } from "./reveal/behavior";
import REVEAL_DEFINITION from "./reveal/_behavior-definition";

import { loggerBehaviorFactory } from "./logger/behavior";
import LOGGER_DEFINITION from "./logger/_behavior-definition";

// Register all
const behaviors = [
  { name: REVEAL_DEFINITION.name, factory: revealBehaviorFactory, def: REVEAL_DEFINITION },
  { name: LOGGER_DEFINITION.name, factory: loggerBehaviorFactory, def: LOGGER_DEFINITION },
];

behaviors.forEach(({ name, factory }) => {
  registerBehavior(name, factory);
});

// Define common hosts
defineBehavioralHost("div", "behavioral-div", []);
defineBehavioralHost("button", "behavioral-button", []);
defineBehavioralHost("dialog", "behavioral-dialog", []);
```

```typescript
// app.ts
import "./behaviors/index"; // Register everything

// Now you can use behaviors in your app
```

### Pattern 2: Lazy Loading

For code splitting, you can register loaders instead of behaviors:

```typescript
import { registerLoader } from "./behaviors/behavior-registry";

// Register a loader function
registerLoader("reveal", async () => {
  const { revealBehaviorFactory } = await import("./behaviors/reveal/behavior");
  const REVEAL_DEFINITION = await import("./behaviors/reveal/_behavior-definition");
  registerBehavior(REVEAL_DEFINITION.default.name, revealBehaviorFactory);
});
```

When the behavior is needed, it will be loaded automatically.

### Pattern 3: Behavior Composition

Create wrapper behaviors that combine multiple behaviors:

```typescript
const composedBehaviorFactory = (el: HTMLElement) => {
  // Get other behaviors
  const reveal = revealBehaviorFactory(el);
  const logger = loggerBehaviorFactory(el);
  
  return {
    connectedCallback() {
      reveal.connectedCallback?.();
      logger.connectedCallback?.();
    },
    
    onCommand(e: CommandEvent) {
      logger.onCommand?.(e); // Log first
      reveal.onCommand?.(e); // Then execute
    },
  };
};
```

## TypeScript Support

### Behavior Factory Type

```typescript
import type { BehaviorFactory, BehaviorInstance } from "./behavior-registry";

const myBehaviorFactory: BehaviorFactory = (el: HTMLElement): BehaviorInstance => {
  return {
    connectedCallback() {},
    onClick(e: MouseEvent) {},
  };
};
```

### Typed Element Reference

```typescript
const myBehaviorFactory = (el: HTMLElement) => {
  // Type assertion for specific elements
  const dialog = el as HTMLDialogElement;
  
  return {
    onCommand(e: CommandEvent) {
      dialog.showModal(); // Now type-safe
    },
  };
};
```

### Schema Types

If using TypeBox or Zod schemas, you can extract types:

```typescript
import { Type, Static } from "@sinclair/typebox";

const schema = Type.Object({
  "reveal-delay": Type.Optional(Type.String()),
  "reveal-duration": Type.Optional(Type.String()),
});

type RevealProps = Static<typeof schema>;
// { "reveal-delay"?: string; "reveal-duration"?: string; }
```

## Debugging Tips

### Check Registration

```typescript
import { getBehavior } from "./behaviors/behavior-registry";

// Check if behavior is registered
const factory = getBehavior("reveal");
console.log("Reveal registered:", !!factory);
```

### Check Custom Elements

```typescript
// Check if behavioral host is defined
const isRegistered = customElements.get("behavioral-reveal");
console.log("Host registered:", !!isRegistered);
```

### Verify Element Setup

```html
<dialog is="behavioral-reveal" id="modal" behavior="reveal">
  Content
</dialog>

<script type="module">
  const el = document.getElementById("modal");
  console.log("Element:", el);
  console.log("Is custom element:", el.constructor.name);
  console.log("Has behavior attr:", el.getAttribute("behavior"));
  console.log("Has is attr:", el.getAttribute("is"));
</script>
```

### Listen to Events

```typescript
const el = document.getElementById("modal");

// Listen to command events
el.addEventListener("command", (e) => {
  console.log("Command received:", e.detail.command);
});

// Listen to lifecycle
el.addEventListener("connected", () => {
  console.log("Behavior connected");
});
```

## Limitations

When manually loading without the CLI:

1. **No automatic transformations** - You're responsible for schema compatibility (TypeBox, Zod, etc.)
2. **No project detection** - You must manually specify paths and configurations
3. **No updates** - You must manually update behavior files when the registry changes
4. **Manual attribute tracking** - You must call `getObservedAttributes` yourself

## When to Use the CLI

Consider using the CLI (`behavior-fn add`) if:

- You want automatic schema transformation (TypeBox → Zod/Valibot)
- You need project-specific configurations
- You want automatic updates to behaviors
- You prefer a managed installation process

The CLI handles all the registration boilerplate and transformations automatically.

## Summary

Manual loading workflow:

1. **Copy core files** (`behavior-registry.ts`, `behavioral-host.ts`, `behavior-utils.ts`)
2. **Copy or create behaviors** (factory functions)
3. **Register behaviors** via `registerBehavior(name, factory)`
4. **Define hosts** via `defineBehavioralHost(tagName, customElementName, observedAttributes)`
5. **Use in HTML** with `is` and `behavior` attributes

Key requirements:
- ✅ The `is` attribute is **required** on elements with behaviors
- ✅ Behavioral hosts must be defined before use
- ✅ Behaviors must be registered before elements connect to DOM
- ✅ Trigger buttons using Invoker Commands API don't need `is` attribute

This gives you full control over behavior loading while maintaining the same API as the CLI-installed version.
