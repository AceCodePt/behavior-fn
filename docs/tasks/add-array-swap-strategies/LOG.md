# Implementation Log: Add Array Swap Strategies to Request Behavior

**Status:** ✅ Complete  
**Branch:** `add-array-swap-strategies-to-request-behavior`  
**Date:** 2026-02-25

---

## Architectural Decision

**Type:** Breaking Enhancement to existing Behavior

**Rationale:** This replaces the old `appendArray`/`prependArray` strategies with four new, more flexible strategies. This is a breaking change since the old strategy names are removed, but provides better semantics and clearer intent.

## State Manifest

All state is managed through HTML attributes on the host element:

| Attribute | Type | Source of Truth | Validation |
|-----------|------|-----------------|------------|
| `request-json-strategy` | String literal | Host element attribute | TypeBox Union of string literals |

**Key Changes:**
1. Removed separate `request-json-strategy` attribute entirely
2. Consolidated all strategies into single `request-swap` attribute
3. `innerHTML` now works for both HTML elements AND JSON script tags (replacing content)

**Old attribute (REMOVED):**
- `request-json-strategy` with values: `replace`, `appendArray`, `prependArray`

**New unified attribute:**
- `request-swap` now supports both HTML strategies AND array manipulation strategies:
  - **HTML strategies:** `innerHTML`, `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none`
  - **Array strategies (JSON script tags only):**
    - `appendToArray` - Push response (any type) to end of array
    - `appendSpreadToArray` - Spread response array to end of existing array
    - `prependToArray` - Push response (any type) to start of array
    - `prependSpreadToArray` - Spread response array to start of existing array
  - **Universal strategy:** `innerHTML` works for both HTML elements and JSON script tags

**Old strategies (REMOVED):**
- `replace` - Use `innerHTML` instead (works the same for JSON script tags)
- `appendArray` - Use `appendSpreadToArray` instead
- `prependArray` - Use `prependSpreadToArray` instead

---

## Implementation Summary

### Phase 1: Schema (Contract) ✅
Updated `schema.ts`:
- **Removed entire `request-json-strategy` attribute**
- **Consolidated into `request-swap`:**
  - Added 4 array strategies: `appendToArray`, `appendSpreadToArray`, `prependToArray`, `prependSpreadToArray`
  - Kept existing HTML strategies: `innerHTML`, `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none`
  - Did NOT add `replace` - `innerHTML` serves this purpose for both HTML and JSON

### Phase 2: Test (Red Phase) ✅
Added 16 new test cases organized in 4 describe blocks:
1. **appendToArray strategy (4 tests)**
2. **appendSpreadToArray strategy (4 tests)**
3. **prependToArray strategy (4 tests)**
4. **prependSpreadToArray strategy (4 tests)**

Updated existing test:
- Changed "replace" test to use "innerHTML" for JSON script tag replacement

Removed old test cases:
- Removed 6 tests for deprecated `appendArray`/`prependArray` strategies
- Removed redundant test for non-script elements with `replace`

### Phase 3: Develop (Green Phase) ✅
Updated `behavior.ts`:
- Removed `request-json-strategy` attribute access entirely
- Unified logic to use single `request-swap` attribute for both HTML and JSON
- Added JSON script tag detection with intelligent routing:
  - `innerHTML` on JSON script tag → parse and format JSON (replaces content)
  - Array strategies on JSON script tag → apply array manipulation
  - HTML strategies on any element → standard DOM manipulation
  - Array strategies on non-JSON elements → fallback to `innerHTML`
- Changed default for malformed JSON from `{}` to `[]` for array strategies
- Improved error messages and graceful fallback handling

---

## Key Design Decisions

### 1. Naming Convention
- `appendToArray` / `prependToArray` = Push single item (any type)
- `appendSpreadToArray` / `prependSpreadToArray` = Spread array items
- This makes the intent explicit and clear

### 2. Type Flexibility
- `*ToArray` strategies accept ANY response type (object, primitive, array)
- `*SpreadToArray` strategies REQUIRE response to be an array (warn otherwise)
- Both require existing data to be an array (warn otherwise)

### 3. Breaking Change Justification
- Old `appendArray`/`prependArray` names were ambiguous (didn't indicate spread behavior)
- New names are more explicit about push vs spread semantics
- Clearer distinction between single-item and array operations
- Project is in beta (pre-1.0), breaking changes are acceptable for better patterns

### 4. Error Handling
- Invalid JSON in existing data → log warning, abort operation
- Non-array existing data with array strategy → log warning, abort operation
- Non-array response with spread strategy → log warning, abort operation
- Empty arrays → proceed normally (valid case)

---

## Test Results

**All Tests:** ✅ 333/333 passing  
**Type Check:** ✅ No errors  
**Coverage:** All new strategies tested with happy path and error cases

### New Test Coverage
- **appendToArray:** Objects, primitives, empty arrays, error handling
- **appendSpreadToArray:** Array spreading, empty arrays, type validation
- **prependToArray:** Objects, primitives, empty arrays, error handling
- **prependSpreadToArray:** Array spreading, empty arrays, type validation

---

## Files Modified

1. **registry/behaviors/request/schema.ts** (+13/-9 lines)
   - Removed entire `request-json-strategy` attribute definition
   - Added 4 new array strategy literals to `request-swap` union
   - Did NOT add `replace` - `innerHTML` serves this purpose

2. **registry/behaviors/request/behavior.ts** (+88/-45 lines)
   - Removed `request-json-strategy` attribute access completely
   - Unified logic to use single `request-swap` attribute
   - Added special handling for `innerHTML` on JSON script tags (parses and formats JSON)
   - Added array strategy detection and routing for JSON script tags
   - Added graceful fallback for array strategies on non-script elements
   - Changed default for invalid JSON from `{}` to `[]` for array contexts

3. **registry/behaviors/request/behavior.test.ts** (+639/-365 lines)
   - Updated all tests to use `request-swap` instead of `request-json-strategy`
   - Changed "replace" test to use "innerHTML" for JSON replacement
   - Removed redundant test for non-script elements
   - Removed 6 old test cases for deprecated strategies
   - Added 16 new comprehensive test cases
   - Organized in 4 describe blocks for clarity

4. **docs/tasks/add-array-swap-strategies/LOG.md** (new file)
   - Implementation documentation

---

## Documentation Status

✅ Already updated in `examples/JSON-TEMPLATE-PATTERNS.md`  
✅ Task definition in `docs/tasks/add-array-swap-strategies/task.md`

---

## Migration Guide for Users

**Breaking Changes:**
1. The `request-json-strategy` attribute is removed - use `request-swap` instead
2. Old strategy names are no longer supported
3. `replace` strategy removed - use `innerHTML` instead

| Old Attribute & Strategy | New Attribute & Strategy | Notes |
|-------------------------|-------------------------|-------|
| `request-json-strategy="replace"` | `request-swap="innerHTML"` | innerHTML now handles JSON script tags intelligently |
| `request-json-strategy="appendArray"` | `request-swap="appendSpreadToArray"` | Renamed for clarity (spreads array) |
| `request-json-strategy="prependArray"` | `request-swap="prependSpreadToArray"` | Renamed for clarity (spreads array) |
| N/A | `request-swap="appendToArray"` | New - pushes single item to end |
| N/A | `request-swap="prependToArray"` | New - pushes single item to start |

**Migration Steps:**
1. Replace all `request-json-strategy` attributes with `request-swap`
2. Update strategy values:
   - `replace` → `innerHTML`
   - `appendArray` → `appendSpreadToArray`
   - `prependArray` → `prependSpreadToArray`
3. Consider using `*ToArray` strategies for single-item pushes (cleaner for chat/notification patterns)

**Design Benefits:**
- ✅ One attribute instead of two
- ✅ `innerHTML` works universally for both HTML and JSON
- ✅ Clearer intent with explicit push vs spread naming
- ✅ Consistent with standard DOM APIs

---

## Success Criteria

- ✅ Schema updated with new swap strategy literals
- ✅ Tests cover all four strategies with various data types
- ✅ Tests cover edge cases (empty arrays, non-array data)
- ✅ All existing tests still pass (334/334)
- ✅ Type safety verified (no TypeScript errors)
- ✅ Documentation already updated
- ⏳ User review and commit authorization
