# Task: Align Behavior Attributes

**Task ID:** 20260224-125849-align-behavior-attributes  
**Created:** 2026-02-24 12:58:49  
**Status:** Planning  
**Agent:** Architect  

## Goal

Align all behavior attribute naming conventions to follow the pattern `{behavior-name}-{attribute-name}` and update documentation to match actual implementations.

## Context

The README.md documentation contains multiple misalignments with the actual behavior implementations:

1. **Inconsistent Naming Convention:** Some behaviors don't follow the `{behavior-name}-*` prefix pattern:
   - `compute`: Uses `formula` instead of `compute-formula`
   - `element-counter`: Uses `data-root` and `data-selector` instead of `element-counter-root` and `element-counter-selector`
   - `logger`: Uses `log-trigger` instead of `logger-trigger`

2. **README Documentation Errors:**
   - `request`: Documents non-existent attributes (`request-loading`, `request-error`, `request-debounce`, `request-mode`) and missing existing ones (`request-confirm`, `request-push-url`, `request-vals`)
   - `input-watcher`: README uses wrong prefixes (`watch-*` instead of `input-watcher-*`)
   - `compute`: Documents 4 non-existent attributes
   - `element-counter`: Documents `counter-*` attributes that don't exist
   - `logger`: Documents 3 attributes when only 1 exists

## Requirements

### Architectural Principle
**Every behavior attribute MUST start with the behavior name as a prefix.**

Examples:
- ✅ `reveal-delay`, `reveal-duration`, `reveal-anchor`
- ✅ `request-url`, `request-method`, `request-trigger`
- ✅ `input-watcher-target`, `input-watcher-format`
- ❌ `formula` (should be `compute-formula`)
- ❌ `data-root` (should be `element-counter-root`)
- ❌ `log-trigger` (should be `logger-trigger`)

### Phase 1: Schema Updates (Source of Truth)

1. **compute/schema.ts**
   - Change `formula` → `compute-formula`
   - Add `COMPUTE_ATTRS` constant for attribute names
   - Add description metadata

2. **element-counter/schema.ts**
   - Change `data-root` → `element-counter-root`
   - Change `data-selector` → `element-counter-selector`
   - Update `ELEMENT_COUNTER_ATTRS` constant

3. **logger/schema.ts**
   - Change `log-trigger` → `logger-trigger`
   - Add `LOGGER_ATTRS` constant
   - Verify if additional attributes are needed (events, attrs, prefix from README?)

### Phase 2: Implementation Updates

For each behavior with schema changes:
1. Import and use the `*_ATTRS` constant from schema
2. Update all `getAttribute()` calls to use constants
3. Update all `attributeChangedCallback` logic

**Files to update:**
- `registry/behaviors/compute/behavior.ts`
- `registry/behaviors/element-counter/behavior.ts`
- `registry/behaviors/logger/behavior.ts`

### Phase 3: Test Updates

Update all test files to use new attribute names:
- `registry/behaviors/compute/behavior.test.ts`
- `registry/behaviors/element-counter/behavior.test.ts`
- `registry/behaviors/logger/behavior.test.ts`

### Phase 4: Documentation Updates

Update `README.md` sections for each behavior with:
1. **Correct attribute names** from schemas
2. **Correct descriptions** from schema metadata
3. **Correct usage examples** with proper attribute names
4. **Remove non-existent attributes**
5. **Add missing attributes**

**Behaviors to document:**
- ✅ reveal (already correct)
- ⚠️ request (fix attributes, add missing ones)
- ❌ input-watcher (fix all prefixes)
- ❌ compute (complete rewrite with correct attribute)
- ❌ element-counter (complete rewrite with correct attributes)
- ❌ logger (complete rewrite with correct attribute)

## PDSRTDD Workflow

This task follows the PDSRTDD workflow with a focus on maintaining the **Schema as Source of Truth**:

1. **P - Plan** ✅ (This document)
2. **D - Data** - Attribute names and their types are defined in schemas
3. **S - Schema** - Update schemas first (they are the contract)
4. **R - Registry** - No registry changes needed (behaviors already registered)
5. **T - Test** - Update tests to use new attribute names
6. **DD - Develop** - Update behavior implementations to use new attribute names

## Atomic Tasks

Each change should be atomic and independently verifiable:

### Task 1: Update Compute Behavior
- [ ] Update `compute/schema.ts` with `COMPUTE_ATTRS` and `compute-formula`
- [ ] Update `compute/behavior.ts` to use `COMPUTE_ATTRS.FORMULA`
- [ ] Update `compute/behavior.test.ts` with new attribute name
- [ ] Verify tests pass

### Task 2: Update Element-Counter Behavior
- [ ] Update `element-counter/schema.ts` with new attribute names
- [ ] Update `element-counter/behavior.ts` to use new constants
- [ ] Update `element-counter/behavior.test.ts` with new attribute names
- [ ] Verify tests pass

### Task 3: Update Logger Behavior
- [ ] Update `logger/schema.ts` with `LOGGER_ATTRS` and `logger-trigger`
- [ ] Update `logger/behavior.ts` to use `LOGGER_ATTRS.TRIGGER`
- [ ] Update `logger/behavior.test.ts` with new attribute name
- [ ] Verify tests pass

### Task 4: Update README Documentation
- [ ] Update `request` behavior documentation (fix and add attributes)
- [ ] Update `input-watcher` behavior documentation (already has correct prefixes in code)
- [ ] Update `compute` behavior documentation (complete rewrite)
- [ ] Update `element-counter` behavior documentation (complete rewrite)
- [ ] Update `logger` behavior documentation (complete rewrite)

## Success Criteria

1. ✅ All behavior attributes follow `{behavior-name}-{attribute}` convention
2. ✅ All schemas export `{BEHAVIOR}_ATTRS` constants
3. ✅ All implementations use constants from schemas (DRY principle)
4. ✅ All tests pass with updated attribute names
5. ✅ README.md accurately documents all actual attributes
6. ✅ README.md examples use correct attribute names
7. ✅ No non-existent attributes documented
8. ✅ No existing attributes missing from documentation

## Branch Strategy

- **Branch name:** `feat/align-behavior-attributes`
- **Work environment:** Git worktree in `../align-behavior-attributes`
- **Base:** Current `main` branch

## Notes

- This is a **breaking change** for any existing users of `compute`, `element-counter`, or `logger` behaviors
- Consider documenting migration path in CHANGELOG
- The `reveal`, `request`, and `input-watcher` behaviors already follow the naming convention in their implementations
- The README needs fixes even for behaviors with correct implementations

## Risk Assessment

**Low Risk:**
- Schema changes are localized
- Behavior implementations are isolated
- Tests will catch any regressions
- Breaking changes are acceptable pre-1.0

**Mitigation:**
- Run full test suite after each atomic change
- Verify examples in README actually work
- Update any example projects if they exist
