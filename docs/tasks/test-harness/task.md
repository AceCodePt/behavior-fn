# Add Test Harness to Core

## Description

Implement a robust test harness to simplify testing behaviors. This harness should provide utilities for dispatching commands and mocking dependencies.

## Requirements

- **`dispatchCommand`**: A utility to dispatch custom `command` events.
- **`createCommandSource`**: A utility to create mock source elements.

## Implementation Plan

1.  **Update `registry/behaviors/command-test-harness.ts`**:
    - Implement `dispatchCommand`.
    - Implement `createCommandSource`.

2.  **Update `registry/behaviors-registry.json`**:
    - Ensure `command-test-harness.ts` is included in the `core` package or as a separate utility.

## Status: Completed

- **Refactoring:** Removed `registerTestComponent` from the harness.
- **Standardization:** Tests now use `defineBehavioralHost` from `~host`, ensuring they test the actual runtime code.
- **Utilities:** `dispatchCommand` and `createCommandSource` remain for interaction testing.

## Example Usage

```typescript
import { dispatchCommand } from "~test-utils";
import { defineBehavioralHost } from "~host";
import { registerBehavior } from "~registry";

// Register host once
defineBehavioralHost("button");

const el = document.createElement("button", { is: "behavioral-button" });
dispatchCommand(el, "--do-something");
```
