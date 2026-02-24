# Constants Pattern for Behaviors

## Overview

Each behavior has a `constants.ts` file containing ONLY attribute name constants - no schema validation logic. This keeps CDN bundles lightweight by avoiding TypeBox imports.

## File Structure

```
registry/behaviors/{behavior-name}/
├── constants.ts             # Attribute constants only (NO TypeBox)
├── schema.ts                # TypeBox schema + re-exports constants
├── behavior.ts              # Imports from constants.ts
└── _behavior-definition.ts  # Imports from schema.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CDN Path                             │
├─────────────────────────────────────────────────────────┤
│ behavior.ts → constants.ts                              │
│                                                          │
│ ✅ No TypeBox imported                                   │
│ ✅ Small bundle size (~10KB)                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     CLI Path                             │
├─────────────────────────────────────────────────────────┤
│ _behavior-definition.ts → schema.ts → constants.ts     │
│                                                          │
│ ✅ Full TypeBox validation                               │
│ ✅ Schema transformation (TypeBox → Zod/Valibot/etc.)   │
└─────────────────────────────────────────────────────────┘
```

## constants.ts Template

```typescript
/**
 * Attribute name constants for the {behavior-name} behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The {behavior-name} behavior {brief description}.
 */
export const {BEHAVIOR}_ATTRS = {
  /** Description of what this attribute does */
  ATTRIBUTE_NAME: "{behavior-name}-attribute-name",
  
  /** Another attribute description */
  ANOTHER: "{behavior-name}-another",
} as const;
```

## Key Principles

### 1. No Imports
constants.ts should have **ZERO imports** - especially no TypeBox, Zod, or validation libraries.

```typescript
// ❌ BAD - Imports TypeBox
import { Type } from "@sinclair/typebox";

// ✅ GOOD - No imports at all
export const REVEAL_ATTRS = {
  DELAY: "reveal-delay",
} as const;
```

### 2. JSDoc Comments
Each constant should have a JSDoc comment explaining what it does.

```typescript
export const REVEAL_ATTRS = {
  /** Delay before revealing (CSS time value, e.g., "300ms") */
  DELAY: "reveal-delay",
  
  /** Duration of reveal animation (CSS time value, e.g., "200ms") */
  DURATION: "reveal-duration",
} as const;
```

### 3. Naming Convention
- Object name: `{BEHAVIOR}_ATTRS` (e.g., `REVEAL_ATTRS`, `REQUEST_ATTRS`)
- Keys: SCREAMING_SNAKE_CASE (e.g., `DELAY`, `WHEN_TARGET`)
- Values: kebab-case with behavior prefix (e.g., `"reveal-delay"`, `"request-url"`)

### 4. Standard HTML Attributes
Standard HTML attributes (like `hidden`, `open`, `popover`) should be included if the behavior uses them:

```typescript
export const REVEAL_ATTRS = {
  // Behavior-specific attributes
  DELAY: "reveal-delay",
  DURATION: "reveal-duration",
  
  // Standard HTML attributes used by this behavior
  HIDDEN: "hidden",
  OPEN: "open",
  POPOVER: "popover",
} as const;
```

## schema.ts Pattern

schema.ts imports from constants.ts and re-exports for backward compatibility:

```typescript
import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { REVEAL_ATTRS } from "./constants";

// Re-export for backward compatibility
export { REVEAL_ATTRS };

// Define schema using the constants
export const schema = Type.Object({
  [REVEAL_ATTRS.DELAY]: Type.Optional(Type.String()),
  [REVEAL_ATTRS.DURATION]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
```

## behavior.ts Pattern

behavior.ts imports ONLY from constants.ts (not schema.ts):

```typescript
// ✅ GOOD - Import from constants.ts
import { REVEAL_ATTRS } from "./constants";

export const revealBehaviorFactory = (el: HTMLElement) => {
  const delay = el.getAttribute(REVEAL_ATTRS.DELAY);
  // ...
};
```

```typescript
// ❌ BAD - Import from schema.ts (brings TypeBox into CDN bundle)
import { REVEAL_ATTRS } from "./schema";
```

### Exception: Type Imports

If you need TypeScript types from schema.ts, import them separately:

```typescript
import { REQUEST_ATTRS } from "./constants";
import type { TriggerConfig } from "./schema";  // Type-only import

export const requestBehaviorFactory = (el: HTMLElement) => {
  const triggers: TriggerConfig[] = parseTriggers(
    el.getAttribute(REQUEST_ATTRS.TRIGGER)
  );
};
```

## Bundle Size Impact

| Approach | Bundle Size | TypeBox Included? |
|----------|-------------|-------------------|
| **Before (import from schema.ts)** | ~60KB | ✅ Yes (~50KB) |
| **After (import from constants.ts)** | ~10KB | ❌ No |
| **Savings** | **-50KB** | **-83%** |

## Benefits

1. **Smaller CDN Bundles**: 50KB savings per behavior bundle
2. **Faster Load Times**: Less JavaScript to download and parse
3. **Clear Separation**: Constants vs validation logic separated
4. **Backward Compatible**: schema.ts re-exports constants
5. **Better DX**: JSDoc comments provide inline documentation

## Verification

### Check No TypeBox in CDN Bundle

```bash
# Build CDN bundles
pnpm build

# Verify TypeBox not included
grep -i "typebox" dist/cdn/reveal.js
# Should return nothing

# Check bundle size
ls -lh dist/cdn/reveal.js
# Should be ~10KB (not ~60KB)
```

### Check Constants Work

```typescript
import { REVEAL_ATTRS } from "./constants";

console.log(REVEAL_ATTRS.DELAY);  // "reveal-delay"
```

### Check Schema Re-exports

```typescript
// Both work (schema.ts re-exports from constants.ts)
import { REVEAL_ATTRS } from "./constants";  // Direct
import { REVEAL_ATTRS } from "./schema";     // Re-exported
```

## Creating a New Behavior

When creating a new behavior, follow this checklist:

1. ✅ Create `constants.ts` with attribute names + JSDoc
2. ✅ Create `schema.ts` that imports and re-exports from constants.ts
3. ✅ Create `behavior.ts` that imports from constants.ts (NOT schema.ts)
4. ✅ Create `_behavior-definition.ts` that imports from schema.ts
5. ✅ Verify no TypeBox in behavior.ts dependency chain
6. ✅ Add JSDoc comments to all constants

## Example: Complete New Behavior

```typescript
// constants.ts
/**
 * Attribute name constants for the tooltip behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The tooltip behavior shows contextual information on hover.
 */
export const TOOLTIP_ATTRS = {
  /** Tooltip text content */
  TEXT: "tooltip-text",
  
  /** Tooltip position (top, bottom, left, right) */
  POSITION: "tooltip-position",
  
  /** Delay before showing tooltip (milliseconds) */
  DELAY: "tooltip-delay",
} as const;
```

```typescript
// schema.ts
import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { TOOLTIP_ATTRS } from "./constants";

export { TOOLTIP_ATTRS };

export const schema = Type.Object({
  [TOOLTIP_ATTRS.TEXT]: Type.String(),
  [TOOLTIP_ATTRS.POSITION]: Type.Optional(
    Type.Union([
      Type.Literal("top"),
      Type.Literal("bottom"),
      Type.Literal("left"),
      Type.Literal("right"),
    ])
  ),
  [TOOLTIP_ATTRS.DELAY]: Type.Optional(Type.Number()),
});

export type SchemaType = InferSchema<typeof schema>;
```

```typescript
// behavior.ts
import { TOOLTIP_ATTRS } from "./constants";  // ✅ From constants, not schema

export const tooltipBehaviorFactory = (el: HTMLElement) => {
  const text = el.getAttribute(TOOLTIP_ATTRS.TEXT);
  const position = el.getAttribute(TOOLTIP_ATTRS.POSITION) || "top";
  const delay = parseInt(el.getAttribute(TOOLTIP_ATTRS.DELAY) || "300");
  
  // ... implementation
};
```

## Summary

The constants pattern is a **critical optimization** for CDN bundles:

- ✅ **83% smaller bundles** (10KB vs 60KB)
- ✅ **Zero runtime overhead** (no validation in browser)
- ✅ **Backward compatible** (schema.ts re-exports)
- ✅ **Better DX** (JSDoc comments)
- ✅ **Clear architecture** (separation of concerns)

**Always import from constants.ts in behavior.ts files!**
