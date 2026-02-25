# Migrate Content-Setter Behavior to Option B Pattern

## Goal
Migrate `content-setter` behavior to use auto-extracted ATTRS with bracket notation.

## Context
- ✅ Schema migrated to literal keys
- ✅ Definition cleaned up with commands
- ✅ `behavior.ts` uses bracket notation
- ❌ `behavior.test.ts` still imports old constants

## Status
**Behavior Code:** ✅ Complete  
**Test File:** ❌ Needs Migration

## Requirements

### Update `behavior.test.ts`

**Remove old import:**
```typescript
import { CONTENT_SETTER_ATTRS } from "./schema";
```

**Add to definition destructure:**
```typescript
import definition from "./_behavior-definition";
const { name, ATTRS, COMMANDS } = definition;
```

**Replace all test attribute accesses:**
```typescript
CONTENT_SETTER_ATTRS.ATTRIBUTE → ATTRS["content-setter-attribute"]
CONTENT_SETTER_ATTRS.VALUE → ATTRS["content-setter-value"]
CONTENT_SETTER_ATTRS.MODE → ATTRS["content-setter-mode"]
```

**Replace all test command accesses:**
```typescript
// If tests use command constants directly
CONTENT_SETTER_COMMANDS["--set-content"] → COMMANDS["--set-content"]
```

**Search pattern to verify:**
```bash
grep -n "CONTENT_SETTER_ATTRS\|CONTENT_SETTER_COMMANDS" behavior.test.ts
```

## Success Criteria
- [ ] No imports from `./schema` for constants
- [ ] All attribute accesses use bracket notation
- [ ] All command accesses use COMMANDS from definition
- [ ] All 12 tests pass: `npm test -- registry/behaviors/content-setter/behavior.test.ts`

## Reference
- Working example: `registry/behaviors/reveal/behavior.test.ts` (with commands)
- Working example: `registry/behaviors/logger/behavior.test.ts` (attributes only)
