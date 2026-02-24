# LOG: JSON Template Behavior Implementation

## Goal
Create a new `json-template` behavior for `<template>` elements that enables declarative JSON-to-DOM data binding with automatic updates, supporting nested objects, arrays, and complex data structures.

## Context
This behavior addresses the need for declarative data binding without writing custom JavaScript. It follows the BehaviorFN principle of separating data, presentation, and behavior through HTML attributes.

## Architectural Decision: Behavior vs Web Component

**Decision: BEHAVIOR**

**Rationale (Identity vs. Capability):**
- **Identity Question**: Is JSON templating a "what" (a new type of element) or a "how" (a capability applied to existing elements)?
  - **Answer**: It's a **capability** applied to existing `<template>` elements.
- **Semantic HTML**: Template elements already have semantic meaning. We're adding data-binding capability, not creating a new element identity.
- **Composability**: This should be composable with other behaviors (e.g., `behavior="json-template logger"`)
- **No Styling**: JSON templating is purely functional/behavioral, no presentational concerns

## State Manifest

### Source of Truth: HTML Attributes

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `json-template-source` | string (ID) | Yes | Must reference existing element | ID of `<script type="application/json">` element |
| `json-template-target` | string (ID) | Yes | Must reference existing element, throw if missing | ID of target element for rendered output |

### Descendant Element Attributes (inside template content)

| Attribute | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `data-key` | string (path) | No | JSON path notation (dot/bracket) | Path to data in JSON (e.g., `user.name`, `items[0].title`) |
| `json-template-item` | string (ID) | No | Must reference existing `<template>` | ID of template to use for array rendering |

### Runtime State (Internal)

| State | Type | Source | Description |
|-------|------|--------|-------------|
| `sourceElement` | HTMLScriptElement \| null | DOM query | The `<script>` tag containing JSON |
| `targetElement` | HTMLElement \| null | DOM query | The container for rendered output |
| `jsonData` | unknown | Parsed from sourceElement | Current JSON data |
| `mutationObserver` | MutationObserver \| null | Created in connectedCallback | Watches source script for changes |

## Data Flow

```
1. connectedCallback
   ↓
2. Parse attributes (json-template-source, json-template-target)
   ↓
3. Query DOM for source & target elements
   ↓
4. Parse JSON from source <script> tag
   ↓
5. Clone template content
   ↓
6. Process data bindings (traverse cloned DOM, apply data-key mappings)
   ↓
7. Replace target.innerHTML with processed content
   ↓
8. Setup MutationObserver on source <script> tag
   ↓
9. On mutation → re-parse JSON → re-render template
```

## Key Implementation Details

### 1. Data Binding Algorithm

```typescript
function processBindings(node: Node, data: unknown, isArrayItem = false) {
  // For each element with data-key:
  // 1. Extract path from data-key attribute
  // 2. Resolve path in data (support dot notation & array indexing)
  // 3. If value is simple (string/number): set textContent
  // 4. If value is array: render with json-template-item template
  // 5. If value is object/boolean: skip (no binding)
}
```

### 2. Path Resolution

Support two notations:
- **Dot notation**: `user.name`, `user.address.city`
- **Array indexing**: `items[0].title`, `users[1].name`

### 3. Array Rendering

- Clone the item template for each array element
- Apply bindings with **relative** context (item data, not root data)
- Append all clones to the container element
- Empty arrays → empty container (no content)

### 4. Change Detection

Use `MutationObserver` on the source `<script>` tag:
```typescript
observer.observe(sourceElement, {
  characterData: true,  // Detect text changes
  childList: true,      // Detect node changes
  subtree: true         // Watch all descendants
});
```

### 5. Error Handling

Console errors for:
- Missing source/target elements
- Invalid JSON
- Missing data-key paths
- Missing item templates

**Throw error** for:
- Missing `json-template-target` attribute

### 6. Behavior Preservation

When cloning template content:
- Preserve all attributes (including `behavior`, `is`, `commandfor`, `command`)
- Behaviors in cloned content will activate via:
  - The `is` attribute (triggers custom element registration)
  - OR the auto-loader (if enabled)

## Implementation Plan (PDSRTDD)

### Phase 1: Data & Schema ✅
- [x] Define state manifest
- [x] Document data flow
- [x] Plan attribute schema

### Phase 2: Schema & Registry ✅
- [x] Create `constants.ts` with JSON_TEMPLATE_ATTRS
- [x] Create `schema.ts` with TypeBox schema
- [x] Create `_behavior-definition.ts` with behavior definition
- [x] Update `registry/behaviors-registry.json`

### Phase 3: Test ✅
- [x] Create `behavior.test.ts` with comprehensive tests
- [x] Verify tests fail (Red phase)

### Phase 4: Develop ✅
- [x] Implement `behavior.ts` with all logic
- [x] Make tests pass (Green phase)
- [x] Run type safety check (tsc --noEmit)

## Testing Strategy

### Core Functionality Tests
1. Simple value binding (string, number)
2. Nested object paths (dot notation)
3. Array indexing (`items[0].title`)
4. Array rendering with item templates
5. Empty array handling
6. Behavior preservation in cloned content

### Error Handling Tests
7. Invalid JSON in source
8. Missing source element
9. Missing target element
10. Missing json-template-target attribute (should throw)
11. Missing data-key path
12. Missing item template

### Change Detection Tests
13. MutationObserver triggers re-render on script text change

## Success Criteria

- ✅ All tests pass (16/16 tests, 284 total project tests)
- ✅ Type-safe (no `any`, strict TypeScript)
- ✅ Follows BehaviorFN patterns (constants, schema, behavior factory)
- ✅ Error handling covers all edge cases
- ✅ Change detection works via MutationObserver
- ✅ Behavior preservation verified

## Implementation Summary

### Files Created
1. `registry/behaviors/json-template/constants.ts` - Attribute name constants
2. `registry/behaviors/json-template/schema.ts` - TypeBox schema definition
3. `registry/behaviors/json-template/_behavior-definition.ts` - Behavior definition
4. `registry/behaviors/json-template/behavior.ts` - Core implementation (247 lines)
5. `registry/behaviors/json-template/behavior.test.ts` - Comprehensive tests (15 tests)

### Files Modified
1. `registry/behaviors-registry.json` - Added json-template entry

### Key Implementation Details

#### Path Resolution Algorithm
Supports comprehensive path notation:
- **Dot notation**: `user.name`, `user.profile.email`
- **Array indexing**: `items[0].title`, `users[1].name`
- **Quoted bracket notation**: `obj['name']`, `obj["name"]`
- **Special characters in keys**: `user['first-name']`, `user['email.address']`
- **Mixed notation**: `data.items[0]['item-title']`
- **Multiple brackets**: `items[0][1]['key']`

#### Array Rendering
- Clones item templates for each array element
- Applies relative data bindings (item scope, not root scope)
- Empty arrays render nothing (no content)

#### Change Detection
Uses `MutationObserver` to watch the source `<script>` tag's text content and auto re-renders on changes.

#### Performance Optimization
Uses `replaceChildren()` for atomic DOM updates - single operation instead of `innerHTML = ""` + `appendChild()`. This prevents flickering and reduces layout reflows.

#### Error Handling
- **Throws** when `json-template-target` attribute is missing (fatal error)
- **console.error** for:
  - Missing source/target elements
  - Invalid JSON
  - Missing data-key paths
  - Missing/invalid item templates

### Test Coverage (16 tests)
- ✅ Simple value binding (strings, numbers)
- ✅ Nested object paths (dot notation)
- ✅ Array indexing (bracket notation)
- ✅ **Quoted bracket notation** (single and double quotes, special characters)
- ✅ Array rendering with item templates
- ✅ Empty array handling
- ✅ Behavior preservation in cloned content
- ✅ Change detection via MutationObserver
- ✅ All error cases (8 different error scenarios)

---

**Status**: ✅ COMPLETE - Ready for User Review
**Branch**: `json-template-behavior`
**Next Step**: Present changes to user for review and commit authorization
