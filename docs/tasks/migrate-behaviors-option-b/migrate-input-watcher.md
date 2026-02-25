# Migrate Input-Watcher Behavior to Option B Pattern

## Goal
Migrate `input-watcher` behavior to use auto-extracted ATTRS with bracket notation.

## Requirements

### 1. Update `schema.ts`
Remove `INPUT_WATCHER_ATTRS` constant, use literal keys:
```typescript
export const schema = Type.Object({
  /** Selector or ID list of input elements to watch */
  "input-watcher-target": Type.Optional(Type.String({ description: "..." })),
  
  /** Format string with placeholders (e.g., "Value: {value}") */
  "input-watcher-format": Type.Optional(Type.String({ description: "..." })),
  
  /** Events to listen to (comma-separated, default: "input,change") */
  "input-watcher-events": Type.Optional(Type.String({ description: "..." })),
  
  /** Attribute to read from target (default: value property) */
  "input-watcher-attr": Type.Optional(Type.String({ description: "..." })),
});
```

### 2. Update `_behavior-definition.ts`
```typescript
const definition = uniqueBehaviorDef({
  name: "input-watcher",
  schema,
});
```

### 3. Update `behavior.ts`
Replace:
```
INPUT_WATCHER_ATTRS.TARGET → ATTRS["input-watcher-target"]
INPUT_WATCHER_ATTRS.FORMAT → ATTRS["input-watcher-format"]
INPUT_WATCHER_ATTRS.EVENTS → ATTRS["input-watcher-events"]
INPUT_WATCHER_ATTRS.ATTR → ATTRS["input-watcher-attr"]
```

## Success Criteria
- [ ] Schema uses literal keys
- [ ] Definition uses auto-extraction
- [ ] behavior.ts uses bracket notation
- [ ] Tests pass: `npm test -- registry/behaviors/input-watcher/behavior.test.ts`
