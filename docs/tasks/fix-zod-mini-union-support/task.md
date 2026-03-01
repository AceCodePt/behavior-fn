# Task: Fix Zod Mini Union Type Support

**Status:** `[ ]` Todo  
**Type:** Regression  
**Priority:** High  
**Agent:** Infrastructure

## Goal

Fix the `zod-mini` validator transformer to support `anyOf` (union types) in TypeBox schemas, specifically for the `request` behavior's `request-trigger` attribute.

## Context

The CLI's `zod-mini` validator transformer currently throws an error when encountering `anyOf` schemas:

```
Failed to transform schema for request/schema.ts: Error: Unsupported schema type: {"anyOf":[{"type":"string"},{"type":"array","items":{"anyOf":[{"type":"string"},{"type":"object",...}]}},...]}
```

This occurs because the transformer doesn't handle TypeBox's `Type.Union()` which compiles to JSON Schema's `anyOf`. The `request` behavior uses this pattern:

```typescript
"request-trigger": Type.Optional(
  Type.Union([
    Type.String(),
    Type.Array(Type.Union([Type.String(), TriggerSchema])),
    TriggerSchema,
  ]),
),
```

### Why This Matters

1. **Breaking User Experience:** Users installing the `request` behavior with `zod-mini` get a cryptic error and partial installation
2. **Feature Parity:** Other validators (Zod, Valibot, ArkType) support unions, so `zod-mini` should too
3. **Common Pattern:** Union types are a fundamental schema pattern used across behaviors

## Requirements

### Functional Requirements

1. ✅ Transform `anyOf` arrays to `z.union([...])` calls
2. ✅ Handle nested unions (e.g., arrays containing unions)
3. ✅ Handle optional unions (most common case)
4. ✅ Maintain type safety in generated code
5. ✅ Support all existing union patterns in the codebase

### Technical Requirements

1. ✅ Update `transformToZodMini()` in `src/validators/zod-mini/index.ts`
2. ✅ Add union parsing logic to the `parse()` helper
3. ✅ Handle array items that use `anyOf`
4. ✅ Add comprehensive test coverage in `tests/transformers.test.ts`

### Test Coverage

Must test:
- ✅ Simple union: `Type.Union([Type.String(), Type.Number()])`
- ✅ Optional union: `Type.Optional(Type.Union([...]))`
- ✅ Union with literals: `Type.Union([Type.Literal("a"), Type.Literal("b")])`
- ✅ Array of unions: `Type.Array(Type.Union([...]))`
- ✅ Nested unions: `Type.Union([Type.String(), Type.Union([...])])`
- ✅ Complex case: The exact `request-trigger` schema pattern

## Current Implementation Analysis

### Zod Mini Transformer Structure

The transformer in `src/validators/zod-mini/index.ts` has:
- `parse(s: JSONSchemaProperty)`: Recursive parser for individual schema properties
- `parseObject(s: JSONSchemaObject)`: Top-level object parser

Current supported types:
1. ✅ Strings (with minLength, maxLength, pattern)
2. ✅ Numbers (with minimum, maximum)
3. ✅ Booleans
4. ✅ Objects (nested, recursive)
5. ✅ Enums (via `enum` or `anyOf` with `const`)
6. ❌ Arrays (NOT IMPLEMENTED)
7. ❌ Unions (NOT IMPLEMENTED - except enum pattern)

### JSON Schema `anyOf` Format

TypeBox's `Type.Union()` compiles to:
```json
{
  "anyOf": [
    { "type": "string" },
    { "type": "number" }
  ]
}
```

Zod Mini equivalent:
```typescript
z.union([z.string(), z.number()])
```

### Edge Cases to Consider

1. **Empty unions:** `anyOf: []` (should error or return `z.never()`)
2. **Single-item unions:** `anyOf: [{ "type": "string" }]` (can unwrap)
3. **Mixed types:** Strings, numbers, objects, arrays in one union
4. **Nested unions:** Unions containing unions
5. **Optional unions:** `Type.Optional(Type.Union([...]))`

## Dependencies

- ❌ None (independent task)

## Success Criteria

1. ✅ `behavior-fn add request` with `zod-mini` completes without errors
2. ✅ Generated `schema.ts` contains valid `z.union()` calls
3. ✅ All existing behaviors still transform correctly
4. ✅ Test suite passes with 100% coverage for union scenarios
5. ✅ Error messages are clear for unsupported edge cases

## Out of Scope

- ❌ `oneOf` support (discriminated unions) - not used in current behaviors
- ❌ `allOf` support (intersections) - not used in current behaviors
- ❌ Other validators (Zod, Valibot, etc.) - already support unions

## Implementation Notes

### Suggested Approach

1. **Add Array Support First:** The `request-trigger` pattern requires array support
   ```typescript
   if (s.type === 'array' && s.items) {
     return `z.array(${parse(s.items)})`;
   }
   ```

2. **Add Union Support:** Check for `anyOf` before the enum check
   ```typescript
   if (s.anyOf && !s.anyOf[0]?.const) {
     const variants = s.anyOf.map(variant => parse(variant));
     return `z.union([${variants.join(', ')}])`;
   }
   ```

3. **Order Matters:** Check unions before enums (enums use `anyOf` with `const`)
   ```typescript
   // 1. Check for discriminated union (anyOf with const - this is an enum)
   if (s.anyOf && s.anyOf[0]?.const) {
     const values = s.anyOf.map(x => x.const);
     return `z.enum([${values.map(v => `'${v}'`).join(', ')}])`;
   }
   
   // 2. Check for regular union (anyOf without const)
   if (s.anyOf) {
     const variants = s.anyOf.map(variant => parse(variant));
     return `z.union([${variants.join(', ')}])`;
   }
   ```

### Testing Strategy

1. **Unit Tests:** Test each union pattern in isolation
2. **Integration Test:** Transform the full `request` schema
3. **Regression Test:** Ensure existing behaviors still work

## Related Files

- `src/validators/zod-mini/index.ts` - Main transformer
- `tests/transformers.test.ts` - Test suite
- `registry/behaviors/request/schema.ts` - Real-world usage

## References

- [Zod Union Documentation](https://zod.dev/?id=unions)
- [JSON Schema anyOf](https://json-schema.org/understanding-json-schema/reference/combining#anyof)
- [TypeBox Union](https://github.com/sinclairzx81/typebox#union)

---

## Protocol Checklist

- [ ] **Plan & Data (Handshake Phase)**
  - [ ] Read and understand the requirement
  - [ ] Analyze current zod-mini transformer implementation
  - [ ] Review JSON Schema `anyOf` format and Zod union API
  - [ ] Create LOG.md with implementation plan
  - [ ] **STOP** - Wait for approval
- [ ] **Schema & Registry**
  - [ ] N/A (internal CLI tooling)
- [ ] **Test**
  - [ ] Add test cases for simple unions
  - [ ] Add test cases for optional unions
  - [ ] Add test cases for arrays with unions
  - [ ] Add test cases for nested unions
  - [ ] Add integration test for `request` schema
  - [ ] Verify tests fail (Red)
- [ ] **Develop**
  - [ ] Add array support to `parse()`
  - [ ] Add union support to `parse()`
  - [ ] Ensure enum detection still works
  - [ ] Run tests until they pass (Green)
- [ ] **Verify**
  - [ ] Run `pnpm check` (type safety)
  - [ ] Run `pnpm test` (all tests pass)
  - [ ] Test `behavior-fn add request` with `zod-mini` in a real project
  - [ ] Verify generated code is valid
- [ ] **Review**
  - [ ] Present changes to user
  - [ ] **STOP** - Wait for commit approval

## Prohibited Patterns

- ❌ **Do NOT** break existing enum detection (check `const` first)
- ❌ **Do NOT** use `any` types in the transformer
- ❌ **Do NOT** add dependencies to `zod-mini` package
- ❌ **Do NOT** change the public API of the `Validator` interface
- ❌ **Do NOT** skip test coverage for edge cases

## State Manifest

N/A - This is a pure function transformer with no state.

## Architectural Decision

**Type:** Infrastructure (CLI Tooling)

**Decision:** Add union and array support to the Zod Mini transformer's recursive `parse()` function.

**Rationale:**
- Minimal change: Only affects one file (`zod-mini/index.ts`)
- Consistent pattern: Follows existing recursive parsing structure
- Type-safe: Leverages TypeScript's type narrowing
- Maintainable: Clear separation between enum detection and union handling
