# ADR 001: Behavioral Host and Test Harness Refactoring

## Context

Initially, the `behavior-cn` library had a fragmented approach to registering behavioral components:

1.  `behavioral-host.ts`: Contained the `withBehaviors` mixin.
2.  `define-hosts.ts`: Contained the `defineBehavioralHost` utility.
3.  `command-test-harness.ts`: Contained a `registerTestComponent` utility that duplicated logic from `defineBehavioralHost` specifically for tests.

This led to:

- **Code Duplication:** The logic to register a custom element with behaviors was repeated.
- **Inconsistency:** Tests were using a different registration mechanism than the runtime.
- **Confusion:** Users (and developers) had to know about multiple utilities for similar purposes.

## Decision

We decided to:

1.  **Merge `define-hosts.ts` into `behavioral-host.ts`:** The `defineBehavioralHost` function is the primary entry point for using the mixin, so they belong together.
2.  **Deprecate `registerTestComponent`:** Tests should use the exact same `defineBehavioralHost` utility as the application code. This ensures tests accurately reflect runtime behavior.
3.  **Simplify `command-test-harness.ts`:** It now only contains utilities for dispatching commands (`dispatchCommand`) and creating mock sources (`createCommandSource`), which are specific to testing interactions.

## Consequences

### Positive

- **Single Source of Truth:** `behavioral-host.ts` is the one place where behavioral elements are defined.
- **Better Testing:** Tests now verify the actual runtime registration logic.
- **Simplified API:** Users only need to import `defineBehavioralHost` from `~host`.
- **Reduced Maintenance:** Less code to maintain and fewer files to manage.

### Negative

- **Migration:** Existing tests had to be refactored to use `defineBehavioralHost`.

## Implementation Details

- `behavioral-host.ts` now exports both `withBehaviors` (the mixin) and `defineBehavioralHost` (the registration utility).
- The CLI was updated to install `behavioral-host.ts` as part of the `core` package.
- The `~host` alias was added to `tsconfig.json` and the CLI's import rewriter to point to `behavioral-host.ts`.
