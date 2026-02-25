# Migrate Element-Counter Behavior to Option B Pattern

## Goal
Migrate `element-counter` behavior to use auto-extracted ATTRS with bracket notation.

## Requirements

### 1. Update `schema.ts`
Remove `ELEMENT_COUNTER_ATTRS` constant, use literal keys:
```typescript
export const schema = Type.Object({
  /** Root element to search within (selector or "document") */
  "element-counter-root": Type.Optional(Type.String()),
  
  /** CSS selector for elements to count */
  "element-counter-selector": Type.Optional(Type.String()),
});
```

### 2. Update `_behavior-definition.ts`
```typescript
const definition = uniqueBehaviorDef({
  name: "element-counter",
  schema,
});
```

### 3. Update `behavior.ts`
Replace:
```
ELEMENT_COUNTER_ATTRS.ROOT → ATTRS["element-counter-root"]
ELEMENT_COUNTER_ATTRS.SELECTOR → ATTRS["element-counter-selector"]
```

## Success Criteria
- [ ] Schema uses literal keys
- [ ] Definition uses auto-extraction
- [ ] behavior.ts uses bracket notation
- [ ] Tests pass: `npm test -- registry/behaviors/element-counter/behavior.test.ts`
