# Migrate logger to Behavior Definition Standard

## Goal

Refactor the `logger` behavior to fully adhere to the **Behavior Definition Standard** as defined in `docs/guides/behavior-definition-standard.md`.

## Context

The `logger` behavior currently uses `ATTRS` (uppercase) instead of `attributes` (lowercase) as specified in the standard. Additionally, tests use `definition.ATTRS` directly instead of extracting at module level.

**Current Issues:**
- Uses `definition.ATTRS` instead of `definition.attributes`
- Tests use `definition.ATTRS[...]` directly inline instead of extracting at module level

## Requirements

### 1. Update behavior.ts

Replace:
```typescript
const { ATTRS } = definition;
```

With:
```typescript
const { attributes } = definition;
```

Update all references from `ATTRS["logger-trigger"]` to `attributes["logger-trigger"]`.

### 2. Update behavior.test.ts

Add module-level extraction at the top of the test file (after imports):
```typescript
const { name, attributes } = definition;
```

Replace all instances of `definition.ATTRS[...]` with `attributes[...]`.

### 3. Verification

- All tests must pass
- No type errors
- Code follows the exact pattern shown in `docs/guides/behavior-definition-standard.md`

## Success Criteria

- ✅ behavior.ts uses `attributes` instead of `ATTRS`
- ✅ behavior.test.ts extracts at module level
- ✅ All tests pass
- ✅ No type errors
- ✅ Code matches the standard pattern exactly
