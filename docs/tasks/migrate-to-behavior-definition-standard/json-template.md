# Migrate json-template to Behavior Definition Standard

## Goal

Refactor the `json-template` behavior to fully adhere to the **Behavior Definition Standard** as defined in `docs/guides/behavior-definition-standard.md`.

## Context

The `json-template` behavior currently uses `ATTRS` (uppercase) instead of `attributes` (lowercase) as specified in the standard. This inconsistency reduces code clarity and violates the established pattern.

**Current Issues:**
- Uses `definition.ATTRS` instead of `definition.attributes`

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

Update all references from `ATTRS["json-template-for"]` to `attributes["json-template-for"]`.

### 2. Verification

- All tests must pass
- No type errors
- Code follows the exact pattern shown in `docs/guides/behavior-definition-standard.md`

## Success Criteria

- ✅ behavior.ts uses `attributes` instead of `ATTRS`
- ✅ All tests pass
- ✅ No type errors
- ✅ Code matches the standard pattern exactly
