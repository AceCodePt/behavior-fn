# Implementation Log: Opt-In Auto-Loader for Behavioral Hosts

## Task Overview
**Branch:** `opt-in-auto-loader-for-behavioral-hosts`
**Status:** In Progress
**Date Started:** 2026-02-24

## Goal
Provide an **optional utility** that automatically adds `is="behavioral-*"` attributes to elements with `behavior` attributes, eliminating the need for manual host declaration while maintaining the explicit, predictable core architecture.

## Architectural Decision

### Why This is NOT a Behavior
The auto-loader is **NOT** a behavior. It is a **system utility** that operates at the framework level, not at the element level. Here's why:

1. **Scope:** Behaviors operate on individual elements. The auto-loader operates on the entire DOM tree.
2. **Lifecycle:** Behaviors are attached to specific elements. The auto-loader watches for all elements with `behavior` attributes.
3. **Purpose:** Behaviors add capabilities to elements. The auto-loader automates the registration process.
4. **Identity:** Adding the auto-loader doesn't change the element's identity; it only automates the addition of the `is` attribute.

**Classification:** System Utility (similar to `behavioral-host.ts`, `behavior-registry.ts`)

### Design Principles

1. **Opt-In Only:** The auto-loader must be explicitly enabled by calling `enableAutoLoader()`. It should NOT be part of the default setup.

2. **Behavior-Based Host Pattern:** 
   - The `is` attribute describes **behaviors**, not tag types
   - Multiple tag types can share the same behavioral host if they use the same behavior combination
   - Example: Both `<button behavior="reveal">` and `<dialog behavior="reveal">` use `is="behavioral-reveal"`

3. **Alphabetical Sorting:**
   - Behaviors are always sorted alphabetically for consistency
   - `behavior="reveal logger"` and `behavior="logger reveal"` both produce `is="behavioral-logger-reveal"`

4. **Dynamic Host Registration:**
   - The auto-loader discovers unique behavior combinations
   - Registers behavioral hosts on-demand using `defineBehavioralHost(tagName, customElementName, observedAttributes)`
   - Collects observed attributes from all behaviors in the combination

5. **Edge Case Handling:**
   - Skip elements with existing `is` attributes
   - Handle empty `behavior=""` gracefully
   - Process elements added both before and after `enableAutoLoader()` is called
   - Prevent infinite loops from MutationObserver

## State Manifest

### Auto-Loader State
| State | Source of Truth | Validation | Description |
|-------|----------------|------------|-------------|
| `observer` | `MutationObserver` instance | Native API | Watches for DOM changes |
| `processedElements` | `WeakSet<Element>` | N/A | Tracks already-processed elements to prevent duplicate work |
| `registeredHosts` | `Set<string>` | N/A | Tracks registered behavioral host names to avoid duplicate registration |

### No Element-Level State
The auto-loader does NOT maintain state on individual elements. It only:
1. Reads the `behavior` attribute
2. Writes the `is` attribute (if missing)
3. Registers behavioral hosts globally

## Implementation Plan

### Phase 1: Core Auto-Loader Implementation
**File:** `registry/behaviors/auto-loader.ts`

**Exports:**
- `enableAutoLoader(): () => void` - Main function that starts the observer and returns a disconnect function

**Algorithm:**
```typescript
// 1. Scan existing DOM for elements with behavior attribute
// 2. Set up MutationObserver to watch for new elements
// 3. For each element with behavior attribute:
//    a. Parse behavior attribute (space-separated list)
//    b. Sort behaviors alphabetically
//    c. Create custom element name: behavioral-{sorted-behaviors}
//    d. Collect observed attributes from all behaviors
//    e. Register behavioral host if not already registered
//    f. Add is attribute to element
// 4. Return disconnect function to stop the observer
```

**Edge Cases to Handle:**
- Elements with existing `is` attributes → Skip
- Empty behavior attribute (`behavior=""`) → Skip
- Unknown behaviors → Log warning, skip
- Invalid tag names → Skip
- Race conditions → Use processedElements WeakSet

### Phase 2: Tests
**File:** `registry/behaviors/auto-loader.test.ts`

**Test Coverage:**
1. Basic functionality
   - Adds `is` attribute to elements with `behavior` attribute
   - Processes elements added before `enableAutoLoader()`
   - Processes elements added after `enableAutoLoader()`
   
2. Behavior-based host pattern
   - Same behavior on different tags uses same host
   - Multiple behaviors are sorted alphabetically
   
3. Edge cases
   - Skips elements with existing `is` attributes
   - Handles empty behavior attributes
   - Handles unknown behaviors gracefully
   
4. Cleanup
   - `disconnect()` stops the observer
   - No memory leaks

### Phase 3: Documentation Updates

**Files to Update:**
1. `README.md` - Add "Optional: Auto-Loader" section with:
   - Clear statement that behaviors don't load automatically
   - Why `is` attribute is required
   - How to use auto-loader
   - Tradeoffs (DX vs. explicitness/performance)

2. `docs/guides/auto-loader.md` - Comprehensive guide:
   - When to use auto-loader vs. explicit `is` attributes
   - How it works internally
   - Performance considerations
   - Migration guide

### Phase 4: Template Integration

**Files to Update:**
- Behavior creation templates should include commented-out auto-loader import example

## Dependencies

### Internal Dependencies
- `registry/behaviors/behavioral-host.ts` - `defineBehavioralHost()` function
- `registry/behaviors/behavior-registry.ts` - `getBehavior()` function
- `registry/behaviors/behavior-utils.ts` - `getObservedAttributes()` function
- `registry/behaviors/types.ts` - Type definitions

### External Dependencies
- Native `MutationObserver` API
- Native `customElements` API
- `WeakSet` for tracking processed elements

## Technical Notes

### Why WeakSet for Processed Elements?
Using `WeakSet<Element>` ensures:
1. Automatic garbage collection when elements are removed from DOM
2. No memory leaks from tracking removed elements
3. Fast O(1) lookup to check if element was already processed

### Why Behavior-Based Hosts?
The `is` attribute should describe **what the element does** (its behaviors), not **what it is** (its tag name). This makes the contract explicit and allows different tag types to share behavioral host implementations.

**Example:**
```html
<!-- Both use the same behavioral host -->
<button is="behavioral-reveal" behavior="reveal">Toggle</button>
<dialog is="behavioral-reveal" behavior="reveal">Content</dialog>

<!-- Different behavior combinations = different hosts -->
<div is="behavioral-logger-reveal" behavior="reveal logger">Element 1</div>
<button is="behavioral-logger" behavior="logger">Element 2</button>
```

### Performance Considerations
- **MutationObserver Overhead:** Minimal for most apps (~2KB + event listener overhead)
- **Batch Processing:** MutationObserver automatically batches DOM changes
- **Debouncing:** Not needed due to MutationObserver's built-in batching
- **Recommendation:** Use explicit `is` attributes for high-performance scenarios

### Prohibited Patterns
1. ❌ **Auto-enabling by default:** The auto-loader must be opt-in
2. ❌ **Tag-based hosts:** Don't create `behavioral-button-reveal`, create `behavioral-reveal`
3. ❌ **Overwriting existing `is` attributes:** Respect user's explicit choices
4. ❌ **Throwing errors for unknown behaviors:** Log warnings instead
5. ❌ **Processing elements multiple times:** Use WeakSet to track

## Checklist

### Implementation
- [x] Create `registry/behaviors/auto-loader.ts`
- [x] Implement `enableAutoLoader()` function
- [x] Handle edge cases (existing `is`, empty behavior, unknown behaviors)
- [x] Return cleanup function
- [x] Add TypeScript types

### Tests
- [x] Create `registry/behaviors/auto-loader.test.ts`
- [x] Test basic functionality
- [x] Test behavior-based host pattern
- [x] Test edge cases
- [x] Test cleanup/disconnect

### Documentation
- [x] Update README.md with auto-loader section (enhanced with limitation note)
- [x] Create `docs/guides/auto-loader.md`
- [x] Document tradeoffs clearly

### Quality Assurance
- [x] All tests pass (`pnpm test`) - 236/236 tests passing
- [x] Type safety verified (`npx tsc --noEmit`) - No errors
- [x] No `any` types used
- [x] Code follows project standards
- [ ] **User Review**: Changes verified and commit authorized

## PDSRTDD Phase Status

- [x] **Plan** - Architectural decision made, LOG.md created
- [x] **Data** - State manifest defined (see above)
- [x] **Schema** - N/A (system utility, not a behavior)
- [x] **Registry** - N/A (not a behavior)
- [x] **Test** - Tests written and passing (19/19 tests)
- [x] **Develop** - Implementation complete and tested

## Implementation Summary

### Files Created

1. **`registry/behaviors/auto-loader.ts`** (222 lines)
   - Exports `enableAutoLoader()` function
   - Uses MutationObserver to watch for elements with `behavior` attribute
   - Implements behavior-based host pattern
   - Handles all edge cases:
     - Elements with existing `is` attributes → Skip
     - Empty `behavior` attributes → Skip
     - Unknown behaviors → Warn but continue
     - Multiple behaviors → Sort alphabetically
     - Whitespace handling → Trim and split properly
   - Returns cleanup function to disconnect observer
   - Tracks processed elements with WeakSet (automatic GC)
   - Tracks registered hosts with Set (avoid duplicate registration)

2. **`registry/behaviors/auto-loader.test.ts`** (291 lines)
   - 19 comprehensive tests covering:
     - Basic functionality (4 tests)
     - Behavior-based host pattern (2 tests)
     - Edge cases (9 tests)
     - Cleanup (2 tests)
     - Nested elements (2 tests)
   - All tests passing ✅

3. **`docs/guides/auto-loader.md`** (466 lines)
   - Comprehensive guide covering:
     - When to use / avoid auto-loader
     - Basic usage examples
     - How it works internally
     - All edge cases and limitations
     - Performance considerations
     - Comparison table: Explicit vs. Auto-Loader
     - Migration guides (both directions)
     - Advanced usage (HMR, frameworks)
     - Debugging tips
     - FAQ section

### Files Modified

1. **`README.md`**
   - Enhanced auto-loader section with Custom Elements limitation note
   - Added warning about behavior changes after initial load

### Key Design Decisions

1. **Behavior-Based Host Pattern:** The `is` attribute describes behaviors, not tag types. This allows different tags with the same behaviors to share behavioral hosts.

2. **Behaviors Are Static (Architectural Principle):** Behaviors are defined at element creation time and do not change. This is both a Custom Elements limitation and a design principle:
   - Behaviors define what an element **is** (its identity)
   - Attributes define what state an element is **in** (its state)
   - Once set, behaviors cannot be added, removed, or changed at runtime
   - To control behavior dynamically, use behavior-specific **attributes** instead

3. **Custom Elements Limitation:** Once an element is upgraded with an `is` attribute, it cannot be re-upgraded. This aligns with our architectural principle of static behaviors.

4. **WeakSet for Tracking:** Used WeakSet to track processed elements, ensuring automatic garbage collection when elements are removed from DOM.

5. **No Behavior Attribute Observation:** Removed observation of `behavior` attribute changes since behaviors are static by design.

6. **Graceful Error Handling:** Unknown behaviors trigger warnings but don't throw errors, allowing the app to continue functioning.

### Test Results

```
✅ All 240 tests passing (up from 236 - added 4 new parsing tests)
✅ Type checking: 0 errors
✅ Auto-loader specific: 23/23 tests passing (up from 19)
```

### Bug Fixes During Implementation

**Behavior Parsing Inconsistency Fixed:**
- Initially used `.split(/\s+/)` which only supported space separators
- Updated to match `behavioral-host.ts` parsing logic exactly:
  - `.replace(/[^a-zA-Z- ,]/, "")` - Remove invalid characters (no g flag needed)
  - `.split(/[^a-zA-z-]+/)` - Split on non-letters/non-hyphens
  - Note: g flag not needed because `.split()` already handles all remaining invalid chars
- Now supports both space AND comma separators
- Correctly handles hyphenated behavior names like `input-watcher`
- Added 4 new tests to cover these edge cases

### Performance Impact

- **File Size:** ~2KB minified
- **Runtime:** MutationObserver + WeakSet tracking
- **Memory:** Automatic GC via WeakSet
- **Recommendation:** Use for prototypes/content-heavy sites; use explicit `is` for production apps

## Next Steps

**HALT - Ready for User Review**

Changes completed in feature branch `opt-in-auto-loader-for-behavioral-hosts`. All tests pass and type safety verified.

**User should review:**
1. Auto-loader implementation and edge case handling
2. Test coverage (19 tests)
3. Documentation completeness (README + comprehensive guide)
4. Performance tradeoffs documented clearly

**After approval:**
- User can request commit and push to remote
