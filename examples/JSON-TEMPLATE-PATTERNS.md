# JSON Template Behavior - Pattern Guide

The `json-template` behavior uses an **implicit template pattern** inspired by HTML's `<label>` + `<input>` relationship.

## Core Concept: Implicit Templates

Just like `<input>` inside `<label>` doesn't need an explicit `for` attribute:

```html
<!-- Label pattern: implicit association -->
<label>
  Username
  <input type="text">
</label>
```

**JSON Template uses the same pattern:**

```html
<!-- JSON Template: implicit template -->
<div behavior="json-template" json-template-for="my-data">
  <template>
    <!-- No ID needed! -->
    <div data-key="name"></div>
  </template>
</div>
```

## Basic Patterns

### 1. Simple Value Binding

```html
<!-- Data -->
<script type="application/json" id="user-data">
  {"name": "Sagi", "email": "sagi@example.com"}
</script>

<!-- Renderer -->
<div behavior="json-template" json-template-for="user-data">
  <template>
    <div data-key="name"></div>
    <div data-key="email"></div>
  </template>
</div>

<!-- Result -->
<div>Sagi</div>
<div>sagi@example.com</div>
<template>...</template> <!-- Preserved for re-rendering -->
```

### 2. Nested Objects

```html
<!-- Data -->
<script type="application/json" id="user-data">
  {
    "user": {
      "profile": {
        "name": "Sagi",
        "location": "Israel"
      }
    }
  }
</script>

<!-- Renderer -->
<div behavior="json-template" json-template-for="user-data">
  <template>
    <div data-key="user.profile.name"></div>
    <div data-key="user.profile.location"></div>
  </template>
</div>
```

Supports dot notation for deep paths: `user.profile.location`

### 3. Arrays (Implicit Nested Template)

```html
<!-- Data -->
<script type="application/json" id="users-data">
  {
    "users": [
      {"name": "Alice", "age": 25},
      {"name": "Bob", "age": 30}
    ]
  }
</script>

<!-- Renderer -->
<div behavior="json-template" json-template-for="users-data">
  <template>
    <ul data-key="users">
      <template>
        <!-- Implicit item template! -->
        <li>
          <span data-key="name"></span> (<span data-key="age"></span>)
        </li>
      </template>
    </ul>
  </template>
</div>

<!-- Result -->
<ul>
  <li><span>Alice</span> (<span>25</span>)</li>
  <li><span>Bob</span> (<span>30</span>)</li>
  <template>...</template> <!-- Preserved -->
</ul>
```

**How it works:**
1. Element with `data-key="users"` points to array
2. Nested `<template>` is found automatically (implicit!)
3. Template cloned for each item
4. Each item processed with its own data context
5. Template preserved for re-rendering

### 4. Nested Arrays (Multiple Levels)

```html
<!-- Data -->
<script type="application/json" id="org-data">
  {
    "departments": [
      {
        "name": "Engineering",
        "employees": [
          {"name": "Alice"},
          {"name": "Bob"}
        ]
      },
      {
        "name": "Sales",
        "employees": [
          {"name": "Charlie"}
        ]
      }
    ]
  }
</script>

<!-- Renderer -->
<div behavior="json-template" json-template-for="org-data">
  <template>
    <div data-key="departments">
      <template>
        <div class="dept">
          <h3 data-key="name"></h3>
          <ul data-key="employees">
            <template>
              <li data-key="name"></li>
            </template>
          </ul>
        </div>
      </template>
    </div>
  </template>
</div>

<!-- Result -->
<div class="dept">
  <h3>Engineering</h3>
  <ul>
    <li>Alice</li>
    <li>Bob</li>
    <template>...</template>
  </ul>
</div>
<div class="dept">
  <h3>Sales</h3>
  <ul>
    <li>Charlie</li>
    <template>...</template>
  </ul>
</div>
<template>...</template>
```

Each nesting level maintains its own data context!

### 5. Array Access by Index

```html
<!-- Data -->
<script type="application/json" id="data">
  {"users": [{"name": "Alice"}, {"name": "Bob"}]}
</script>

<!-- Renderer -->
<div behavior="json-template" json-template-for="data">
  <template>
    <div data-key="users[0].name"></div>
    <div data-key="users[1].name"></div>
  </template>
</div>

<!-- Result -->
<div>Alice</div>
<div>Bob</div>
```

## Advanced Patterns

### Explicit Template ID (Reusable Templates)

For template reuse across multiple places:

```html
<!-- Shared template -->
<template id="user-card">
  <div class="card">
    <h3 data-key="name"></h3>
    <p data-key="email"></p>
  </div>
</template>

<!-- Use in multiple places -->
<div data-key="activeUsers" json-template-item="user-card"></div>
<div data-key="inactiveUsers" json-template-item="user-card"></div>
```

**Explicit template takes precedence** over implicit nested template.

### Mixed Content

```html
<div behavior="json-template" json-template-for="data">
  <template>
    <h2>User Profile</h2> <!-- Static content -->
    <div data-key="user.name"></div> <!-- Dynamic content -->
    <p>Email: <span data-key="user.email"></span></p> <!-- Mixed -->
  </template>
</div>
```

### Complex Nesting

```html
<div behavior="json-template" json-template-for="data">
  <template>
    <div data-key="response.departments">
      <template>
        <section>
          <h2 data-key="name"></h2>
          <div data-key="teams">
            <template>
              <div class="team">
                <h3 data-key="name"></h3>
                <ul data-key="members">
                  <template>
                    <li>
                      <span data-key="name"></span> - <span data-key="role"></span>
                    </li>
                  </template>
                </ul>
              </div>
            </template>
          </div>
        </section>
      </template>
    </div>
  </template>
</div>
```

Data structure:
```json
{
  "response": {
    "departments": [
      {
        "name": "Engineering",
        "teams": [
          {
            "name": "Frontend",
            "members": [
              {"name": "Alice", "role": "Dev"},
              {"name": "Bob", "role": "Lead"}
            ]
          }
        ]
      }
    ]
  }
}
```

## How It Works

### Data Flow

```
1. json-template-for="answer-data"
   ↓
2. Finds <script id="answer-data">
   ↓
3. Watches for textContent changes (MutationObserver)
   ↓
4. On change: parse JSON
   ↓
5. Find implicit <template> child
   ↓
6. Clone template content
   ↓
7. Process data-key bindings
   ↓
8. Insert rendered content (preserve template)
```

### Template Preservation

**Important:** Templates are NEVER deleted during rendering. They're preserved for:
- Re-rendering when data changes
- Debugging (inspect original template structure)
- Performance (no need to re-parse HTML)

```html
<!-- Before rendering -->
<div behavior="json-template">
  <template>...</template>
</div>

<!-- After rendering -->
<div behavior="json-template">
  <div>Rendered content</div>
  <template>...</template> <!-- Still here! -->
</div>

<!-- After re-rendering -->
<div behavior="json-template">
  <div>New content</div>
  <template>...</template> <!-- Still preserved! -->
</div>
```

### Data Context

Each template has its own data context:

```html
<div data-key="users">
  <template>
    <!-- Context: each user object -->
    <span data-key="name"></span> <!-- user.name -->
    
    <div data-key="orders">
      <template>
        <!-- Context: each order object -->
        <span data-key="id"></span> <!-- order.id -->
        <span data-key="total"></span> <!-- order.total -->
      </template>
    </div>
  </template>
</div>
```

## Pattern Comparison

### Implicit Template (Recommended)

```html
✅ Clean, minimal HTML
✅ Like native HTML patterns (<label> + <input>)
✅ No ID pollution
✅ Self-contained components

<div data-key="users">
  <template>
    <li data-key="name"></li>
  </template>
</div>
```

### Explicit Template ID

```html
✅ Reusable across multiple containers
✅ Template can live anywhere in document
⚠️ Requires unique IDs
⚠️ More verbose

<div data-key="users" json-template-item="user-template"></div>

<template id="user-template">
  <li data-key="name"></li>
</template>
```

**Use implicit by default, explicit for reuse!**

## Edge Cases

### Empty Arrays

```html
<div data-key="users">
  <template>
    <li data-key="name"></li>
  </template>
</div>
```

If `users` is `[]`, nothing is rendered (template is preserved).

### Missing Data Paths

```html
<div data-key="nonexistent.path"></div>
```

Logs error to console, element remains empty.

### Non-Array with Template

```html
<div data-key="user"> <!-- user is object, not array -->
  <template>
    <div data-key="name"></div>
  </template>
</div>
```

Logs error: "Expected array at path 'user', got object"

### Array Without Template

```html
<div data-key="users"></div> <!-- users is array, but no template -->
```

Nothing renders (arrays need templates).

## Best Practices

### ✅ DO: Use Implicit Templates

```html
<div data-key="items">
  <template>
    <div data-key="title"></div>
  </template>
</div>
```

### ✅ DO: Use Semantic HTML

```html
<ul data-key="users">
  <template>
    <li data-key="name"></li>
  </template>
</ul>
```

### ✅ DO: Preserve Template Structure

Templates are automatically preserved - don't worry about them!

### ⚠️ AVOID: Deep Nesting Without Reason

```html
<!-- Too deep - hard to maintain -->
<div data-key="a">
  <template>
    <div data-key="b">
      <template>
        <div data-key="c">
          <template>
            <div data-key="d"></div>
          </template>
        </div>
      </template>
    </div>
  </template>
</div>
```

Flatten your data structure when possible.

### ⚠️ AVOID: Mixing Patterns

```html
<!-- Don't mix implicit and explicit unnecessarily -->
<div data-key="users" json-template-item="user-template">
  <template>
    <!-- This implicit template is ignored! -->
    <li data-key="name"></li>
  </template>
</div>
```

Explicit template ID takes precedence - be consistent!

## Debugging

### Enable Console Logging

Errors are automatically logged:
- `[json-template] Data path not found: "path"`
- `[json-template] Expected array at path "path", got object`
- `[json-template] No <template> element found as direct child`

### Inspect Rendered HTML

Templates are preserved, so you can inspect both:
```javascript
// In browser console
const container = document.querySelector('[behavior="json-template"]');
console.log(container.querySelector('template')); // Original template
console.log(container.children); // Rendered + template
```

### Check Data Source

```javascript
const data = document.getElementById('my-data');
console.log(JSON.parse(data.textContent)); // Verify JSON structure
```

## Performance

**Template Preservation Benefits:**
- ✅ No HTML re-parsing on updates
- ✅ Faster re-renders (clone existing template)
- ✅ Lower memory usage (single template instance)

**Rendering Strategy:**
- All binding processing happens in a DocumentFragment (off-DOM)
- Single DOM operation at the end (`insertBefore`)
- Minimal reflows and repaints

## Migration from Old Pattern

### Before (explicit target)
```html
<script id="data"></script>

<div id="output"></div>

<template 
  behavior="json-template"
  json-template-source="data"
  json-template-target="output"
>
  <div data-key="name"></div>
</template>
```

### After (implicit template)
```html
<script id="data"></script>

<div behavior="json-template" json-template-for="data">
  <template>
    <div data-key="name"></div>
  </template>
</div>
```

**Benefits:**
- ✅ One less element (no separate output div)
- ✅ No ID pollution (`output` ID not needed)
- ✅ Self-contained component
- ✅ More intuitive (like native HTML patterns)

## Summary

| Pattern | Use When | Example |
|---------|----------|---------|
| **Implicit Template** | Default - clean, self-contained | `<div data-key="items"><template>...</template></div>` |
| **Explicit Template ID** | Need to reuse template | `<div data-key="items" json-template-item="shared-template">` |
| **Nested Arrays** | Complex hierarchical data | Multiple levels of `<div data-key><template>` |
| **Direct Index Access** | Accessing specific items | `data-key="users[0].name"` |

**Default to implicit, use explicit only for reuse!**
