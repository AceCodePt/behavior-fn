# Implementation Log: Add json-template-slice Attribute for Array Slicing

## Architectural Decision

**Feature Type**: Enhancement to existing behavior  
**Implementation**: Attribute addition to json-template behavior

This is an **additive feature** to the existing `json-template` behavior. It adds a new optional attribute `json-template-slice` that allows users to render a subset of array items using JavaScript's `Array.slice()` syntax.

## Why This Approach?

**Problem**: Currently, when `json-template-for` points to an array, the template renders once per item. Users cannot easily access just the first item, last N items, or a specific range without iteration.

**Use Cases**:
1. **Chat pattern**: Need to extract session data from first message without duplicating inputs
2. **Pagination**: Render specific ranges (items 10-20)
3. **Performance**: Show only last N items (virtual scrolling)
4. **UI components**: Access first/last items for special styling

**Solution**: Add `json-template-slice` attribute that accepts JavaScript slice syntax:
- `0:1` - First item only
- `-1:` - Last item only
- `-5:` - Last 5 items
- `10:20` - Range (items 10-19)
- `:10` - First 10 items
- `5:` - From index 5 onwards

## State Manifest

### New Attribute
- **`json-template-slice`**: Optional string attribute
  - **Format**: `"start:end"` (JavaScript slice syntax)
  - **Validation**: TypeBox schema with Optional(String)
  - **Default**: No slice (render all items)
  - **Source of Truth**: Element attribute value

### Internal State
No new component state. The slice expression is:
1. Read from attribute during render
2. Parsed into `{ start?: number; end?: number }`
3. Applied to array data before iteration

## Implementation Plan

### Phase 1: Schema (Contract)
- [x] Add `json-template-slice` to `schema.ts` as optional string attribute

### Phase 2: Data & Logic
- [x] Implement `parseSlice(expr: string)` function to parse slice expressions
- [x] Modify render logic to apply slice before array iteration
- [x] Handle edge cases (invalid syntax, out of bounds, empty arrays)

### Phase 3: Tests (Red Phase)
- [x] Write tests for all slice patterns
- [x] Tests for empty arrays with slice
- [x] Tests for out-of-bounds slices
- [x] Tests for invalid syntax
- [x] Ensure tests fail before implementation

### Phase 4: Implementation (Green Phase)
- [x] Implement slice logic in behavior.ts
- [x] Wire up to existing array rendering flow
- [x] Ensure backward compatibility (no slice = render all)

## Key Design Decisions

1. **Follow JavaScript Semantics**: Use exact `Array.slice()` behavior for familiarity and predictability
2. **Additive Feature**: No breaking changes - attribute is optional
3. **Works with Empty Arrays**: Leverages existing empty array rendering feature (renders once with empty context)
4. **Graceful Fallback**: Invalid syntax logs warning and falls back to rendering all items
5. **Attribute Naming**: Follows behavior pattern `json-template-{feature}`

## Test Coverage

- [x] First item only (`0:1`)
- [x] Last item only (`-1:`)
- [x] Last N items (`-5:`)
- [x] First N items (`:10`)
- [x] From index onwards (`5:`)
- [x] Range (`10:20`)
- [x] Empty array with slice
- [x] Out of bounds indices
- [x] Invalid syntax with fallback
- [x] Backward compatibility (no slice attribute)

## Verification Steps

1. Run all json-template tests: `npm test json-template`
2. Verify type safety: `npm run check`
3. Test chat demo with slice
4. Verify backward compatibility (existing code without slice works)

## Implementation Details

### parseSlice Function
```typescript
function parseSlice(expr: string): { start?: number; end?: number } {
  const trimmed = expr.trim();
  
  // Single number: "-1" or "5"
  if (!trimmed.includes(':')) {
    const num = parseInt(trimmed, 10);
    if (isNaN(num)) return {};
    return { start: num };
  }
  
  // Range: "start:end"
  const [startStr, endStr] = trimmed.split(':');
  const result: { start?: number; end?: number } = {};
  
  if (startStr?.trim()) {
    const start = parseInt(startStr.trim(), 10);
    if (!isNaN(start)) result.start = start;
  }
  
  if (endStr?.trim()) {
    const end = parseInt(endStr.trim(), 10);
    if (!isNaN(end)) result.end = end;
  }
  
  return result;
}
```

### Integration Point
In the render function, before the array iteration block:
```typescript
if (Array.isArray(jsonData)) {
  const sliceAttr = el.getAttribute(attributes['json-template-slice']);
  let itemsToRender = jsonData;
  
  if (sliceAttr) {
    const { start, end } = parseSlice(sliceAttr);
    itemsToRender = jsonData.slice(start, end);
  }
  
  // Rest of array rendering logic uses itemsToRender
}
```

## Status

- [x] Schema updated
- [x] parseSlice function implemented
- [x] Integration with render logic complete
- [x] Tests written and passing (83 json-template tests, all passing)
- [x] Type checking passes
- [x] All project tests pass (393 tests)
- [x] Backward compatibility verified
- [x] Ready for review

## Summary of Changes

### Files Modified

1. **`registry/behaviors/json-template/schema.ts`**
   - Added `json-template-slice` as optional string attribute
   - Follows behavior attribute naming convention

2. **`registry/behaviors/json-template/behavior.ts`**
   - Added `parseSlice()` function to parse slice expressions
   - Modified array rendering logic to apply slice before iteration
   - Maintains backward compatibility (no slice = render all)

3. **`registry/behaviors/json-template/behavior.test.ts`**
   - Added 13 comprehensive tests for slice functionality
   - All edge cases covered (empty arrays, out of bounds, invalid syntax)

### Test Coverage

All slice patterns tested and passing:
- ✅ First item only (`0:1`)
- ✅ Last item only (`-1:`)
- ✅ Last N items (`-2:`)
- ✅ Range (`1:3`)
- ✅ First N items (`:2`)
- ✅ From index onwards (`1:`)
- ✅ Empty array with slice
- ✅ Out of bounds handling
- ✅ Single number slice (negative: `-1`)
- ✅ Single number slice (positive: `1`)
- ✅ Backward compatibility (no slice attribute)
- ✅ Works with fallback operators

### Breaking Changes

**None.** This is a purely additive feature. Existing code without the `json-template-slice` attribute continues to work exactly as before.
