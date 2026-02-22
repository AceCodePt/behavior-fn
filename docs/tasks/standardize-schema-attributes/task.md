# Standardize Schema Interface & Move Observed Attributes to Host

**Priority**: High
**Status**: Pending

## Context

Currently, behavior definitions (`_behavior-definition.ts`) often duplicate information:
```typescript
const LOGGER_DEFINITION = uniqueBehaviorDef({
  name: "logger",
  schema,
  observedAttributes: Object.keys(schema.properties), // Duplicate!
  command: {},
});
```

The schema already contains the properties that should be observed. We want to remove this duplication and ensure `observedAttributes` are automatically derived from the schema by the host/utils.

Additionally, we need to enforce a rule that **all attributes** used by the behavior must be observed. This prevents "surprises" where changing an attribute does nothing because the behavior isn't watching it, and it ensures the documentation generated from the schema is accurate.

## Goals

1.  **Refactor `uniqueBehaviorDef`**: Update the utility to automatically derive `observedAttributes` from the `schema` property if present.
2.  **Remove Explicit `observedAttributes`**: Update all behavior definitions to remove the manual `observedAttributes` array.
3.  **Update `BehavioralHost`**: Ensure the host uses the schema-derived attributes correctly.
4.  **Update Guides**: Add a rule stating that all functional attributes must be observed/defined in the schema.

## Protocol Checklist

- [ ] **Plan**: Verify the type changes needed in `behavior-utils.ts`.
- [ ] **Schema**: Update `BehaviorDef` type.
- [ ] **Refactor**: Update `uniqueBehaviorDef` implementation.
- [ ] **Migrate**: Update all existing behaviors (`logger`, `request`, etc.) to remove `observedAttributes`.
- [ ] **Verify**: Ensure tests still pass and attributes are still observed.
- [ ] **Docs**: Update `docs/contributing/adding-behaviors.md` with the new rule.

## Prohibited Patterns

- Do not manually list attributes in `observedAttributes` if they are in the schema.
- Do not use `any` for schema inference.
