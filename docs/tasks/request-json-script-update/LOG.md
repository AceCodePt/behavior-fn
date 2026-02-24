# LOG: Request Behavior JSON Script Update Support

**Branch:** `request-behavior-json-script-update-support`  
**Task Status:** In Progress  
**Started:** 2026-02-24

---

## Goal

Enhance the `request` behavior to support updating existing JSON `<script>` tags with different merge strategies (replace, appendArray, prependArray) based on the response content.

---

## Context & Why

Currently, the `request` behavior only supports HTML swap strategies (`innerHTML`, `outerHTML`, etc.). Many applications use `<script type="application/json">` tags to store structured data that needs dynamic updates. Without native support for JSON script tag updates, developers must write custom JavaScript, defeating the declarative behavior pattern.

This enhancement enables developers to declaratively update JSON data stores using the same request behavior they already use for HTML content.

---

## Architectural Decision

**Identity vs. Capability Analysis:**
- This is a **Capability Enhancement** to an existing behavior (request)
- The behavior remains "request" - we're adding JSON handling capabilities
- No new behavior is needed; we extend the existing swap logic

**Approach:**
- Add a new attribute `request-json-strategy` to control JSON merge behavior
- Detect when target is a `<script type="application/json">` element
- Apply appropriate strategy (replace, appendArray, prependArray)
- Maintain backward compatibility with HTML swap strategies

---

## State Manifest

### New Attribute
- **Source:** `request-json-strategy` attribute on the host element
- **Type:** `"replace" | "appendArray" | "prependArray"` (optional)
- **Default:** `"replace"`
- **Validation:** TypeBox Union of Literals in schema
- **Purpose:** Controls how JSON response merges with existing JSON content

### Existing Attributes (unchanged)
- `request-url`: URL endpoint
- `request-method`: HTTP method
- `request-trigger`: Event trigger
- `request-target`: Target element ID
- `request-swap`: HTML swap strategy (continues to work for HTML responses)
- `request-indicator`: Loading indicator
- `request-confirm`: Confirmation dialog
- `request-push-url`: History management
- `request-vals`: Additional form values

---

## Implementation Plan

### Phase 1: Data & Schema
1. **Update constants.ts:**
   - Add `JSON_STRATEGY: "request-json-strategy"` to `REQUEST_ATTRS`

2. **Update schema.ts:**
   - Add new attribute to schema with TypeBox union of literals:
     ```typescript
     [REQUEST_ATTRS.JSON_STRATEGY]: Type.Optional(
       Type.Union([
         Type.Literal("replace"),
         Type.Literal("appendArray"),
         Type.Literal("prependArray"),
       ]),
     )
     ```

### Phase 2: Test (Red)
1. **Add test cases to behavior.test.ts:**
   - Test: JSON replace strategy updates script tag content
   - Test: JSON appendArray adds items to existing array
   - Test: JSON prependArray adds items to start of array
   - Test: Invalid JSON in existing content logs warning
   - Test: Invalid JSON in response logs warning
   - Test: Array operation on non-array data logs warning
   - Test: Backward compatibility - HTML swap continues to work
   - Test: JSON strategy only applies to script tags

### Phase 3: Develop (Green)
1. **Update behavior.ts - `handleEvent` function:**
   - After fetching response, detect if target is `<script type="application/json">`
   - Check for `request-json-strategy` attribute
   - If JSON strategy is set and target is script tag:
     - Parse existing JSON from `target.textContent`
     - Parse response JSON
     - Apply strategy:
       - **replace:** Set `target.textContent = JSON.stringify(responseData, null, 2)`
       - **appendArray:** Validate both are arrays, concat, stringify
       - **prependArray:** Validate both are arrays, prepend, stringify
     - Handle errors gracefully with console warnings
   - Otherwise, proceed with existing HTML swap logic

2. **Error Handling:**
   - Wrap JSON parsing in try-catch blocks
   - Log meaningful warnings for:
     - Invalid existing JSON
     - Invalid response JSON
     - Type mismatches (attempting array operations on non-arrays)
   - Gracefully fail (don't crash the behavior)

---

## JSON Strategy Logic (Pseudocode)

```typescript
// Inside handleEvent, after getting html/response:

const jsonStrategy = getAttr(REQUEST_ATTRS.JSON_STRATEGY);
const isScriptTag = target instanceof HTMLScriptElement && 
                    target.type === "application/json";

if (jsonStrategy && isScriptTag) {
  try {
    // Parse existing JSON
    const existingText = target.textContent?.trim() || "{}";
    let existingData;
    try {
      existingData = JSON.parse(existingText);
    } catch (err) {
      console.warn("[Request] Invalid existing JSON in script tag", err);
      existingData = null;
    }

    // Parse response JSON
    let responseData;
    try {
      responseData = JSON.parse(html);
    } catch (err) {
      console.warn("[Request] Invalid JSON in response", err);
      return; // Cannot proceed without valid response
    }

    // Apply strategy
    let finalData;
    switch (jsonStrategy) {
      case "replace":
        finalData = responseData;
        break;
      
      case "appendArray":
        if (!Array.isArray(existingData) || !Array.isArray(responseData)) {
          console.warn("[Request] appendArray requires both existing and response to be arrays");
          return;
        }
        finalData = [...existingData, ...responseData];
        break;
      
      case "prependArray":
        if (!Array.isArray(existingData) || !Array.isArray(responseData)) {
          console.warn("[Request] prependArray requires both existing and response to be arrays");
          return;
        }
        finalData = [...responseData, ...existingData];
        break;
      
      default:
        finalData = responseData;
    }

    // Update script content
    target.textContent = JSON.stringify(finalData, null, 2);
    
  } catch (err) {
    console.error("[Request] Error processing JSON strategy", err);
  }
} else {
  // Existing HTML swap logic
  switch (swap) {
    // ... existing cases
  }
}
```

---

## Testing Strategy

### Test Setup
- Use jsdom and vitest
- Mock fetch to return JSON responses
- Create script tags with `type="application/json"` and pre-populated JSON
- Verify JSON content after requests

### Test Cases
1. **Replace Strategy:**
   - Existing: `{"count": 1}`
   - Response: `{"count": 5}`
   - Expected: `{"count": 5}`

2. **AppendArray Strategy:**
   - Existing: `[{"id": 1}]`
   - Response: `[{"id": 2}, {"id": 3}]`
   - Expected: `[{"id": 1}, {"id": 2}, {"id": 3}]`

3. **PrependArray Strategy:**
   - Existing: `[{"id": 2}]`
   - Response: `[{"id": 1}]`
   - Expected: `[{"id": 1}, {"id": 2}]`

4. **Error Handling:**
   - Invalid existing JSON → warns, uses response only
   - Invalid response JSON → warns, no update
   - Array operation on object → warns, no update

5. **Backward Compatibility:**
   - HTML swap strategies continue to work unchanged
   - JSON strategy ignored for non-script targets

---

## Breaking Changes

**None.** This is a purely additive enhancement:
- New optional attribute (`request-json-strategy`)
- Only activates when explicitly set AND target is a JSON script tag
- All existing HTML swap behaviors remain unchanged

---

## Documentation Updates

Will need to update:
- Behavior documentation to explain JSON script tag support
- Add examples showing JSON update patterns
- Document error handling behavior

---

## Dependencies

- No new external dependencies
- Uses built-in `JSON.parse` and `JSON.stringify`

---

## Success Criteria

- [x] Schema includes `request-json-strategy` attribute
- [x] Constants include `JSON_STRATEGY` key
- [x] All test cases pass (8 tests covering strategies and errors)
- [x] Backward compatibility verified (existing tests still pass - 277/277 tests passing)
- [x] JSON updates work for all three strategies
- [x] Error handling prevents crashes on invalid JSON
- [x] Type safety passes (pnpm tsc --noEmit)
- [ ] User review and approval

---

## Next Steps

1. ✅ Create LOG.md (this file)
2. ✅ Update constants.ts with new attribute
3. ✅ Update schema.ts with new union type
4. ✅ Write failing tests (8 tests covering all scenarios)
5. ✅ Implement JSON strategy logic
6. ✅ Verify all tests pass (277/277 passing)
7. ✅ Run type checking (passed)
8. ⏳ Present changes for user review

---

## Implementation Summary

### Files Modified

1. **registry/behaviors/request/constants.ts** (+3 lines)
   - Added `JSON_STRATEGY: "request-json-strategy"` constant

2. **registry/behaviors/request/schema.ts** (+7 lines)
   - Added `request-json-strategy` attribute to schema
   - TypeBox Union of Literals: "replace" | "appendArray" | "prependArray"

3. **registry/behaviors/request/behavior.ts** (+94 lines, -25 lines refactored)
   - Added JSON script tag detection
   - Implemented three merge strategies
   - Added comprehensive error handling
   - Maintained focus restoration logic

4. **registry/behaviors/request/behavior.test.ts** (+343 lines)
   - Added 8 new test cases in "JSON Script Tag Updates" describe block
   - Tests cover: replace, appendArray, prependArray strategies
   - Error handling tests: invalid existing JSON, invalid response JSON
   - Type mismatch tests: array operations on non-arrays
   - Backward compatibility tests

### Test Coverage

**New Tests (11):**
1. ✅ Replace strategy updates JSON content
2. ✅ AppendArray adds items to existing array
3. ✅ PrependArray adds items to start of array
4. ✅ AppendArray with empty array `[]` (edge case)
5. ✅ PrependArray with empty array `[]` (edge case)
6. ✅ Completely empty script tag with appendArray (warns - defaults to object)
7. ✅ Warns on invalid existing JSON (still updates with response)
8. ✅ Warns on invalid response JSON (no update)
9. ✅ Warns when appendArray used on non-array
10. ✅ Warns when prependArray used on non-array
11. ✅ JSON strategy ignored for non-script elements
12. ✅ Backward compatibility with HTML swap strategies

**All Tests:** 280/280 passing ✅

### Key Implementation Details

1. **Detection Logic:**
   - Checks if target is `HTMLScriptElement`
   - Verifies `type="application/json"`
   - Only activates when `request-json-strategy` is set

2. **Error Handling:**
   - Invalid existing JSON: warns, uses null, proceeds with response
   - Invalid response JSON: warns, aborts operation
   - Type mismatches: warns, aborts operation
   - All errors are non-fatal console warnings

3. **JSON Formatting:**
   - Uses `JSON.stringify(data, null, 2)` for readable output
   - Maintains consistent formatting

4. **Backward Compatibility:**
   - HTML swap strategies unchanged
   - Focus restoration logic preserved
   - No breaking changes to existing APIs
