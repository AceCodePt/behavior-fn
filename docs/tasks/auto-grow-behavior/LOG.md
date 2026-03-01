# Auto-Grow Behavior Implementation Log

## Task Overview

**Goal**: Implement an `auto-grow` behavior that automatically adjusts the height of textarea elements to fit their content as the user types.

**Branch**: `implement-auto-grow-behavior`

**Status**: In Progress

---

## Plan Phase (PDSRTDD)

### Architectural Decision: Behavior vs. Web Component

**Decision**: **Behavior** (not a Web Component)

**Rationale**: Following the "Identity vs. Capability" heuristic:
- **Identity**: `<textarea>` already has a well-defined identity as a native HTML element
- **Capability**: Auto-grow is a **capability** we're adding to existing textareas, not creating a new element type
- The auto-grow functionality is a behavioral enhancement that can be applied to standard textarea elements
- No new element identity is being created

This is a textbook example of a behavior: we're augmenting an existing element with additional functionality while preserving its native identity and semantics.

### Data & State Analysis

**State Manifest**:

| State | Source of Truth | Type | Validation |
|-------|----------------|------|------------|
| Element Type | `el instanceof HTMLTextAreaElement` | Boolean check | Runtime instanceof check |
| Initial Styles | Applied in `connectedCallback` | CSS Properties | N/A (imperative) |
| Dynamic Height | Calculated in `onInput` from `scrollHeight` | CSS Property | N/A (computed) |

**Key Observations**:
1. **No Configurable Attributes**: This behavior has NO schema properties - it's a zero-config behavior that works out of the box
2. **Element Type Guard**: Must validate that the behavior is only attached to `<textarea>` elements
3. **Style Mutations**: The behavior directly mutates CSS properties:
   - `overflow-y: hidden` - Prevents internal scrolling
   - `resize: none` - Disables manual resize handles
   - `height: auto` then `height: ${scrollHeight}px` - Dynamic height adjustment

**Behavioral Contract**:
- **Input**: Element must be a `HTMLTextAreaElement`
- **Output**: Auto-adjusting height based on content
- **Side Effects**: CSS style mutations on the element

### Implementation Strategy

**File Structure** (Standard 4-file pattern):
```
registry/behaviors/auto-grow/
├── schema.ts                 # Empty object schema (no configurable attributes)
├── _behavior-definition.ts   # Behavior definition using uniqueBehaviorDef
├── behavior.ts               # Implementation with element type guard
└── behavior.test.ts          # Comprehensive tests
```

**Key Implementation Points**:

1. **Schema** (`schema.ts`):
   - Use `Type.Object({})` - empty object since no attributes are needed
   - This still follows the standard pattern for consistency

2. **Definition** (`_behavior-definition.ts`):
   - Use `uniqueBehaviorDef` with name "auto-grow" and empty schema
   - No commands needed for this behavior

3. **Behavior Logic** (`behavior.ts`):
   - Type guard at the top: `if (!(el instanceof HTMLTextAreaElement))`
   - Return empty object `{}` for non-textarea elements (with console warning)
   - Implement `connectedCallback()` for initial style setup
   - Implement `onInput()` for dynamic height adjustment
   - Use standard event handler pattern (camelCase naming)

4. **Tests** (`behavior.test.ts`):
   - Test element type validation (non-textarea warning)
   - Test that textarea works correctly
   - Test initial styles are applied
   - Test height auto-adjusts on input
   - Test overflow-y and resize styles

5. **Registry**:
   - Add entry to `registry/behaviors-registry.json`

### Testing Strategy

**Test Cases**:

1. **Element Type Validation**:
   - ✅ Attach to `<div>` → console.warn called
   - ✅ Attach to `<textarea>` → no warning

2. **Style Application**:
   - ✅ `overflow-y: hidden` is set on connect
   - ✅ `resize: none` is set on connect

3. **Height Auto-Adjustment**:
   - ✅ Initial height matches content
   - ✅ Height increases when text is added
   - ✅ Height is set via the two-step process: `auto` then `${scrollHeight}px`

4. **Event Handler**:
   - ✅ `onInput` is called when input event fires
   - ✅ Height recalculates on every input

---

## Schema Phase

**Status**: Ready to implement

**Files to Create**:
1. `registry/behaviors/auto-grow/schema.ts` - Empty object schema
2. `registry/behaviors/auto-grow/_behavior-definition.ts` - Behavior definition

**Expected Pattern**:
```typescript
// schema.ts
export const schema = Type.Object({});

// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "auto-grow",
  schema,
});
```

---

## Registry Phase

**Status**: Pending schema completion

**Action Required**:
- Add entry to `registry/behaviors-registry.json`

---

## Test Phase

**Status**: Pending schema completion

**Test File**: `registry/behaviors/auto-grow/behavior.test.ts`

**Test Coverage**:
- Element type validation
- Console warning for non-textarea
- Style application (overflow-y, resize)
- Dynamic height adjustment
- Input event handling

---

## Develop Phase

**Status**: Pending test completion

**Implementation File**: `registry/behaviors/auto-grow/behavior.ts`

**Core Logic**:
```typescript
export const autoGrowBehaviorFactory = (el: HTMLElement) => {
  // Type guard with warning
  if (!(el instanceof HTMLTextAreaElement)) {
    console.warn(`[AutoGrow] Behavior attached to non-textarea element: <${el.tagName.toLowerCase()}>`);
    return {};
  }

  return {
    connectedCallback() {
      // Initial styles
      el.style.overflowY = 'hidden';
      el.style.resize = 'none';
    },
    onInput() {
      // Dynamic height adjustment
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    },
  };
};
```

---

## Progress Tracking

- [x] Plan created and documented
- [x] Schema defined
- [x] Behavior definition created
- [x] Tests written (7 tests)
- [x] Implementation complete (all tests passing ✅)
- [x] Registry updated
- [x] Type checking passes
- [x] Example created (examples/auto-grow-example.html)
- [ ] User review and commit

---

## Notes

- This is a **zero-config behavior** - no attributes to configure
- Still follows the 4-file standard for consistency
- Simple implementation but important UX pattern
- Type guard ensures proper usage
