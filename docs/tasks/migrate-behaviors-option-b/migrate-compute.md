# Migrate Compute Behavior to Option B Pattern

## Goal
Migrate `compute` behavior to use auto-extracted ATTRS with bracket notation.

## Context
- ✅ Schema migrated to literal keys  
- ✅ Definition cleaned up
- ✅ `behavior.ts` uses bracket notation
- ❌ `behavior.test.ts` still imports old constants

## Status
**Behavior Code:** ✅ Complete  
**Test File:** ❌ Needs Migration

## Requirements

### Update `behavior.test.ts`

**Remove old import:**
```typescript
import { COMPUTE_ATTRS } from "./schema";
```

**Add to definition destructure:**
```typescript
import definition from "./_behavior-definition";
const { name, ATTRS } = definition;
```

**Replace all test attribute accesses:**
```typescript
COMPUTE_ATTRS.FORMULA → ATTRS["compute-formula"]
```

**Search pattern to verify:**
```bash
grep -n "COMPUTE_ATTRS" behavior.test.ts
```

## Success Criteria
- [ ] No imports from `./schema` for constants
- [ ] All attribute accesses use bracket notation
- [ ] All 19 tests pass: `npm test -- registry/behaviors/compute/behavior.test.ts`

## Reference
- Working example: `registry/behaviors/reveal/behavior.test.ts`
- Working example: `registry/behaviors/logger/behavior.test.ts`
