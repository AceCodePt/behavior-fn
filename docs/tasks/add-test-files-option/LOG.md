# LOG: Add Test Files Import Option

**Task Type:** Enhancement (Progression)  
**Branch:** `add-test-files-import-option`  
**Date:** 2026-02-24

## Architectural Decision

### Problem Statement
Currently, `behavior-fn add` copies all behavior files including test files. Users want control over whether test files are included in their project.

### Solution Approach

This is a **CLI Enhancement** that modifies the `installBehavior` function and adds:
1. CLI flag parsing (`--tests`, `--no-tests`, `-t`)
2. Interactive prompt (default: Yes)
3. Config-based preference (`includeTests` in `behavior.json`)
4. File filtering logic in the installation process

### Why This Approach?

- **Backward Compatible:** Default includes tests (current behavior)
- **User Control:** Respects the shadcn/ui philosophy of "ask what affects code generation"
- **Minimal Changes:** Only modifies `index.ts` and config schema
- **No Breaking Changes:** Existing behaviors continue to work

## State Manifest

### 1. CLI Arguments
- **Source:** `process.argv` (parsed in `main()`)
- **State:**
  - `--tests` flag: boolean (explicit include)
  - `--no-tests` flag: boolean (explicit exclude)
  - `-t` flag: boolean (short form for `--tests`)
- **Validation:** Parse and validate flags before installation

### 2. Config File (`behavior.json`)
- **Source:** `behavior.json` loaded via `loadConfig()`
- **New Field:** `includeTests?: boolean`
- **Validation:** Optional field, defaults to `undefined`
- **Schema:**
```typescript
interface Config {
  paths: {
    behaviors: string;
    utils: string;
    registry: string;
    testUtils: string;
  };
  aliases: {
    utils: string;
    registry: string;
    testUtils: string;
  };
  includeTests?: boolean; // NEW: optional preference
}
```

### 3. Installation Decision State
- **Source:** Computed from flags > config > prompt
- **Type:** `boolean`
- **Logic:**
  1. If `--tests` flag present → `true`
  2. Else if `--no-tests` flag present → `false`
  3. Else if `config.includeTests` is defined → use config value
  4. Else prompt user (default: `true`)

### 4. File Filtering State
- **Source:** `behavior.files` from registry
- **Filter Logic:** Skip files matching `.test.ts` pattern when `includeTests === false`
- **Implementation:** Add conditional check in the file installation loop

## Implementation Plan

### Phase 1: Data & Schema (Contract)

1. **Update Config Interface** (lines 21-33 in `index.ts`)
   - Add `includeTests?: boolean` field to `Config` interface
   
2. **Document Config Schema**
   - Update any config-related documentation

### Phase 2: Test (Red)

1. **Create Test File** (`tests/add-command-tests.test.ts` or similar)
   - Test flag parsing
   - Test file filtering logic
   - Test config preference reading
   - Test CLI override behavior

2. **Test Cases:**
   - Default behavior (includes tests)
   - `--no-tests` flag (excludes tests)
   - `--tests` flag (includes tests)
   - `-t` flag (includes tests)
   - Config preference respected
   - CLI flags override config

### Phase 3: Develop (Green)

1. **Parse CLI Flags** (in `main()` function around line 351-353)
   ```typescript
   const args = process.argv.slice(2);
   const command = args[0];
   const behaviorName = args.find(arg => !arg.startsWith('-'));
   const flags = {
     tests: args.includes('--tests') || args.includes('-t'),
     noTests: args.includes('--no-tests'),
   };
   ```

2. **Resolve Include Tests Decision** (before calling `installBehavior`)
   ```typescript
   // Determine includeTests value
   let includeTests = true; // default
   
   if (flags.tests) {
     includeTests = true;
   } else if (flags.noTests) {
     includeTests = false;
   } else if (config.includeTests !== undefined) {
     includeTests = config.includeTests;
   } else {
     // Prompt user
     const response = await prompts({
       type: 'confirm',
       name: 'includeTests',
       message: 'Include test files? (Recommended for learning)',
       initial: true,
     });
     includeTests = response.includeTests ?? true;
   }
   ```

3. **Update `installBehavior` Function** (line 74)
   - Add `includeTests: boolean = true` parameter
   - Add file filtering logic in the installation loop (around line 96)
   ```typescript
   for (const file of behavior.files) {
     // Skip test files if not requested
     if (!includeTests && file.path.endsWith('.test.ts')) {
       console.log(`  Skipping ${file.path} (tests excluded)`);
       continue;
     }
     
     // ... existing installation logic ...
   }
   ```

4. **Update All `installBehavior` Calls**
   - Pass `includeTests` parameter from resolved decision

5. **Update Help Text** (around line 504-517)
   - Document `--tests`, `--no-tests`, and `-t` flags

## File Changes

### Modified Files
- `index.ts` - Main CLI logic
  - Config interface update
  - Flag parsing
  - Prompt logic
  - File filtering in `installBehavior`
  - Help text update

### Test Files (New)
- `tests/add-command-tests.test.ts` or similar
  - Unit tests for flag parsing
  - Integration tests for file filtering

### Documentation Updates
- CLI help text (in `index.ts`)
- Potentially `docs/guides/using-behaviors.md` (if exists)

## Testing Strategy

### Unit Tests
1. Test flag parsing logic
2. Test decision resolution (flags > config > prompt)
3. Test file filtering logic (`.test.ts` exclusion)

### Integration Tests
1. Test `behavior-fn add reveal` (includes tests by default)
2. Test `behavior-fn add reveal --no-tests` (excludes tests)
3. Test `behavior-fn add reveal --tests` (explicit include)
4. Test `behavior-fn add reveal -t` (short form)
5. Test config preference respected
6. Test CLI flag overrides config

### Edge Cases
1. Both `--tests` and `--no-tests` specified (last wins? or error?)
2. Invalid flag combinations
3. Prompt cancelled/interrupted

## Success Criteria

- [x] Config interface updated with `includeTests?: boolean`
- [x] CLI flags parsed correctly (`--tests`, `--no-tests`, `-t`)
- [x] Decision resolution logic works (flags > config > prompt)
- [x] File filtering excludes `.test.ts` files when `includeTests === false`
- [x] Default behavior includes tests (backward compatible)
- [x] All tests pass (186 tests, including 22 new tests)
- [x] Help text updated
- [x] No breaking changes to existing behaviors

## Notes

### Design Decisions

1. **Default to Yes**: Maintains backward compatibility and is learning-friendly
2. **Prompt Last**: Only prompt if no flag or config preference is set
3. **Simple Filtering**: Use `.endsWith('.test.ts')` for file detection
4. **Test Utilities**: NOT handling shared test utilities in this task (future enhancement)
5. **Flag Priority**: CLI flags override config preferences

### Deferred Features

1. **Test Utilities Management**: The `command-test-harness.ts` tracking/removal logic is explicitly out of scope for this task
2. **Separate Commands**: `add-utils` and `remove-utils` commands deferred
3. **Metadata Tracking**: No metadata file for tracking which behaviors have tests

### Risks & Mitigations

- **Risk**: Breaking existing installations
  - **Mitigation**: Default to `true` (current behavior)
  
- **Risk**: Users confused by prompt
  - **Mitigation**: Clear prompt message with "Recommended for learning" hint

- **Risk**: Test utilities orphaned
  - **Mitigation**: Acceptable for v1, document as known limitation

## Timeline

1. **Plan & Data**: 15 min ✓ (this document)
2. **Schema**: 5 min (update Config interface)
3. **Test**: 30 min (write failing tests)
4. **Develop**: 45 min (implement logic)
5. **Verify**: 15 min (run tests, check)

**Total Estimate**: ~2 hours

---

**Status**: 🔄 REFACTORING (No Backward Compatibility Constraint)  
**Implementation Time**: ~1.5 hours (initial) + refactor time

---

## REFACTOR: Production-First Approach

### Philosophy Shift
**From**: "Tests included by default, opt-out if you don't want them"  
**To**: "Tests are optional examples, opt-in if you want to learn"

### Key Changes
1. **Default**: `false` (no tests, lean and production-ready)
2. **No Prompt**: Flag or config only (CI/CD friendly)
3. **Simpler Flags**: Only `--with-tests` / `-t` (no `--no-tests`)
4. **Registry Metadata**: Explicit file categories (not string matching)
5. **Cleaner Config**: `optionalFiles.tests` (scalable for future)
6. **Silent Skips**: Only log what's installed, not what's skipped

---

**Status**: ✅ COMPLETED (v1)  
**Implementation Time**: ~1.5 hours

---

## Implementation Summary

### Changes Made

#### 1. Config Interface (index.ts, line 33)
Added optional `includeTests?: boolean` field to the Config interface to allow users to set a default preference in `behavior.json`.

#### 2. CLI Flag Parsing (index.ts, lines 359-366)
- Extracted behavior name correctly (handles flags in any position)
- Parse `--tests`, `--no-tests`, and `-t` flags
- Store in `flags` object for decision resolution

#### 3. Decision Resolution Logic (index.ts, lines 500-520)
Implements the priority: **flags > config > prompt > default**
- `--tests` flag → `true` (explicit include)
- `--no-tests` flag → `false` (explicit exclude)
- `config.includeTests` → use config value
- Prompt user (only for non-core behaviors) → default to `true`

#### 4. File Filtering (index.ts, lines 99-105)
Added check in installation loop:
```typescript
if (!includeTests && file.path.endsWith(".test.ts")) {
  console.log(`  Skipping ${file.path} (tests excluded)`);
  continue;
}
```

#### 5. Function Signature Update (index.ts, line 80)
Added `includeTests: boolean = true` parameter to `installBehavior()` function with backward-compatible default.

#### 6. Help Text (index.ts, lines 554-565)
Updated CLI help to document new flags:
```
  add <behavior-name> [options]
                         Add a specific behavior to your project

Options for 'add' command:
  --tests, -t            Include test files (explicit)
  --no-tests             Exclude test files (explicit)
```

### Tests Added

#### Unit Tests (tests/add-command-test-files.test.ts - 15 tests)
1. Config interface supports `includeTests` field
2. Flag parsing for `--tests`, `--no-tests`, `-t`
3. Decision resolution logic (flags > config > default)
4. File filtering by `.test.ts` extension
5. Edge cases (both flags present, explicit true in config)

#### Integration Tests (tests/add-command-integration.test.ts - 7 tests)
1. Installation without test files (config preference)
2. Installation with test files (config preference)
3. Default behavior (includes tests)
4. Multiple behaviors with different preferences
5. Flag precedence over config
6. Config usage when no flags

### Test Results
- **Before**: 164 tests passing
- **After**: 186 tests passing (+22 new tests)
- **All existing tests**: ✅ Still passing (backward compatible)

### Backward Compatibility
✅ **Maintained**
- Default behavior: Include tests (same as before)
- No changes to existing behaviors
- Config field is optional
- All existing tests pass

### Known Limitations (Deferred)
1. Test utilities (command-test-harness.ts) always installed if present
2. No metadata tracking for which behaviors have tests
3. No separate `add-utils` or `remove-utils` commands

These limitations are acceptable for v1 and can be addressed in future enhancements.

---

**Files Modified**: 1 (`index.ts`)  
**Files Added**: 2 (test files + LOG.md)  
**Tests Added**: 22  
**Breaking Changes**: None
