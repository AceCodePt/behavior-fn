# Migrate Compound-Commands Behavior to Option B Pattern

## Goal
Migrate `compound-commands` behavior to use auto-extracted ATTRS with bracket notation.

## Requirements

### 1. Update `schema.ts`
Remove `COMPOUND_COMMANDS_ATTRS` constant, use literal keys:
```typescript
/**
 * Schema for compound-commands behavior.
 * 
 * This behavior adds compound command support to buttons using the Invoker Commands API.
 */
export const schema = Type.Object({
  /** Target element ID(s), comma-separated for multiple targets */
  "commandfor": Type.Optional(Type.String()),
  
  /** Command value(s), comma-separated for multiple commands */
  "command": Type.Optional(Type.String()),
});
```

### 2. Update `_behavior-definition.ts`
```typescript
const definition = uniqueBehaviorDef({
  name: "compound-commands",
  schema,
});
```

### 3. Update `behavior.ts`
Replace:
```
COMPOUND_COMMANDS_ATTRS.COMMANDFOR → ATTRS["commandfor"]
COMPOUND_COMMANDS_ATTRS.COMMAND → ATTRS["command"]
```

## Success Criteria
- [ ] Schema uses literal keys
- [ ] Definition uses auto-extraction
- [ ] behavior.ts uses bracket notation
- [ ] Tests pass: `npm test -- registry/behaviors/compound-commands/behavior.test.ts`
