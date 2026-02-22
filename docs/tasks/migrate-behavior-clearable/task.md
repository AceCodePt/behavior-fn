# Migrate `clearable` to TypeBox Schema

## Context
Migrate `clearable` behavior to the TypeBox-first schema pattern.
This behavior observes `clear-trigger`.

## Objectives
1.  Replace `_behavior-definition.ts` with `schema.ts`.
2.  Define schema using `@sinclair/typebox`.
3.  Update `behavior.ts` to use `SchemaType`.
4.  Update `registry/behaviors-registry.json`.

## Steps
1.  **Analyze**: Check `registry/behaviors/clearable/_behavior-definition.ts` for props/attributes.
2.  **Schema**: Create `registry/behaviors/clearable/schema.ts` with `Type.Object`, `Type.String` for `clear-trigger`.
3.  **Refactor**: Update `registry/behaviors/clearable/behavior.ts` to import `SchemaType`.
4.  **Update Registry**: Update `registry/behaviors-registry.json`.
5.  **Cleanup**: Delete `registry/behaviors/clearable/_behavior-definition.ts`.
6.  **Verify**: Run tests.

## Deliverables
-   `registry/behaviors/clearable/schema.ts`
-   Updated `registry/behaviors/clearable/behavior.ts`
-   Updated `registry/behaviors-registry.json`
-   No `_behavior-definition.ts`
