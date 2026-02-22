# Migrate `element-counter` to TypeBox Schema

## Context
Migrate `element-counter` behavior to the TypeBox-first schema pattern.
This behavior likely observes `counter-selector`.

## Objectives
1.  Replace `_behavior-definition.ts` with `schema.ts`.
2.  Define schema using `@sinclair/typebox`.
3.  Update `behavior.ts` to use `SchemaType`.
4.  Update `registry/behaviors-registry.json`.

## Steps
1.  **Analyze**: Check `registry/behaviors/element-counter/_behavior-definition.ts`.
2.  **Schema**: Create `registry/behaviors/element-counter/schema.ts` with `Type.Object`, `Type.String` for `counter-selector`.
3.  **Refactor**: Update `registry/behaviors/element-counter/behavior.ts` to import `SchemaType`.
4.  **Update Registry**: Update `registry/behaviors-registry.json`.
5.  **Cleanup**: Delete `registry/behaviors/element-counter/_behavior-definition.ts`.
6.  **Verify**: Run tests.

## Deliverables
-   `registry/behaviors/element-counter/schema.ts`
-   Updated `registry/behaviors/element-counter/behavior.ts`
-   Updated `registry/behaviors-registry.json`
-   No `_behavior-definition.ts`
