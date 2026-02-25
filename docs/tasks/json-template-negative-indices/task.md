# Task: Add Negative Array Index Support to json-template Path Resolution

## Goal

Enable negative array indices in curly brace interpolation paths (e.g., `{items[-1].name}`, `{users[-2].email}`) to access arrays from the end, matching JavaScript's negative index behavior.

## Context

**Current Behavior:**

The `resolvePath()` function in json-template only supports positive array indices:

```typescript
// Line 115-120 in behavior.ts
const index = Number.parseInt(keyOrIndex, 10);
if (Array.isArray(current) && index >= 0 && index < current.length) {
  current = current[index];
} else {
  return undefined;
}
```

**Problem:**

Negative indices like `[-1]` are parsed but rejected by the `index >= 0` check:

```html
<template>
  {items[-1].name}  <!-- Returns undefined ❌ -->
</template>
```

**Expected (JavaScript Behavior):**

```javascript
items[-1]  // Last item
items[-2]  // Second to last
items[-3]  // Third to last
```

**Use Cases:**

### 1. Chat Pattern - Access Last Turn

```html
<!-- User's most recent message -->
{session.turns[-1].query.text}
```

Without this, we can't access the last turn to display the user's query.

### 2. Recent Items

```html
<!-- Last activity -->
{activities[-1].description}

<!-- Previous value -->
{history[-2].value}
```

### 3. Last Element in Dynamic Lists

```html
<!-- Latest notification -->
{notifications[-1].message}

<!-- Last log entry -->
{logs[-1].text}
```

---

## Requirements

### Update `resolvePath()` Function

**Current code (lines 114-121):**

```typescript
} else {
  // Array index: arr[0]
  const index = Number.parseInt(keyOrIndex, 10);
  if (Array.isArray(current) && index >= 0 && index < current.length) {
    current = current[index];
  } else {
    return undefined;
  }
}
```

**Updated code:**

```typescript
} else {
  // Array index: arr[0] or arr[-1]
  const index = Number.parseInt(keyOrIndex, 10);
  if (Array.isArray(current)) {
    // Handle negative indices (count from end)
    const actualIndex = index < 0 ? current.length + index : index;
    
    if (actualIndex >= 0 && actualIndex < current.length) {
      current = current[actualIndex];
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}
```

**JavaScript Semantics:**

| Input | Array | Result |
|-------|-------|--------|
| `arr[-1]` | `['a', 'b', 'c']` | `'c'` (last) |
| `arr[-2]` | `['a', 'b', 'c']` | `'b'` (second to last) |
| `arr[-3]` | `['a', 'b', 'c']` | `'a'` (third to last) |
| `arr[-4]` | `['a', 'b', 'c']` | `undefined` (out of bounds) |
| `arr[-1]` | `[]` | `undefined` (empty array) |

---

## Examples

### Before (Doesn't Work)

```html
<script id="data">
{
  "users": [
    {"name": "Alice"},
    {"name": "Bob"},
    {"name": "Charlie"}
  ]
}
</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <p>Last user: {users[-1].name}</p>
    <!-- Returns: "Last user: " (undefined) ❌ -->
  </template>
</div>
```

### After (Works)

```html
<div behavior="json-template" json-template-for="data">
  <template>
    <p>Last user: {users[-1].name}</p>
    <!-- Returns: "Last user: Charlie" ✅ -->
  </template>
</div>
```

---

## Chat Pattern Use Case

### Current Workaround (Mock Server)

```javascript
// Mock server adds query at top level
const response = {
  query: query,  // Workaround
  answer: {...},
  session: {...}
};
```

```html
<template>
  <div>{query}</div>  <!-- Works but doesn't match real backend -->
</template>
```

### With Negative Indices (Matches Real Backend)

```html
<template>
  <!-- Access last turn directly -->
  <div class="user">{session.turns[-1].query.text}</div>
  <div class="assistant">{answer.answerText}</div>
</template>
```

**No server workaround needed!** ✅

---

## Testing Plan

### Test Cases

```typescript
describe('resolvePath with negative indices', () => {
  it('should access last item with [-1]', () => {
    const data = { items: ['a', 'b', 'c'] };
    expect(resolvePath(data, 'items[-1]')).toBe('c');
  });
  
  it('should access second to last with [-2]', () => {
    const data = { items: ['a', 'b', 'c'] };
    expect(resolvePath(data, 'items[-2]')).toBe('b');
  });
  
  it('should return undefined for out of bounds negative index', () => {
    const data = { items: ['a', 'b'] };
    expect(resolvePath(data, 'items[-5]')).toBeUndefined();
  });
  
  it('should return undefined for negative index on empty array', () => {
    const data = { items: [] };
    expect(resolvePath(data, 'items[-1]')).toBeUndefined();
  });
  
  it('should work with nested paths', () => {
    const data = {
      session: {
        turns: [
          { query: { text: 'first' } },
          { query: { text: 'last' } }
        ]
      }
    };
    expect(resolvePath(data, 'session.turns[-1].query.text')).toBe('last');
  });
  
  it('should work in interpolation', () => {
    const template = '<p>{items[-1]}</p>';
    const data = { items: ['a', 'b', 'c'] };
    expect(interpolateString(template, data)).toBe('<p>c</p>');
  });
});
```

---

## Definition of Done

- [ ] `resolvePath()` supports negative array indices
- [ ] Negative indices follow JavaScript semantics (`-1` = last, `-2` = second to last)
- [ ] Out of bounds negative indices return `undefined`
- [ ] Works with nested paths (`session.turns[-1].query.text`)
- [ ] Tests added for all negative index scenarios
- [ ] Chat demo updated to use `{session.turns[-1].query.text}`
- [ ] Mock server simplified (no need for top-level `query` workaround)
- [ ] All existing tests pass (backward compatibility)
- [ ] Documentation updated (JSON-TEMPLATE-PATTERNS.md)
- [ ] **User Review**: Changes verified and commit authorized

---

## Benefits

### 1. JavaScript Parity ✅

Matches JavaScript array access behavior:
```javascript
arr[-1]  // Last item
```

### 2. Cleaner Templates ✅

**Before (need workarounds):**
```html
{query}  <!-- Requires server to add top-level field -->
```

**After (use actual data structure):**
```html
{session.turns[-1].query.text}  <!-- Matches backend structure -->
```

### 3. Common Pattern ✅

Accessing last item is extremely common:
- Last message in chat
- Most recent activity
- Latest notification
- Previous value in history

### 4. No Breaking Changes ✅

Additive feature - existing positive indices work unchanged.

---

## Implementation Size

**Minimal change** - Just 4 lines:

```typescript
// Add before the index bounds check:
const actualIndex = index < 0 ? current.length + index : index;

// Use actualIndex instead of index:
if (actualIndex >= 0 && actualIndex < current.length) {
  current = current[actualIndex];
}
```

---

## Priority

**MEDIUM-HIGH** - Needed for chat pattern to match real backend structure cleanly.

---

## Notes

- This is a natural extension of array access
- JavaScript developers expect negative indices to work
- Very small implementation (4 lines)
- High value for real-world patterns
