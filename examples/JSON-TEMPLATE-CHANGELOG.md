# JSON Template Behavior - Pattern Update

## Summary of Changes

The `json-template` behavior has been refactored to use **implicit template patterns** inspired by native HTML elements like `<label>` and `<input>`.

## What Changed

### 1. Attribute Rename

**Before:**
- `json-template-source` - ID of data source
- `json-template-target` - ID of render target

**After:**
- `json-template-for` - ID of data source (like `for` in `<label>`)
- Renders into the container itself (implicit)

### 2. Template Discovery

**Before (Explicit):**
```html
<template 
  behavior="json-template"
  json-template-source="data"
  json-template-target="output"
>
  <div data-key="name"></div>
</template>

<div id="output"></div>
```

❌ Problem: `<template>` can't use `is` attribute (not a valid customized built-in element)

**After (Implicit):**
```html
<div behavior="json-template" json-template-for="data">
  <template>
    <div data-key="name"></div>
  </template>
</div>
```

✅ Solution: Behavior on container, template as direct child

### 3. Array Item Templates

**Before:**
```html
<div data-key="users" json-template-item="user-template"></div>

<template id="user-template">
  <li data-key="name"></li>
</template>
```

**After (Implicit - Recommended):**
```html
<div data-key="users">
  <template>
    <li data-key="name"></li>
  </template>
</div>
```

**Explicit still supported:**
```html
<div data-key="users" json-template-item="user-template"></div>

<template id="user-template">
  <li data-key="name"></li>
</template>
```

## Why This Pattern?

### Follows Native HTML Conventions

**Label + Input (Explicit):**
```html
<label for="username">Username</label>
<input id="username">
```

**Label + Input (Implicit):**
```html
<label>
  Username
  <input>
</label>
```

**JSON Template (Implicit):**
```html
<div behavior="json-template" json-template-for="data">
  <template>
    <!-- content -->
  </template>
</div>
```

### Benefits

1. **✅ Works with Auto-Loader**: Container can be customized built-in element
2. **✅ Self-Contained**: Everything in one place
3. **✅ Less ID Pollution**: No need for unique template IDs everywhere
4. **✅ More Intuitive**: Matches mental model of HTML composition
5. **✅ Template Preservation**: Templates stay in DOM for re-rendering
6. **✅ Nested Arrays**: Implicit templates work recursively

## Migration Guide

### Simple Case

**Before:**
```html
<script id="user-data">{"name": "Sagi"}</script>

<div id="output"></div>

<template 
  behavior="json-template"
  json-template-source="user-data"
  json-template-target="output"
>
  <div data-key="name"></div>
</template>
```

**After:**
```html
<script id="user-data">{"name": "Sagi"}</script>

<div behavior="json-template" json-template-for="user-data">
  <template>
    <div data-key="name"></div>
  </template>
</div>
```

### Array Case

**Before:**
```html
<script id="users-data">
  {"users": [{"name": "Alice"}, {"name": "Bob"}]}
</script>

<div id="output"></div>

<template id="main">
  <ul data-key="users" json-template-item="user-item"></ul>
</template>

<template id="user-item">
  <li data-key="name"></li>
</template>

<template 
  behavior="json-template"
  json-template-source="users-data"
  json-template-target="output"
  id="main"
>
</template>
```

**After:**
```html
<script id="users-data">
  {"users": [{"name": "Alice"}, {"name": "Bob"}]}
</script>

<div behavior="json-template" json-template-for="users-data">
  <template>
    <ul data-key="users">
      <template>
        <li data-key="name"></li>
      </template>
    </ul>
  </template>
</div>
```

## Implementation Details

### Template Discovery

```typescript
// Find implicit template as direct child
const template = el.querySelector(':scope > template');
```

### Array Item Template Discovery

```typescript
// 1. Check for explicit ID
const itemTemplateId = el.getAttribute('json-template-item');
if (itemTemplateId) {
  itemTemplate = document.getElementById(itemTemplateId);
}

// 2. Fall back to implicit nested template
const nestedTemplate = el.querySelector(':scope > template');
if (nestedTemplate instanceof HTMLTemplateElement) {
  itemTemplate = nestedTemplate;
}
```

**Precedence:** Explicit ID > Implicit nested template

### Template Preservation

```typescript
// Clear content but preserve template
const nodesToRemove: Node[] = [];
el.childNodes.forEach(node => {
  if (node !== templateElement) {
    nodesToRemove.push(node);
  }
});
nodesToRemove.forEach(node => {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
});

// Insert rendered content BEFORE template
el.insertBefore(clone, templateElement);
```

### Recursion Strategy

```typescript
// After rendering array: RETURN (don't recurse - items already processed)
if (isArrayWithTemplate) {
  // ... render array items ...
  return; // ← Prevents double-processing
}

// For simple values: RECURSE (for nested children)
if (typeof value === "string" || typeof value === "number") {
  el.textContent = String(value);
  // Fall through to recursion
}

// Always recurse for nested structures
for (const child of Array.from(el.childNodes)) {
  processBindings(child, data, isArrayItem);
}
```

## Breaking Changes

⚠️ **This is a breaking change** (pre-1.0 beta)

**Changed:**
- Attribute names: `json-template-source/target` → `json-template-for`
- Element type: `<template behavior>` → `<div behavior>`
- Template location: External → Nested

**Migration required** for existing code using old pattern.

## Timeline

- **v0.1.4**: Old explicit pattern
- **v0.2.0** (current): New implicit pattern

## Resources

- [Pattern Guide](./JSON-TEMPLATE-PATTERNS.md) - Complete usage examples
- [Behavior Source](../registry/behaviors/json-template/behavior.ts) - Implementation
- [Tests](../registry/behaviors/json-template/behavior.test.ts) - All patterns tested
- [Demo](./ai-qa-demo.html) - Working example

---

**Questions?** Open an issue or check the main docs!
