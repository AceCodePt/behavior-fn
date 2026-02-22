# Extract Behaviors

## Description

Extract existing behaviors from the `reeeally` project into the `behavior-cn` registry.

## Requirements

- **Behaviors:**
  - `reveal`
  - `request`
  - `clearable`
  - `input-watcher`
  - `element-counter`
  - `set-value`
  - `sign-out`
  - `social-auth`
  - `logger`
  - `compute`

- **Refactoring:**
  - Remove Zod dependency from runtime logic (keep in definition for types).
  - Split `_behavior-definition.ts` and `behavior.ts` to prevent SSR issues.
  - Replace project-specific imports with `~utils`, `~registry`, etc.

## Implementation Plan

1.  **Copy Files:** Copy behavior directories from `reeeally/src/components/html/behaviors/` to `registry/behaviors/`.
2.  **Refactor:** Update imports and remove project-specific dependencies.
3.  **Verify:** Ensure tests pass (or are updated to pass).
