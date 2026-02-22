# Task: Consolidate Create Host Behavior

## Goal

Refactor the `defineBehavioralHost` utility to accept a `BehaviorDef` (or array of definitions) directly instead of requiring manual extraction of observed attributes.

## Context

Currently, creating a behavioral host requires manually passing the observed attributes derived from the schema. This is repetitive and prone to error (e.g., forgetting to update `observedAttributes` when the schema changes).

## Requirements

1.  **Update `defineBehavioralHost` Interface**:
    -   The function should accept one or more `BehaviorDef` objects.
    -   It should automatically derive `observedAttributes` from the schemas within those definitions.

2.  **Update Usage**:
    -   Refactor existing tests and documentation to use the new, simplified API.

## Definition of Done

-   `defineBehavioralHost` accepts `BehaviorDef` objects directly.
-   Manual extraction of `observedAttributes` is no longer required at the call site.
-   All tests pass with the new signature.
-   Documentation examples are updated.
