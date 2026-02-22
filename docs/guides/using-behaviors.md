# Using Behaviors

This guide explains how to use behaviors in your application after installing them via `behavior-cn`.

## Prerequisites

Ensure you have initialized `behavior-cn` and installed the desired behavior.

```bash
npx behavior-cn init
npx behavior-cn add reveal
```

## The Basics

Behaviors are applied to standard HTML elements using the `behavior` attribute. However, for them to work, the element must be a **Behavioral Host**.

### 1. Registering a Host

You need to register a custom element that acts as a host for behaviors. We provide a utility `defineBehavioralHost` for this.

```typescript
// src/components/html/behaviors/index.ts (or similar entry point)
import { defineBehavioralHost } from "./behavior-registry";
import "./reveal/behavior"; // Import the behavior implementation to register it

// Register <behavioral-div>
defineBehavioralHost("div");

// Register <behavioral-button>
defineBehavioralHost("button");
```

### 2. Using in HTML

Now you can use the custom element and attach the behavior.

```html
<div is="behavioral-div" behavior="reveal" id="my-content" hidden>
  I am hidden content!
</div>

<button is="behavioral-button" command="--toggle" command-for="my-content">
  Toggle Content
</button>
```

## Composing Behaviors

You can attach multiple behaviors to a single element by space-separating them in the `behavior` attribute.

```html
<input
  is="behavioral-input"
  behavior="clearable input-watcher"
  placeholder="Type something..."
/>
```

## Passing Props

Behaviors accept configuration via attributes. The attribute names are defined in the behavior's documentation (or `_behavior-definition.ts`).

```html
<div
  is="behavioral-div"
  behavior="reveal"
  data-animation="fade"
  data-duration="300"
>
  ...
</div>
```

## Triggering Commands

Most behaviors respond to commands. You can trigger them using a button with `command` and `command-for` attributes (if you're using a `command-button` abstraction) or by dispatching the event manually.

```typescript
const el = document.getElementById("my-content");
el.dispatchEvent(
  new CustomEvent("command", {
    bubbles: true,
    detail: { command: "--show" },
  }),
);
```

## Framework Integration

### Astro

In Astro, you can use the custom elements directly in your `.astro` files.

```astro
---
// src/pages/index.astro
import "@/components/html/behaviors/index"; // Ensure registry is loaded
---

<div is="behavioral-div" behavior="reveal">...</div>
```

### React / Next.js

In React, you need to use the `is` attribute. React 19 supports custom elements better, but for older versions, you might need a wrapper or just use the standard HTML syntax.

```jsx
export function MyComponent() {
  return (
    <div is="behavioral-div" behavior="reveal">
      ...
    </div>
  );
}
```

## Troubleshooting

- **Behavior not working?** Check if the element has the `is="..."` attribute and if the host is registered via `defineBehavioralHost`.
- **Command not working?** Check if the `command-for` ID matches the target element's ID.
- **Types missing?** Ensure you have the correct TS configuration and are using the `BehavioralHost` types if needed.
