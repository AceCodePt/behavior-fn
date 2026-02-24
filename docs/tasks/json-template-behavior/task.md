# Task: JSON Template Behavior

## Goal

Create a new `json-template` behavior for `<template>` elements that enables declarative JSON-to-DOM data binding with automatic updates, supporting nested objects, arrays, and complex data structures.

## Context

Currently, developers need to write custom JavaScript to:
- Parse JSON from `<script type="application/json">` tags
- Map JSON data to DOM elements
- Handle nested objects and arrays
- Re-render when data changes
- Manage array item templates

This is boilerplate-heavy and error-prone. A declarative `json-template` behavior would enable developers to define data bindings purely through HTML attributes, with automatic change detection and re-rendering.

## Requirements

### Core Functionality
- The behavior **MUST** only work on `<template>` elements (semantic correctness)
- The behavior **MUST** render on `connectedCallback` (initial render)
- The behavior **MUST** use `MutationObserver` to watch the source `<script>` tag's text content and auto re-render on changes
- The behavior **MUST** clone the template content, process data bindings, and replace the target element's `innerHTML`

### Attributes
- `json-template-source` (required): ID of the `<script type="application/json">` element containing the data
- `json-template-target` (required): ID of the element where rendered content will be inserted (via `innerHTML`)
- `data-key` (on descendant elements): JSON path for data binding (supports dot notation and array indexing)
- `json-template-item` (on elements with `data-key`): ID of template to use for rendering array items

### Data Binding Rules
- **Simple values** (strings, numbers): Set as `textContent` on elements with matching `data-key`
- **Arrays**: Render using the template specified in `json-template-item` attribute
- **Objects and Booleans**: Ignored (no binding applied)
- **Nested paths**: Support both dot notation (`user.name`, `user.address.city`) and array indexing (`todos[0].title`, `users[1].name`)

### Array Rendering
- Array item templates use **relative** `data-key` paths (relative to the array item, not root JSON)
  - Example: For JSON `{todos: [{title: "Task"}]}`, inside the item template, `data-key="title"` maps to the item's `title` property
- Array rendering **MUST** always replace the element's content (no append/prepend strategies)
- Empty arrays **MUST** render nothing (leave the element empty, no placeholder content)
- Item templates **MUST** be cloned for each array item and appended to the container element

### Change Detection
- Use `MutationObserver` to watch the `textContent` of the source `<script>` tag
- On changes, re-parse JSON and re-render the entire template

### Error Handling
- `console.error` when `json-template-source` ID doesn't exist or element is not found
- `console.error` when `json-template-target` ID doesn't exist or element is not found
- `console.error` when source element contains invalid JSON
- `console.error` when `data-key` path doesn't exist in the JSON data
- `console.error` when `json-template-item` template ID doesn't exist or element is not a template
- Behavior **MUST** throw an error if `json-template-target` attribute is omitted

### Behavior Preservation
- Any `behavior` and `is` attributes on elements inside the template content **MUST** be preserved in the cloned content
- These behaviors **MUST** activate normally when the cloned content is inserted into the target (via `is` attribute or auto-loader)
- The `<template>` element with `behavior="json-template"` stays in the DOM unchanged for re-rendering

### Example Usage

```html
<!-- Source data -->
<script type="application/json" id="user-data">
{
  "name": "Sagi",
  "age": 30,
  "todos": [
    {"id": 1, "title": "Learn BehaviorFN", "done": false},
    {"id": 2, "title": "Build something cool", "done": true}
  ]
}
</script>

<!-- Target container -->
<div id="user-display"></div>

<!-- Main template -->
<template 
  is="behavioral-json-template"
  behavior="json-template"
  json-template-source="user-data"
  json-template-target="user-display">
  <div>
    <h2 data-key="name"></h2>
    <p>Age: <span data-key="age"></span></p>
    <ul data-key="todos" json-template-item="todo-item-template"></ul>
  </div>
</template>

<!-- Array item template -->
<template id="todo-item-template">
  <li>
    <span data-key="id"></span>: <span data-key="title"></span>
  </li>
</template>
```

**Expected Result in `#user-display`:**
```html
<div>
  <h2>Sagi</h2>
  <p>Age: <span>30</span></p>
  <ul>
    <li><span>1</span>: <span>Learn BehaviorFN</span></li>
    <li><span>2</span>: <span>Build something cool</span></li>
  </ul>
</div>
```

### Nested Path Examples

```html
<!-- JSON: { user: { profile: { name: "Sagi" } } } -->
<span data-key="user.profile.name"></span>  <!-- "Sagi" -->

<!-- JSON: { items: [{ title: "First" }, { title: "Second" }] } -->
<span data-key="items[0].title"></span>  <!-- "First" -->
<span data-key="items[1].title"></span>  <!-- "Second" -->

<!-- JSON: { user: { "first-name": "John", "email.address": "john@example.com" } } -->
<span data-key="user['first-name']"></span>  <!-- "John" (single quotes) -->
<span data-key='user["email.address"]'></span>  <!-- "john@example.com" (double quotes, dot preserved) -->

<!-- JSON: { data: { items: [{ "item-title": "First" }] } } -->
<span data-key="data.items[0]['item-title']"></span>  <!-- "First" (mixed notation) -->
```

## Definition of Done

- [ ] Schema created with `json-template-source`, `json-template-target` attributes
- [ ] Behavior registered in `registry/behaviors-registry.json`
- [ ] Behavior only activates on `<template>` elements (error/warning for others)
- [ ] Initial render on `connectedCallback`
- [ ] `MutationObserver` watches source `<script>` tag and triggers re-render on changes
- [ ] Simple values (strings, numbers) correctly bind to `textContent` via `data-key`
- [ ] Nested object paths work (dot notation: `user.name`, `user.address.city`)
- [ ] Array indexing works (`items[0].title`, `users[1].name`)
- [ ] Array rendering works with `json-template-item` templates
- [ ] Array item templates use relative `data-key` paths (relative to item, not root)
- [ ] Empty arrays render nothing (no content, no errors)
- [ ] Cloned content preserves `behavior` and `is` attributes, and behaviors activate normally
- [ ] Error handling covers all specified error cases with `console.error`
- [ ] Throws error when `json-template-target` is omitted
- [ ] Tests cover:
  - Simple value binding
  - Nested object paths (dot notation)
  - Array indexing
  - Array rendering with item templates
  - Empty arrays
  - Invalid JSON
  - Missing source/target/item template IDs
  - Missing data-key paths
  - Behavior preservation in cloned content
  - MutationObserver triggering re-render
- [ ] All tests pass
- [ ] Documentation updated with examples
- [ ] **User Review**: Changes verified and commit authorized
