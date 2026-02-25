# Migrate Request Behavior to Option B Pattern

## Goal
Complete migration of `request` behavior to Option B pattern with auto-extracted metadata.

## Context
- ✅ Schema and definition already updated
- ❌ `behavior.ts` still uses old constant names (`REQUEST_ATTRS.URL`)
- ❌ Needs bracket notation: `ATTRS["request-url"]`

## Requirements

### Update `behavior.ts`
Replace all attribute accesses:
```
REQUEST_ATTRS.URL → ATTRS["request-url"]
REQUEST_ATTRS.METHOD → ATTRS["request-method"]
REQUEST_ATTRS.TRIGGER → ATTRS["request-trigger"]
REQUEST_ATTRS.TARGET → ATTRS["request-target"]
REQUEST_ATTRS.SWAP → ATTRS["request-swap"]
REQUEST_ATTRS.INDICATOR → ATTRS["request-indicator"]
REQUEST_ATTRS.CONFIRM → ATTRS["request-confirm"]
REQUEST_ATTRS.PUSH_URL → ATTRS["request-push-url"]
REQUEST_ATTRS.VALS → ATTRS["request-vals"]
REQUEST_ATTRS.JSON_STRATEGY → ATTRS["request-json-strategy"]
```

Update command access:
```typescript
const { name, ATTRS, COMMANDS } = definition;
const command = COMMANDS;
```

### Update imports
```typescript
import definition from "./_behavior-definition";
const { name, ATTRS, COMMANDS } = definition;
```

## Success Criteria
- [ ] All `REQUEST_ATTRS.KEY` replaced with `ATTRS["request-key"]`
- [ ] Tests pass: `npm test -- registry/behaviors/request/behavior.test.ts`
- [ ] No imports from `constants.ts`

## Reference
- Working example: `registry/behaviors/reveal/behavior.ts`
