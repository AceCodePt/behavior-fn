# JSON-Template Behavior Guide

The `json-template` behavior provides powerful data binding and template rendering for JSON data sources using intuitive curly brace interpolation syntax.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Interpolation Syntax](#interpolation-syntax)
- [Fallback Operators](#fallback-operators)
- [Array Rendering](#array-rendering)
- [Path Resolution](#path-resolution)
- [Safety Features](#safety-features)
- [Advanced Features](#advanced-features)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Basic Usage

### Minimal Example

```html
<!-- Data source -->
<script type="application/json" id="user-data">
  {
    "name": "Alice",
    "role": "admin"
  }
</script>

<!-- Template renderer -->
<div 
  is="behavioral-json-template"
  behavior="json-template" 
  json-template-for="user-data"
>
  <template>
    <h2>{name}</h2>
    <p>Role: {role}</p>
  </template>
</div>
```

**Result:**
```html
<h2>Alice</h2>
<p>Role: admin</p>
```

---

## Interpolation Syntax

### Text Content Interpolation

```html
<!-- Simple value -->
<p>{name}</p>

<!-- Multiple interpolations -->
<p>{firstName} {lastName}</p>

<!-- Mixed static and dynamic -->
<p>Welcome, {name}!</p>
```

### Attribute Interpolation

```html
<!-- Single attribute -->
<div data-id="{id}">Content</div>

<!-- Multiple attributes -->
<div 
  data-type="{type}" 
  data-status="{status}"
  class="user-{role}">
  Content
</div>

<!-- Mixed static and dynamic classes -->
<button class="btn btn-{size} btn-{variant}">Click</button>
```

### Nested Path Access

```html
<!-- Dot notation -->
<p>{user.profile.name}</p>
<p>{settings.theme.color}</p>

<!-- Bracket notation (array index) -->
<p>{items[0].title}</p>
<p>{users[1].email}</p>

<!-- Mixed notation -->
<p>{data.items[0].nested.value}</p>
```

---

## Fallback Operators

The json-template behavior supports three fallback operators with JavaScript semantics.

### `||` (Logical OR) - Default for Falsy Values

Returns the fallback value when the original value is **falsy** (undefined, null, false, 0, "", NaN).

```html
<!-- Basic usage -->
<p>{name || "Guest"}</p>

<!-- With missing data -->
{username || "Anonymous"}        <!-- undefined → "Anonymous" -->
{count || 10}                    <!-- 0 → "10" (0 is falsy) -->
{active || "N/A"}                <!-- false → "N/A" (false is falsy) -->
{message || ""}                  <!-- "" → "" (empty string is falsy) -->
```

**Use case:** Providing default values when data might be missing or falsy.

### `??` (Nullish Coalescing) - Default for Null/Undefined Only

Returns the fallback value **only** when the original value is nullish (null or undefined).

```html
<!-- Basic usage -->
<p>{price ?? "N/A"}</p>

<!-- Preserves falsy non-nullish values -->
{count ?? 10}                    <!-- 0 → "0" (0 is NOT nullish) -->
{active ?? "N/A"}                <!-- false → "false" (false is NOT nullish) -->
{message ?? "None"}              <!-- "" → "" (empty string is NOT nullish) -->
{missing ?? "default"}           <!-- undefined → "default" -->
{nullable ?? "default"}          <!-- null → "default" -->
```

**Use case:** Providing defaults only for truly missing data while preserving falsy values like 0, false, or "".

### `&&` (Logical AND) - Conditional Display

Returns the fallback value when the original value is **truthy**.

```html
<!-- Basic usage -->
<p>{premium && "⭐ Pro"}</p>

<!-- Conditional badges/indicators -->
{verified && "✓"}                <!-- true → "✓" -->
{premium && "⭐ Premium"}         <!-- true → "⭐ Premium" -->
{count && "items available"}     <!-- 5 → "items available" -->
{admin && "Admin Access"}        <!-- true → "Admin Access" -->

<!-- When value is falsy, shows the original value -->
{active && "online"}             <!-- false → "false" -->
{count && "items"}               <!-- 0 → "0" -->
```

**Use case:** Conditionally showing content only when a condition is truthy.

### Operator Comparison Table

| Operator | Syntax | Falsy Behavior | Nullish Behavior | Truthy Behavior |
|----------|--------|----------------|------------------|-----------------|
| `\|\|` | `{x \|\| "default"}` | Uses fallback | Uses fallback | Keeps value |
| `??` | `{x ?? "default"}` | Keeps value* | Uses fallback | Keeps value |
| `&&` | `{x && "value"}` | Keeps value | Returns "" | Uses fallback |

*Except for null/undefined which are both falsy and nullish.

### Operator Examples Side-by-Side

```html
<!-- Data: { count: 0, status: null, premium: true } -->

<p>{count || 10}</p>     <!-- "10" (0 is falsy) -->
<p>{count ?? 10}</p>     <!-- "0" (0 is not nullish) -->
<p>{count && "items"}</p><!-- "0" (0 is falsy, no substitution) -->

<p>{status || "unknown"}</p>     <!-- "unknown" (null is falsy) -->
<p>{status ?? "unknown"}</p>     <!-- "unknown" (null is nullish) -->
<p>{status && "active"}</p>      <!-- "" (null is falsy, returns empty) -->

<p>{premium || "basic"}</p>      <!-- "true" (true is truthy) -->
<p>{premium ?? "basic"}</p>      <!-- "true" (true is not nullish) -->
<p>{premium && "⭐ Pro"}</p>     <!-- "⭐ Pro" (true is truthy) -->
```

---

## Array Rendering

### Root-Level Arrays

When the root data is an array, the template repeats automatically for each item.

```html
<script type="application/json" id="todos">
  [
    { "title": "Buy groceries", "done": false },
    { "title": "Walk dog", "done": true },
    { "title": "Write docs", "done": false }
  ]
</script>

<div behavior="json-template" json-template-for="todos">
  <template>
    <div class="todo">
      <input type="checkbox" checked="{done}">
      <span>{title || "Untitled"}</span>
    </div>
  </template>
</div>
```

**Result:** 3 todo items rendered.

#### Empty Arrays

**Important:** Empty root-level arrays render the template **once** with an empty context (`{}`). This enables forms and UI elements to exist before data arrives.

```html
<script type="application/json" id="items">
  []
</script>

<div behavior="json-template" json-template-for="items">
  <template>
    <div class="item">{name || "Guest"}</div>
  </template>
</div>
```

**Result:** Template renders once with fallback value: `<div class="item">Guest</div>`

**Why this matters:**

This pattern enables forms that need to exist before data arrives (chat interfaces, search forms, etc.):

```html
<script type="application/json" id="messages">
  []
</script>

<div behavior="json-template" json-template-for="messages">
  <template>
    <form>
      <input name="query" placeholder="{query || 'Enter message'}">
      <input name="session" value="{session || '-'}">
      <button type="submit">Send</button>
    </form>
  </template>
</div>
```

**Result:** Form renders immediately with fallback values, allowing users to submit the first message.

**Reactive behavior:** When the data changes from empty to populated (or vice versa), the template automatically re-renders:

```javascript
// Initially empty - renders ONCE with empty context
document.getElementById('items').textContent = '[]';
// Result: 1 item with fallback values

// Add items dynamically - renders ONCE PER ITEM
document.getElementById('items').textContent = JSON.stringify([
  { name: 'Item 1' },
  { name: 'Item 2' }
]);
// Result: 2 items with actual data

// Clear items - back to single render with empty context
document.getElementById('items').textContent = '[]';
// Result: 1 item with fallback values
```

### Nested Arrays with `data-array`

For arrays within objects, use the `data-array` attribute on a nested `<template>`.

```html
<script type="application/json" id="user">
  {
    "name": "Alice",
    "projects": [
      { "title": "BehaviorFN", "stars": 100 },
      { "title": "AutoWC", "stars": 50 }
    ]
  }
</script>

<div behavior="json-template" json-template-for="user">
  <template>
    <h2>{name}</h2>
    <ul>
      <template data-array="projects">
        <li>{title}: {stars ?? 0} ⭐</li>
      </template>
    </ul>
  </template>
</div>
```

**Result:**
```html
<h2>Alice</h2>
<ul>
  <li>BehaviorFN: 100 ⭐</li>
  <li>AutoWC: 50 ⭐</li>
</ul>
```

#### Empty Nested Arrays

**Note:** Empty **nested** arrays (with `data-array` attribute) behave differently - they render **nothing** (not even once). This is the correct behavior for nested arrays.

```html
<script type="application/json" id="user">
  {
    "name": "Alice",
    "projects": []
  }
</script>

<div behavior="json-template" json-template-for="user">
  <template>
    <h2>{name}</h2>
    <ul>
      <template data-array="projects">
        <li>{title}</li>
      </template>
    </ul>
  </template>
</div>
```

**Result:**
```html
<h2>Alice</h2>
<ul>
  <!-- No <li> elements - nested arrays don't render when empty -->
</ul>
```

**The difference:**
- **Root-level empty array (`[]`)**: Renders template **once** with empty context
- **Nested empty array (`data-array="items"` where items is `[]`)**: Renders **nothing** (zero times)

### Deeply Nested Arrays

```html
<script type="application/json" id="data">
  {
    "departments": [
      {
        "name": "Engineering",
        "employees": [
          { "name": "Alice" },
          { "name": "Bob" }
        ]
      }
    ]
  }
</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <template data-array="departments">
      <h3>{name}</h3>
      <ul>
        <template data-array="employees">
          <li>{name || "Unknown"}</li>
        </template>
      </ul>
    </template>
  </template>
</div>
```

---

## Path Resolution

### Simple Properties

```html
{name}        <!-- data.name -->
{age}         <!-- data.age -->
{active}      <!-- data.active -->
```

### Nested Objects (Dot Notation)

```html
{user.name}                    <!-- data.user.name -->
{user.profile.email}           <!-- data.user.profile.email -->
{settings.theme.color}         <!-- data.settings.theme.color -->
```

### Array Access (Bracket Notation)

```html
{items[0]}                     <!-- data.items[0] -->
{items[0].title}               <!-- data.items[0].title -->
{users[1].address.city}        <!-- data.users[1].address.city -->
```

### Quoted Property Names

Use bracket notation with quotes for properties containing special characters:

```html
{obj['first-name']}            <!-- data.obj["first-name"] -->
{obj["email.address"]}         <!-- data.obj["email.address"] -->
{data['user-id']}              <!-- data.data["user-id"] -->
```

### Mixed Notation

```html
{user.items[0].title}          <!-- Dot + bracket -->
{data['users'][0].name}        <!-- Bracket + bracket + dot -->
```

---

## Safety Features

### Deep Path Safety (Null-Safe Traversal)

The behavior safely handles undefined intermediate properties without throwing errors.

**Problem in JavaScript:**
```javascript
const data = { user: {} };
data.user.profile.email;  // ❌ TypeError: Cannot read property 'email' of undefined
```

**Safe in JSON-Template:**
```html
<!-- Data: { user: {} } -->
{user.profile.email}  <!-- ✅ Returns undefined → renders "" (no error!) -->
```

#### How It Works

The path resolver checks at each step:

```typescript
// Traversing user.profile.email
1. Access 'user' → ✅ Found
2. Access 'profile' → ❌ Undefined - STOP SAFELY
3. Return undefined (never tries to access 'email')
```

This is equivalent to **JavaScript optional chaining**: `data?.user?.profile?.email`

#### Examples

```html
<!-- All safe, no errors! -->
{a.b.c}                        <!-- Safe even if b is undefined -->
{user.profile.email}           <!-- Safe even if profile is undefined -->
{app.settings.theme.color}     <!-- Safe even if settings.theme is undefined -->
{data.nested.deep.value}       <!-- Safe at any depth -->
```

#### With Fallback Operators

This safety makes fallback operators extremely powerful:

```html
<!-- Data: { user: {} } (profile doesn't exist) -->
<p>{user.profile.email || "no-email@example.com"}</p>
<!-- ✅ Result: "no-email@example.com" -->

<!-- Data: { app: { settings: {} } } (theme doesn't exist) -->
<p>{app.settings.theme.color ?? "blue"}</p>
<!-- ✅ Result: "blue" -->

<!-- Data: { user: null } -->
<p>{user.profile.name ?? "Anonymous"}</p>
<!-- ✅ Result: "Anonymous" -->
```

### Graceful Degradation

Missing paths return empty strings by default:

```html
<!-- Data: {} -->
{nonexistent.path}     <!-- Renders "" -->
{missing.value}        <!-- Renders "" -->
```

### Type Safety

Only primitive values (string, number, boolean) are interpolated. Objects and arrays render as empty strings:

```html
<!-- Data: { obj: { nested: "value" }, arr: [1, 2, 3] } -->
{obj}      <!-- Renders "" (can't interpolate objects) -->
{arr}      <!-- Renders "" (can't interpolate arrays) -->
```

---

## Advanced Features

### Literal Values as Operands

You can use quoted strings as literal values on the left side of operators:

```html
<!-- Literal string evaluation -->
{"&&" && "||"}                 <!-- "&&" is truthy → "||" -->
{"" || "empty"}                <!-- "" is falsy → "empty" -->
{"text" ?? "fallback"}         <!-- "text" is not nullish → "text" -->

<!-- Operator symbols as data -->
{"Use && for AND" && "✓"}     <!-- Shows "✓" -->
{"Use || for OR" || "info"}   <!-- Shows "Use || for OR" -->
```

### Quoted vs Unquoted Keywords

**Unquoted = Path (property lookup):**
```html
{undefined ?? "fallback"}      <!-- Looks for data.undefined property -->
{null ?? "N/A"}                <!-- Looks for data.null property -->
```

**Quoted = Literal string:**
```html
{"undefined" ?? "fallback"}    <!-- Literal string "undefined" (truthy) → "undefined" -->
{"null" ?? "N/A"}              <!-- Literal string "null" (truthy) → "null" -->
```

### Operators Inside Quoted Strings

Operators inside quoted strings are treated as literal text:

```html
{message || "Use || for defaults"}     <!-- Fallback contains "||" as text -->
{value && "Fish && Chips"}             <!-- Fallback contains "&&" as text -->
{info ?? "Use ?? for nullish"}         <!-- Fallback contains "??" as text -->
```

### Whitespace Handling

The parser is whitespace-tolerant:

```html
{name||"Guest"}                <!-- Works -->
{name || "Guest"}              <!-- Works -->
{ name  ||  "Guest" }          <!-- Works -->
{  name||"Guest"  }            <!-- Works -->
```

---

## Common Patterns

### User Profile Display

```html
<script type="application/json" id="profile">
  {
    "name": "Alice",
    "email": "alice@example.com",
    "verified": true,
    "premium": false,
    "avatar": null
  }
</script>

<div behavior="json-template" json-template-for="profile">
  <template>
    <div class="profile">
      <h2>{name || "Anonymous"} {verified && "✓"}</h2>
      <p>Email: {email ?? "Not provided"}</p>
      <span class="badge">{premium && "⭐ Premium"}</span>
      <img src="{avatar || '/default-avatar.png'}" alt="{name}">
    </div>
  </template>
</div>
```

### Product Listing

```html
<script type="application/json" id="products">
  [
    { "name": "Laptop", "price": 999, "inStock": true, "discount": 0 },
    { "name": "Mouse", "price": 29, "inStock": false, "discount": 5 },
    { "name": "Keyboard", "price": 79, "inStock": true, "discount": null }
  ]
</script>

<div behavior="json-template" json-template-for="products">
  <template>
    <div class="product">
      <h3>{name || "Unknown Product"}</h3>
      <p class="price">${price ?? "N/A"}</p>
      <span class="stock">{inStock && "✓ In Stock"}</span>
      <span class="discount">{discount && "Save $"}{discount}</span>
    </div>
  </template>
</div>
```

### Dashboard Stats

```html
<script type="application/json" id="stats">
  {
    "views": 0,
    "users": 1250,
    "revenue": null,
    "growth": 15.5
  }
</script>

<div behavior="json-template" json-template-for="stats">
  <template>
    <div class="stats">
      <div class="stat">
        <span class="label">Views</span>
        <span class="value">{views ?? "N/A"}</span>
      </div>
      <div class="stat">
        <span class="label">Users</span>
        <span class="value">{users || "0"}</span>
      </div>
      <div class="stat">
        <span class="label">Revenue</span>
        <span class="value">${revenue ?? "0.00"}</span>
      </div>
      <div class="stat">
        <span class="label">Growth</span>
        <span class="value">{growth && "+"}{growth ?? 0}%</span>
      </div>
    </div>
  </template>
</div>
```

### Nested Comments with Replies

```html
<script type="application/json" id="comments">
  {
    "comments": [
      {
        "author": "Alice",
        "text": "Great article!",
        "verified": true,
        "replies": [
          { "author": "Bob", "text": "I agree!" }
        ]
      }
    ]
  }
</script>

<div behavior="json-template" json-template-for="comments">
  <template>
    <template data-array="comments">
      <div class="comment">
        <strong>{author || "Anonymous"} {verified && "✓"}</strong>
        <p>{text}</p>
        <div class="replies">
          <template data-array="replies">
            <div class="reply">
              <strong>{author || "Anonymous"}</strong>
              <p>{text}</p>
            </div>
          </template>
        </div>
      </div>
    </template>
  </template>
</div>
```

---

## Troubleshooting

### Empty Output

**Problem:** Template renders but shows nothing.

**Causes:**
1. Missing `json-template-for` attribute
2. Incorrect data source ID
3. Empty or invalid JSON in data source
4. Missing `<template>` element

**Solution:**
```html
<!-- Check all required elements -->
<script type="application/json" id="data-id">{"name": "test"}</script>
<div behavior="json-template" json-template-for="data-id">
  <template>
    <div>{name}</div>
  </template>
</div>
```

### Template Not Rendering

**Problem:** Template shows as-is with `{curly braces}`.

**Causes:**
1. Missing `is="behavioral-json-template"` attribute
2. Missing `behavior="json-template"` attribute
3. Behavior not registered

**Solution:**
```html
<div 
  is="behavioral-json-template"
  behavior="json-template" 
  json-template-for="data-id"
>
  <template>...</template>
</div>
```

### Fallback Not Working

**Problem:** Expected fallback value but got original value.

**Cause:** Using wrong operator for the use case.

**Solution:**
```html
<!-- For falsy values (including 0, false, "") use || -->
{count || 10}

<!-- For null/undefined only (preserve 0, false, "") use ?? -->
{count ?? 10}

<!-- For truthy conditions use && -->
{active && "Online"}
```

### Array Not Repeating

**Problem:** Array data shows once or not at all.

**Causes:**
1. Root-level array: Missing behavioral host setup
2. Nested array: Missing `data-array` attribute on `<template>`

**Solution:**
```html
<!-- Root-level array -->
<script type="application/json" id="list">[{...}, {...}]</script>
<div behavior="json-template" json-template-for="list">
  <template>
    <div>{title}</div>
  </template>
</div>

<!-- Nested array -->
<script type="application/json" id="data">{"items": [{...}, {...}]}</script>
<div behavior="json-template" json-template-for="data">
  <template>
    <template data-array="items">
      <div>{title}</div>
    </template>
  </template>
</div>
```

### Deep Path Returns Empty

**Problem:** `{user.profile.email}` renders empty but should have value.

**Cause:** Intermediate property is missing or null.

**Solution:** Use fallback operators:
```html
{user.profile.email || "no-email@example.com"}
{user.profile.email ?? "Not provided"}
```

**Debug:** Check data structure matches expected path.

---

## Attribute Reference

### `json-template-for`

**Type:** String (required)  
**Description:** ID of the `<script type="application/json">` element containing the data source.

```html
<div behavior="json-template" json-template-for="my-data-id">
```

---

## Best Practices

1. **Use `??` for numeric/boolean values** to preserve 0 and false
2. **Use `||` for optional strings** to catch empty strings too
3. **Use `&&` for conditional display** of badges, indicators
4. **Keep templates simple** - complex logic belongs in data transformation
5. **Use fallbacks liberally** - makes templates resilient to incomplete data
6. **Nest templates for arrays** - use `data-array` attribute for clarity
7. **Name data sources meaningfully** - IDs should describe the data
8. **Validate JSON** - invalid JSON fails silently

---

## Performance Notes

- **Reactivity:** Templates re-render automatically when data source changes (via MutationObserver)
- **Cloning:** Template is cloned before processing (preserves original)
- **Array rendering:** Efficient - processes each item once
- **Path resolution:** Cached at parse time, resolved at render time
- **No re-parsing:** Operators parsed once, evaluated at render time

---

## Browser Support

- **Modern browsers** with Web Components support
- **Custom Elements v1** required
- **MutationObserver** for reactivity
- **Template element** support required

---

## Related Behaviors

- **content-setter:** For simpler text/HTML content updates
- **request:** For fetching JSON data dynamically
- **compute:** For calculated values based on attributes

---

## Examples Repository

See the `examples/` directory for complete working examples:
- Basic interpolation
- Fallback operators
- Array rendering
- Nested arrays
- Real-world patterns
