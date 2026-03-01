# Fix Zod Mini Imports Mismatch and Standardize on Named Imports

**Status:** Todo  
**Type:** Regression (Bug Fix)  
**Priority:** High  
**Agent:** Infrastructure

## Goal

Fix the import mismatch in `ZodMiniValidator` where utils/types import from `"zod"` but schema files import from `"zod/mini"`, causing `instanceof z.ZodObject` checks to fail at runtime. Additionally, standardize all Zod Mini imports to use named import style `{ z }` to match the regular Zod validator pattern.

## Context

**The Bug:**

When a user installs behaviors using `zod-mini`, the CLI transforms code as follows:

1. **Schema files** (`schema.ts`): `import { z } from "zod/mini"` (needs update from `* as z`)
2. **Utils file** (`behavior-utils.ts`): `import { z } from "zod"` ❌
3. **Types file** (`types.ts`): `import { z } from "zod"` ❌

This creates a runtime mismatch:
- Schema objects are instances of `z.ZodObject` from `"zod/mini"`
- `getObservedAttributes()` checks `schema instanceof z.ZodObject` where `z` is from `"zod"`
- Since these are different constructor functions, `instanceof` returns `false`
- Result: `getObservedAttributes()` returns `[]` instead of extracting attribute keys

**Root Cause:**

In `src/validators/zod-mini/index.ts`:
- `transformToZodMini()` uses `import * as z from "zod/mini"` (line 96) - needs update to named import
- `getUtilsImports()` incorrectly uses `import { z } from "zod"` (line 126) ❌
- `getTypesFileContent()` incorrectly uses `import { z } from "zod"` (line 131) ❌
- `getObservedAttributesCode()` checks `instanceof z.ZodObject` but `z` comes from wrong import ❌

**Expected Behavior:**

All Zod Mini imports should consistently use `"zod/mini"` with **named import** style (matching regular Zod):
```typescript
import { z } from "zod/mini";
```

**Consistency with Regular Zod:**

The regular `ZodValidator` already uses named imports correctly:
- Schema files: `import { z } from "zod";` ✅
- Utils/Types: `import { z } from "zod";` ✅

Zod Mini should follow the exact same pattern, just with `"zod/mini"` instead of `"zod"`.

## Success Criteria

- [ ] `ZodMiniValidator.transformToZodMini()` uses `import { z } from "zod/mini"` (named import)
- [ ] `ZodMiniValidator.getUtilsImports()` uses `import { z } from "zod/mini"` (named import)
- [ ] `ZodMiniValidator.getTypesFileContent()` uses `import { z } from "zod/mini"` (named import)
- [ ] `getObservedAttributes()` instanceof check works with zod-mini schemas
- [ ] All zod-mini imports use named import `{ z }` style consistently
- [ ] Existing tests pass
- [ ] Manual verification: Install a behavior with zod-mini and verify `getObservedAttributes()` extracts keys correctly

## Implementation Notes

### Files to Modify

**Primary:**
- `src/validators/zod-mini/index.ts` (lines 96, 125-127, 130-143)

**Reference (for consistency):**
- `src/validators/zod/index.ts` (already correct - uses named imports throughout)

### Changes Required

1. **Update `getUtilsImports()`** (line 125-127):
   ```typescript
   // ❌ Current
   getUtilsImports(): string {
     return `import { z } from "zod";`;
   }
   
   // ✅ Fixed
   getUtilsImports(): string {
     return `import { z } from "zod/mini";`;
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
   import { z } from "zod/mini";
   ```

3. **Update `transformToZodMini()`** (line 96):
   ```typescript
   // ❌ Current
   return `import * as z from "zod/mini";
   
   // ✅ Fixed
   return `import { z } from "zod/mini";
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
- **User Preference:** Use named imports `{ z }` style (not namespace `* as z`) for all Zod imports, regardless if it's regular Zod or Zod Mini
- **Related Files:**
  - `src/validators/zod-mini/index.ts` (lines 96, 115-143) - needs fixing
  - `src/validators/zod/index.ts` (line 102, 132) - reference pattern (already correct)
- **Pattern:** Follow the exact same pattern as regular Zod validator (named imports), but with `"zod/mini"` instead of `"zod"`
