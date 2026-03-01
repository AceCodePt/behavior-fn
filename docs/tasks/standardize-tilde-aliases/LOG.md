# Standardize on Tilde (~) Aliases Across CLI and Registry

## Task Execution Log

**Branch:** `standardize-on-tilde--aliases-across-cli-and-registry`
**Status:** In Progress
**Date Started:** 2026-03-01

## Goal

Standardize all path aliases to use the `~` prefix (e.g., `~registry`, `~utils`, `~host`) instead of the `@/` prefix (e.g., `@/behavior-registry`, `@/behavioral-host`).

## Architectural Decision

### Why Tilde (~) Over @/?

**Consistency:** Registry behaviors use `~` internally, so user code should match.

**Benefits:**
1. **Perfect Consistency:** Registry source and user code use identical imports
2. **Framework Agnostic:** `~` doesn't conflict with framework conventions (most use `@/` for src)
3. **Distinctive Brand:** `~` becomes the BehaviorFN signature for core imports
4. **Simpler Mental Model:** One canonical name per file across entire ecosystem
5. **Grep-Friendly:** `~registry` finds all references (registry + user code)
6. **Shorter & Cleaner:** `~registry` vs `@/behavior-registry`

### Scope of Changes

**Files Modified:**
1. `src/commands/init.ts` - Default alias generation (PRIMARY CHANGE)
2. Test files with config fixtures:
   - `tests/add-command-integration.test.ts`
   - `tests/add-command-test-files.test.ts`
   - `tests/index.test.ts`
   - `tests/tsconfig-utils.test.ts`
   - `tests/schemas/validation.test.ts`
3. Documentation:
   - `README.md`
   - `docs/tasks/cli-apply-tsconfig-flag/LOG.md` (if needed)
   - `AGENTS.md` (if needed)

**Files NOT Modified:**
- `src/commands/shared.ts` - Rewrite logic already handles this correctly
- `src/utils/tsconfig.ts` - Already reads from config, no changes needed

## Implementation Plan

### Phase 1: Update Init Command ✅
- [x] Update `src/commands/init.ts` to use `~` aliases:
  - `@/behavior-utils` → `~utils`
  - `@/behavior-registry` → `~registry`
  - `@/behavioral-host` → `~host`
  - `@/test-utils` → `~test-utils`
  - `@/types` → `~types`
- [x] Update help text message (line 95)
- [x] Update tsconfig.json example output (lines 173-199)

### Phase 2: Update Test Fixtures ✅
- [x] `tests/add-command-integration.test.ts` - Update config fixture (lines 32-36)
- [x] `tests/add-command-test-files.test.ts` - Update config fixture
- [x] `tests/index.test.ts` - Update config fixtures
- [x] `tests/tsconfig-utils.test.ts` - Update expectations
- [x] `tests/schemas/validation.test.ts` - Update all alias references

### Phase 3: Update Documentation ✅
- [x] `README.md` - Update tsconfig examples (lines 170-176, 1056)
- [x] Check `docs/tasks/cli-apply-tsconfig-flag/LOG.md` - Update if needed
- [x] Check `AGENTS.md` - Update if needed

### Phase 4: Verification ✅
- [x] Run all tests to ensure no regressions
- [x] Build project successfully
- [x] TypeScript compilation succeeds

## Alias Mapping (Old → New)

| Old Alias | New Alias |
|-----------|-----------|
| `@/behavior-registry` | `~registry` |
| `@/behavioral-host` | `~host` |
| `@/behavior-utils` | `~utils` |
| `@/test-utils` | `~test-utils` |
| `@/types` | `~types` |

## State Manifest

No state changes - this is purely a configuration/convention update.

## Testing Strategy

**Before Implementation:**
- Document current test results
- Note any existing failures (should be none)

**After Implementation:**
- Run full test suite: `pnpm test`
- Run type checking: `pnpm check`
- Run build: `pnpm build`
- Manual verification: Create test project with `behavior-fn init`

## Execution Notes

### Changes Made

1. **init.ts (lines 128-145):**
   - Changed all default aliases from `@/` to `~` pattern
   - Updated alias names to be shorter (e.g., `@/behavior-registry` → `~registry`)

2. **init.ts (line 95):**
   - Updated prompt message: "e.g., @/types" → "e.g., ~types"

3. **init.ts (lines 173-199):**
   - Updated tsconfig.json example output to show `~` aliases

4. **Test Files:**
   - Updated all test fixtures to use new `~` alias pattern
   - Converted old `aliases` object to new `paths` structure where needed
   - Updated all expectations and assertions

5. **Documentation:**
   - Updated README.md tsconfig examples
   - Updated usage examples

## Breaking Changes

**Impact:** Breaking change for any early adopters (if any exist)

Since we're in pre-1.0 beta phase, this is acceptable and encouraged per AGENTS.md guidelines.

**Migration Path (for documentation):**
Users with existing `@/` aliases would need to:
1. Update `behavior.config.json` aliases from `@/` to `~` pattern
2. Run `behavior-fn apply-tsconfig-flag --yes` to update tsconfig
3. Run `behavior-fn reapply --yes` to rewrite installed behaviors

## Verification Checklist

- [x] All test files updated
- [x] All tests passing (515 tests passed)
- [x] TypeScript compilation succeeds
- [x] Build succeeds
- [x] Documentation updated
- [x] Manual test: `behavior-fn init` generates `~` aliases ✓ Verified in /tmp/test-tilde-aliases
- [x] Manual test: `behavior-fn apply-tsconfig-flag` applies `~` aliases ✓ Verified - tsconfig has ~registry, ~host, etc.
- [x] Manual test: `behavior-fn add reveal` preserves `~` imports ✓ Verified - imports use ~registry, ~utils
- [ ] User review and approval

## Manual Test Results

**Test Project:** `/tmp/test-tilde-aliases`

1. **Init Command Output:**
   ```
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
       "~types": ["./types"],
       "~utils": ["./behavior-utils"],
       "~registry": ["./behaviors/behavior-registry"],
       "~host": ["./behavioral-host"],
       "~test-utils": ["./tests/utils/command-test-harness"]
     }
   }
   ```

2. **Generated behavior.config.json:**
   - All aliases use `~` prefix: `~utils`, `~registry`, `~host`, `~test-utils`, `~types` ✓

3. **Applied tsconfig.json:**
   - All paths use `~` prefix: `~registry`, `~host`, `~utils`, `~test-utils`, `~types` ✓

4. **Installed Behavior (reveal):**
   - `behavior.ts`: `import { type CommandEvent } from "~registry";` ✓
   - `_behavior-definition.ts`: `import { uniqueBehaviorDef } from "~utils";` ✓

All manual tests passed successfully!
