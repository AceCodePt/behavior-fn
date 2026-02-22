# Migrate `logger` to TypeBox Schema

## Context
Migrate `logger` behavior to the TypeBox-first schema pattern.
This behavior observes `log-trigger`.

## Objectives
1.  Replace `_behavior-definition.ts` with `schema.ts`.
2.  Define schema using `@sinclair/typebox`.
3.  Update `behavior.ts` to use `SchemaType`.
4.  Update `registry/behaviors-registry.json`.

## Steps
1.  **Analyze**: Check `registry/behaviors/logger/_behavior-definition.ts` for props/attributes.
2.  **Schema**: Create `registry/behaviors/logger/schema.ts` with `Type.Object`, `Type.String` for `log-trigger` (or check if it's an attribute).
3.  **Refactor**: Update `registry/behaviors/logger/behavior.ts` to import `SchemaType`.
4.  **Update Registry**: Update `registry/behaviors-registry.json`.
5.  **Cleanup**: Delete `registry/behaviors/logger/_behavior-definition.ts`.
6.  **Verify**: Run tests.

## Deliverables
-   `registry/behaviors/logger/schema.ts`
-   Updated `registry/behaviors/logger/behavior.ts`
-   Updated `registry/behaviors-registry.json`
-   No `_behavior-definition.ts`
