# Migrate `set-value` to TypeBox Schema

## Context
Migrate `set-value` behavior to the TypeBox-first schema pattern.
This behavior observes `value-target`, `value-source`.

## Objectives
1.  Replace `_behavior-definition.ts` with `schema.ts`.
2.  Define schema using `@sinclair/typebox`.
3.  Update `behavior.ts` to use `SchemaType`.
4.  Update `registry/behaviors-registry.json`.

## Steps
1.  **Analyze**: Check `registry/behaviors/set-value/_behavior-definition.ts`.
2.  **Schema**: Create `registry/behaviors/set-value/schema.ts` with `Type.Object`, `Type.String` for `value-target`, `value-source`.
3.  **Refactor**: Update `registry/behaviors/set-value/behavior.ts` to import `SchemaType`.
4.  **Update Registry**: Update `registry/behaviors-registry.json`.
5.  **Cleanup**: Delete `registry/behaviors/set-value/_behavior-definition.ts`.
6.  **Verify**: Run tests.

## Deliverables
-   `registry/behaviors/set-value/schema.ts`
-   Updated `registry/behaviors/set-value/behavior.ts`
-   Updated `registry/behaviors-registry.json`
-   No `_behavior-definition.ts`
