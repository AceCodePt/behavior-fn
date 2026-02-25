# Task: Render json-template When Root Data is Empty Array

## Goal

Make json-template behavior render the template at least once even when the root data is an empty array, enabling forms and UI that need to exist before data arrives.

## Context

Currently, when json-template points to an empty array as root data, nothing renders:

```html
<script id="data">[]</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <form>
      <input name="query">
      <input name="session" value="{[0].session || -}">
      <button>Submit</button>
    </form>
  </template>
</div>
```

**Current Behavior:** Form doesn't render (empty array = no items = no rendering)

**Desired Behavior:** Form renders once with fallback values

### Why This is Needed

**Use Case: Chat Interface**
- Start with empty messages array: `[]`
- Form needs to render immediately with session="-"
- As messages arrive, they append to array
- Form should stay rendered, updating session from `[0].session`

**Without This Fix:**
- Form won't appear until first message arrives
- User can't submit first message
- Chicken-and-egg problem!

## Requirements

When root data is an empty array:
- Render the template **once** with empty context (`{}`)
- Fallback operators should work: `{[0].session || "-"}` → `"-"`
- When array becomes non-empty, switch to normal array rendering (one per item)
- Maintain backward compatibility for nested array templates (those should remain empty)

## Proposed Behavior

### Scenario 1: Root Empty Array (NEW)

```html
<script id="data">[]</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <form>
      <input value="{[0].name || 'Guest'}">
    </form>
  </template>
</div>
```

**Result:** Form renders once with fallback values
- `{[0].name || 'Guest'}` → `"Guest"`

### Scenario 2: Root Non-Empty Array (EXISTING)

```html
<script id="data">[{"name": "Alice"}, {"name": "Bob"}]</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <div>{name}</div>
  </template>
</div>
```

**Result:** Template renders for each item (existing behavior)
- Two divs: "Alice", "Bob"

### Scenario 3: Nested Empty Array (EXISTING - NO CHANGE)

```html
<script id="data">{"users": []}</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <ul>
      <template data-array="users">
        <li>{name}</li>
      </template>
    </ul>
  </template>
</div>
```

**Result:** Outer template renders, inner renders nothing (existing behavior)
- `<ul>` with empty content

## Definition of Done

- [ ] When root data is empty array, template renders once with empty context
- [ ] Fallback operators work correctly: `{[0].prop || default}` → `default`
- [ ] When array becomes non-empty, behavior switches to per-item rendering
- [ ] Nested arrays with `data-array` attribute remain unchanged (no rendering if empty)
- [ ] All existing tests still pass
- [ ] New tests added for empty root array scenario
- [ ] Documentation updated
- [ ] **User Review**: Changes verified and commit authorized

## Implementation Notes

### Current Code (behavior.ts lines 461-495)

```typescript
// Special case: If root data is an array, render template for each item
if (Array.isArray(jsonData)) {
  // Root is an array - render template once per item
  const fragment = document.createDocumentFragment();

  for (const item of jsonData) {
    const itemClone = templateElement.content.cloneNode(true) as DocumentFragment;
    
    // Process interpolation for this item
    for (const child of Array.from(itemClone.childNodes)) {
      processInterpolation(child, item);
    }

    fragment.appendChild(itemClone);
  }

  // Clear existing rendered content (preserve template)
  // ...
  
  // Insert rendered content before the template
  el.insertBefore(fragment, templateElement);
  return;
}
```

### Proposed Change

```typescript
if (Array.isArray(jsonData)) {
  const fragment = document.createDocumentFragment();

  // NEW: If array is empty, render template once with empty context
  if (jsonData.length === 0) {
    const itemClone = templateElement.content.cloneNode(true) as DocumentFragment;
    
    // Process with empty object context (fallback operators will work)
    for (const child of Array.from(itemClone.childNodes)) {
      processInterpolation(child, {});
    }
    
    fragment.appendChild(itemClone);
  } else {
    // Existing behavior: render once per item
    for (const item of jsonData) {
      const itemClone = templateElement.content.cloneNode(true) as DocumentFragment;
      
      for (const child of Array.from(itemClone.childNodes)) {
        processInterpolation(child, item);
      }
      
      fragment.appendChild(itemClone);
    }
  }

  // Clear and insert (existing code)
  // ...
}
```

## Benefits

### Enables Clean Patterns

**Before (workaround needed):**
```html
<!-- Separate sources, sync script required -->
<script id="messages">[]</script>
<script id="form-state">{"session": "-"}</script>
<!-- Complex setup with sync script -->
```

**After (simple, clean):**
```html
<!-- Single source, no sync needed -->
<script id="data">[]</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <form>
      <input value="{[0].session || -}">
    </form>
  </template>
</div>
```

### Consistency

Empty arrays should render "something" rather than nothing, just like:
- Empty object renders template once
- Single item array renders template once
- Empty array should render template once (with empty context)

### No Breaking Changes

- Existing non-empty arrays: unchanged
- Nested arrays with `data-array`: unchanged (only affects root-level arrays)
- All fallback operators already handle missing paths

## Alternative Considered

**Use separate data sources** (current workaround)
- More complex (two script tags, sync script)
- Less intuitive
- More moving parts

**This task is simpler and more elegant.**
