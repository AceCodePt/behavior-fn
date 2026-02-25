# Migrate JSON-Template Behavior to Option B Pattern

## Goal
Migrate `json-template` behavior to use auto-extracted ATTRS with bracket notation.

## Requirements

### 1. Update `schema.ts`
Remove `JSON_TEMPLATE_ATTRS` constant, use literal key:
```typescript
export const schema = Type.Object({
  /** ID of the <script type="application/json"> element containing the data */
  "json-template-for": Type.String({ 
    description: "ID of the <script type='application/json'> element containing the data (like 'for' in label)" 
  }),
});
```

### 2. Update `_behavior-definition.ts`
```typescript
const definition = uniqueBehaviorDef({
  name: "json-template",
  schema,
});
```

### 3. Update `behavior.ts`
Replace:
```
JSON_TEMPLATE_ATTRS.FOR → ATTRS["json-template-for"]
```

## Success Criteria
- [ ] Schema uses literal key
- [ ] Definition uses auto-extraction
- [ ] behavior.ts uses bracket notation
- [ ] Tests pass: `npm test -- registry/behaviors/json-template/behavior.test.ts`
