# Migrate Request Behavior to Option B Pattern

## Goal
Complete migration of `request` behavior to Option B pattern with auto-extracted metadata.

## Context
- ✅ Schema and definition already updated
- ✅ `behavior.ts` migrated to bracket notation
- ❌ `behavior.test.ts` still imports old constants
- ❌ Test file needs to use `ATTRS` from definition

## Status
**Behavior Code:** ✅ Complete  
**Test File:** ❌ Needs Migration

## Requirements

### 1. Update `behavior.test.ts`

**Remove old import:**
```typescript
import { REQUEST_ATTRS } from "./schema";
```

**Add to definition destructure:**
```typescript
import definition from "./_behavior-definition";
const { name, ATTRS, COMMANDS } = definition;
```

**Replace all test attribute accesses:**
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

## Success Criteria
- [ ] Test file imports removed: No `import { REQUEST_ATTRS } from "./schema"`
- [ ] All test usages converted to bracket notation: `ATTRS["request-key"]`
- [ ] All 48 tests pass: `npm test -- registry/behaviors/request/behavior.test.ts`

## Reference
- Working example: `registry/behaviors/reveal/behavior.test.ts`
- Working example: `registry/behaviors/logger/behavior.test.ts`
