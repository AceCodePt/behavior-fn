# Reimplement Request Behavior

## Context
The `request` behavior needs to be reimplemented to strictly follow the **PDSRTDD** (Plan-Data-Schema-Registry-Test-Develop) workflow and ensuring it aligns with the latest architecture patterns (TypeBox schemas, separated implementation, robust testing).

## Goals
1. Reimplement `request` behavior.
2. Ensure it has a comprehensive `_behavior-definition.ts` schema using TypeBox.
3. Ensure it has solid `behavior.test.ts` coverage.
4. Verify integration/usage.

## PDSRTDD Checklist

- [ ] **Plan**: Analyze requirements and define the capability.
- [ ] **Data**: Define state shapes and sources of truth.
- [ ] **Schema**: Define TypeBox schemas in `_behavior-definition.ts`.
- [ ] **Registry**: Register in `registry/behaviors-registry.json`.
- [ ] **Test**: Write failing tests in `behavior.test.ts`.
- [ ] **Develop**: Implement logic in `behavior.ts`.

## Constraints
- Follow the **Source-as-Registry** philosophy.
- Use `TypeBox` for schema definitions.
- Ensure no `any` types are used.
