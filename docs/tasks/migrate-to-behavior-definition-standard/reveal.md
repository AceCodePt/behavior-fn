# Migrate reveal to Behavior Definition Standard

## Goal

Refactor the `reveal` behavior to fully adhere to the **Behavior Definition Standard** as defined in `docs/guides/behavior-definition-standard.md`.

## Context

The `reveal` behavior currently uses `ATTRS` and `COMMANDS` (uppercase) instead of `attributes` and `command` (lowercase) as specified in the standard. This inconsistency reduces code clarity and violates the established pattern.

**Current Issues:**
- Uses `definition.ATTRS` instead of `definition.attributes`
- Uses `definition.COMMANDS` instead of `definition.command`
- Tests use uppercase property names from the definition

## Requirements

### 1. Update behavior.ts

Replace:
```typescript
const { ATTRS, COMMANDS } = definition;
```

With:
```typescript
const { attributes, command } = definition;
```

Update all references:
- `ATTRS["reveal-delay"]` → `attributes["reveal-delay"]`
- `ATTRS["reveal-duration"]` → `attributes["reveal-duration"]`
- `ATTRS["reveal-anchor"]` → `attributes["reveal-anchor"]`
- `ATTRS["reveal-when-target"]` → `attributes["reveal-when-target"]`
- `ATTRS["reveal-when-attribute"]` → `attributes["reveal-when-attribute"]`
- `ATTRS["reveal-when-value"]` → `attributes["reveal-when-value"]`
- `COMMANDS["--show"]` → `command["--show"]`
- `COMMANDS["--hide"]` → `command["--hide"]`
- `COMMANDS["--toggle"]` → `command["--toggle"]`
- Check for `COMMANDS` existence → check for `command` existence

### 2. Update behavior.test.ts

The tests currently use `REVEAL_DEFINITION.command[...]` which is correct, but ensure consistency.

### 3. Verification

- All tests must pass
- No type errors
- Code follows the exact pattern shown in `docs/guides/behavior-definition-standard.md`

## Success Criteria

- ✅ behavior.ts uses `attributes` and `command` instead of `ATTRS` and `COMMANDS`
- ✅ All tests pass
- ✅ No type errors
- ✅ Code matches the standard pattern exactly
