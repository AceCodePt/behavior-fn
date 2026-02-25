# Behavior Definition Standard

This document defines the **canonical pattern** for creating behavior definitions in BehaviorFN.

## Core Principle: Schema as Single Source of Truth

The schema defines attribute names as **literal string keys**. The `uniqueBehaviorDef` utility automatically extracts these keys to create strongly-typed ATTRS and COMMANDS objects where **key equals value**.

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
ATTRS = {
  "reveal-delay": "reveal-delay",
  "reveal-duration": "reveal-duration",
  "reveal-anchor": "reveal-anchor",
}

COMMANDS = {
  "--show": "--show",
  "--hide": "--hide",
  "--toggle": "--toggle",
}
```

This ensures:
- ✅ Schema keys are the single source of truth
- ✅ Strong literal types (e.g., `ATTRS["reveal-delay"]` has type `"reveal-delay"`)
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
 * uniqueBehaviorDef automatically extracts these keys to create definition.ATTRS.
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
 * - ATTRS: From schema keys (e.g., { "reveal-delay": "reveal-delay", ... })
 * - COMMANDS: From command object (e.g., { "--show": "--show", ... })
 * - OBSERVED_ATTRIBUTES: Array of schema keys
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
- No manual ATTRS or OBSERVED_ATTRIBUTES needed - auto-extracted!

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

const { ATTRS, COMMANDS } = definition;

export const revealBehaviorFactory = (el: HTMLElement) => {
  // Access attributes using bracket notation
  const delay = el.getAttribute(ATTRS["reveal-delay"]);
  const duration = el.getAttribute(ATTRS["reveal-duration"]);
  const anchor = el.getAttribute(ATTRS["reveal-anchor"]);
  
  return {
    connectedCallback() {
      // Implementation...
    },
    
    onCommand(e: CommandEvent<string>) {
      if (!COMMANDS) return;
      
      // Access commands using bracket notation
      if (e.command === COMMANDS["--show"]) {
        // Handle show command
      } else if (e.command === COMMANDS["--hide"]) {
        // Handle hide command
      } else if (e.command === COMMANDS["--toggle"]) {
        // Handle toggle command
      }
    },
  };
};

// Attach observed attributes from definition
revealBehaviorFactory.observedAttributes = definition.OBSERVED_ATTRIBUTES;
```

**Key Points:**
- Destructure `ATTRS` and `COMMANDS` from `definition`
- Access attributes with bracket notation: `ATTRS["reveal-delay"]`
- Access commands with bracket notation: `COMMANDS["--show"]`
- Check if `COMMANDS` exists before accessing (behaviors without commands)
- Attach `definition.OBSERVED_ATTRIBUTES` to factory function

### 4. behavior.test.ts - Test Behavior

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { getObservedAttributes } from "~utils";
import { defineBehavioralHost } from "../behavioral-host";
import { registerBehavior } from "../behavior-registry";
import { revealBehaviorFactory } from "./behavior";
import definition from "./_behavior-definition";

describe("Reveal Behavior", () => {
  beforeAll(() => {
    registerBehavior(definition.name, revealBehaviorFactory);
    defineBehavioralHost(
      "div",
      "test-reveal-div",
      getObservedAttributes(definition.schema),
    );
  });

  it("should apply delay attribute", () => {
    const el = document.createElement("div", { is: "test-reveal-div" });
    el.setAttribute("behavior", "reveal");
    el.setAttribute(definition.ATTRS["reveal-delay"], "300ms");
    document.body.appendChild(el);
    
    // Test implementation...
  });
});
```

**Key Points:**
- Use `definition.ATTRS["reveal-delay"]` in tests for type safety
- Use `getObservedAttributes(definition.schema)` for behavioral host
- Register behavior with `definition.name`

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
// ATTRS has type: { "reveal-delay": "reveal-delay", "reveal-duration": "reveal-duration", ... }
const delay: "reveal-delay" = ATTRS["reveal-delay"]; // ✅ Type-safe literal

// COMMANDS has type: { "--show": "--show", "--hide": "--hide", "--toggle": "--toggle" }
const showCmd: "--show" = COMMANDS["--show"]; // ✅ Type-safe literal

// Auto-completion works
ATTRS["reveal-d...  // IDE suggests: "reveal-delay", "reveal-duration"
COMMANDS["--s...   // IDE suggests: "--show"
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
- [ ] Remove separate ATTRS constant definitions
- [ ] Update _behavior-definition.ts to remove manual ATTRS/OBSERVED_ATTRIBUTES
- [ ] Update behavior.ts to use `ATTRS["attribute-name"]` bracket notation
- [ ] Update behavior.ts to use `COMMANDS["--command-name"]` bracket notation
- [ ] Change `definition.ATTRS.KEY` to `definition.ATTRS["key"]` throughout
- [ ] Attach `definition.OBSERVED_ATTRIBUTES` to factory function
- [ ] Update tests to use `definition.ATTRS["attribute-name"]`
- [ ] Verify all tests pass

## Benefits

This pattern provides:

1. **Single Source of Truth**: Schema keys define everything
2. **Type Safety**: Strong literal types throughout
3. **DRY Principle**: No manual duplication of attribute names
4. **Auto-Extraction**: ATTRS, COMMANDS, and OBSERVED_ATTRIBUTES auto-generated
5. **Runtime Safety**: Validation ensures key-value identity
6. **Consistency**: All behaviors follow identical pattern
7. **Maintainability**: Change attribute names in one place (schema)

## Anti-Patterns

### ❌ DON'T: Separate ATTRS constant

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

### ❌ DON'T: Manual ATTRS object

```typescript
// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  ATTRS: { ... },  // ❌ Manual duplication
});
```

### ✅ DO: Auto-extraction

```typescript
// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,  // ✅ ATTRS auto-extracted
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
const { ATTRS } = definition;  // ✅ Single import
```

## Summary

The behavior definition standard ensures:
- Schema is the single source of truth
- No manual duplication
- Full type safety with literal types
- Consistent pattern across all behaviors
- Auto-extracted metadata (ATTRS, COMMANDS, OBSERVED_ATTRIBUTES)

All behaviors MUST follow this pattern.
