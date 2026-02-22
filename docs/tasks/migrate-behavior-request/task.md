# Migrate `request` to TypeBox Schema

## Context
Migrate `request` behavior to the TypeBox-first schema pattern.
This behavior has complex props like `request-trigger`, `request-method`, etc.

## Objectives
1.  Replace `_behavior-definition.ts` with `schema.ts`.
2.  Define schema using `@sinclair/typebox`.
3.  Update `behavior.ts` to use `SchemaType`.
4.  Update `registry/behaviors-registry.json`.

## Steps
1.  **Analyze**: Check `registry/behaviors/request/_behavior-definition.ts` for props/attributes.
    -   `request-method`
    -   `request-trigger`
    -   `request-target`
    -   `request-swap`
    -   `request-indicator`
    -   `request-confirm`
    -   `request-push-url`
    -   `request-vals`
2.  **Schema**: Create `registry/behaviors/request/schema.ts` with `Type.Object`, `Type.String`, etc. matching the complex props.
    -   Note: `request-trigger` might need nested types or `Type.Union`.
3.  **Refactor**: Update `registry/behaviors/request/behavior.ts` to import `SchemaType`.
4.  **Update Registry**: Update `registry/behaviors-registry.json`.
5.  **Cleanup**: Delete `registry/behaviors/request/_behavior-definition.ts`.
6.  **Verify**: Run tests.

## Deliverables
-   `registry/behaviors/request/schema.ts`
-   Updated `registry/behaviors/request/behavior.ts`
-   Updated `registry/behaviors-registry.json`
-   No `_behavior-definition.ts`
