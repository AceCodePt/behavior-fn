# JSON Template Behavior - Pattern Guide

The `json-template` behavior provides reactive JSON-to-HTML rendering using curly brace interpolation syntax (`{path}`).

## Core Concept

The behavior watches a JSON data source and automatically re-renders HTML when the data changes.

**Key Features:**
- **Curly brace interpolation**: `{name}`, `{user.email}`, `{items[0].title}`
- **Reactive updates**: Automatically re-renders when data changes
- **Array rendering**: Using `data-array` attribute on nested templates
- **Preserved templates**: Original `<template>` elements are kept for re-rendering

## Syntax Overview

### Interpolation Patterns

```
{name}                    → Simple property
{user.email}              → Nested property (dot notation)
{items[0].title}          → Array index access
{user['first-name']}      → Bracket notation (for keys with special chars)
{user.items[0].price}     → Mixed notation
```

### Array Rendering

```html
<template data-array="path">
  <!-- Content rendered for each array item -->
  {itemProperty}
</template>
```

---

## Basic Patterns

### 1. Simple Value Interpolation

**Data:**
```html
<script type="application/json" id="user-data">
{
  "name": "Sagi",
  "email": "sagi@example.com",
  "age": 30
}
</script>
```

**Template:**
```html
<div 
  is="behavioral-json-template"
  behavior="json-template" 
  json-template-for="user-data"
>
  <template>
    <div class="profile">
      <h2>{name}</h2>
      <p>Email: {email}</p>
      <p>Age: {age}</p>
    </div>
  </template>
</div>
```

**Result:**
```html
<div class="profile">
  <h2>Sagi</h2>
  <p>Email: sagi@example.com</p>
  <p>Age: 30</p>
</div>
<template>...</template> <!-- Preserved -->
```

---

### 2. Nested Object Paths

**Data:**
```html
<script type="application/json" id="user-data">
{
  "user": {
    "profile": {
      "name": "Sagi",
      "location": "Israel",
      "contact": {
        "email": "sagi@example.com"
      }
    }
  }
}
</script>
```

**Template:**
```html
<div 
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="user-data"
>
  <template>
    <div>
      <h2>{user.profile.name}</h2>
      <p>Location: {user.profile.location}</p>
      <p>Email: {user.profile.contact.email}</p>
    </div>
  </template>
</div>
```

**Result:**
```html
<div>
  <h2>Sagi</h2>
  <p>Location: Israel</p>
  <p>Email: sagi@example.com</p>
</div>
<template>...</template>
```

---

### 3. Array Rendering

**Data:**
```html
<script type="application/json" id="users-data">
{
  "users": [
    {"name": "Alice", "age": 25},
    {"name": "Bob", "age": 30},
    {"name": "Charlie", "age": 35}
  ]
}
</script>
```

**Template:**
```html
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="users-data"
>
  <template>
    <ul>
      <template data-array="users">
        <li>{name} is {age} years old</li>
      </template>
    </ul>
  </template>
</div>
```

**Result:**
```html
<ul>
  <li>Alice is 25 years old</li>
  <li>Bob is 30 years old</li>
  <li>Charlie is 35 years old</li>
  <template data-array="users">...</template> <!-- Preserved -->
</ul>
<template>...</template>
```

**How it works:**
1. Outer `<template>` defines the container structure
2. Inner `<template data-array="users">` marks array iteration
3. Content inside inner template is cloned for each array item
4. Each item has its own data context (so `{name}` refers to the current user's name)

---

### 4. Root-Level Array

If your root data is an array (not an object with an array property):

**Data:**
```html
<script type="application/json" id="items-data">
[
  {"title": "Item 1", "price": 10},
  {"title": "Item 2", "price": 20},
  {"title": "Item 3", "price": 30}
]
</script>
```

**Template:**
```html
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="items-data"
>
  <template>
    <div class="item">
      <h3>{title}</h3>
      <p>Price: ${price}</p>
    </div>
  </template>
</div>
```

**Result:**
```html
<div class="item">
  <h3>Item 1</h3>
  <p>Price: $10</p>
</div>
<div class="item">
  <h3>Item 2</h3>
  <p>Price: $20</p>
</div>
<div class="item">
  <h3>Item 3</h3>
  <p>Price: $30</p>
</div>
<template>...</template>
```

**Key Insight:** When root data is an array, the outer template is rendered once per item automatically (no `data-array` needed on the outer template).

**This is powerful because:**
- ✅ Simpler syntax for list rendering
- ✅ Perfect for accumulating items (chat messages, notifications, logs)
- ✅ Works seamlessly with `request` behavior's array append strategies

---

### 4b. Root-Level Array + Request Integration (Chat Pattern)

**The Power Pattern:** Combine root-level array with `request` behavior's `appendToArray` swap strategy to build reactive UIs that accumulate data.

**Example: Chat Interface**

```html
<!-- Data Store: Array of conversation turns -->
<script id="answers" type="application/json">[]</script>

<!-- Form that appends API responses to array -->
<form
  id="chat-form"
  is="behavioral-json-template-request"
  behavior="json-template request"
  json-template-for="answers"
  request-url="/api/chat"
  request-method="GET"
  request-target="answers"
  request-swap="appendToArray"
>
  <template>
    <input type="text" name="query" placeholder="Ask a question...">
    <!-- Access first item's session, fallback to "-" if empty -->
    <input type="hidden" name="session" value="{[0].session || -}">
    <button type="submit">Send</button>
  </template>
</form>

<!-- Messages render from same array -->
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="answers"
>
  <template>
    <div class="message">
      <p>{text}</p>
      <small>{timestamp}</small>
    </div>
  </template>
</div>
```

**The Flow:**

1. **Initial state:** `answers = []`
   - Form renders with `session = "-"`
   - No messages shown

2. **User submits:** "Hello"
   - Request sends: `?query=Hello&session=-`
   - API responds: `{"text": "Hi there!", "session": "abc123", "timestamp": "..."}`
   - `appendToArray` pushes response into array
   - `answers = [{"text": "Hi there!", "session": "abc123", ...}]`

3. **Both behaviors re-render reactively:**
   - Form updates: `session = "abc123"` (from `[0].session`)
   - Messages show 1 item

4. **User submits again:** "How are you?"
   - Request sends: `?query=How are you?&session=abc123`
   - API responds: `{"text": "I'm good!", "session": "abc123", ...}`
   - `appendToArray` pushes again
   - `answers = [{...}, {"text": "I'm good!", ...}]`

5. **Both re-render again:**
   - Form still has `session = "abc123"`
   - Messages now show 2 items

**Why This Works:**
- ✅ Single source of truth (`answers` array)
- ✅ Both behaviors watch same data source
- ✅ Form is data-driven (regenerates with each update)
- ✅ Session automatically flows through conversation
- ✅ No manual DOM manipulation needed
- ✅ No coordinator script required

**Request Swap Strategies for Arrays:**

| Strategy | Use Case | Example |
|----------|----------|---------|
| `appendToArray` | Push response (object or primitive) to array | Chat messages, logs, notifications |
| `appendSpreadToArray` | Spread response array into existing array | Pagination, infinite scroll |
| `innerHTML` | Replace entire content | Full page updates |

---

### 5. Nested Arrays

**Data:**
```html
<script type="application/json" id="org-data">
{
  "departments": [
    {
      "name": "Engineering",
      "employees": [
        {"name": "Alice", "role": "Developer"},
        {"name": "Bob", "role": "Lead"}
      ]
    },
    {
      "name": "Sales",
      "employees": [
        {"name": "Charlie", "role": "Manager"}
      ]
    }
  ]
}
</script>
```

**Template:**
```html
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="org-data"
>
  <template>
    <div>
      <template data-array="departments">
        <section class="dept">
          <h2>{name}</h2>
          <ul>
            <template data-array="employees">
              <li>{name} - {role}</li>
            </template>
          </ul>
        </section>
      </template>
    </div>
  </template>
</div>
```

**Result:**
```html
<div>
  <section class="dept">
    <h2>Engineering</h2>
    <ul>
      <li>Alice - Developer</li>
      <li>Bob - Lead</li>
      <template data-array="employees">...</template>
    </ul>
  </section>
  <section class="dept">
    <h2>Sales</h2>
    <ul>
      <li>Charlie - Manager</li>
      <template data-array="employees">...</template>
    </ul>
  </section>
  <template data-array="departments">...</template>
</div>
<template>...</template>
```

**Each nesting level maintains its own data context!**

---

### 6. Array Index Access

Access specific array items directly:

**Data:**
```html
<script type="application/json" id="data">
{
  "users": [
    {"name": "Alice"},
    {"name": "Bob"},
    {"name": "Charlie"}
  ]
}
</script>
```

**Template:**
```html
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="data"
>
  <template>
    <div>
      <p>First: {users[0].name}</p>
      <p>Second: {users[1].name}</p>
      <p>Third: {users[2].name}</p>
    </div>
  </template>
</div>
```

**Result:**
```html
<div>
  <p>First: Alice</p>
  <p>Second: Bob</p>
  <p>Third: Charlie</p>
</div>
<template>...</template>
```

---

### 7. Attribute Interpolation

Curly braces work in **any attribute**:

**Data:**
```html
<script type="application/json" id="data">
{
  "user": {
    "id": "user-123",
    "avatar": "https://example.com/avatar.jpg",
    "name": "Sagi"
  }
}
</script>
```

**Template:**
```html
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="data"
>
  <template>
    <div id="{user.id}" class="user-{user.id}">
      <img src="{user.avatar}" alt="{user.name}">
      <a href="/users/{user.id}">View Profile</a>
    </div>
  </template>
</div>
```

**Result:**
```html
<div id="user-123" class="user-user-123">
  <img src="https://example.com/avatar.jpg" alt="Sagi">
  <a href="/users/user-123">View Profile</a>
</div>
<template>...</template>
```

---

### 8. Mixed Static and Dynamic Content

Combine static text with interpolated values:

**Template:**
```html
<template>
  <p>Hello, {user.name}! You have {notifications.count} new messages.</p>
  <p>Status: {user.status}</p>
</template>
```

---

## Advanced Patterns

### Bracket Notation for Special Characters

Use bracket notation for keys with special characters:

**Data:**
```json
{
  "user": {
    "first-name": "Sagi",
    "last-name": "Cohen",
    "email.address": "sagi@example.com"
  }
}
```

**Template:**
```html
<template>
  <p>{user['first-name']} {user['last-name']}</p>
  <p>{user['email.address']}</p>
</template>
```

---

### Complex Nested Arrays

**Data:**
```json
{
  "organization": {
    "departments": [
      {
        "name": "Engineering",
        "teams": [
          {
            "name": "Frontend",
            "members": [
              {"name": "Alice", "role": "Developer"},
              {"name": "Bob", "role": "Lead"}
            ]
          },
          {
            "name": "Backend",
            "members": [
              {"name": "Charlie", "role": "Developer"}
            ]
          }
        ]
      }
    ]
  }
}
```

**Template:**
```html
<template>
  <div>
    <template data-array="organization.departments">
      <section>
        <h2>Department: {name}</h2>
        <template data-array="teams">
          <div class="team">
            <h3>Team: {name}</h3>
            <ul>
              <template data-array="members">
                <li>{name} - {role}</li>
              </template>
            </ul>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
```

---

## How It Works

### Data Flow

```
1. Element with json-template-for="data-id"
   ↓
2. Finds <script id="data-id" type="application/json">
   ↓
3. Sets up MutationObserver to watch for changes
   ↓
4. On change: Parses JSON
   ↓
5. Finds <template> child
   ↓
6. Clones template content (off-DOM, in DocumentFragment)
   ↓
7. Processes interpolation:
   - Text nodes: Replace {path} with values
   - Attributes: Replace {path} in attribute values
   - Arrays: Clone inner template for each item
   ↓
8. Clears existing rendered content (preserves template)
   ↓
9. Inserts new content before template
```

### Reactive Updates

The behavior uses `MutationObserver` to watch the data source:

```javascript
mutationObserver.observe(sourceElement, {
  characterData: true,  // Watches text changes
  childList: true,      // Watches child nodes
  subtree: true         // Watches all descendants
});
```

**This means:**
- Change the `textContent` of the script tag → auto re-render
- Works with any tool that modifies the JSON (e.g., `request` behavior)

---

## Integration with Request Behavior

The `request` behavior can update JSON script tags using the `request-swap` attribute. When targeting `<script type="application/json">` elements, special swap strategies become available.

### Basic Pattern: Replace Data

```html
<!-- Data Store -->
<script id="api-data" type="application/json">
{}
</script>

<!-- Fetch data via request behavior -->
<button
  is="behavioral-request"
  behavior="request"
  request-url="/api/users"
  request-method="GET"
  request-target="api-data"
  request-swap="innerHTML"
>
  Load Users
</button>

<!-- Auto-renders when api-data updates -->
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="api-data"
>
  <template>
    <ul>
      <template data-array="users">
        <li>{name} - {email}</li>
      </template>
    </ul>
  </template>
</div>
```

**Flow:**
1. User clicks button
2. Request behavior fetches `/api/users`
3. Updates `#api-data` with response JSON (replaces entire content)
4. json-template observes change and re-renders

---

### Advanced Pattern: Accumulate Data

When the target is a `<script type="application/json">` containing an **array**, you can use special array swap strategies:

#### `request-swap="appendToArray"`

**Pushes response (object or value) to the end of array.**

```html
<!-- Start with empty array -->
<script id="messages" type="application/json">[]</script>

<form
  is="behavioral-request"
  behavior="request"
  request-url="/api/send"
  request-target="messages"
  request-swap="appendToArray"
>
  <input type="text" name="text">
  <button>Send</button>
</form>

<!-- Renders all messages -->
<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="messages"
>
  <template>
    <div class="msg">{text}</div>
  </template>
</div>
```

**Behavior:**
```javascript
// Initial: messages = []
// Response: {"text": "Hello", "id": 1}
// Result: messages = [{"text": "Hello", "id": 1}]

// Next Response: {"text": "World", "id": 2}
// Result: messages = [{"text": "Hello", "id": 1}, {"text": "World", "id": 2}]
```

**Use Cases:**
- Chat messages
- Activity logs
- Notifications
- Append-only data streams

---

#### `request-swap="appendSpreadToArray"`

**Spreads response array items into existing array.**

```html
<script id="items" type="application/json">[]</script>

<button
  is="behavioral-request"
  behavior="request"
  request-url="/api/items?page=1"
  request-target="items"
  request-swap="appendSpreadToArray"
>
  Load More
</button>

<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="items"
>
  <template>
    <div class="item">{title}</div>
  </template>
</div>
```

**Behavior:**
```javascript
// Initial: items = []
// Response: [{"title": "Item 1"}, {"title": "Item 2"}]
// Result: items = [{"title": "Item 1"}, {"title": "Item 2"}]

// Next Response: [{"title": "Item 3"}, {"title": "Item 4"}]
// Result: items = [
//   {"title": "Item 1"},
//   {"title": "Item 2"},
//   {"title": "Item 3"},
//   {"title": "Item 4"}
// ]
```

**Use Cases:**
- Infinite scroll / pagination
- Loading more search results
- Batch data loading
- API responses that return arrays

---

#### `request-swap="prependToArray"`

**Pushes response (object or value) to the beginning of array.**

```html
<script id="notifications" type="application/json">[]</script>

<!-- New notifications appear at top -->
<form
  is="behavioral-request"
  behavior="request"
  request-url="/api/notifications/check"
  request-target="notifications"
  request-swap="prependToArray"
  request-trigger="load"
>
</form>

<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="notifications"
>
  <template>
    <div class="notification">{message}</div>
  </template>
</div>
```

**Behavior:**
```javascript
// Initial: notifications = [{"message": "Old", "id": 1}]
// Response: {"message": "New!", "id": 2}
// Result: notifications = [{"message": "New!", "id": 2}, {"message": "Old", "id": 1}]
```

**Use Cases:**
- Latest-first notifications
- Real-time feeds (newest at top)
- Activity streams
- Reverse chronological lists

---

#### `request-swap="prependSpreadToArray"`

**Spreads response array items to the beginning of existing array.**

```html
<script id="feed" type="application/json">[]</script>

<button
  is="behavioral-request"
  behavior="request"
  request-url="/api/feed/newer"
  request-target="feed"
  request-swap="prependSpreadToArray"
>
  Load Newer Posts
</button>

<div
  is="behavioral-json-template"
  behavior="json-template"
  json-template-for="feed"
>
  <template>
    <article>{title}</article>
  </template>
</div>
```

**Behavior:**
```javascript
// Initial: feed = [{"title": "Post 3"}, {"title": "Post 4"}]
// Response: [{"title": "Post 1"}, {"title": "Post 2"}]
// Result: feed = [
//   {"title": "Post 1"},
//   {"title": "Post 2"},
//   {"title": "Post 3"},
//   {"title": "Post 4"}
// ]
```

**Use Cases:**
- Load newer content
- Reverse pagination (load previous page)
- Prepending batch data
- Timeline updates

---

### Request Swap Strategy Reference

| Strategy | Target | Behavior | Use Case |
|----------|--------|----------|----------|
| `innerHTML` | Any element | Replace content with response HTML | Full updates |
| `outerHTML` | Any element | Replace element with response HTML | Component swap |
| `beforeend` | Any element | Insert response HTML at end | Append HTML |
| `afterend` | Any element | Insert response HTML after | Insert HTML |
| `appendToArray` | JSON array script | Push response to end of array | Chat, logs, notifications |
| `appendSpreadToArray` | JSON array script | Spread response array to end | Pagination, infinite scroll |
| `prependToArray` | JSON array script | Push response to start of array | Latest-first feeds |
| `prependSpreadToArray` | JSON array script | Spread response array to start | Load newer content |

**Note:** Array strategies only work when:
- Target is `<script type="application/json">`
- Existing content is a valid JSON array (`[]`)
- Response is valid JSON

---

## Edge Cases

### Empty Arrays

```html
<template data-array="users">
  <li>{name}</li>
</template>
```

If `users` is `[]`, nothing is rendered (template is preserved).

### Missing Paths

```html
<p>{nonexistent.path}</p>
```

Returns empty string (no error, graceful degradation).

### Invalid Array Marker

```html
<template data-array="user"><!-- user is object, not array -->
  <div>{name}</div>
</template>
```

Logs error: `[json-template] Expected array at path "user", got object`

### Template Not Found

If no `<template>` child exists:

Logs error: `[json-template] No <template> element found as direct child`

---

## Template Preservation

**Critical:** Templates are **NEVER** removed during rendering.

**Why?**
- ✅ Re-rendering uses the same template (no re-parsing)
- ✅ Performance: Clone is faster than re-parsing HTML
- ✅ Debugging: Inspect original template structure

**Before Rendering:**
```html
<div behavior="json-template">
  <template>
    <p>{name}</p>
  </template>
</div>
```

**After Rendering:**
```html
<div behavior="json-template">
  <p>Sagi</p>
  <template>
    <p>{name}</p>
  </template>
</div>
```

**After Re-rendering (data changed):**
```html
<div behavior="json-template">
  <p>New Name</p>
  <template>
    <p>{name}</p>
  </template>
</div>
```

---

## Performance

### Optimizations

1. **Off-DOM Processing**: All interpolation happens in a `DocumentFragment` before insertion
2. **Single DOM Operation**: Only one `insertBefore()` call at the end
3. **Template Cloning**: Faster than parsing HTML strings
4. **Minimal Reflows**: Content cleared and inserted in one pass

### Best Practices

✅ **DO: Keep templates simple**
```html
<template>
  <div>{name}</div>
</template>
```

✅ **DO: Use semantic HTML**
```html
<template data-array="items">
  <li>{title}</li>
</template>
```

❌ **AVOID: Excessive nesting**
```html
<!-- Too deep -->
<template data-array="a">
  <template data-array="b">
    <template data-array="c">
      <template data-array="d">
        <div>{value}</div>
      </template>
    </template>
  </template>
</template>
```

Flatten your data structure when possible.

---

## Debugging

### Console Errors

Errors are automatically logged with the `[json-template]` prefix:

- `[json-template] json-template-for attribute is required`
- `[json-template] Data source element not found: data-id`
- `[json-template] No <template> element found as direct child`
- `[json-template] Invalid JSON in source element`
- `[json-template] Expected array at path "path", got object`

### Inspect in DevTools

```javascript
// Find the container
const container = document.querySelector('[behavior="json-template"]');

// Check the template
console.log(container.querySelector('template'));

// Check rendered content
console.log(container.children);

// Check data source
const dataId = container.getAttribute('json-template-for');
const dataEl = document.getElementById(dataId);
console.log(JSON.parse(dataEl.textContent));
```

---

## Common Patterns

### Loading States

```html
<script id="data" type="application/json">
{"loading": true, "users": []}
</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <div>
      <!-- Show loading state (conditional rendering via CSS or empty checks) -->
      <template data-array="users">
        <li>{name}</li>
      </template>
    </div>
  </template>
</div>
```

### Combining Behaviors

```html
<!-- Form with request + json-template rendering -->
<div id="app">
  <script id="response" type="application/json">
  {}
  </script>
  
  <form
    is="behavioral-request"
    behavior="request"
    request-url="/api/search"
    request-target="response"
  >
    <input type="text" name="q">
    <button>Search</button>
  </form>
  
  <div
    is="behavioral-json-template"
    behavior="json-template"
    json-template-for="response"
  >
    <template>
      <ul>
        <template data-array="results">
          <li>{title} - {description}</li>
        </template>
      </ul>
    </template>
  </div>
</div>
```

---

## Summary

| Feature | Syntax | Example |
|---------|--------|---------|
| **Simple Property** | `{key}` | `{name}` |
| **Nested Property** | `{obj.key}` | `{user.profile.name}` |
| **Array Index** | `{arr[n].key}` | `{users[0].name}` |
| **Bracket Notation** | `{obj['key']}` | `{user['first-name']}` |
| **Array Iteration** | `<template data-array="path">` | See examples above |
| **Attribute Interpolation** | `attr="{path}"` | `id="{user.id}"` |

**Key Principles:**
1. Curly braces `{path}` work in **text content** and **attributes**
2. Use `data-array="path"` on nested `<template>` for arrays
3. Templates are **preserved** for re-rendering
4. Works reactively with `MutationObserver`
5. Graceful fallback for missing paths (empty string)
