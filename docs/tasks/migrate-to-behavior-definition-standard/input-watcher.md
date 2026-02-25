# Migrate input-watcher to Behavior Definition Standard

## Goal

Refactor the `input-watcher` behavior to fully adhere to the **Behavior Definition Standard** as defined in `docs/guides/behavior-definition-standard.md`.

## Context

The `input-watcher` behavior currently uses `ATTRS` (uppercase) instead of `attributes` (lowercase) as specified in the standard. This inconsistency reduces code clarity and violates the established pattern.

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

Update all references from `ATTRS["input-watcher-target"]` to `attributes["input-watcher-target"]` (and all other attribute references).

### 2. Verification

- All tests must pass
- No type errors
- Code follows the exact pattern shown in `docs/guides/behavior-definition-standard.md`

## Success Criteria

- ✅ behavior.ts uses `attributes` instead of `ATTRS`
- ✅ All tests pass
- ✅ No type errors
- ✅ Code matches the standard pattern exactly
