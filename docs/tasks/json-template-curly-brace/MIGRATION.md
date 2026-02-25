# Migration Guide: json-template Curly Brace Syntax

## Breaking Change (v0.x → v1.0)

The `json-template` behavior has been redesigned with a more intuitive and familiar templating syntax using curly braces `{}` instead of the `data-key` attribute pattern.

## Summary of Changes

### Old Pattern (v0.x) - DEPRECATED ❌
```html
<div behavior="json-template" json-template-for="my-data">
  <template>
    <div>
      <h2 data-key="name"></h2>
      <p data-key="description"></p>
    </div>
  </template>
</div>

<!-- Array rendering -->
<div behavior="json-template" json-template-for="my-data">
  <template>
    <ul data-key="users">
      <template>
        <li>
          <span data-key="name"></span> (<span data-key="age"></span>)
        </li>
      </template>
    </ul>
  </template>
</div>
```

### New Pattern (v1.0) - RECOMMENDED ✅
```html
<div behavior="json-template" json-template-for="my-data">
  <template>
    <div>
      <h2>{name}</h2>
      <p>{description}</p>
    </div>
  </template>
</div>

<!-- Array rendering -->
<div behavior="json-template" json-template-for="my-data">
  <template>
    <ul>
      <template data-array="users">
        <li>{name} ({age})</li>
      </template>
    </ul>
  </template>
</div>
```

## What Changed?

### 1. Text Content Interpolation
**Before:** Each element with dynamic content needed a `data-key` attribute
**After:** Use `{path}` directly in text content

```html
<!-- Before -->
<h2 data-key="title"></h2>
<p>Age: <span data-key="age"></span></p>

<!-- After -->
<h2>{title}</h2>
<p>Age: {age}</p>
```

### 2. Mixed Static and Dynamic Content
**Before:** Required wrapper elements with `data-key`
**After:** Mix static text and interpolations naturally

```html
<!-- Before -->
<div data-key="name"></div>
<!-- Had to manually add "Username: " prefix elsewhere -->

<!-- After -->
<div>Username: {name}</div>
```

### 3. Attribute Interpolation (NEW!)
**Before:** Not supported
**After:** Interpolate in ANY attribute value

```html
<!-- New capability! -->
<div data-type="{type}" class="user-{role}">
  {name}
</div>

<!-- Web component support -->
<dialog is="behavioral-reveal" behavior="reveal">
  <h2>{title}</h2>
  <p>{content}</p>
</dialog>
```

### 4. Array Rendering
**Before:** Used `data-key` + implicit/explicit templates with `json-template-item`
**After:** Use `data-array="path"` attribute on nested `<template>`

```html
<!-- Before -->
<ul data-key="items">
  <template>
    <li data-key="name"></li>
  </template>
</ul>

<!-- After -->
<ul>
  <template data-array="items">
    <li>{name}</li>
  </template>
</ul>
```

### 5. Nested Paths
**Both patterns support dot notation and bracket notation (unchanged)**

```html
<!-- Before -->
<span data-key="user.profile.name"></span>
<span data-key="items[0].title"></span>

<!-- After -->
<span>{user.profile.name}</span>
<span>{items[0].title}</span>
```

## Migration Steps

### Step 1: Update Simple Bindings
Replace `data-key` attributes with `{path}` in text content:

```diff
<template>
-  <h1 data-key="title"></h1>
-  <p data-key="description"></p>
+  <h1>{title}</h1>
+  <p>{description}</p>
</template>
```

### Step 2: Simplify Mixed Content
Remove wrapper elements and use inline interpolation:

```diff
<template>
-  <p>Name: <span data-key="name"></span></p>
-  <p>Email: <span data-key="email"></span></p>
+  <p>Name: {name}</p>
+  <p>Email: {email}</p>
</template>
```

### Step 3: Update Array Rendering
Change `data-key` on container to `data-array` on nested template:

```diff
<template>
-  <ul data-key="users">
+  <ul>
-    <template>
+    <template data-array="users">
-      <li data-key="name"></li>
+      <li>{name}</li>
    </template>
  </ul>
</template>
```

### Step 4: Add Attribute Interpolation (Optional Enhancement)
Leverage the new capability to set attributes dynamically:

```diff
<template>
-  <div>
+  <div data-type="{type}" data-id="{id}">
-    <span data-key="label"></span>
+    {label}
  </div>
</template>
```

### Step 5: Remove Old Attributes (Cleanup)
The following attributes are no longer used:
- `data-key` (replaced by `{path}` interpolation)
- `json-template-item` (replaced by `data-array` on nested templates)

## Example: Full Migration

### Before (v0.x)
```html
<script type="application/json" id="user-data">
{
  "user": {
    "name": "Sagi Cohen",
    "email": "sagi@example.com",
    "role": "admin"
  },
  "posts": [
    { "title": "First Post", "date": "2024-01-01" },
    { "title": "Second Post", "date": "2024-01-15" }
  ]
}
</script>

<div is="behavioral-json-template" behavior="json-template" json-template-for="user-data">
  <template>
    <div>
      <h2 data-key="user.name"></h2>
      <p data-key="user.email"></p>
      <p data-key="user.role"></p>
      
      <h3>Posts</h3>
      <ul data-key="posts">
        <template>
          <li>
            <strong data-key="title"></strong>
            <span data-key="date"></span>
          </li>
        </template>
      </ul>
    </div>
  </template>
</div>
```

### After (v1.0)
```html
<script type="application/json" id="user-data">
{
  "user": {
    "name": "Sagi Cohen",
    "email": "sagi@example.com",
    "role": "admin"
  },
  "posts": [
    { "title": "First Post", "date": "2024-01-01" },
    { "title": "Second Post", "date": "2024-01-15" }
  ]
}
</script>

<div is="behavioral-json-template" behavior="json-template" json-template-for="user-data">
  <template>
    <div data-role="{user.role}">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      
      <h3>Posts</h3>
      <ul>
        <template data-array="posts">
          <li>
            <strong>{title}</strong> - {date}
          </li>
        </template>
      </ul>
    </div>
  </template>
</div>
```

## Benefits of the New Syntax

1. **More Intuitive:** Matches popular templating engines (Handlebars, Vue, etc.)
2. **Less Verbose:** No need for extra `<span>` wrappers
3. **More Flexible:** Interpolate in text AND attributes
4. **Better DX:** Mix static and dynamic content naturally
5. **Web Component Ready:** Preserve `is=""` attributes for behavioral hosts

## Backward Compatibility

**This is a breaking change.** The old `data-key` pattern will no longer work in v1.0+.

If you need to maintain old code temporarily:
1. Pin to v0.x in your `package.json`
2. Migrate incrementally
3. Upgrade to v1.0+ when all templates are converted

## Need Help?

If you encounter issues during migration, please:
1. Review this guide
2. Check the test file for examples: `registry/behaviors/json-template/behavior.test.ts`
3. Open an issue on GitHub with your specific use case
