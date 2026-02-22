# Separate Standard Events

The user requested that the logic for standard events (the list of events and the mixin that adds them) be separated from the core `behavioral-host.ts` logic. This ensures that `behavioral-host.ts` remains generic and doesn't have hard dependencies on specific event lists, while still allowing `defineBehavioralHost` to provide a complete solution.

## Plan

1.  Create `registry/behaviors/standard-events.ts`:
    - Move `withStandardEvents` mixin here.
    - Import `STANDARD_EVENTS` from `event-methods.ts`.
    - Import types from `auto-wc`.
2.  Update `registry/behaviors/behavioral-host.ts`:
    - Remove `withStandardEvents` definition.
    - Import `withStandardEvents` from `./standard-events`.
    - `defineBehavioralHost` will use the imported mixin.
3.  Update `registry/behaviors-registry.json`:
    - Add `standard-events.ts` to the `core` package file list.

This structure allows the CLI to install `standard-events.ts` alongside `behavioral-host.ts`, satisfying the requirement.
