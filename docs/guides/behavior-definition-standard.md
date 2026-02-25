# Behavior Definition Standard

This document defines the **canonical pattern** for creating behavior definitions in BehaviorFN.

## Core Principle: Schema as Single Source of Truth

The schema defines attribute names as **literal string keys**. The `uniqueBehaviorDef` utility automatically extracts these keys to create a strongly-typed attributes object where **key equals value**.

## File Structure

Every behavior MUST have exactly **4 files**:

```
behavior-name/
├── schema.ts                 # TypeBox schema with literal attribute keys
├── _behavior-definition.ts   # Behavior definition (auto-extracts metadata)
├── behavior.ts               # Behavior logic (accesses via definition object)
└── behavior.test.ts          # Tests
```

## Pattern: Key-Value Identity

**All attribute and command names follow the pattern where key === value:**

```typescript
attributes = {
  "reveal-delay": "reveal-delay",
  "reveal-duration": "reveal-duration",
  "reveal-anchor": "reveal-anchor",
}

command = {
  "--show": "--show",
  "--hide": "--hide",
  "--toggle": "--toggle",
}
```

This ensures:
- ✅ Schema keys are the single source of truth
- ✅ Strong literal types (e.g., `attributes["reveal-delay"]` has type `"reveal-delay"`)
- ✅ Runtime and compile-time safety
- ✅ No manual duplication

## Implementation Pattern

### 1. schema.ts - Define Attributes

```typescript
import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Schema for reveal behavior.
 * 
 * The schema keys define the HTML attributes.
 * uniqueBehaviorDef automatically extracts these keys to create definition.attributes.
 */
export const schema = Type.Object({
  /** Delay before revealing (CSS time value, e.g., "300ms") */
  "reveal-delay": Type.Optional(Type.String({ 
    description: "CSS time value for delay" 
  })),
  
  /** Duration of reveal animation */
  "reveal-duration": Type.Optional(Type.String({ 
    description: "CSS time value for duration" 
  })),
  
  /** ID of anchor element for positioning */
  "reveal-anchor": Type.Optional(Type.String({ 
    description: "ID of the anchor element" 
  })),
  
  // ... more attributes
});

export type SchemaType = InferSchema<typeof schema>;
```

**Key Points:**
- Use literal strings as keys: `"reveal-delay"`, NOT variables
- Add JSDoc comments above each key for documentation
- Use TypeBox `description` metadata for schema documentation
- Export the inferred TypeScript type

### 2. _behavior-definition.ts - Define Behavior

```typescript
import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Reveal behavior definition.
 * 
 * uniqueBehaviorDef automatically extracts:
 * - attributes: From schema keys (e.g., { "reveal-delay": "reveal-delay", ... })
 */
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: {
    "--show": "--show",
    "--hide": "--hide",
    "--toggle": "--toggle",
  },
});

export default definition;
```

**Key Points:**
- Import schema from `./schema`
- Pass `command` object with key-value identity pattern
- `uniqueBehaviorDef` validates that all keys equal their values
- No manual attributes needed - auto-extracted!

**For behaviors without commands**, omit the `command` property:

```typescript
const definition = uniqueBehaviorDef({
  name: "logger",
  schema,
  // No command property
});
```

### 3. behavior.ts - Implement Logic

```typescript
import { type CommandEvent } from "~registry";
import definition from "./_behavior-definition";

const { attributes, command } = definition;

export const revealBehaviorFactory = (el: HTMLElement) => {
  // Access attributes using bracket notation
  const delay = el.getAttribute(attributes["reveal-delay"]);
  const duration = el.getAttribute(attributes["reveal-duration"]);
  const anchor = el.getAttribute(attributes["reveal-anchor"]);
  
  return {
    connectedCallback() {
      // Implementation...
    },
    
    onCommand(e: CommandEvent<string>) {
      if (!command) return;
      
      // Access commands using bracket notation
      if (e.command === command["--show"]) {
        // Handle show command
      } else if (e.command === command["--hide"]) {
        // Handle hide command
      } else if (e.command === command["--toggle"]) {
        // Handle toggle command
      }
    },
  };
};
```

**Key Points:**
- Destructure `attributes` and `command` from `definition`
- Access attributes with bracket notation: `attributes["reveal-delay"]`
- Access commands with bracket notation: `command["--show"]`
- Check if `command` exists before accessing (behaviors without commands)

### 4. behavior.test.ts - Test Behavior

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { getObservedAttributes } from "~utils";
import { defineBehavioralHost } from "../behavioral-host";
import { registerBehavior } from "../behavior-registry";
import { revealBehaviorFactory } from "./behavior";
import definition from "./_behavior-definition";

// Extract attributes and command at module level for cleaner test code
const { name, attributes, command } = definition;

describe("Reveal Behavior", () => {
  beforeAll(() => {
    registerBehavior(name, revealBehaviorFactory);
    defineBehavioralHost(
      "div",
      "test-reveal-div",
      getObservedAttributes(definition.schema),
    );
  });

  it("should apply delay attribute", () => {
    const el = document.createElement("div", { is: "test-reveal-div" });
    el.setAttribute("behavior", "reveal");
    el.setAttribute(attributes["reveal-delay"], "300ms");
    document.body.appendChild(el);
    
    // Test implementation...
  });
  
  it("should handle show command", () => {
    const el = document.createElement("div", { is: "test-reveal-div" });
    el.setAttribute("behavior", "reveal");
    document.body.appendChild(el);
    
    dispatchCommand(el, command["--show"]);
    
    // Test implementation...
  });
});
```

**Key Points:**
- **Extract at module level**: Destructure `name`, `attributes`, `command` from definition
- **Use extracted variables**: Reference `attributes["reveal-delay"]` and `command["--show"]` directly
- **Type safety**: TypeScript infers `command` correctly (defined when provided, undefined when not)
- Use `getObservedAttributes(definition.schema)` for behavioral host

**For behaviors without commands**:

```typescript
// Behavior without commands (e.g., logger)
const { name, attributes } = definition;
// command will be undefined, just don't extract it
```

## Standard Test Pattern

**This is the required pattern for ALL behavior tests.**

### Module-Level Setup

```typescript
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { getObservedAttributes } from "~utils";
import { defineBehavioralHost } from "../behavioral-host";
import { registerBehavior } from "../behavior-registry";
import { behaviorFactory } from "./behavior";
import definition from "./_behavior-definition";
import { dispatchCommand } from "../command-test-harness";

// 1. Extract everything at module level
const { name, attributes, command } = definition;
const observedAttributes = getObservedAttributes(definition.schema);

// 2. Setup test constants
const tag = "div";
const webcomponentTag = "test-behavior-div";
```

### Test Structure

```typescript
describe("Behavior Name", () => {
  beforeAll(() => {
    registerBehavior(name, behaviorFactory);
    defineBehavioralHost(tag, webcomponentTag, observedAttributes);
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should test attribute", () => {
    const el = document.createElement(tag, { is: webcomponentTag }) as HTMLElement;
    el.setAttribute("behavior", name);
    el.setAttribute(attributes["behavior-attribute"], "value");
    document.body.appendChild(el);
    
    // Assertions...
  });

  it("should test command", () => {
    const el = document.createElement(tag, { is: webcomponentTag }) as HTMLElement;
    el.setAttribute("behavior", name);
    document.body.appendChild(el);
    
    dispatchCommand(el, command["--command-name"]);
    
    // Assertions...
  });
});
```

### Required Practices

1. **✅ DO extract at module level:**
   ```typescript
   const { name, attributes, command } = definition;
   ```

2. **✅ DO use extracted variables:**
   ```typescript
   el.setAttribute(attributes["behavior-attr"], "value");
   dispatchCommand(el, command["--cmd"]);
   ```

3. **✅ DO clean up between tests:**
   ```typescript
   beforeEach(() => {
     document.body.innerHTML = "";
   });
   ```

4. **❌ DON'T repeat `definition.` everywhere:**
   ```typescript
   // ❌ Bad
   el.setAttribute(definition.attributes["attr"], "value");
   
   // ✅ Good
   el.setAttribute(attributes["attr"], "value");
   ```

5. **❌ DON'T use string literals for attributes:**
   ```typescript
   // ❌ Bad - no type safety
   el.setAttribute("behavior-attr", "value");
   
   // ✅ Good - type-safe
   el.setAttribute(attributes["behavior-attr"], "value");
   ```

### Why This Pattern?

- **DRY**: Extract once, use everywhere
- **Type Safety**: Full TypeScript inference and autocomplete
- **Maintainability**: Change attribute names in schema, tests update automatically
- **Readability**: Clean, consistent code across all tests
- **Consistency**: Same pattern in behavior.ts and behavior.test.ts

## Attribute Naming Convention

All behavior-specific attributes MUST follow the pattern:

```
{behavior-name}-{attribute-name}
```

**Examples:**
- ✅ `"reveal-delay"`, `"reveal-duration"`, `"reveal-anchor"`
- ✅ `"compute-formula"`
- ✅ `"request-url"`, `"request-method"`, `"request-trigger"`
- ✅ `"input-watcher-target"`, `"input-watcher-format"`
- ✅ `"element-counter-root"`, `"element-counter-selector"`
- ✅ `"logger-trigger"`

**Standard HTML attributes** (like `"hidden"`, `"open"`, `"popover"`) are used directly without the behavior prefix.

## Command Naming Convention

All commands MUST use the double-dash prefix pattern:

```
--{command-name}
```

**Examples:**
- ✅ `"--show"`, `"--hide"`, `"--toggle"`
- ✅ `"--trigger"`, `"--close-sse"`
- ✅ `"--set-content"`

## Type Safety Benefits

The pattern provides full type safety:

```typescript
// attributes has type: { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration", ... }
const delay: "reveal-delay" = attributes["reveal-delay"]; // ✅ Type-safe literal

// command has type: { "--show": "--show", "--hide": "--hide", "--toggle": "--toggle" }
const showCmd: "--show" = command["--show"]; // ✅ Type-safe literal

// Auto-completion works
attributes["reveal-d...  // IDE suggests: "reveal-delay", "reveal-duration"
command["--s...   // IDE suggests: "--show"
```

## Validation

`uniqueBehaviorDef` performs runtime validation:

```typescript
// ✅ VALID - key equals value
command: {
  "--show": "--show",
  "--hide": "--hide",
}

// ❌ INVALID - key doesn't equal value
command: {
  "show": "--show",  // Runtime Error!
}
```

## Migration Checklist

When updating existing behaviors to this pattern:

- [ ] Move attribute constants to schema.ts as literal string keys
- [ ] Remove separate attributes constant definitions
- [ ] Update _behavior-definition.ts to remove manual attributes
- [ ] Update behavior.ts to use `attributes["attribute-name"]` bracket notation
- [ ] Update behavior.ts to use `command["--command-name"]` bracket notation
- [ ] Change `definition.attributes.KEY` to `definition.attributes["key"]` throughout
- [ ] Update tests: Extract `{ name, attributes, command }` at module level
- [ ] Update tests: Use extracted variables (`attributes[...]`, `command[...]`)
- [ ] Update tests: Remove old constant imports (e.g., `BEHAVIOR_ATTRS`)
- [ ] Verify all tests pass

## Benefits

This pattern provides:

1. **Single Source of Truth**: Schema keys define everything
2. **Type Safety**: Strong literal types throughout
3. **DRY Principle**: No manual duplication of attribute names
4. **Auto-Extraction**: attributes auto-generated from schema
5. **Runtime Safety**: Validation ensures key-value identity
6. **Consistency**: All behaviors follow identical pattern
7. **Maintainability**: Change attribute names in one place (schema)

## Anti-Patterns

### ❌ DON'T: Separate attributes constant

```typescript
// schema.ts
export const REVEAL_ATTRS = {
  DELAY: "reveal-delay",  // ❌ Separate constant
};

export const schema = Type.Object({
  [REVEAL_ATTRS.DELAY]: Type.Optional(...),
});
```

### ✅ DO: Literal keys in schema

```typescript
// schema.ts
export const schema = Type.Object({
  "reveal-delay": Type.Optional(...),  // ✅ Literal key
});
```

### ❌ DON'T: Manual attributes object

```typescript
// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  attributes: { ... },  // ❌ Manual duplication
});
```

### ✅ DO: Auto-extraction

```typescript
// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,  // ✅ attributes auto-extracted
});
```

### ❌ DON'T: Separate imports

```typescript
// behavior.ts
import { REVEAL_ATTRS } from "./constants";  // ❌ Separate file
```

### ✅ DO: Import from definition

```typescript
// behavior.ts
import definition from "./_behavior-definition";
const { attributes } = definition;  // ✅ Single import
```

### ❌ DON'T: Repeat `definition.` everywhere in tests

```typescript
// behavior.test.ts
it("should work", () => {
  el.setAttribute(definition.attributes["attr-1"], "value");  // ❌ Repetitive
  el.setAttribute(definition.attributes["attr-2"], "value");  // ❌ Repetitive
  dispatchCommand(el, definition.command["--cmd"]);      // ❌ Repetitive
});
```

### ✅ DO: Extract at module level in tests

```typescript
// behavior.test.ts
const { name, attributes, command } = definition;

it("should work", () => {
  el.setAttribute(attributes["attr-1"], "value");  // ✅ Clean
  el.setAttribute(attributes["attr-2"], "value");  // ✅ Clean
  dispatchCommand(el, command["--cmd"]);      // ✅ Clean
});
```

**Why this is better:**
- ✅ **DRY**: Don't repeat `definition.` on every line
- ✅ **Type Safety**: TypeScript correctly infers command type
- ✅ **Readability**: Cleaner, less visual noise
- ✅ **Simplicity**: No type guards or assertions needed
- ✅ **Consistency**: Same pattern as behavior.ts implementation

## Summary

The behavior definition standard ensures:
- Schema is the single source of truth
- No manual duplication
- Full type safety with literal types
- Consistent pattern across all behaviors
- Auto-extracted attributes from schema

All behaviors MUST follow this pattern.
