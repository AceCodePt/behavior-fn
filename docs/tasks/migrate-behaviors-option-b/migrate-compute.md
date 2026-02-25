# Migrate Compute Behavior to Option B Pattern

## Goal
Migrate `compute` behavior to use auto-extracted ATTRS with bracket notation.

## Requirements

### 1. Update `schema.ts`
Remove `COMPUTE_ATTRS` constant, use literal key:
```typescript
export const schema = Type.Object({
  /** Formula for computation (e.g., "a + b") */
  "compute-formula": Type.String(),
});
```

### 2. Update `_behavior-definition.ts`
```typescript
const definition = uniqueBehaviorDef({
  name: "compute",
  schema,
});
```

### 3. Update `behavior.ts`
Replace:
```
COMPUTE_ATTRS.FORMULA → ATTRS["compute-formula"]
```

## Success Criteria
- [ ] Schema uses literal key
- [ ] Definition uses auto-extraction
- [ ] behavior.ts uses bracket notation
- [ ] Tests pass: `npm test -- registry/behaviors/compute/behavior.test.ts`
