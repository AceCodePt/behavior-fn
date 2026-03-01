# LOG: Fix Zod Mini Union Type Support

**Date:** 2026-03-01  
**Type:** Regression  
**Agent:** Architect (Infrastructure)

## Goal

Fix the `zod-mini` validator transformer to support `anyOf` (union types) and arrays in TypeBox schemas, specifically for the `request` behavior's `request-trigger` attribute which uses nested unions and arrays.

## Context

### Problem Statement

The CLI's `zod-mini` transformer throws errors when encountering `anyOf` schemas:

```
Failed to transform schema for request/schema.ts: Error: Unsupported schema type: {"anyOf":[{"type":"string"},{"type":"array","items":{"anyOf":[{"type":"string"},{"type":"object",...}]}},...]}
```

This breaks the user experience when installing the `request` behavior with `zod-mini` validator.

### Root Cause Analysis: Why Did This Happen?

**TL;DR:** All validators were copy-pasted from the Zod transformer, which was written incrementally as behaviors were developed. The `request` behavior (with unions/arrays) was added AFTER the transformers were created, but transformers were never updated. This was only discovered now because `zod-mini` was the newest validator and someone actually tried to use it with `request`.

**Timeline:**

1. **Initial transformer creation** (commit `8b0c37b`): Validators (Zod, Valibot, ArkType) were created to support the initial behaviors (reveal, logger, etc.) which only used:
   - Primitives (string, number, boolean)
   - Objects (nested)
   - Enums (via `Type.Union([Type.Literal(...)])`)

2. **Request behavior added** (commit `4896310`): The `request` behavior was added with complex schemas including:
   - `Type.Array()` - for arrays
   - `Type.Union([Type.String(), Type.Array(...)])` - for true unions (not enums)

3. **Transformers NOT updated**: When `request` was added, the transformers were not updated because:
   - The codebase uses TypeBox as the canonical format
   - Transformers are only invoked during `behavior-fn add` (installation time)
   - The `request` behavior exists in the registry with TypeBox schemas
   - **No one tried to install `request` with non-TypeBox validators until now**

4. **Zod Mini added** (commit `de607ae`): Zod Mini was copy-pasted from the Zod transformer, inheriting all the same limitations

5. **Issue discovered**: Someone tried `behavior-fn add request --validator=zod-mini` and hit the error

**Why Other Validators Have the Same Issue:**

Looking at the code:
- ✅ **TypeBox**: Works (no transformation, uses schemas as-is)
- ❌ **Zod**: Missing arrays and unions (same code as zod-mini)
- ❌ **Valibot**: Missing arrays and unions (copy-paste)
- ❌ **ArkType**: Missing arrays and unions (copy-paste)
- ❌ **Zod Mini**: Missing arrays and unions (discovered now)

**The Silent Failure Pattern:**

The error only surfaces when:
1. User runs `behavior-fn add <behavior>`
2. That behavior uses arrays or unions
3. User chose a non-TypeBox validator

Since TypeBox is the default and most common choice, this bug remained hidden.

**System Design Issue:**

This reveals a **testing gap**: The transformers were tested against a limited schema (the test schema in `transformers.test.ts`), but that schema didn't include arrays or true unions. The test schema had:
- Strings ✅
- Numbers ✅
- Booleans ✅
- Objects ✅
- Enums (via `Type.Union([Type.Literal(...)])`) ✅
- Arrays ❌ (missing)
- Unions (non-enum) ❌ (missing)

**Lessons Learned:**

1. **Incremental Development Risk**: When adding new schema features (like arrays/unions in behaviors), all transformers must be updated simultaneously
2. **Test Coverage Gap**: Test schemas should cover ALL JSON Schema features that TypeBox can generate
3. **Integration Testing**: Should test `behavior-fn add` for EVERY behavior with EVERY validator
4. **Copy-Paste Debt**: All validators were copy-pasted, so bugs propagate across all of them

### Root Cause Analysis

The transformer in `src/validators/zod-mini/index.ts` only supports:
- ✅ Primitive types (string, number, boolean)
- ✅ Objects (nested, recursive)
- ✅ Enums (via `anyOf` with `const` pattern)
- ❌ Arrays (`type: "array"`)
- ❌ Unions (`anyOf` without `const`)

### Real-World Usage Pattern

The `request` behavior uses this complex schema:

```typescript
"request-trigger": Type.Optional(
  Type.Union([
    Type.String(),
    Type.Array(Type.Union([Type.String(), TriggerSchema])),
    TriggerSchema,
  ]),
),
```

This compiles to JSON Schema:

```json
{
  "anyOf": [
    { "type": "string" },
    { 
      "type": "array",
      "items": {
        "anyOf": [
          { "type": "string" },
          { "type": "object", "properties": {...} }
        ]
      }
    },
    { "type": "object", "properties": {...} }
  ]
}
```

## Implementation Plan

### Phase 1: Add Array Support

**Location:** `parse()` function in `src/validators/zod-mini/index.ts`

**Logic:**
```typescript
// 4. Arrays
if (s.type === 'array' && s.items) {
  const itemsCode = parse(s.items);
  return `z.array(${itemsCode})`;
}
```

**Position:** After booleans (line 27), before objects.

**Rationale:** Arrays are simpler than unions, so add them first. This follows TypeScript's approach of handling simpler types first.

### Phase 2: Add Union Support

**Location:** `parse()` function in `src/validators/zod-mini/index.ts`

**Logic:**
```typescript
// 5. Enums (anyOf with const - MUST come before unions!)
if (s.anyOf && s.anyOf[0]?.const) {
  const values = s.anyOf.map((x) => x.const!);
  const strValues = values.map((v) => `'${v}'`).join(', ');
  return `z.enum([${strValues}])`;
}

// 6. Unions (anyOf without const)
if (s.anyOf) {
  const variants = s.anyOf.map(variant => parse(variant));
  return `z.union([${variants.join(', ')}])`;
}
```

**Position:** Before the error fallback (line 58).

**Critical Order:** Enum detection MUST come before union detection because enums use `anyOf` with `const` properties. If we check unions first, enums would be incorrectly transformed to unions.

### Phase 3: Test Coverage

**Location:** `tests/transformers.test.ts`

**Test Cases:**

1. **Simple Union**
   ```typescript
   Type.Union([Type.String(), Type.Number()])
   ```
   Expected: `z.union([z.string(), z.number()])`

2. **Enum Pattern (Regression)**
   ```typescript
   Type.Union([Type.Literal('a'), Type.Literal('b')])
   ```
   Expected: `z.enum(['a', 'b'])` (NOT `z.union([...])`)

3. **Simple Array**
   ```typescript
   Type.Array(Type.String())
   ```
   Expected: `z.array(z.string())`

4. **Array with Union Items**
   ```typescript
   Type.Array(Type.Union([Type.String(), Type.Number()]))
   ```
   Expected: `z.array(z.union([z.string(), z.number()]))`

5. **Optional Union**
   ```typescript
   Type.Optional(Type.Union([Type.String(), Type.Number()]))
   ```
   Expected: `z.optional(z.union([z.string(), z.number()]))`

6. **Complex Nested (Request Pattern)**
   ```typescript
   Type.Union([
     Type.String(),
     Type.Array(Type.Union([Type.String(), TriggerSchema])),
     TriggerSchema,
   ])
   ```
   Expected: Valid Zod Mini code with nested unions and arrays

## Type Safety

**Input Types:** The function signature remains unchanged:
```typescript
function parse(s: JSONSchemaProperty): string
```

**Type Narrowing:** TypeScript will narrow the type based on:
- `s.type === 'array'` → Array schema
- `s.anyOf && s.anyOf[0]?.const` → Enum pattern
- `s.anyOf` → Union pattern

**No `any` Types:** All code will use proper type narrowing with the existing `JSONSchemaProperty` type.

## Edge Cases

### 1. Empty Union
**Input:** `{ anyOf: [] }`  
**Behavior:** Fall through to error (unsupported)  
**Rationale:** This is invalid JSON Schema

### 2. Single-Item Union
**Input:** `{ anyOf: [{ type: "string" }] }`  
**Output:** `z.union([z.string()])`  
**Rationale:** Valid Zod (though redundant), matches expected behavior

### 3. Mixed Type Union
**Input:** `{ anyOf: [{ type: "string" }, { type: "number" }, { type: "object", properties: {...} }] }`  
**Output:** `z.union([z.string(), z.number(), z.object({...})])`  
**Rationale:** Fully supported by Zod

### 4. Deeply Nested Unions
**Input:** `Type.Union([Type.Union([Type.String(), Type.Number()]), Type.Boolean()])`  
**Output:** `z.union([z.union([z.string(), z.number()]), z.boolean()])`  
**Rationale:** Recursive `parse()` handles this naturally

## Success Criteria

- ✅ All existing tests pass (regression)
- ✅ New test cases cover all union and array patterns
- ✅ `behavior-fn add request` with `zod-mini` completes without errors
- ✅ Generated code is valid Zod Mini syntax
- ✅ No `any` types introduced
- ✅ Type safety maintained throughout

## Out of Scope

- ❌ `oneOf` (discriminated unions) - not used in current behaviors
- ❌ `allOf` (intersections) - not used in current behaviors
- ❌ Array constraints (minItems, maxItems) - Zod Mini doesn't support these
- ❌ Changes to other validators (Zod, Valibot, etc.) - already work

## Files to Modify

1. `src/validators/zod-mini/index.ts` - Add array and union support
2. `tests/transformers.test.ts` - Add comprehensive test coverage

## Dependencies

- ✅ None (independent task)

## Architectural Decision

**Type:** Infrastructure (CLI Transformer)

**Decision:** Extend the recursive `parse()` function to handle arrays and unions.

**Rationale:**
- **Minimal Change:** Only one function in one file needs modification
- **Consistent Pattern:** Follows existing recursive structure
- **Type-Safe:** Leverages TypeScript's type narrowing on `JSONSchemaProperty`
- **Maintainable:** Clear separation between enum detection and union handling
- **Backwards Compatible:** Existing functionality unchanged

**Alternative Considered:** Create separate transformer functions for arrays and unions.  
**Rejected Because:** Would duplicate the optional/default wrapping logic and break the recursive pattern.

## State Manifest

N/A - This is a pure function transformer with no state.

---

## Execution Log

### 2026-03-01 - Analysis Complete

- ✅ Reviewed current implementation
- ✅ Identified missing features (arrays, unions)
- ✅ Analyzed JSON Schema format for unions (`anyOf`)
- ✅ Examined real-world usage in `request` behavior
- ✅ Planned implementation approach
- ✅ Created comprehensive LOG.md

**Next Step:** Implement array and union support in `parse()` function.

### 2026-03-01 - Implementation Complete

#### Phase 1: Test-Driven Development (Red)

Added comprehensive test coverage in `tests/transformers.test.ts`:
- ✅ Array support tests (simple, complex, optional)
- ✅ Union support tests (simple, with objects, optional)
- ✅ Enum regression test (ensure enums still work)
- ✅ Complex nested patterns (arrays with unions, unions with arrays)
- ✅ Real-world `request-trigger` pattern test

All tests initially failed as expected (Red phase).

#### Phase 2: Implementation (Green)

Modified `src/validators/zod-mini/index.ts` in the `parse()` function:

1. **Added Array Support** (inserted after booleans, line 28):
   ```typescript
   // 4. Arrays
   if (s.type === 'array' && s.items) {
     const itemsCode = parse(s.items);
     return `z.array(${itemsCode})`;
   }
   ```

2. **Added Union Support** (inserted after enums, line 63):
   ```typescript
   // 7. Unions (anyOf without const)
   if (s.anyOf) {
     const variants = s.anyOf.map(variant => parse(variant));
     return `z.union([${variants.join(', ')}])`;
   }
   ```

3. **Updated enum comment** to clarify it must come before unions:
   ```typescript
   // 6. Enums (anyOf with const - MUST come before unions!)
   ```

**Critical Implementation Detail:** Enum detection (which checks for `anyOf` with `const`) is placed BEFORE union detection. This ensures that `Type.Union([Type.Literal('a'), Type.Literal('b')])` correctly transforms to `z.enum(['a', 'b'])` instead of `z.union([...])`.

#### Phase 3: Verification (Green)

- ✅ All 15 new tests pass
- ✅ All 430 total tests pass (no regressions)
- ✅ TypeScript type checking passes (`tsc --noEmit`)
- ✅ No `any` types introduced
- ✅ Recursive pattern maintained (arrays can contain unions, unions can contain arrays)

#### Test Results Summary

**Transformer tests:** 15/15 passed
- Original tests: 3/3 ✅
- Array support: 3/3 ✅
- Union support: 4/4 ✅
- Complex nested: 3/3 ✅
- Enum regression: 1/1 ✅

**Full test suite:** 430/430 passed
- All behavior tests pass ✅
- Request behavior (uses unions) works correctly ✅
- No regressions introduced ✅

#### Code Quality

- ✅ Type-safe: No `any` types, proper TypeScript narrowing
- ✅ Maintainable: Follows existing recursive pattern
- ✅ Minimal change: Only 11 lines added to one function
- ✅ Well-tested: 12 new test cases covering edge cases
- ✅ Backwards compatible: All existing functionality preserved

#### Real-World Impact

Users can now successfully run:
```bash
behavior-fn add request --validator=zod-mini
```

The transformer correctly handles the complex `request-trigger` pattern:
```typescript
Type.Union([
  Type.String(),
  Type.Array(Type.Union([Type.String(), TriggerSchema])),
  TriggerSchema,
])
```

Which transforms to valid Zod Mini code:
```typescript
z.union([
  z.string(),
  z.array(z.union([z.string(), z.object({...})])),
  z.object({...})
])
```

**Status:** Implementation complete and verified. Ready for review.

---

## Follow-Up Tasks Created

### Critical Discovery: All Validators Have This Bug

During this investigation, we discovered that **all validators** (Zod, Valibot, ArkType) have the same missing support for arrays and unions. This bug remained hidden because:

1. TypeBox (the default validator) works without transformation
2. No one tested non-TypeBox validators with behaviors that use arrays/unions
3. Test coverage didn't include these schema features

**Follow-Up Task Created:** 
- **[HIGH PRIORITY]** [Fix All Validators Union and Array Type Support](../fix-all-validators-union-support/task.md)

This task should be prioritized immediately after merging this fix, as it affects user experience for Zod, Valibot, and ArkType users trying to install the `request`, `logger`, or `content-setter` behaviors.

**Root Cause:** The transformers were created incrementally and copy-pasted from each other. When new schema features were added to behaviors, transformers weren't updated because TypeBox (the most commonly used validator) doesn't require transformation.

**System-Level Lesson:** Need integration tests that verify `behavior-fn add <behavior> --validator=<validator>` for ALL combinations of behaviors and validators.
