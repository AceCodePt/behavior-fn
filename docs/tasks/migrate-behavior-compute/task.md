# Migrate `compute` to TypeBox Schema

## Context
Migrate `compute` behavior to the TypeBox-first schema pattern.
This behavior observes `compute-target`, `compute-trigger`.

## Objectives
1.  Replace `_behavior-definition.ts` with `schema.ts`.
2.  Define schema using `@sinclair/typebox`.
3.  Update `behavior.ts` to use `SchemaType`.
4.  Update `registry/behaviors-registry.json`.

## Steps
1.  **Analyze**: Check `registry/behaviors/compute/_behavior-definition.ts`.
2.  **Schema**: Create `registry/behaviors/compute/schema.ts` with `Type.Object`, `Type.String` for `compute-target`, `compute-trigger`.
3.  **Refactor**: Update `registry/behaviors/compute/behavior.ts` to import `SchemaType`.
4.  **Update Registry**: Update `registry/behaviors-registry.json`.
5.  **Cleanup**: Delete `registry/behaviors/compute/_behavior-definition.ts`.
6.  **Verify**: Run tests.

## Deliverables
-   `registry/behaviors/compute/schema.ts`
-   Updated `registry/behaviors/compute/behavior.ts`
-   Updated `registry/behaviors-registry.json`
-   No `_behavior-definition.ts`
