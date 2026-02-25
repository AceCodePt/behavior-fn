# Migrate Content-Setter Behavior to Option B Pattern

## Goal
Migrate `content-setter` behavior to use auto-extracted ATTRS and COMMANDS with bracket notation.

## Requirements

### 1. Update `schema.ts`
Remove `CONTENT_SETTER_ATTRS` constant, use literal keys:
```typescript
export const schema = Type.Object({
  /** The attribute to modify. Use "textContent" for text content updates. */
  "content-setter-attribute": Type.String(),
  
  /** The value to set on the target */
  "content-setter-value": Type.String(),
  
  /** How to apply the value: "set" (default), "toggle", or "remove" */
  "content-setter-mode": Type.Optional(
    Type.Union([
      Type.Literal("set"),
      Type.Literal("toggle"),
      Type.Literal("remove"),
    ]),
  ),
});
```

### 2. Update `_behavior-definition.ts`
```typescript
const definition = uniqueBehaviorDef({
  name: "content-setter",
  schema,
  command: {
    "--set-content": "--set-content",
  },
});
```

### 3. Update `behavior.ts`
Replace attributes:
```
CONTENT_SETTER_ATTRS.ATTRIBUTE → ATTRS["content-setter-attribute"]
CONTENT_SETTER_ATTRS.VALUE → ATTRS["content-setter-value"]
CONTENT_SETTER_ATTRS.MODE → ATTRS["content-setter-mode"]
```

Replace commands:
```
CONTENT_SETTER_COMMANDS["--set-content"] → COMMANDS["--set-content"]
```

## Success Criteria
- [ ] Schema uses literal keys
- [ ] Definition uses auto-extraction
- [ ] behavior.ts uses bracket notation for ATTRS and COMMANDS
- [ ] Tests pass: `npm test -- registry/behaviors/content-setter/behavior.test.ts`
