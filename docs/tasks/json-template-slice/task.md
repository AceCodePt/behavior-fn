# Task: Add `json-template-slice` Attribute for Array Slicing

## Goal

Add a `json-template-slice` attribute to the json-template behavior that allows rendering a subset of array items instead of iterating over all items, enabling access to specific items (first, last, range) without duplication.

## Context

**Current Behavior:**

When `json-template-for` points to an array, the template renders once per item:

```html
<script id="data">[{id: 1}, {id: 2}, {id: 3}]</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <div>{id}</div>
  </template>
</div>

<!-- Renders 3 divs -->
```

**The Problem:**

Sometimes you want to render based on array data but NOT iterate over all items:

**Use Case 1: Access First Item Only**
```html
<!-- Chat: Show session from first message only -->
<input 
  behavior="json-template" 
  json-template-for="answers"
  name="session" 
  value="{session.name}"
>
```

**Current:** Renders N inputs (one per message) ❌  
**Desired:** Render 1 input (using first message's session) ✅

**Use Case 2: Show Last N Items**
```html
<!-- Show only last 5 messages -->
<div behavior="json-template" json-template-for="messages">
  <template>
    <div>{text}</div>
  </template>
</div>
```

**Current:** Renders ALL messages ❌  
**Desired:** Render only last 5 ✅

**Use Case 3: Pagination**
```html
<!-- Show items 10-20 -->
<div 
  behavior="json-template" 
  json-template-for="items"
  json-template-slice="10:20"
>
  <template>
    <div>{title}</div>
  </template>
</div>
```

---

## Proposed Solution

Add `json-template-slice` attribute that uses JavaScript `Array.slice()` syntax:

### Syntax

```
json-template-slice="start:end"
```

**Examples:**

| Slice | Meaning | JavaScript Equivalent |
|-------|---------|----------------------|
| `0:1` | First item only | `array.slice(0, 1)` |
| `0:5` | First 5 items | `array.slice(0, 5)` |
| `-1` | Last item only | `array.slice(-1)` |
| `-5:` | Last 5 items | `array.slice(-5)` |
| `10:20` | Items 10-19 | `array.slice(10, 20)` |
| `:10` | First 10 items | `array.slice(0, 10)` |
| `5:` | All items from index 5 | `array.slice(5)` |

### Behavior

When `json-template-slice` is present:
1. Parse the slice expression
2. Apply `array.slice(start, end)` to the data
3. Render template for the sliced subset

When `json-template-slice` is NOT present:
- Default behavior (render all items)

---

## Requirements

### Schema Update

Add optional attribute to `schema.ts`:

```typescript
export const schema = Type.Object({
  "json-template-for": Type.String({
    description: "ID of the <script type='application/json'> element containing the data"
  }),
  
  "json-template-slice": Type.Optional(Type.String({
    description: "Array slice syntax (e.g., '0:1', '-5:', '10:20') to render subset of items"
  })),
});
```

### Implementation

**In `behavior.ts`:**

```typescript
// Parse slice expression
function parseSlice(sliceExpr: string): { start?: number; end?: number } {
  if (!sliceExpr || sliceExpr.trim() === '') return {};
  
  const parts = sliceExpr.split(':');
  
  if (parts.length === 1) {
    // Single number: "-1" means slice(-1)
    const num = parseInt(parts[0], 10);
    return { start: num };
  }
  
  const startStr = parts[0]?.trim();
  const endStr = parts[1]?.trim();
  
  return {
    start: startStr ? parseInt(startStr, 10) : undefined,
    end: endStr ? parseInt(endStr, 10) : undefined,
  };
}

// In render function, before iterating array:
if (Array.isArray(jsonData)) {
  const sliceAttr = el.getAttribute(ATTRS['json-template-slice']);
  let itemsToRender = jsonData;
  
  if (sliceAttr) {
    const { start, end } = parseSlice(sliceAttr);
    itemsToRender = jsonData.slice(start, end);
  }
  
  // Now iterate over itemsToRender instead of jsonData
  for (const item of itemsToRender) {
    // ... existing rendering logic
  }
}
```

---

## Usage Examples

### Chat: Session from First Message

```html
<script id="answers">[]</script>

<!-- Form with session input that doesn't duplicate -->
<div
  behavior="json-template"
  json-template-for="answers"
  json-template-slice="0:1"
>
  <template>
    <input type="hidden" name="session" value="{session.name || -}">
  </template>
</div>
```

**Behavior:**
- Empty array `[]` → Renders once with empty context, value="-" ✅
- One item `[{session: {name: "123"}}]` → Renders once, value="123" ✅
- Two items `[{...}, {...}]` → Still renders once (sliced to first item only) ✅

### Show Last 10 Messages

```html
<div
  behavior="json-template"
  json-template-for="messages"
  json-template-slice="-10:"
>
  <template>
    <div class="message">{text}</div>
  </template>
</div>
```

### Pagination

```html
<!-- Page 1: items 0-9 -->
<div json-template-for="items" json-template-slice="0:10">
  <template><div>{title}</div></template>
</div>

<!-- Page 2: items 10-19 -->
<div json-template-for="items" json-template-slice="10:20">
  <template><div>{title}</div></template>
</div>
```

### Show First and Last

```html
<!-- First item -->
<div json-template-for="users" json-template-slice="0:1">
  <template><div>First: {name}</div></template>
</div>

<!-- Last item -->
<div json-template-for="users" json-template-slice="-1:">
  <template><div>Last: {name}</div></template>
</div>
```

---

## Edge Cases

### Slice with Empty Array

```html
<script id="data">[]</script>
<div json-template-for="data" json-template-slice="0:1">
  <template>
    <input value="{name || Guest}">
  </template>
</div>
```

**Behavior:**
- `[].slice(0, 1)` → `[]` (empty array)
- Empty array → Render once with empty context (existing feature)
- Input value → "Guest" ✅

### Invalid Slice Syntax

```html
json-template-slice="invalid"
```

**Behavior:**
- Log warning: `[json-template] Invalid slice syntax: "invalid"`
- Fall back to rendering all items (default behavior)

### Out of Bounds

```html
json-template-slice="100:200"
<!-- Array only has 10 items -->
```

**Behavior:**
- `array.slice(100, 200)` → `[]` (JavaScript behavior)
- Empty result → Render once with empty context

---

## Benefits

### 1. Solves Chat Pattern ✅

```html
<script id="answers">[]</script>

<form behavior="request" request-target="answers" request-swap="appendToArray">
  <!-- Session input - renders once from first item -->
  <div behavior="json-template" json-template-for="answers" json-template-slice="0:1">
    <template>
      <input name="session" value="{session.name || -}">
    </template>
  </div>
  
  <input name="query">
  <button>Send</button>
</form>

<!-- Messages - renders all items -->
<div behavior="json-template" json-template-for="answers">
  <template>
    <div>{answer.answerText}</div>
  </template>
</div>
```

**No duplicate inputs! ✅**

### 2. Enables Pagination ✅

```html
<!-- Dynamic slice based on page number -->
<div 
  behavior="json-template" 
  json-template-for="items"
  json-template-slice="{pageStart}:{pageEnd}"
>
  <template><div>{title}</div></template>
</div>
```

### 3. Performance Optimization ✅

Only render visible items:
```html
<!-- Show last 50 messages (virtual scrolling) -->
<div json-template-for="messages" json-template-slice="-50:">
  <template><div>{text}</div></template>
</div>
```

### 4. Flexible Data Access ✅

- First item: `0:1`
- Last item: `-1:`
- First N: `:N`
- Last N: `-N:`
- Range: `start:end`

---

## Definition of Done

- [ ] `json-template-slice` attribute added to schema
- [ ] `parseSlice(expr)` function implemented
- [ ] Slice applied before array iteration in render logic
- [ ] Works with empty arrays (renders once with empty context)
- [ ] Works with out-of-bounds indices (JavaScript slice behavior)
- [ ] Invalid syntax logs warning and falls back to default
- [ ] Tests added for all slice patterns:
  - [ ] `0:1` (first item)
  - [ ] `-1:` (last item)
  - [ ] `-5:` (last 5)
  - [ ] `:10` (first 10)
  - [ ] `5:` (from index 5)
  - [ ] `10:20` (range)
  - [ ] Empty array with slice
  - [ ] Out of bounds
  - [ ] Invalid syntax
- [ ] Documentation updated (JSON-TEMPLATE-PATTERNS.md)
- [ ] Chat demo updated to use slice
- [ ] All existing tests pass (backward compatibility)
- [ ] **User Review**: Changes verified and commit authorized

---

## Implementation Notes

### Parse Function

```typescript
function parseSlice(expr: string): { start?: number; end?: number } {
  const trimmed = expr.trim();
  
  // Single number: "-1" or "5"
  if (!trimmed.includes(':')) {
    const num = parseInt(trimmed, 10);
    if (isNaN(num)) {
      console.warn(`[json-template] Invalid slice: "${expr}"`);
      return {};
    }
    return { start: num };
  }
  
  // Range: "start:end"
  const [startStr, endStr] = trimmed.split(':');
  
  const result: { start?: number; end?: number } = {};
  
  if (startStr && startStr.trim()) {
    const start = parseInt(startStr.trim(), 10);
    if (!isNaN(start)) {
      result.start = start;
    }
  }
  
  if (endStr && endStr.trim()) {
    const end = parseInt(endStr.trim(), 10);
    if (!isNaN(end)) {
      result.end = end;
    }
  }
  
  return result;
}
```

### Render Logic Update

```typescript
if (Array.isArray(jsonData)) {
  const sliceAttr = el.getAttribute(ATTRS['json-template-slice']);
  let itemsToRender = jsonData;
  
  // Apply slice if specified
  if (sliceAttr) {
    const { start, end } = parseSlice(sliceAttr);
    itemsToRender = jsonData.slice(start, end);
  }
  
  const fragment = document.createDocumentFragment();
  
  // Empty array handling (existing feature works with sliced arrays too)
  if (itemsToRender.length === 0) {
    const itemClone = templateElement.content.cloneNode(true);
    for (const child of Array.from(itemClone.childNodes)) {
      processInterpolation(child, {});
    }
    fragment.appendChild(itemClone);
  } else {
    // Render sliced items
    for (const item of itemsToRender) {
      const itemClone = templateElement.content.cloneNode(true);
      for (const child of Array.from(itemClone.childNodes)) {
        processInterpolation(child, item);
      }
      fragment.appendChild(itemClone);
    }
  }
  
  // ... insert fragment
}
```

---

## Examples

### Chat Pattern (First Item Only)

```html
<script id="answers">[]</script>

<form behavior="request" request-target="answers" request-swap="appendToArray">
  <!-- Session input using slice="0:1" -->
  <div 
    behavior="json-template" 
    json-template-for="answers"
    json-template-slice="0:1"
    style="display: contents;"
  >
    <template>
      <input type="hidden" name="session" value="{session.name || -}">
    </template>
  </div>
  
  <input name="queryText" placeholder="Ask...">
  <button>Send</button>
</form>
```

**Flow:**
1. Empty array → `[].slice(0,1)` → `[]` → Render once with `{}` → value="-"
2. One message → `[{...}].slice(0,1)` → `[{...}]` → Render once → value="session-123"
3. Two messages → `[{...}, {...}].slice(0,1)` → `[{...}]` → Render once → No duplication! ✅

### Show Last 10 Messages

```html
<div 
  behavior="json-template" 
  json-template-for="messages"
  json-template-slice="-10:"
>
  <template>
    <div class="message">{text}</div>
  </template>
</div>
```

### Show Items 10-20 (Pagination)

```html
<div 
  behavior="json-template" 
  json-template-for="products"
  json-template-slice="10:20"
>
  <template>
    <div class="product">{name} - ${price}</div>
  </template>
</div>
```

### Dynamic Slice (Future Enhancement)

Could support interpolation in slice attribute:

```html
<div 
  json-template-for="items"
  json-template-slice="{pageStart}:{pageEnd}"
>
  <template><div>{title}</div></template>
</div>
```

**Note:** This would require slice attribute to be reactive and re-parse when data changes. Could be a future enhancement.

---

## Benefits

### 1. Pure Behavior Solution ✅
No sync scripts needed - declarative attribute handles it

### 2. Familiar API ✅
Uses standard JavaScript `Array.slice()` syntax that developers know

### 3. Flexible ✅
- First item: `0:1`
- Last item: `-1:`
- First N: `:N`
- Last N: `-N:`
- Range: `start:end`
- All: omit attribute

### 4. Composable ✅
Works with all existing features:
- ✅ Fallback operators
- ✅ Empty array rendering
- ✅ Nested arrays
- ✅ Array swap strategies

### 5. Performance ✅
Only render what you need:
- Virtual scrolling (last N items)
- Pagination (specific range)
- Single item access (no iteration overhead)

---

## Comparison to Alternatives

### vs `json-template-context`

**Slice:**
```html
json-template-slice="0:1"  <!-- First item -->
json-template-slice="-1:"  <!-- Last item -->
```

**Context:**
```html
json-template-context="first"
json-template-context="last"
```

**Why slice is better:**
- ✅ More flexible (any range, not just first/last)
- ✅ Standard JavaScript API
- ✅ Supports pagination out of the box
- ✅ Single attribute handles all cases

### vs `data-single`

**Slice:**
```html
<div json-template-slice="0:1">
  <template>{name}</template>
</div>
```

**data-single:**
```html
<template data-single="[0]">
  {name}
</template>
```

**Why slice is better:**
- ✅ Consistent level (element attribute, not template attribute)
- ✅ More flexible (ranges, not just single index)
- ✅ Clearer intent

---

## Testing Plan

### Test Cases

```typescript
describe('json-template-slice', () => {
  it('should render first item only with slice="0:1"', () => {
    const data = [{name: 'A'}, {name: 'B'}, {name: 'C'}];
    // ... setup with slice="0:1"
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('A');
  });
  
  it('should render last item with slice="-1:"', () => {
    const data = [{name: 'A'}, {name: 'B'}, {name: 'C'}];
    // ... setup with slice="-1:"
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('C');
  });
  
  it('should render last 2 items with slice="-2:"', () => {
    const data = [{name: 'A'}, {name: 'B'}, {name: 'C'}];
    // ... setup with slice="-2:"
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('B');
    expect(items[1].textContent).toBe('C');
  });
  
  it('should render range with slice="1:3"', () => {
    const data = [{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}];
    // ... setup with slice="1:3"
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('B');
    expect(items[1].textContent).toBe('C');
  });
  
  it('should render first N with slice=":2"', () => {
    const data = [{name: 'A'}, {name: 'B'}, {name: 'C'}];
    // ... setup with slice=":2"
    expect(items).toHaveLength(2);
  });
  
  it('should render from index with slice="1:"', () => {
    const data = [{name: 'A'}, {name: 'B'}, {name: 'C'}];
    // ... setup with slice="1:"
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('B');
  });
  
  it('should handle empty array with slice', () => {
    const data = [];
    // ... setup with slice="0:1"
    expect(items).toHaveLength(1); // Renders once with empty context
  });
  
  it('should handle out of bounds slice gracefully', () => {
    const data = [{name: 'A'}];
    // ... setup with slice="10:20"
    // slice(10, 20) on 1-item array → []
    expect(items).toHaveLength(1); // Empty result → render once with {}
  });
  
  it('should warn on invalid slice syntax', () => {
    // ... setup with slice="invalid"
    // Should log warning and render all items
  });
});
```

---

## Documentation Updates

### JSON-TEMPLATE-PATTERNS.md

Add new section:

```markdown
## Array Slicing

Use `json-template-slice` to render a subset of array items:

### First Item Only
\`\`\`html
<div json-template-for="messages" json-template-slice="0:1">
  <template>{text}</template>
</div>
\`\`\`

### Last 5 Items
\`\`\`html
<div json-template-slice="-5:">
  <template>{text}</template>
</div>
\`\`\`

### Range (Items 10-20)
\`\`\`html
<div json-template-slice="10:20">
  <template>{title}</template>
</div>
\`\`\`
```

---

## Related Patterns

### Chat with Slice

Once implemented, the chat demo becomes:

```html
<script id="answers">[]</script>

<form behavior="request" request-target="answers" request-swap="appendToArray">
  <!-- Session using slice - NO DUPLICATION -->
  <div behavior="json-template" json-template-for="answers" json-template-slice="0:1" style="display: contents;">
    <template>
      <input type="hidden" name="session" value="{session.name || -}">
    </template>
  </div>
  
  <input name="queryText">
  <button>Send</button>
</form>

<div behavior="json-template" json-template-for="answers">
  <template>
    <div>{answer.answerText}</div>
  </template>
</div>
```

**Pure behavior pattern. Zero glue code. No duplication. Beautiful! ✨**

---

## Priority

**HIGH** - This is the missing piece for the chat pattern to be pure behavior-driven.

---

## Notes

- Slice follows JavaScript `Array.slice()` semantics exactly
- Negative indices supported (count from end)
- Out of bounds handled gracefully
- Works perfectly with existing empty array rendering
- No breaking changes (additive feature)
