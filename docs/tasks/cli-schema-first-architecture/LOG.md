# Migration Log: CLI to Schema-First Architecture (TypeBox)

**Branch**: `migrate-cli-to-schema-first-architecture-typebox`  
**Started**: 2026-02-27  
**Completed**: 2026-02-27  
**Status**: Complete

## Goal

Apply Schema-First Architecture principles to CLI internals by:
1. Replacing manual TypeScript interfaces with TypeBox schemas (SSOT)
2. Deriving types from schemas via `Static<typeof Schema>`
3. Adding runtime validation for all JSON file loading
4. Providing clear, actionable error messages on validation failures

## Context

Currently, the CLI uses manual TypeScript interfaces (`src/types/init.ts`, `src/types/registry.ts`) with no runtime validation. This violates our SSOT principle and creates a disconnect between what we teach users (schema-first) and what we practice internally.

## Architectural Decision

### Two Separate Validation Contexts

The CLI has **two completely separate validation contexts**:

1. **CLI Internal Validation (TypeBox - Always)**
   - Validates `behavior.config.json` structure
   - Validates `registry/behaviors-registry.json` structure
   - TypeBox is a devDependency - never shipped to users
   - User's validator choice is **irrelevant** for CLI internals

2. **User's Validator Choice (Zod/Valibot/etc)**
   - **Only** used for transforming behavior schemas
   - Example: `reveal/schema.ts` (TypeBox) → Zod (if user chose Zod)
   - Copied to user's project
   - CLI never uses user's validator for its own data

### Critical Distinction

**The user's validator choice ONLY affects behavior schemas, NOT CLI validation.**

Example flow:
```bash
$ behavior-fn init
✔ Which schema validator? › Zod

# This creates behavior.config.json:
{
  "validator": "zod",  # Just a STRING value
  "paths": { ... }
}

$ behavior-fn add reveal

# What happens:
# 1. CLI reads behavior.config.json (JSON file)
# 2. CLI validates it with TypeBox (NOT Zod!)
# 3. CLI reads the "validator" field value: "zod"
# 4. CLI transforms reveal/schema.ts from TypeBox → Zod
# 5. CLI copies Zod version to user's project
```

## Implementation Plan (PDSRTDD)

### Phase 1: Data & Schema (D + S)

**Create new schema files:**

1. **`src/schemas/config.ts`**
   - TypeBox schema for `behavior.config.json`
   - Type derived via `Static<typeof ConfigSchema>`
   - Replaces `src/types/init.ts` (manual interface)

2. **`src/schemas/registry.ts`**
   - TypeBox schema for `registry/behaviors-registry.json`
   - Types derived via `Static<typeof Schema>`
   - Replaces `src/types/registry.ts` (manual interfaces)

3. **`src/schemas/validation.ts`**
   - Reusable validation utilities
   - `validateJson<T>()` - validate in-memory data
   - `validateJsonFile<T>()` - load and validate JSON files
   - Clear error formatting with paths and messages

**Keep existing:**
- `src/types/schema.ts` - Generic JSON Schema types (unrelated to validation)

### Phase 2: Registry (R)

No registry changes needed - this is internal CLI refactoring.

### Phase 3: Tests (T)

**Create `src/schemas/validation.test.ts`:**
- Valid config acceptance
- Invalid validator rejection
- Missing required fields rejection
- Malformed JSON handling

**Update existing CLI tests:**
- Verify validation errors are clear and actionable
- Test migration path validation

### Phase 4: Development (DD)

**Update `index.ts`:**
1. Import schemas and validation helpers
2. Replace all `JSON.parse()` with `validateJsonFile()`
3. Update `loadConfig()` with validation
4. Update registry loading with validation
5. Remove manual `Config` interface (use exported type from schema)

**Update import statements:**
- Any file importing from deleted types → update to `src/schemas/*`

**Delete obsolete files:**
- `src/types/init.ts` → merged into `src/schemas/config.ts`
- `src/types/registry.ts` → moved to `src/schemas/registry.ts`

## State Manifest

### Config Schema (`behavior.config.json`)

| Attribute | Type | Source of Truth | Validation |
|-----------|------|-----------------|------------|
| `validator` | Union of literal strings | `validators` registry via `PackageName` | ConfigSchema |
| `paths.behaviors` | string | User input | ConfigSchema |
| `paths.utils` | string | User input | ConfigSchema |
| `paths.registry` | string | User input | ConfigSchema |
| `paths.testUtils` | string | User input | ConfigSchema |
| `paths.host` | string | User input | ConfigSchema |
| `paths.types` | string | User input | ConfigSchema |
| `aliases.utils` | string | User input | ConfigSchema |
| `aliases.registry` | string | User input | ConfigSchema |
| `aliases.testUtils` | string | User input | ConfigSchema |
| `aliases.host` | string | User input | ConfigSchema |
| `aliases.types` | string | User input | ConfigSchema |
| `optionalFiles.tests` | boolean? | User input | ConfigSchema |

### Registry Schema (`registry/behaviors-registry.json`)

| Attribute | Type | Source of Truth | Validation |
|-----------|------|-----------------|------------|
| `[].name` | string | Behavior directory name | BehaviorRegistrySchema |
| `[].files[].path` | string | File path relative to registry | BehaviorRegistrySchema |
| `[].dependencies` | string[]? | package.json names | BehaviorRegistrySchema |

## Benefits

1. **SSOT**: Types derived from schemas, no manual duplication
   - Validator options derived from `validators` registry via `createValidatorUnion()`
   - Validator detection uses `zodValidator.packageName` instead of hardcoded `"zod"` string
   - Add a new validator → schema automatically includes it, detection automatically works
2. **Runtime Safety**: Invalid configs caught early with clear errors
3. **Dogfooding**: We use the same schema-first pattern we teach users
4. **Better DX**: Clear validation errors instead of cryptic runtime errors
5. **Type Safety**: TypeScript types automatically stay in sync with schemas

## Breaking Changes

None. This is internal refactoring. The external CLI API remains identical.

## Error Message Improvement

**Before (Cryptic):**
```
TypeError: Cannot read property 'behaviors' of undefined
  at installBehavior (index.ts:152)
```

**After (Clear):**
```
❌ Invalid behavior.config.json:
  - /paths: Required property
  - /validator: Expected "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini", received "invalid-validator"
```

## Files Changed

### Created
- [x] `src/schemas/config.ts` (validator union derived from validators registry - SSOT)
- [x] `src/schemas/registry.ts`
- [x] `src/schemas/validation.ts`
- [x] `tests/schemas/validation.test.ts`

### Modified
- [x] `index.ts` (add validation to JSON loading)
- [x] `tests/index.test.ts` (updated test to verify schema validation)
- [x] `src/utils/detect-validator.ts` (removed hardcoded "zod" strings, use zodValidator.packageName instead)

### Deleted
- [x] `src/types/init.ts`
- [x] `src/types/registry.ts`

### Kept (No Changes)
- `src/types/schema.ts` (generic JSON Schema types)

## Testing Strategy

1. **Unit Tests**: Validate schema acceptance/rejection
2. **Integration Tests**: Test CLI commands with invalid configs
3. **Manual Testing**: Test all error paths with malformed configs

## Success Criteria

- [x] All CLI data structures use TypeBox schemas as SSOT
- [x] Types derived from schemas via `Static<typeof>`
- [x] All JSON loading validated via `Value.Check()`
- [x] Clear, actionable error messages on validation failures
- [x] No manual interface definitions for validated data
- [x] All existing tests pass (424 tests)
- [x] New validation tests added and passing (21 new tests)

## Notes

### Why TypeBox for CLI?

TypeBox is already a devDependency and it's the fastest validator. Since the CLI is build-time only, performance matters. Users never see this choice unless they explicitly select TypeBox as their behavior validator.

### Separation of Concerns

- **CLI schemas** (`src/schemas/*`) - validate CLI operations (never copied to users)
- **Behavior schemas** (`registry/behaviors/*/schema.ts`) - define behavior APIs (transformed to user's validator)

These are completely independent.

### Why Manual Registries Are Acceptable

**Investigated:** Auto-discovery from filesystem (Convention Over Configuration)

**Finding:** TypeScript requires compile-time knowledge for type inference:
```typescript
export type PackageName = (typeof validators)[number]["packageName"];
// ↑ Requires TypeScript to know array contents at compile time
```

**Attempted Solutions:**
1. **Dynamic imports** - ❌ Top-level await, no compile-time types
2. **Vite glob imports** - ❌ We use tsup, not Vite
3. **Codegen** - ✅ Possible but adds unnecessary build complexity

**Decision:** Accept manual registries as reasonable trade-off

**Rationale:**
- Validators and platforms change **rarely** (not weekly/daily)
- Manual registry is **explicit and clear**
- Small set (~5 validators, ~3 platforms)
- The registry IS the single source - everything derives from it
- No hardcoded duplicates exist elsewhere

**What IS SSOT-Compliant:**
✅ Validators/platforms registries - Single source, all code derives from them
✅ Config schema - Derives validator union from registry
✅ Validator detection - Uses `zodValidator.packageName`, not `"zod"`
✅ All types - Derived via `(typeof registry)[number]["property"]`

**What Would Violate SSOT:**
❌ Hardcoding validator names in multiple places (FIXED)
❌ Duplicating the list of validators (NONE found)
❌ Manual type definitions for validators (use derived types)

**Conclusion:** The manual registries ARE the single source of truth. Filesystem auto-discovery would sacrifice compile-time type safety with no meaningful benefit for our small, stable set of validators/platforms.
