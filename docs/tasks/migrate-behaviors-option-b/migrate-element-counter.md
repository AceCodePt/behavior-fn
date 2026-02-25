# Migrate Element-Counter Behavior to Option B Pattern

## Goal
Migrate `element-counter` behavior to use auto-extracted ATTRS with bracket notation.

## Context
- ✅ Schema migrated to literal keys
- ✅ Definition cleaned up
- ✅ `behavior.ts` uses bracket notation
- ⚠️ `behavior.test.ts` partially migrated

## Status
**Behavior Code:** ✅ Complete  
**Test File:** ⚠️ Needs Completion

## Requirements

### Update `behavior.test.ts`

**Verify import is correct:**
```typescript
import definition from "./_behavior-definition";
const { name, ATTRS } = definition;
```

**Ensure ALL attribute usages use bracket notation:**
```typescript
// Replace any remaining:
ELEMENT_COUNTER_ATTRS.ROOT → ATTRS["element-counter-root"]
ELEMENT_COUNTER_ATTRS.SELECTOR → ATTRS["element-counter-selector"]
```

**Check for old imports:**
```bash
grep -n "ELEMENT_COUNTER_ATTRS" behavior.test.ts
```

## Success Criteria
- [ ] No imports from `./schema` for constants
- [ ] All attribute accesses use bracket notation
- [ ] All 2 tests pass: `npm test -- registry/behaviors/element-counter/behavior.test.ts`

## Reference
- Working example: `registry/behaviors/reveal/behavior.test.ts`
- Working example: `registry/behaviors/logger/behavior.test.ts`
