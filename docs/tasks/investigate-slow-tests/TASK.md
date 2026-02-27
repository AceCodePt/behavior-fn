# Task: Investigate Slow Test Execution Times

**Status**: `[ ]` Todo  
**Type**: Investigation / Performance Optimization  
**Created**: 2026-02-27  
**Agent**: Architect

## Goal

Investigate and optimize the slow execution times for `request` and `json-template` behavior test suites.

## Context

### Current Performance Issue

Two test files are taking significantly longer to execute than expected:

- `registry/behaviors/request/behavior.test.ts`: **356ms** for 54 tests (~6.6ms per test)
- `registry/behaviors/json-template/behavior.test.ts`: **538ms** for 89 tests (~6.0ms per test)

### Why This Matters

1. **Developer Experience**: Slow tests reduce iteration speed and discourage running tests frequently
2. **CI/CD Performance**: Longer test times increase pipeline duration and costs
3. **Scalability**: As the behavior library grows, these patterns may compound
4. **Test Smell**: Slow tests often indicate architectural issues or improper test isolation

### Key Observations

- **Large Test Files**: 
  - `request/behavior.test.ts`: 1,542 lines
  - `json-template/behavior.test.ts`: 2,602 lines
- **Web Component Registration**: Both use `defineBehavioralHost` in `beforeAll`
- **DOM Heavy**: Extensive use of `document.createElement` and DOM manipulation
- **Mock Setup**: Both stub global `fetch` and other browser APIs

## Success Criteria

1. **Identify Root Causes**: Determine the specific bottlenecks causing slow execution
2. **Quantify Impact**: Measure which operations are consuming the most time
3. **Provide Recommendations**: Document actionable optimization strategies
4. **Target Performance**: Aim for <2ms per test average (industry standard for unit tests)

## Investigation Areas

### 1. Custom Element Registration Overhead

**Question**: Is `defineBehavioralHost` creating web components unnecessarily expensive?

- Multiple tag registrations per test file (`button`, `div`, `form`, `input` in request tests)
- Check if registration is synchronous and blocking
- Consider: Can we register once globally and reuse?

### 2. DOM Creation and Manipulation

**Question**: Are we creating too many DOM nodes per test?

- Both files have extensive `document.createElement` calls
- `json-template` tests appear to create full template structures
- Consider: Can we use lightweight fixtures or snapshots?

### 3. Test Isolation Issues

**Question**: Are tests properly isolated or is there state leakage?

- Check if `beforeEach` cleanup is comprehensive
- Look for shared state between tests
- Consider: Are we doing unnecessary setup/teardown?

### 4. Mock Performance

**Question**: Are mock setups contributing to slowness?

- `vi.stubGlobal` calls in `beforeEach`
- Check if mocks are being reset/restored efficiently
- Consider: Can mocks be configured once?

### 5. Synchronous vs Asynchronous Operations

**Question**: Are we unnecessarily awaiting or blocking?

- Check for missing `async/await` causing slower synchronous paths
- Look for unnecessary `Promise` chains
- Consider: Can operations be parallelized?

### 6. File Size and Complexity

**Question**: Should these test files be split up?

- 1,500+ and 2,600+ lines is exceptionally large for a single test file
- Consider: Would splitting into multiple files improve performance?
- Consider: Are there redundant test patterns that could be parameterized?

## Investigation Methodology

### Phase 1: Profiling (Data Collection)

1. **Vitest Profiling**: Run tests with `--reporter=verbose` to see individual test times
2. **Memory Profiling**: Check for memory leaks or excessive allocations
3. **Comparison Baseline**: Compare against faster test files (e.g., `reveal`, `logger`)
4. **Hot Spots**: Identify the slowest individual tests within each suite

### Phase 2: Hypothesis Testing

1. **Isolate Web Component Registration**: Test with/without `defineBehavioralHost`
2. **Simplify DOM**: Create minimal test fixtures
3. **Remove Mocks**: Test with/without fetch mocking
4. **Parallel Execution**: Check if tests can run in parallel

### Phase 3: Optimization

1. **Apply Findings**: Implement the most impactful optimizations
2. **Measure Improvements**: Re-run profiling to validate changes
3. **Document Patterns**: Create test performance guidelines for future behaviors

## Expected Deliverables

1. **Analysis Report**: `docs/tasks/investigate-slow-tests/ANALYSIS.md` documenting:
   - Root causes identified
   - Performance measurements (before/after)
   - Bottleneck breakdown
   
2. **Optimization PR**: Implementation of recommended changes

3. **Testing Guidelines**: Update `docs/guides/testing-behaviors.md` with:
   - Performance best practices
   - Test structure recommendations
   - Profiling instructions

## Notes

- **Non-Breaking**: Optimizations should maintain existing test coverage
- **Reproducible**: Changes should be measurable and verifiable
- **Educational**: Findings should inform future behavior test development

## Related

- `docs/guides/testing-behaviors.md` - Current testing guide
- `registry/behaviors/reveal/behavior.test.ts` - Example of faster test (compare structure)
- `registry/behaviors/logger/behavior.test.ts` - Another fast test for comparison
