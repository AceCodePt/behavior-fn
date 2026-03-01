# Fix Zod Mini Imports Mismatch in getObservedAttributes

**Status:** Todo  
**Type:** Regression (Bug Fix)  
**Priority:** High  
**Agent:** Infrastructure

## Goal

Fix the import mismatch in `ZodMiniValidator` where `getObservedAttributesCode()` and `getUtilsImports()` import from `"zod"` but schema files import from `"zod/mini"`, causing `instanceof z.ZodObject` checks to fail at runtime.

## Context

**The Bug:**

When a user installs behaviors using `zod-mini`, the CLI transforms code as follows:

1. **Schema files** (`schema.ts`): `import * as z from "zod/mini"`
2. **Utils file** (`behavior-utils.ts`): `import { z } from "zod"` ❌
3. **Types file** (`types.ts`): `import { z } from "zod"` ❌

This creates a runtime mismatch:
- Schema objects are instances of `z.ZodObject` from `"zod/mini"`
- `getObservedAttributes()` checks `schema instanceof z.ZodObject` where `z` is from `"zod"`
- Since these are different constructor functions, `instanceof` returns `false`
- Result: `getObservedAttributes()` returns `[]` instead of extracting attribute keys

**Root Cause:**

In `src/validators/zod-mini/index.ts`:
- `transformToZodMini()` correctly uses `import * as z from "zod/mini"` (line 96)
- `getUtilsImports()` incorrectly uses `import { z } from "zod"` (line 126) ❌
- `getTypesFileContent()` incorrectly uses `import { z } from "zod"` (line 131) ❌
- `getObservedAttributesCode()` checks `instanceof z.ZodObject` but `z` comes from wrong import ❌

**Expected Behavior:**

All Zod Mini imports should consistently use `"zod/mini"`:
```typescript
import * as z from "zod/mini";
```

## Success Criteria

- [ ] `ZodMiniValidator.getUtilsImports()` uses `import * as z from "zod/mini"`
- [ ] `ZodMiniValidator.getTypesFileContent()` uses `import * as z from "zod/mini"`
- [ ] `getObservedAttributes()` instanceof check works with zod-mini schemas
- [ ] All zod-mini imports are consistent across schema.ts, behavior-utils.ts, and types.ts
- [ ] Existing tests pass
- [ ] Manual verification: Install a behavior with zod-mini and verify `getObservedAttributes()` extracts keys correctly

## Implementation Notes

### Files to Modify

**Primary:**
- `src/validators/zod-mini/index.ts` (lines 125-127, 130-143)

### Changes Required

1. **Update `getUtilsImports()`** (line 125-127):
   ```typescript
   // ❌ Current
   getUtilsImports(): string {
     return `import { z } from "zod";`;
   }
   
   // ✅ Fixed
   getUtilsImports(): string {
     return `import * as z from "zod/mini";`;
   }
   ```

2. **Update `getTypesFileContent()`** (line 130-143):
   ```typescript
   // ❌ Current
   getTypesFileContent(): string {
     return `import { type StandardSchemaV1 } from "@standard-schema/spec";
   import { z } from "zod";
   
   // ✅ Fixed
   getTypesFileContent(): string {
     return `import { type StandardSchemaV1 } from "@standard-schema/spec";
   import * as z from "zod/mini";
   ```

3. **Verify `transformToZodMini()`** already correct (line 96):
   ```typescript
   // ✅ Already correct - no changes needed
   return `import * as z from "zod/mini";
   ```

### Why This Matters

**instanceof across module boundaries:**

```javascript
// zod/mini exports
export class ZodObject { ... }

// zod exports
export class ZodObject { ... }

// Even if they're the same class, they're different constructor functions!
miniSchema instanceof zodMini.ZodObject  // true
miniSchema instanceof zod.ZodObject      // false ❌
```

JavaScript `instanceof` checks if an object's prototype chain includes the constructor's prototype. When you import the same class from two different modules/paths, you get two different constructor functions with separate prototypes.

## Testing Strategy

1. **Unit Test** (if not already covered):
   - Create a test that uses zod-mini validator
   - Transform a schema with attributes
   - Call `getObservedAttributes()` on the transformed schema
   - Verify it returns attribute keys (not empty array)

2. **Integration Test**:
   - Run `behavior-fn init` with zod-mini in a test project
   - Add a behavior with multiple attributes
   - Verify `getObservedAttributes(definition.schema)` returns correct keys
   - Verify `defineBehavioralHost()` receives correct observedAttributes

3. **Manual Verification**:
   ```bash
   # In a test project
   pnpm dlx behavior-fn init
   # Select zod-mini when prompted
   
   pnpm dlx behavior-fn add reveal
   
   # Check generated files
   cat src/behaviors/behavior-utils.ts  # Should import from "zod/mini"
   cat src/behaviors/types.ts           # Should import from "zod/mini"
   cat src/behaviors/reveal/schema.ts   # Should import from "zod/mini"
   ```

## Verification Checklist

- [ ] All imports in zod-mini generated code use `"zod/mini"` consistently
- [ ] `instanceof z.ZodObject` check works with zod-mini schemas
- [ ] No mixing of `"zod"` and `"zod/mini"` imports in same file
- [ ] `getObservedAttributes()` returns correct keys for zod-mini schemas
- [ ] All existing tests pass
- [ ] Manual verification completed with test project

## References

- **Bug Report:** User reported `schema instanceof z.ZodObject` expected `ZodMiniObject` but received `z.ZodObject` from `"zod"`
- **Related Files:**
  - `src/validators/zod-mini/index.ts` (lines 115-143)
  - `src/validators/zod/index.ts` (comparison - correctly uses `"zod"` throughout)
- **Pattern:** Follow the same pattern as regular Zod validator, but with `"zod/mini"` consistently
