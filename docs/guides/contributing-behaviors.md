# Contributing Behaviors Guide

This guide walks you through creating, implementing, testing, and managing behaviors in the BehaviorFN registry.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Creating a New Behavior](#creating-a-new-behavior)
- [Implementing Your Behavior](#implementing-your-behavior)
- [Testing Your Behavior](#testing-your-behavior)
- [Removing a Behavior](#removing-a-behavior)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

---

## Prerequisites

Before creating a behavior, ensure you have:

1. **Cloned the repository** and are on a feature branch
2. **Built the CLI** with `pnpm build`
3. **Understood the behavior philosophy**: Behaviors are stateless, event-driven mixins that add capabilities to HTML elements

---

## Creating a New Behavior

### Step 1: Run the Create Command

Use the CLI to scaffold a new behavior:

```bash
pnpm build
node dist/index.js create my-behavior-name
```

**Naming Rules:**
- Must be in **kebab-case** (lowercase with hyphens)
- Can include numbers (e.g., `input-watcher-2`)
- Must be unique (not already exist in the registry)
- Cannot be named `core` (reserved)

**Example:**
```bash
node dist/index.js create hover-tooltip
```

### Step 2: Verify Files Created

The command creates four files in `registry/behaviors/my-behavior-name/`:

```
registry/behaviors/hover-tooltip/
├── _behavior-definition.ts  # The contract (behavior metadata)
├── schema.ts                 # TypeBox schema (attribute definitions)
├── behavior.ts               # Implementation (factory function)
└── behavior.test.ts          # Tests (vitest test suite)
```

The behavior is also automatically registered in `registry/behaviors-registry.json`.

---

## Implementing Your Behavior

### Step 1: Define Your Schema

Open `schema.ts` and define the attributes your behavior will observe:

```typescript
import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Schema for hover-tooltip behavior
 * Defines which attributes this behavior observes
 */
export const schema = Type.Object({
  // Required attribute
  "tooltip-text": Type.String(),
  
  // Optional attribute with default
  "tooltip-position": Type.Optional(
    Type.Union([
      Type.Literal("top"),
      Type.Literal("bottom"),
      Type.Literal("left"),
      Type.Literal("right"),
    ])
  ),
  
  // Optional boolean attribute
  "tooltip-delay": Type.Optional(Type.Number()),
});

export type SchemaType = InferSchema<typeof schema>;
```

**Key Points:**
- Use `Type.Optional()` for optional attributes
- Use `Type.Union()` with `Type.Literal()` for enums
- Keep attribute names in kebab-case
- Document each attribute with comments

### Step 2: Implement the Behavior Logic

Open `behavior.ts` and implement the factory function:

```typescript
/**
 * Hover Tooltip Behavior Implementation
 * 
 * Shows a tooltip when the user hovers over the element.
 */
export const hoverTooltipBehaviorFactory = (el: HTMLElement) => {
  // Private state (closure)
  let tooltipElement: HTMLDivElement | null = null;
  let timeoutId: number | null = null;

  // Helper functions
  const createTooltip = () => {
    const text = el.getAttribute("tooltip-text");
    if (!text) return null;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = text;
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);
    return tooltip;
  };

  const positionTooltip = () => {
    if (!tooltipElement) return;
    
    const position = el.getAttribute("tooltip-position") || "top";
    const rect = el.getBoundingClientRect();
    
    // Position logic based on attribute
    switch (position) {
      case "top":
        tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
        tooltipElement.style.top = `${rect.top - tooltipElement.offsetHeight - 8}px`;
        break;
      case "bottom":
        tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
        tooltipElement.style.top = `${rect.bottom + 8}px`;
        break;
      // ... other positions
    }
  };

  const showTooltip = () => {
    tooltipElement = createTooltip();
    if (!tooltipElement) return;
    
    positionTooltip();
    tooltipElement.style.display = "block";
  };

  const hideTooltip = () => {
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
  };

  // Return event handlers (will be auto-wired by the behavioral host)
  return {
    onMouseEnter() {
      const delay = parseInt(el.getAttribute("tooltip-delay") || "0", 10);
      
      if (delay > 0) {
        timeoutId = window.setTimeout(showTooltip, delay);
      } else {
        showTooltip();
      }
    },

    onMouseLeave() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      hideTooltip();
    },

    // Cleanup when behavior is removed
    onDisconnected() {
      hideTooltip();
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    },
  };
};
```

**Key Points:**
- Factory receives the `HTMLElement` as a parameter
- Use closures for private state
- Return an object with event handler methods (camelCase, e.g., `onClick`, `onMouseEnter`)
- Access attributes with `el.getAttribute()`
- Include cleanup in `onDisconnected()` if needed

**Available Event Handlers:**
All standard DOM event handlers can be used:
- `onClick`, `onDblclick`
- `onMouseEnter`, `onMouseLeave`, `onMouseMove`
- `onKeyDown`, `onKeyUp`, `onKeyPress`
- `onFocus`, `onBlur`
- `onInput`, `onChange`
- `onSubmit`
- `onDisconnected` (special: called when behavior is removed)

---

## Testing Your Behavior

### Step 1: Write Tests

Open `behavior.test.ts` and write comprehensive tests:

```typescript
/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { defineBehavioralHost } from "../behavioral-host";
import { hoverTooltipBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";
import { getObservedAttributes } from "~utils";
import definition from "./_behavior-definition";

const { name } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

describe("Hover Tooltip Behavior", () => {
  beforeAll(() => {
    registerBehavior(name, hoverTooltipBehaviorFactory);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    expect(hoverTooltipBehaviorFactory).toBeDefined();
    expect(name).toBe("hover-tooltip");
  });

  it("should create tooltip on mouse enter", async () => {
    const tag = "button";
    const webcomponentTag = "test-tooltip-btn";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, { is: webcomponentTag }) as HTMLElement;
    el.setAttribute("behavior", "hover-tooltip");
    el.setAttribute("tooltip-text", "Click me!");
    document.body.appendChild(el);

    await vi.waitFor(() => {
      el.dispatchEvent(new MouseEvent("mouseenter"));
      
      const tooltip = document.querySelector(".tooltip");
      expect(tooltip).not.toBeNull();
      expect(tooltip?.textContent).toBe("Click me!");
    });
  });

  it("should remove tooltip on mouse leave", async () => {
    const tag = "button";
    const webcomponentTag = "test-tooltip-btn-2";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, { is: webcomponentTag }) as HTMLElement;
    el.setAttribute("behavior", "hover-tooltip");
    el.setAttribute("tooltip-text", "Hover text");
    document.body.appendChild(el);

    await vi.waitFor(() => {
      el.dispatchEvent(new MouseEvent("mouseenter"));
      expect(document.querySelector(".tooltip")).not.toBeNull();
      
      el.dispatchEvent(new MouseEvent("mouseleave"));
      expect(document.querySelector(".tooltip")).toBeNull();
    });
  });

  it("should respect tooltip-delay attribute", async () => {
    vi.useFakeTimers();
    
    const tag = "button";
    const webcomponentTag = "test-tooltip-btn-delay";
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);

    const el = document.createElement(tag, { is: webcomponentTag }) as HTMLElement;
    el.setAttribute("behavior", "hover-tooltip");
    el.setAttribute("tooltip-text", "Delayed");
    el.setAttribute("tooltip-delay", "500");
    document.body.appendChild(el);

    el.dispatchEvent(new MouseEvent("mouseenter"));
    
    // Should not show immediately
    expect(document.querySelector(".tooltip")).toBeNull();
    
    // Should show after delay
    vi.advanceTimersByTime(500);
    expect(document.querySelector(".tooltip")).not.toBeNull();
    
    vi.useRealTimers();
  });
});
```

**Testing Best Practices:**
1. Always register the behavior in `beforeAll()`
2. Clear the DOM in `beforeEach()`
3. Create unique webcomponent tags for each test
4. Use `vi.waitFor()` for async operations
5. Test all attribute variations
6. Test edge cases (missing attributes, invalid values)
7. Test cleanup/disconnection if applicable

### Step 2: Run Tests

```bash
# Run all tests
pnpm test

# Run only your behavior's tests
pnpm test registry/behaviors/hover-tooltip/behavior.test.ts

# Run in watch mode during development
pnpm vitest watch registry/behaviors/hover-tooltip/behavior.test.ts
```

### Step 3: Verify Type Safety

```bash
# Check for TypeScript errors
pnpm tsc --noEmit
```

---

## Removing a Behavior

If you need to remove a behavior (e.g., it's deprecated or superseded):

```bash
pnpm build
node dist/index.js remove my-behavior-name
```

**Safety Features:**
- Cannot remove the `core` behavior (protected)
- Validates the behavior exists before removal
- Removes all files and updates the registry automatically

**⚠️ Warning:** This action is permanent. Make sure you've committed any work before removing.

---

## Best Practices

### Behavior Design

1. **Single Responsibility**: Each behavior should do one thing well
   - ✅ Good: `hover-tooltip`, `auto-save`, `click-outside`
   - ❌ Bad: `super-mega-everything-behavior`

2. **Stateless When Possible**: Prefer deriving state from attributes
   ```typescript
   // ✅ Good: Derive from attributes
   const isEnabled = el.getAttribute("enabled") === "true";
   
   // ❌ Avoid: Internal state that diverges from attributes
   let internalState = true;
   ```

3. **Use Closures for Private State**: When state is needed, use closures
   ```typescript
   export const myBehaviorFactory = (el: HTMLElement) => {
     let privateState = null; // Closure variable
     
     return {
       onClick() {
         privateState = "clicked";
       }
     };
   };
   ```

4. **Clean Up Resources**: Always cleanup in `onDisconnected()`
   ```typescript
   return {
     onDisconnected() {
       // Clear timers
       if (timeoutId) clearTimeout(timeoutId);
       
       // Remove event listeners
       document.removeEventListener("click", handler);
       
       // Remove DOM elements
       tooltipElement?.remove();
     }
   };
   ```

### Schema Design

1. **Use Descriptive Names**: Attributes should clearly indicate their purpose
   ```typescript
   // ✅ Good
   "tooltip-text": Type.String()
   "auto-save-delay": Type.Number()
   
   // ❌ Bad
   "text": Type.String()
   "delay": Type.Number()
   ```

2. **Provide Sensible Defaults**: Use `Type.Optional()` with defaults in code
   ```typescript
   // In schema
   "interval": Type.Optional(Type.Number())
   
   // In behavior
   const interval = parseInt(el.getAttribute("interval") || "1000", 10);
   ```

3. **Use Enums for Fixed Values**: Type.Union with Type.Literal
   ```typescript
   "position": Type.Union([
     Type.Literal("start"),
     Type.Literal("center"),
     Type.Literal("end"),
   ])
   ```

### Testing Strategy

1. **Test Happy Path First**: Basic functionality with valid inputs
2. **Test Edge Cases**: Empty attributes, invalid values, boundary conditions
3. **Test Interactions**: Multiple behaviors, DOM changes, async operations
4. **Test Cleanup**: Ensure no memory leaks or orphaned elements

---

## Common Patterns

### Pattern 1: Command Behavior

Behaviors that respond to user commands (clicks, submits):

```typescript
export const commandBehaviorFactory = (el: HTMLElement) => {
  return {
    onClick(e: MouseEvent) {
      const command = el.getAttribute("command");
      if (command === "save") {
        // Execute save logic
      }
    }
  };
};
```

### Pattern 2: Observer Behavior

Behaviors that watch for changes and react:

```typescript
export const observerBehaviorFactory = (el: HTMLElement) => {
  return {
    onInput(e: Event) {
      const value = (e.target as HTMLInputElement).value;
      // React to value changes
    }
  };
};
```

### Pattern 3: Lifecycle Behavior

Behaviors that perform actions during element lifecycle:

```typescript
export const lifecycleBehaviorFactory = (el: HTMLElement) => {
  let intervalId: number;
  
  // Setup on creation (called when behavior attaches)
  intervalId = window.setInterval(() => {
    // Periodic action
  }, 1000);
  
  return {
    onDisconnected() {
      // Cleanup on removal
      clearInterval(intervalId);
    }
  };
};
```

### Pattern 4: Reactive Behavior

Behaviors that react to attribute changes:

```typescript
export const reactiveBehaviorFactory = (el: HTMLElement) => {
  let currentValue = el.getAttribute("value") || "";
  
  // The behavioral host will detect attribute changes
  // and re-run the factory if needed
  
  return {
    onClick() {
      // Use current attribute value
      console.log(currentValue);
    }
  };
};
```

---

## Next Steps

After creating and testing your behavior:

1. **Build the CLI**: `pnpm build`
2. **Test locally**: Install the behavior in a test project with `behavior-fn add your-behavior`
3. **Document usage**: Add examples to the behavior's JSDoc comments
4. **Create a PR**: Submit your behavior for review
5. **Update CHANGELOG**: Document your contribution

---

## Getting Help

- **Questions?** Open an issue on GitHub
- **Found a bug?** Please report it with steps to reproduce
- **Have an idea?** Discuss it in GitHub Discussions before implementing

Happy coding! 🎉
