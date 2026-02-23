# Type Safety Refactor - Execution Checklist

## Quick Reference

**Goal**: Eliminate all `any` types from production code using `AttributeSchema`  
**Key Insight**: Behavior schemas always represent HTML attributes (objects with string keys)  
**Scope**: Production code only (tests excluded)  
**Target**: 0 `any`, 0 `as any`, 0 `@ts-ignore` in production code

---

## Phase 1: Create Type Definitions ✅

### Files to Create

- [ ] `src/types/schema.ts`
  - [ ] `StringSchema` interface
  - [ ] `NumberSchema` interface
  - [ ] `BooleanSchema` interface
  - [ ] `EnumSchema` interface
  - [ ] `PropertySchema` type (union)
  - [ ] `AttributeSchema` interface
  - [ ] `BehaviorSchema` type alias

- [ ] `src/types/registry.ts`
  - [ ] `BehaviorFileMetadata` interface
  - [ ] `BehaviorMetadata` interface
  - [ ] `BehaviorRegistry` type

- [ ] `src/types/type-guards.ts`
  - [ ] `hasValue()` - DOM element type guard
  - [ ] `isFormElement()` - Event target type guard
  - [ ] `isAttributeSchema()` - Schema validation (if needed)

### Files to Update

- [ ] `src/strategies/validator-strategy.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update `transformSchema()` signature: `(schemaObject: AttributeSchema, ...)`

---

## Phase 2: Strategy & Transformer Layer ✅

### Strategy Implementations (5 files)

- [ ] `src/strategies/typebox-strategy.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update `transformSchema()` parameter type
  - [ ] Remove `as any` from lines 17-18
  - [ ] Use `schema.properties` directly

- [ ] `src/strategies/zod-strategy.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update `transformSchema()` parameter type

- [ ] `src/strategies/valibot-strategy.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update `transformSchema()` parameter type
  - [ ] Remove `as any` from lines 17-18

- [ ] `src/strategies/arktype-strategy.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update `transformSchema()` parameter type
  - [ ] Remove `as any` from line 22

- [ ] `src/strategies/zod-mini-strategy.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update `transformSchema()` parameter type

### Transformer Functions (5 files)

- [ ] `src/transformers/toZod.ts`
  - [ ] Import `AttributeSchema`, `PropertySchema`
  - [ ] Update `toZod()`: `(schema: AttributeSchema): string`
  - [ ] Update `parse()`: `(s: PropertySchema): string`
  - [ ] Remove `any` from line 25 map callback
  - [ ] Remove `any` from line 33 map callback

- [ ] `src/transformers/toValibot.ts`
  - [ ] Import `AttributeSchema`, `PropertySchema`
  - [ ] Update `toValibot()`: `(schema: AttributeSchema): string`
  - [ ] Update `parse()`: `(s: PropertySchema): string`
  - [ ] Remove `any` from map callbacks (lines 25, 33)

- [ ] `src/transformers/toTypeBox.ts`
  - [ ] Import `AttributeSchema`
  - [ ] Update signature: `(schemaFileContent: string, schema: AttributeSchema): string`

- [ ] `src/transformers/toArkType.ts`
  - [ ] Import `AttributeSchema`, `PropertySchema`
  - [ ] Update `toArkType()`: `(schema: AttributeSchema): string`
  - [ ] Update `parse()`: `(s: PropertySchema): string`
  - [ ] Remove `any` from map callbacks (lines 18, 24)

- [ ] `src/transformers/toZodMini.ts`
  - [ ] Import `AttributeSchema`, `PropertySchema`
  - [ ] Update `toZodMini()`: `(schema: AttributeSchema): string`
  - [ ] Update `parse()`: `(s: PropertySchema): string`
  - [ ] Remove `any` from line 25 map callback
  - [ ] Remove `any` from line 33 map callback

---

## Phase 3: CLI Layer ✅

- [ ] `index.ts`
  - [ ] Import `BehaviorMetadata` from `./src/types/registry`
  - [ ] Line 17: Type registry as `BehaviorMetadata[]`
  - [ ] Line 68: Remove `any` from find callback
  - [ ] Lines 121-123: Type jiti import result with proper interface

---

## Phase 4: Behavior Layer ✅

### DOM Element Access

- [ ] `registry/behaviors/input-watcher/behavior.ts`
  - [ ] Import `hasValue` type guard
  - [ ] Line 34: Replace `(el as any).value` with type guard:
    ```typescript
    if (hasValue(el)) {
      return el.value;
    }
    ```

### Event Target Handling

- [ ] `registry/behaviors/request/behavior.ts`
  - [ ] Import `isFormElement` type guard
  - [ ] Line 315: Replace `e.target as any` with type guard:
    ```typescript
    if (changed && isFormElement(e.target)) {
      const val = String(e.target.value);
      if (lastValues.get(e.target) === val) return;
      lastValues.set(e.target, val);
    }
    ```

### Constructor (Optional - Assess Complexity)

- [ ] `registry/behaviors/behavioral-host.ts`
  - [ ] Line 21: Assess if `...args: any[]` can be improved
  - [ ] If complex, document with comment explaining proxy pattern
  - [ ] If simple, use `unknown[]` or generic constraint

---

## Phase 5: Verification ✅

### Type Checking

- [ ] Run `pnpm check` - should pass with 0 errors
- [ ] Verify no new TypeScript errors
- [ ] Check autocomplete works in VSCode/editor

### Testing

- [ ] Run `pnpm test` - all tests should pass
- [ ] No regression in functionality
- [ ] Tests should not need modification

### Code Review

- [ ] Search for `any` in production code (excluding tests):
  ```bash
  rg "\bany\b" --type ts --glob '!*.test.ts' --glob '!tests/'
  ```
- [ ] Search for `as any` in production code:
  ```bash
  rg "as any" --type ts --glob '!*.test.ts' --glob '!tests/'
  ```
- [ ] Verify all occurrences eliminated

---

## Metrics Tracking

### Before
- ❌ Production code `any`: **~20 occurrences**
- ❌ Type assertions `as any`: **16 occurrences**
- ❌ TypeScript suppressions: **2 occurrences**

### After
- ✅ Production code `any`: **0 occurrences**
- ✅ Type assertions `as any`: **0 in production code**
- ✅ TypeScript suppressions: **0 in production code**

---

## Notes

- **Test files excluded**: No changes to `*.test.ts` files
- **Keep it simple**: AttributeSchema is always an object
- **Type guards over assertions**: Prefer `if (hasValue(el))` over `as any`
- **No runtime changes**: This is purely a type-level refactor
