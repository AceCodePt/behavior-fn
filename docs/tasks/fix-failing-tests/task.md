# Task: Fix Failing Tests

## Goal

Fix 4 failing tests in the test suite to ensure all tests pass and maintain project stability.

## Context

The test suite currently has 4 failing tests:

1. **tests/schemas/validation.test.ts**: `should return data for valid input` - The test expects `validateJson` to return data for valid input, but instead `process.exit` is being called. This indicates the validation logic is incorrectly treating valid input as invalid.

2. **tests/index.test.ts**: `should initialize configuration with "init" in interactive mode` - The test expects `writeFileSync` to be called to write the config file, but it's not being called (0 calls). This suggests the init flow is not completing properly.

3. **tests/index.test.ts**: `should add a behavior with "add"` - The test expects `writeFileSync` to be called to write behavior files, but it's not being called (0 calls). This indicates the add command is not executing the file write operations.

4. **tests/index.test.ts**: `should generate correct TypeBox files when TypeBox is selected` - The test expects `writeFileSync` to be called to write TypeBox types file, but it's not being called (0 calls). This suggests TypeBox-specific file generation is broken.

These failures suggest:
- Schema validation logic may have regressed or changed behavior
- File writing operations in the CLI commands may have been refactored without updating tests
- Mock setup may be incomplete or incorrect

## Requirements

- All 4 failing tests MUST pass
- Tests MUST verify actual behavior, not just mock setup
- Fixes MUST not break any currently passing tests (467 tests)
- Root cause of each failure MUST be identified and documented
- If tests are outdated due to refactoring, they MUST be updated to match current implementation
- If implementation is broken, it MUST be fixed to match expected behavior
- Type safety MUST be maintained throughout all fixes

## Definition of Done

- [ ] `tests/schemas/validation.test.ts` - "should return data for valid input" test passes
- [ ] `tests/index.test.ts` - "should initialize configuration with init in interactive mode" test passes
- [ ] `tests/index.test.ts` - "should add a behavior with add" test passes
- [ ] `tests/index.test.ts` - "should generate correct TypeBox files when TypeBox is selected" test passes
- [ ] All 467 currently passing tests continue to pass
- [ ] `pnpm test` shows 0 failures
- [ ] `pnpm check` passes (type safety verified)
- [ ] Root cause of each failure documented in LOG.md
- [ ] **User Review**: Changes verified and commit authorized

## Notes

**Test Failure Details:**

1. **validation.test.ts:310** - `validateJson` is calling `process.exit` even for valid input
   - Mock setup at line 281 throws error when process.exit is called
   - Need to investigate why validation is failing for valid config object

2. **index.test.ts:108** - `writeFileSync` never called during init
   - Test expects config file write at line 108-110
   - May indicate mock setup issue or actual implementation regression
   - Check if init flow was refactored to use different file writing method

3. **index.test.ts:404** - `writeFileSync` never called during add
   - Test expects behavior file write at line 404-406
   - Similar to #2, may be mock or implementation issue
   - Verify add command file generation logic

4. **index.test.ts:586** - `writeFileSync` never called for TypeBox types
   - Test expects types.ts generation at line 586-588
   - Check if TypeBox file generation was removed or moved to different function

**Investigation Strategy:**

1. Check recent commits that might have changed validation or file writing logic
2. Review mock setup in tests to ensure all necessary functions are mocked
3. Verify actual implementation matches test expectations
4. Consider if async/promise handling might be causing early returns
5. Check if file operations were moved to different modules/functions
