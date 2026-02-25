# json-template Pattern Clarification

## The Template Structure

### Required Pattern
```html
<div behavior="json-template" json-template-for="data-id">
  <template> <!-- REQUIRED: Root template (behavior looks for this) -->
    <!-- Your content here -->
  </template>
</div>
```

The **outer `<template>`** is required because:
1. The behavior looks for `:scope > template` to find what to render
2. Template content is inert (not rendered until cloned)
3. This is the standard Web Components pattern

---

## ✅ Correct Patterns

### Pattern 1: Simple Object Rendering
```html
<script type="application/json" id="data">
{
  "name": "Sagi",
  "email": "sagi@example.com"
}
</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <h2>{name}</h2>
    <p>{email}</p>
  </template>
</div>
```

### Pattern 2: Array Rendering (Requires Container Element)
```html
<script type="application/json" id="data">
{
  "users": [
    { "name": "Alice", "age": 25 },
    { "name": "Bob", "age": 30 }
  ]
}
</script>

<div behavior="json-template" json-template-for="data">
  <template>
    <!-- Container element required for array template! -->
    <ul> <!-- or <div>, <section>, etc. -->
      <template data-array="users">
        <li>
          <h3>{name}</h3>
          <p>{age} years old</p>
        </li>
      </template>
    </ul>
  </template>
</div>
```

**Why the container?** The array template needs a parent element to insert rendered items into. The template itself is just a marker—it can't be its own parent.

### Pattern 3: Array with Static Content
```html
<div behavior="json-template" json-template-for="data">
  <template>
    <h2>Team Members</h2> <!-- Static content -->
    
    <template data-array="users">
      <div>{name}</div>
    </template>
  </template>
</div>
```

### Pattern 4: Mixed Static and Dynamic
```html
<div behavior="json-template" json-template-for="data">
  <template>
    <h1>{companyName}</h1> <!-- Dynamic from root -->
    
    <template data-array="departments">
      <section>
        <h2>{name}</h2> <!-- Dynamic from department -->
        <p>{description}</p>
        
        <template data-array="employees">
          <div>{name}</div> <!-- Dynamic from employee -->
        </template>
      </section>
    </template>
  </template>
</div>
```

---

## ❌ Common Mistakes

### Mistake 1: Missing Container for Array Template
```html
<!-- ❌ DON'T: Array template without parent container -->
<div behavior="json-template" json-template-for="data">
  <template>
    <template data-array="users">
      <div>{name}</div>
    </template>
  </template>
</div>
<!-- Error: "Array template has no parent element" -->

<!-- ✅ DO: Wrap array template in a container element -->
<div behavior="json-template" json-template-for="data">
  <template>
    <div> <!-- ← Container required! -->
      <template data-array="users">
        <div>{name}</div>
      </template>
    </div>
  </template>
</div>
```

**Why?** The `<template data-array>` element gets processed while in a DocumentFragment (off-DOM). It needs a parent element to insert the rendered items into. Use a semantic container like `<ul>`, `<ol>`, `<div>`, or `<section>`.

### Mistake 2: Trying to Use data-array on Root Template
```html
<!-- ❌ DON'T: data-array on root template doesn't work -->
<div behavior="json-template" json-template-for="data">
  <template data-array="users">
    <div>{name}</div>
  </template>
</div>

<!-- ✅ DO: Nest the array template inside root template -->
<div behavior="json-template" json-template-for="data">
  <template>
    <template data-array="users">
      <div>{name}</div>
    </template>
  </template>
</div>
```

---

## Why The Nested Structure?

### Root Template (Outer `<template>`)
- **Required by the behavior** - it looks for `:scope > template`
- Defines the "render boundary"
- Content stays inert until processed
- Can contain static content + dynamic arrays

### Container Element (Parent of Array Template)
- **Required for arrays** - provides insertion point for rendered items
- Can be any block element: `<div>`, `<ul>`, `<section>`, etc.
- Choose semantic HTML: `<ul>` for lists, `<section>` for sections
- Can have static content alongside the array template

### Array Template (Inner `<template data-array>`)
- **Optional** - only needed for arrays
- Marks which array to iterate over
- Repeated once per array item
- Changes data context to the current item
- Must have a parent element (can't be direct child of root template)

---

## When Do You Need the Extra Template?

### One Template (No Arrays)
```html
<template>
  <h1>{title}</h1>
  <p>{description}</p>
</template>
```

### Two Templates (Has Arrays)
```html
<template>
  <h1>{companyName}</h1>
  
  <template data-array="employees">
    <div>{name}</div>
  </template>
</template>
```

### Three+ Templates (Nested Arrays)
```html
<template>
  <h1>{companyName}</h1>
  
  <template data-array="departments">
    <h2>{departmentName}</h2>
    
    <template data-array="employees">
      <div>{name}</div>
    </template>
  </template>
</template>
```

---

## Root Data as Array? ✨ Yes!

If your **root data is an array**, you get an elegant, simplified pattern:

```html
<script type="application/json" id="data">
[
  { "name": "Alice", "age": 25 },
  { "name": "Bob", "age": 30 }
]
</script>

<!-- ✅ Simple! Template repeats automatically -->
<div behavior="json-template" json-template-for="data">
  <template>
    <div class="person">
      <h3>{name}</h3>
      <p>Age: {age}</p>
    </div>
  </template>
</div>
```

**Auto-Detection:** The behavior detects if root data is an array and automatically:
1. Repeats the template once per array item
2. Sets each item as the data context
3. No `data-array` attribute needed!

**Benefits:**
- ✅ Cleaner JSON (no wrapper object)
- ✅ Simpler templates (no nested array syntax)
- ✅ More intuitive (template just repeats)
- ✅ Perfect for API responses that return arrays

**When to Use Root Array Pattern:**
- Todo lists, product catalogs, user lists
- API responses that return arrays directly
- Social media feeds, news articles
- Any scenario with a single array of items

**When to Use Nested Object Pattern:**
- Need metadata alongside array (`{total: 10, items: [...]}`)
- Multiple arrays to render (`{users: [...], posts: [...]}`)
- Static content mixed with arrays (`{title: "Users", users: [...]}`)
- Complex nested structures

---

## Summary

| Scenario | Template Count | Example |
|----------|----------------|---------|
| Simple object | 1 | `<template><h1>{title}</h1></template>` |
| Object with array | 2 | `<template><template data-array="items">...</template></template>` |
| Nested arrays | 3+ | `<template><template data-array="depts"><template data-array="employees">...` |

**Rule of Thumb:**
- Outer template = always required (root content)
- Inner template(s) = one per array you want to iterate

The outer template is **not a wrapper** - it's the root content definition. Think of it like the `<body>` of your dynamic content.
