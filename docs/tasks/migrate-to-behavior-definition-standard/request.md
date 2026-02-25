# Migrate request to Behavior Definition Standard

## Goal

Refactor the `request` behavior to fully adhere to the **Behavior Definition Standard** as defined in `docs/guides/behavior-definition-standard.md`.

## Context

The `request` behavior currently uses `ATTRS` and `COMMANDS` (uppercase) instead of `attributes` and `command` (lowercase) as specified in the standard. This inconsistency reduces code clarity and violates the established pattern.

**Current Issues:**
- Uses `definition.ATTRS` instead of `definition.attributes`
- Uses `definition.COMMANDS` instead of `definition.command`
- Tests use `ATTRS` instead of `attributes` (already extracting at module level, which is good)

## Requirements

### 1. Update behavior.ts

Replace:
```typescript
const { ATTRS, COMMANDS, name } = definition;
```

With:
```typescript
const { attributes, command, name } = definition;
```

Update all references:
- `ATTRS["request-url"]` → `attributes["request-url"]`
- `COMMANDS["--trigger"]` → `command["--trigger"]`
- `COMMANDS["--close-sse"]` → `command["--close-sse"]`
- Check for `COMMANDS` existence → check for `command` existence

### 2. Update behavior.test.ts

Replace:
```typescript
const { name, command, ATTRS } = definition;
```

With:
```typescript
const { name, attributes, command } = definition;
```

Update all references from `ATTRS[...]` to `attributes[...]`.

### 3. Verification

- All tests must pass
- No type errors
- Code follows the exact pattern shown in `docs/guides/behavior-definition-standard.md`

## Success Criteria

- ✅ behavior.ts uses `attributes` and `command` instead of `ATTRS` and `COMMANDS`
- ✅ behavior.test.ts uses `attributes` instead of `ATTRS`
- ✅ All tests pass
- ✅ No type errors
- ✅ Code matches the standard pattern exactly
