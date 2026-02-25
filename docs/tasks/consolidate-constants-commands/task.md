# Consolidate Constants and Commands into Behavioral Definition

## Goal

Consolidate all behavior-specific constants (attribute names) and commands into the `_behavior-definition.ts` file as the single source of truth, and ensure all behavior logic explicitly imports and uses these exports instead of separate `constants.ts` or `commands.ts` files.

## Context

Currently, behaviors have a fragmented structure where:
1. **Attribute name constants** live in `constants.ts` (e.g., `REVEAL_ATTRS`, `REQUEST_ATTRS`)
2. **Command definitions** live either in `commands.ts` (reveal) or inline in `_behavior-definition.ts` (request, logger)
3. **Observed attributes** are sometimes derived in `commands.ts` (reveal) or not explicitly exported
4. **Behavior logic** (`behavior.ts`) imports from multiple files (`constants.ts`, `commands.ts`, `_behavior-definition.ts`)

This violates the **Single Source of Truth** principle and creates unnecessary file proliferation. The `_behavior-definition.ts` file should be the **canonical contract** for each behavior, containing:
- Behavior name
- Schema (via import from `schema.ts`)
- Attribute name constants (currently in `constants.ts`)
- Command definitions (currently in `commands.ts` or inline)
- Observed attributes (derived from constants)

### Why This Matters

1. **DRY Principle**: Attribute names and commands should be defined once in the contract
2. **Single Import**: `behavior.ts` should only need to import from `_behavior-definition.ts` for all metadata
3. **Type Safety**: Commands and attributes should be co-located with their schema definition
4. **Consistency**: All behaviors should follow the same file structure pattern
5. **Clarity**: The definition file is the contract—it should contain all metadata

### Current State Examples

**Reveal Behavior (Fragmented)**:
- `constants.ts` → Exports `REVEAL_ATTRS`
- `commands.ts` → Exports `REVEAL_COMMANDS` and `REVEAL_OBSERVED_ATTRIBUTES`
- `_behavior-definition.ts` → Imports both and passes to `uniqueBehaviorDef`
- `behavior.ts` → Imports from both `constants.ts` and `commands.ts`

**Request Behavior (Partially Consolidated)**:
- `constants.ts` → Exports `REQUEST_ATTRS`
- `_behavior-definition.ts` → Defines commands inline
- `behavior.ts` → Imports `REQUEST_ATTRS` from `constants.ts` and destructures from definition

**Logger Behavior (No Commands)**:
- `constants.ts` → Exports `LOGGER_ATTRS`
- `_behavior-definition.ts` → No commands
- `behavior.ts` → Imports from `constants.ts`

## Requirements

1. **Move all constants to `_behavior-definition.ts`**:
   - Export attribute name constants (e.g., `REVEAL_ATTRS`) directly from definition
   - Keep JSDoc comments for attribute documentation
   - Maintain `as const` for literal type inference

2. **Move all commands to `_behavior-definition.ts`**:
   - Export command constants (e.g., `REVEAL_COMMANDS`) directly from definition
   - Keep commands co-located with the behavior they control

3. **Export observed attributes**:
   - Derive `OBSERVED_ATTRIBUTES` from the constants object using `Object.values()`
   - Export from definition for use by behavior implementations

4. **Update all imports**:
   - Refactor `behavior.ts` to import constants, commands, and observed attributes from `_behavior-definition.ts`
   - Remove imports from `constants.ts` and `commands.ts`

5. **Remove obsolete files**:
   - Delete `constants.ts` files
   - Delete `commands.ts` files
   - Update any tests that import from these files

6. **Verify file structure**:
   - Each behavior should have exactly 4 files:
     - `_behavior-definition.ts` (The Contract: name, schema, constants, commands, observed attributes)
     - `schema.ts` (TypeBox schema definition)
     - `behavior.ts` (The Logic: factory function)
     - `behavior.test.ts` (The Verification: tests)

## Success Criteria

- [ ] All `constants.ts` files are deleted
- [ ] All `commands.ts` files are deleted
- [ ] All `_behavior-definition.ts` files export:
  - Behavior name
  - Schema (imported from `schema.ts`)
  - Attribute constants object (e.g., `REVEAL_ATTRS`)
  - Command constants object (if applicable, e.g., `REVEAL_COMMANDS`)
  - Observed attributes array (e.g., `REVEAL_OBSERVED_ATTRIBUTES`)
  - Default export of the behavior definition
- [ ] All `behavior.ts` files import constants/commands/observed attributes from `_behavior-definition.ts`
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm check`)
- [ ] No breaking changes to public API (behaviors still work identically)
- [ ] Pattern is consistent across all 9 behaviors

## Behaviors to Update

1. `reveal` (has both `constants.ts` and `commands.ts`)
2. `request` (has `constants.ts`, commands inline in definition)
3. `logger` (has `constants.ts`, no commands)
4. `element-counter` (has `constants.ts`, no commands)
5. `compute` (has `constants.ts`, no commands)
6. `input-watcher` (has `constants.ts`, no commands)
7. `json-template` (has `constants.ts`, no commands)
8. `compound-commands` (has `constants.ts`, no commands)
9. `content-setter` (has `constants.ts`, no commands)

## Example Target Structure

### `_behavior-definition.ts` (After Consolidation)

```typescript
import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Attribute name constants for the reveal behavior.
 * These define the HTML attributes that control reveal behavior.
 */
export const REVEAL_ATTRS = {
  /** Delay before revealing (CSS time value, e.g., "300ms") */
  DELAY: "reveal-delay",
  /** Duration of reveal animation (CSS time value, e.g., "200ms") */
  DURATION: "reveal-duration",
  /** ID of anchor element for positioning */
  ANCHOR: "reveal-anchor",
  /** Auto-handle popover/dialog states */
  AUTO: "reveal-auto",
  /** Selector for target element to watch */
  WHEN_TARGET: "reveal-when-target",
  /** Attribute name on target to watch */
  WHEN_ATTRIBUTE: "reveal-when-attribute",
  /** Value that triggers reveal */
  WHEN_VALUE: "reveal-when-value",
  /** Standard HTML hidden attribute */
  HIDDEN: "hidden",
  /** Standard HTML open attribute (dialog/details) */
  OPEN: "open",
  /** Standard HTML popover attribute */
  POPOVER: "popover",
} as const;

/**
 * Commands supported by the reveal behavior.
 * These are used with the Invoker Commands API.
 */
export const REVEAL_COMMANDS = {
  "--show": "--show",
  "--hide": "--hide",
  "--toggle": "--toggle",
} as const;

/**
 * Observed attributes - derived from REVEAL_ATTRS (single source of truth).
 * Used by the behavior implementation to know which attributes to watch.
 */
export const REVEAL_OBSERVED_ATTRIBUTES = Object.values(REVEAL_ATTRS);

// Full definition with schema (for CLI and type inference)
const REVEAL_DEFINITION = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: REVEAL_COMMANDS,
});

export default REVEAL_DEFINITION;
```

### `behavior.ts` (After Update)

```typescript
import { type CommandEvent } from "~registry";
import definition, { 
  REVEAL_ATTRS, 
  REVEAL_COMMANDS, 
  REVEAL_OBSERVED_ATTRIBUTES 
} from "./_behavior-definition";

export const revealBehaviorFactory = (el: HTMLElement) => {
  // ... implementation using REVEAL_ATTRS, REVEAL_COMMANDS
  
  return {
    onCommand(e: CommandEvent<keyof typeof REVEAL_COMMANDS>) {
      const cmd = REVEAL_COMMANDS;
      // ... command handling
    },
    // ... other methods
  };
};
```

## Non-Requirements

- Do NOT change the behavior logic or functionality
- Do NOT modify schemas or validation rules
- Do NOT change the public API or how users interact with behaviors
- Do NOT add new features or capabilities

## Notes

- This is a **Regression** task (alignment/refactoring due to architectural improvement)
- The behavior contracts should be strengthened, not weakened
- CDN bundle size should remain unaffected (constants are lightweight)
- This improves maintainability and enforces the "Single Source of Truth" principle
- After this refactor, the 4-file structure will be canonical for all behaviors

## Protocol Checklist

### Plan Phase
- [ ] Analyze all 9 behaviors and their current file structures
- [ ] Document the consolidation pattern for `_behavior-definition.ts`
- [ ] Identify all import statements that need updating
- [ ] Create LOG.md with implementation plan

### Execute Phase
- [ ] Move constants and commands to `_behavior-definition.ts` for all behaviors
- [ ] Update all imports in `behavior.ts` files
- [ ] Update all imports in test files
- [ ] Delete obsolete `constants.ts` and `commands.ts` files
- [ ] Run tests to verify no regressions
- [ ] Run type checking to verify type safety

### Verify Phase
- [ ] All tests pass
- [ ] Type checking passes
- [ ] No `constants.ts` or `commands.ts` files remain
- [ ] All behaviors have exactly 4 files
- [ ] All `behavior.ts` files import from `_behavior-definition.ts`
- [ ] Pattern is consistent across all behaviors

## Prohibited Patterns

### ❌ BAD: Importing from separate files
```typescript
// behavior.ts
import { REVEAL_ATTRS } from "./constants";
import { REVEAL_COMMANDS } from "./commands";
```

### ✅ GOOD: Single import from definition
```typescript
// behavior.ts
import definition, { REVEAL_ATTRS, REVEAL_COMMANDS } from "./_behavior-definition";
```

### ❌ BAD: Separate files for metadata
```text
reveal/
├── constants.ts
├── commands.ts
├── _behavior-definition.ts
```

### ✅ GOOD: Consolidated definition
```text
reveal/
├── _behavior-definition.ts (contains constants, commands, and definition)
├── schema.ts
├── behavior.ts
└── behavior.test.ts
```
