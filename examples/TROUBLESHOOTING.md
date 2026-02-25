# Troubleshooting Guide

Common issues and solutions for BehaviorFN demos and CDN usage.

---

## "Unknown behavior" or "No loader found for behavior"

### Error Message
```
[AutoLoader] Unknown behavior "request" on element: <form>
[BehaviorRegistry] No loader found for behavior: "request"
```

### Cause
The auto-loader is trying to process elements with `behavior` attributes before the behaviors are registered.

### Common Scenarios

#### Scenario 1: Script Loading Order
**Problem:** HTML elements appear before script loads

```html
<!-- ❌ Bad: Elements before script -->
<form behavior="request">...</form>

<script src="behavior-fn.all.js"></script>
```

**Solution:** Load script in `<head>` or before elements

```html
<!-- ✅ Good: Script loads first -->
<head>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
</head>
<body>
  <form behavior="request">...</form>
</body>
```

#### Scenario 2: Loading Individual Bundles
**Problem:** Individual behavior bundles loaded, but auto-loader tries to process elements before all behaviors are registered

```html
<!-- ⚠️ Race condition: -->
<script src="request.js"></script>      <!-- Registers "request", scans DOM -->
<script src="json-template.js"></script> <!-- Registers "json-template" -->

<form behavior="request">...</form>      <!-- ✅ Works -->
<div behavior="json-template">...</div>  <!-- ❌ Might fail if request.js scanned first -->
```

**Solution A:** Use all-in-one bundle

```html
<!-- ✅ Best: All behaviors registered together -->
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

**Solution B:** Load individual bundles + auto-loader bundle

```html
<!-- Load behaviors -->
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/request.js"></script>
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/json-template.js"></script>

<!-- Load auto-loader LAST (enables automatic is attribute) -->
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/auto-loader.js"></script>
```

**Solution C:** Use explicit `is` attributes + define hosts

```html
<script src="request.js"></script>
<script src="json-template.js"></script>

<!-- Define behavioral hosts -->
<script>
  BehaviorFN.defineBehavioralHost('form', 'behavioral-request', []);
  BehaviorFN.defineBehavioralHost('div', 'behavioral-json-template', []);
</script>

<!-- Explicit is attribute -->
<form is="behavioral-request" behavior="request">
<div is="behavioral-json-template" behavior="json-template">
```

#### Scenario 3: Iframe/Embedded Context
**Problem:** Page is loaded in iframe where parent already loaded BehaviorFN

**Solution:** Check if `window.BehaviorFN` exists before loading:

```html
<script>
  if (!window.BehaviorFN) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js';
    document.head.appendChild(script);
  }
</script>
```

#### Scenario 4: CDN Caching Issues
**Problem:** Browser cached old version without certain behaviors

**Solution:** Pin to specific version

```html
<!-- Instead of @latest -->
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/behavior-fn.all.js"></script>
```

Or force cache bust:
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js?v=2"></script>
```

---

## "Target not found" Errors

### Error Message
```
[Request] Target not found: #answer-data
```

### Cause
Using CSS selector syntax (`#id`) instead of plain ID

### Solution
```html
<!-- ❌ Bad: Includes # -->
<form request-target="#answer-data">

<!-- ✅ Good: Plain ID -->
<form request-target="answer-data">
```

**Why:** `document.getElementById()` expects plain ID, not selector syntax.

---

## "This behavior should only be used on <template> elements"

### Error Message (Old - Now Fixed)
```
[json-template] This behavior should only be used on <template> elements
```

### Cause
Using old pattern where behavior was on `<template>` element

### Solution
Use the new implicit pattern with container element:

```html
<!-- ❌ Old pattern (doesn't work) -->
<template 
  behavior="json-template"
  json-template-source="data"
>
  <div data-key="name"></div>
</template>

<!-- ✅ New pattern (works!) -->
<div behavior="json-template" json-template-for="data">
  <template>
    <div data-key="name"></div>
  </template>
</div>
```

---

## "Invalid JSON in source element"

### Error Message
```
[json-template] Invalid JSON in source element: SyntaxError
```

### Cause
Data source has invalid JSON or is empty on initial load

### Solution
This is usually harmless - the template waits for valid data:

```html
<!-- Empty initially (no error with v0.1.6+) -->
<script type="application/json" id="data"></script>

<!-- Gets populated by request behavior -->
<form request-target="data" request-swap="innerHTML">
```

The behavior now gracefully handles empty data sources.

---

## Behaviors Not Working

### Symptom
Elements with `behavior` attribute don't respond to interactions

### Checklist

1. **Script loaded?**
   ```javascript
   // Check in browser console
   console.log(window.BehaviorFN);
   // Should show object with registerBehavior, etc.
   ```

2. **Behavior registered?**
   ```javascript
   console.log(window.BehaviorFN.getBehavior('request'));
   // Should return function
   ```

3. **Element upgraded?**
   ```javascript
   const form = document.querySelector('form[behavior="request"]');
   console.log(form.getAttribute('is'));
   // Should show "behavioral-request"
   ```

4. **Check console for errors**
   - Look for auto-loader warnings
   - Check for registration errors
   - Verify network requests for CDN scripts

---

## Form Submits Traditionally (Page Reload)

### Symptom
Clicking submit causes page navigation instead of AJAX request

### Causes & Solutions

#### Cause 1: Script Not Loaded
**Check:** Browser console shows 404 for behavior script

**Solution:** Fix script URL
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

#### Cause 2: Behavior Not Applied
**Check:** Form doesn't have `is` attribute

**Solution:** Ensure auto-loader ran or add explicit `is` attribute:
```html
<form is="behavioral-request" behavior="request">
```

#### Cause 3: Timing Issue
**Check:** Elements loaded before script

**Solution:** Move script to `<head>` or use `defer`
```html
<head>
  <script defer src="..."></script>
</head>
```

---

## CORS Errors

### Error Message
```
Access to fetch at 'https://api.example.com' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

### Cause
API doesn't include proper CORS headers

### Solutions

1. **Configure API to allow CORS:**
   ```javascript
   // Server-side (Express example)
   app.use(cors({
     origin: 'http://localhost:3000'
   }));
   ```

2. **Use Proxy:**
   ```html
   <!-- Instead of direct API -->
   <form request-url="/api/proxy?target=https://api.example.com">
   ```

3. **Development Proxy:**
   ```javascript
   // In package.json or vite.config.ts
   {
     "proxy": {
       "/api": {
         "target": "https://api.example.com",
         "changeOrigin": true
       }
     }
   }
   ```

---

## Template Not Rendering

### Symptom
JSON data loads but template doesn't display

### Checklist

1. **Data source has content?**
   ```javascript
   const data = document.getElementById('answer-data');
   console.log(data.textContent); // Should show JSON
   ```

2. **JSON is valid?**
   ```javascript
   try {
     JSON.parse(data.textContent);
     console.log('✅ Valid JSON');
   } catch (e) {
     console.error('❌ Invalid JSON:', e);
   }
   ```

3. **Template found?**
   ```javascript
   const container = document.querySelector('[behavior="json-template"]');
   console.log(container.querySelector('template')); // Should exist
   ```

4. **data-key paths correct?**
   ```javascript
   const data = JSON.parse(document.getElementById('answer-data').textContent);
   console.log(data.answer.answerText); // Test path manually
   ```

---

## Auto-Loader Not Working

### Symptom
Elements still missing `is` attribute after page load

### Solutions

1. **Check if auto-loader enabled:**
   ```javascript
   // Should be called by CDN bundles automatically
   // But verify in console
   console.log(typeof window.enableAutoLoader); // Should be "function"
   ```

2. **Check browser console:**
   Look for auto-loader messages:
   ```
   ✅ BehaviorFN loaded with 7 behaviors (auto-loader enabled)
   [AutoLoader] ✅ Upgraded <form#(no id)> to behavioral-request
   ```

3. **Manual trigger (if needed):**
   ```javascript
   window.enableAutoLoader();
   ```

---

## Safari Issues

### Symptom
Behaviors don't work in Safari

### Cause
Safari doesn't fully support Custom Built-in Elements

### Solution
Add polyfill before BehaviorFN:

```html
<script src="https://unpkg.com/@ungap/custom-elements@latest"></script>
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
```

---

## Version Conflicts

### Symptom
```
Behavior "request" is already registered
```

### Causes

1. **Multiple script loads:**
   ```html
   <!-- ❌ Don't do this -->
   <script src="behavior-fn.all.js"></script>
   <script src="behavior-fn.all.js"></script> <!-- Duplicate! -->
   ```

2. **Mixed loading:**
   ```html
   <!-- ❌ Don't mix individual + all-in-one -->
   <script src="request.js"></script>
   <script src="behavior-fn.all.js"></script>
   ```

3. **Multiple versions:**
   ```html
   <!-- ❌ Different versions conflict -->
   <script src="https://unpkg.com/behavior-fn@0.1.4/dist/cdn/behavior-fn.all.js"></script>
   <script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/behavior-fn.all.js"></script>
   ```

### Solution
As of v0.1.6, this is now **silent** - registration is idempotent. But still best practice to load only once!

---

## Understanding Behavioral Hosts

### What is a Behavioral Host?

A **behavioral host** is a custom element that can host behaviors. It's created using `defineBehavioralHost()`:

```javascript
window.BehaviorFN.defineBehavioralHost(
  'form',                  // Base HTML element (tag name)
  'behavioral-request',    // Custom element name (must match is attribute)
  []                       // Observed attributes (optional)
);
```

This creates a custom element you can use with the `is` attribute:

```html
<form is="behavioral-request" behavior="request">
```

### Who Creates Behavioral Hosts?

**With auto-loader:**
```html
<script src="behavior-fn.all.js"></script>
<!-- OR -->
<script src="auto-loader.js"></script>

<!-- Auto-loader sees behavior="request" and automatically calls: -->
<!-- defineBehavioralHost('form', 'behavioral-request', []) -->
```

**Without auto-loader:**
```html
<script src="request.js"></script>

<script>
  // YOU must define the host manually
  window.BehaviorFN.defineBehavioralHost('form', 'behavioral-request', []);
</script>

<form is="behavioral-request" behavior="request">
```

### Common Mistake

```html
<!-- ❌ Forgot to define host -->
<script src="request.js"></script>

<form is="behavioral-request" behavior="request">
  <!-- Error: behavioral-request is not defined! -->
</form>
```

**Fix:** Either load auto-loader OR define host manually:

```html
<!-- ✅ Option A: Load auto-loader -->
<script src="request.js"></script>
<script src="auto-loader.js"></script>

<form behavior="request"> <!-- is added automatically -->

<!-- ✅ Option B: Define host manually -->
<script src="request.js"></script>
<script>
  BehaviorFN.defineBehavioralHost('form', 'behavioral-request', []);
</script>

<form is="behavioral-request" behavior="request">
```

---

## Getting Help

### Before Asking

1. **Check browser console** - most issues show clear error messages
2. **Verify script loaded** - check Network tab in DevTools
3. **Test in fresh incognito window** - eliminates caching issues
4. **Try with pinned version** - use `@0.1.6` instead of `@latest`

### When Reporting Issues

Include:
- Browser and version
- Full error message from console
- Minimal reproduction HTML
- Network tab screenshot (if script loading issue)
- Whether using iframe/embedded context

### Resources

- [GitHub Issues](https://github.com/AceCodePt/behavior-fn/issues)
- [Examples](./README.md)
- [Main Documentation](../README.md)
- [CDN Guide](../docs/guides/manual-loading.md)

---

**Most issues are timing or loading order problems - check your script tags!**
