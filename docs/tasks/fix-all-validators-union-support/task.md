# Task: Fix All Validators Union and Array Type Support

**Status:** `[ ]` Todo  
**Type:** Regression  
**Priority:** High  
**Agent:** Infrastructure

## Goal

Apply the same union and array support fix to **all validators** (Zod, Valibot, ArkType) that was just implemented for Zod Mini.

## Context

### Discovery

While fixing [Zod Mini union support](../fix-zod-mini-union-support/task.md), we discovered that **ALL validators have the same issue**:

- ❌ **Zod**: Missing arrays and unions
- ❌ **Valibot**: Missing arrays and unions  
- ❌ **ArkType**: Missing arrays and unions
- ✅ **Zod Mini**: Fixed in previous task
- ✅ **TypeBox**: No transformation needed (uses schemas as-is)

### Root Cause

The transformers were created incrementally and copy-pasted from each other. When the `request` behavior (which uses arrays and unions) was added, the transformers were never updated because:

1. TypeBox (the default) works without transformation
2. No one tested `behavior-fn add request` with other validators
3. Test coverage didn't include arrays and true unions

### Impact

**Current State:**
- Users installing `request`, `logger`, `content-setter`, or any behavior with unions/arrays will get cryptic errors if they use Zod, Valibot, or ArkType
- Only TypeBox and Zod Mini work correctly

**Affected Behaviors:**
- `request`: Uses `Type.Union()` and `Type.Array()` extensively
- `logger`: Uses `Type.Union()` for log levels
- `content-setter`: Uses `Type.Union()` for content types
- Any future behavior using these types

## Requirements

### Functional Requirements

1. ✅ Add array support to Zod transformer
2. ✅ Add union support to Zod transformer
3. ✅ Add array support to Valibot transformer
4. ✅ Add union support to Valibot transformer
5. ✅ Add array support to ArkType transformer
6. ✅ Add union support to ArkType transformer
7. ✅ Ensure enum detection still works (regression test)

### Technical Requirements

1. ✅ Update `parse()` function in each validator
2. ✅ Follow the same pattern as Zod Mini (arrays before objects, unions after enums)
3. ✅ Add comprehensive test coverage for each validator
4. ✅ Maintain type safety (no `any` types)

### Validator-Specific Syntax

#### Zod
```typescript
// Array
z.array(z.string())

// Union
z.union([z.string(), z.number()])

// Current enum (should not break)
z.enum(['a', 'b'])
```

#### Valibot
```typescript
// Array
v.array(v.string())

// Union
v.union([v.string(), v.number()])

// Current enum (should not break)
v.picklist(['a', 'b'])
```

#### ArkType
```typescript
// Array
"string[]"  // for simple types
type({ ... })  // for complex types in arrays (needs special handling)

// Union
"string | number"

// Current enum (should not break)
'a' | 'b'
```

**Note:** ArkType has a different syntax and may require more complex handling for arrays of objects.

## Implementation Plan

### Phase 1: Zod Transformer

1. Add array support (same as Zod Mini)
2. Add union support (same as Zod Mini)
3. Update tests

### Phase 2: Valibot Transformer

1. Add array support: `v.array(${parse(s.items)})`
2. Add union support: `v.union([${variants.join(', ')}])`
3. Update tests

### Phase 3: ArkType Transformer

1. Add array support:
   - Simple types: `"${parse(s.items)}[]"`
   - Complex types: May need special handling
2. Add union support: `${variants.join(' | ')}`
3. Update tests

**Challenge with ArkType:** Arrays of objects and complex nested types may require different syntax than primitive arrays.

## Test Coverage

For EACH validator, add tests for:

- ✅ Simple arrays: `Type.Array(Type.String())`
- ✅ Arrays with objects: `Type.Array(Type.Object({...}))`
- ✅ Optional arrays: `Type.Optional(Type.Array(...))`
- ✅ Simple unions: `Type.Union([Type.String(), Type.Number()])`
- ✅ Unions with objects: `Type.Union([Type.String(), Type.Object({...})])`
- ✅ Optional unions: `Type.Optional(Type.Union([...]))`
- ✅ Arrays with union items: `Type.Array(Type.Union([...]))`
- ✅ Unions with arrays: `Type.Union([Type.String(), Type.Array(...)])`
- ✅ Request-trigger pattern: Complex nested example
- ✅ Enum regression: Ensure `Type.Union([Type.Literal(...)])` still becomes enum

## Success Criteria

1. ✅ All validators can transform the `request` behavior schema
2. ✅ `behavior-fn add request --validator=zod` works
3. ✅ `behavior-fn add request --validator=valibot` works
4. ✅ `behavior-fn add request --validator=arktype` works
5. ✅ All existing tests pass (no regressions)
6. ✅ New test coverage for all validators
7. ✅ Type safety maintained

## Dependencies

- ✅ [Fix Zod Mini Union Support](../fix-zod-mini-union-support/task.md) - Completed (provides reference implementation)

## Out of Scope

- ❌ `oneOf` support (discriminated unions)
- ❌ `allOf` support (intersections)
- ❌ Array constraints (minItems, maxItems)
- ❌ Tuple support (`Type.Tuple()`)
- ❌ Other JSON Schema features not yet used in behaviors

## Related Files

- `src/validators/zod/index.ts` - Zod transformer
- `src/validators/valibot/index.ts` - Valibot transformer
- `src/validators/arktype/index.ts` - ArkType transformer
- `tests/transformers.test.ts` - Test suite (add tests for each validator)

## Architectural Decision

**Type:** Infrastructure (CLI Transformers)

**Decision:** Apply the same recursive pattern to all transformers, maintaining consistency across validators.

**Rationale:**
- **Consistency:** All transformers should support the same schema features
- **User Experience:** Users should be able to use any validator with any behavior
- **Maintainability:** Same pattern across all transformers makes future updates easier
- **Reference Implementation:** Zod Mini fix provides the pattern to follow

## Risk Assessment

**Low Risk:**
- Zod and Valibot: Direct translation, same pattern as Zod Mini
- All changes are additive (only adding cases, not modifying existing logic)
- Comprehensive test coverage will catch issues

**Medium Risk:**
- ArkType: Different syntax, may need special handling for complex nested structures
- Should test thoroughly with real-world schemas

## Testing Strategy

1. **Unit Tests:** Test each union/array pattern in isolation per validator
2. **Integration Tests:** Test full `request` schema transformation
3. **Regression Tests:** Run full test suite to ensure no breakage
4. **Manual Testing:** Try `behavior-fn add request` with each validator in a real project

## Follow-Up Tasks

After this is complete:

1. **[HIGH]** Add integration tests that test `behavior-fn add <behavior> --validator=<validator>` for ALL combinations
2. **[MEDIUM]** Audit all behaviors to ensure test coverage includes all schema features they use
3. **[LOW]** Document transformer implementation guide for future schema feature additions

---

## Protocol Checklist

- [ ] **Plan & Data**
  - [ ] Review Zod Mini implementation as reference
  - [ ] Identify validator-specific syntax differences
  - [ ] Plan ArkType special handling (if needed)
  - [ ] Create LOG.md
  - [ ] **STOP** - Wait for approval
- [ ] **Test**
  - [ ] Add test cases for Zod transformer
  - [ ] Add test cases for Valibot transformer  
  - [ ] Add test cases for ArkType transformer
  - [ ] Verify tests fail (Red)
- [ ] **Develop**
  - [ ] Implement Zod array and union support
  - [ ] Implement Valibot array and union support
  - [ ] Implement ArkType array and union support
  - [ ] Run tests until they pass (Green)
- [ ] **Verify**
  - [ ] Run full test suite
  - [ ] Type check with `tsc --noEmit`
  - [ ] Manual test: `behavior-fn add request --validator=zod`
  - [ ] Manual test: `behavior-fn add request --validator=valibot`
  - [ ] Manual test: `behavior-fn add request --validator=arktype`
- [ ] **Review**
  - [ ] Present changes to user
  - [ ] **STOP** - Wait for commit approval

## Prohibited Patterns

- ❌ **Do NOT** break existing enum detection
- ❌ **Do NOT** use `any` types
- ❌ **Do NOT** change validator package dependencies
- ❌ **Do NOT** modify public APIs
- ❌ **Do NOT** skip test coverage

## State Manifest

N/A - Pure function transformers with no state.
