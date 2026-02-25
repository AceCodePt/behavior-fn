# BehaviorFN Loading Patterns

Three ways to load BehaviorFN from CDN, each with different tradeoffs.

---

## Pattern 1: All-in-One Bundle (Easiest)

**Best for:** Quick prototypes, learning, simple apps

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Single script - includes all behaviors + auto-loader -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
</head>
<body>
  <!-- Just use behavior attribute - auto-loader handles the rest -->
  <form behavior="request" request-url="/api/search">
    <input name="q">
    <button type="submit">Search</button>
  </form>
  
  <div behavior="json-template" json-template-for="data">
    <template>
      <div data-key="result"></div>
    </template>
  </div>
</body>
</html>
```

**✅ Pros:**
- Zero configuration
- Auto-loader enabled automatically
- All behaviors available
- No race conditions

**⚠️ Cons:**
- Larger file size (~72KB, ~20KB gzipped)
- Includes behaviors you might not need

---

## Pattern 2: Individual Bundles + Auto-Loader (Optimized)

**Best for:** Production apps that need specific behaviors

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Load only the behaviors you need -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/request.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/json-template.js"></script>
  
  <!-- Load auto-loader separately -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/auto-loader.js"></script>
</head>
<body>
  <!-- Just use behavior attribute -->
  <form behavior="request" request-url="/api/search">
    <input name="q">
    <button type="submit">Search</button>
  </form>
  
  <div behavior="json-template" json-template-for="data">
    <template>
      <div data-key="result"></div>
    </template>
  </div>
</body>
</html>
```

**✅ Pros:**
- Smaller file size (only what you need)
- Auto-loader convenience
- Explicit control over what loads

**⚠️ Cons:**
- Multiple HTTP requests
- Must load auto-loader last
- Slightly more complex

**File sizes:**
- `request.js`: ~58KB (~15KB gzipped)
- `json-template.js`: ~8KB (~3KB gzipped)
- `auto-loader.js`: ~5KB (~2KB gzipped)
- **Total: ~71KB (~20KB gzipped)** - similar to all-in-one!

---

## Pattern 3: Individual Bundles + Explicit `is` (No Auto-Loader)

**Best for:** Maximum control, predictable behavior, production apps with strict CSP

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Load only the behaviors you need -->
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/request.js"></script>
  <script src="https://unpkg.com/behavior-fn@latest/dist/cdn/json-template.js"></script>
  
  <!-- Define behavioral hosts manually (required without auto-loader) -->
  <script>
    // Define hosts for each tag+behavior combination you use
    window.BehaviorFN.defineBehavioralHost('form', 'behavioral-request', []);
    window.BehaviorFN.defineBehavioralHost('div', 'behavioral-json-template', []);
  </script>
</head>
<body>
  <!-- Use explicit is attribute -->
  <form 
    is="behavioral-request"
    behavior="request" 
    request-url="/api/search"
  >
    <input name="q">
    <button type="submit">Search</button>
  </form>
  
  <div 
    is="behavioral-json-template"
    behavior="json-template" 
    json-template-for="data"
  >
    <template>
      <div data-key="result"></div>
    </template>
  </div>
</body>
</html>
```

**✅ Pros:**
- No MutationObserver overhead
- No auto-loader ~2KB
- Explicit and predictable
- Better for debugging
- CSP-friendly (no DOM manipulation)

**⚠️ Cons:**
- More verbose HTML
- Must calculate `is` value correctly
- Multiple behaviors: `is="behavioral-logger-reveal"` (sorted alphabetically)
- **Must define behavioral hosts manually** for each tag+behavior combo

**File sizes:**
- `request.js`: ~58KB (~15KB gzipped)
- `json-template.js`: ~8KB (~3KB gzipped)
- **Total: ~66KB (~18KB gzipped)** - smallest option!

**What is `defineBehavioralHost()`?**

It creates a custom element that can host behaviors:

```javascript
// Creates a custom element named 'behavioral-request' that extends 'form'
window.BehaviorFN.defineBehavioralHost(
  'form',                  // Base HTML element
  'behavioral-request',    // Custom element name
  []                       // Observed attributes (optional)
);
```

This is what allows you to use `<form is="behavioral-request">`.

**The auto-loader does this automatically** - it detects `<form behavior="request">` and calls `defineBehavioralHost('form', 'behavioral-request')` for you!

---

## Comparison

| Pattern | File Size | HTTP Requests | Auto `is` | Complexity |
|---------|-----------|---------------|-----------|------------|
| **All-in-One** | ~72KB (~20KB gz) | 1 | ✅ Yes | ⭐ Easy |
| **Individual + Auto-Loader** | ~71KB (~20KB gz) | 3+ | ✅ Yes | ⭐⭐ Medium |
| **Individual + Explicit** | ~66KB (~18KB gz) | 2+ | ❌ No | ⭐⭐⭐ Complex |

---

## Loading Order (Important!)

### Pattern 1: All-in-One
```html
<!-- Order doesn't matter - single script -->
<script src="behavior-fn.all.js"></script>
```

### Pattern 2: Individual + Auto-Loader
```html
<!-- Auto-loader MUST be last -->
<script src="request.js"></script>
<script src="json-template.js"></script>
<script src="auto-loader.js"></script> <!-- ⚠️ LAST! -->
```

**Why:** Auto-loader scans DOM immediately. All behaviors must be registered first.

### Pattern 3: Individual + Explicit
```html
<!-- Order doesn't matter - no auto-loader -->
<script src="request.js"></script>
<script src="json-template.js"></script>
<!-- Can be in any order -->
```

---

## Available Bundles

**Core:**
- `behavior-fn.js` - Core runtime only (~7KB)
- `behavior-fn.all.js` - All behaviors + auto-loader (~72KB)

**Behaviors (Individual):**
- `reveal.js` (~10KB)
- `request.js` (~58KB)
- `json-template.js` (~8KB)
- `logger.js` (~5KB)
- `compute.js` (~9KB)
- `element-counter.js` (~6KB)
- `input-watcher.js` (~6KB)
- `compound-commands.js` (~7KB)

**Utilities:**
- `auto-loader.js` - Auto-loader only (~5KB) ⭐ NEW

**ES Modules:**
- Add `.esm.js` extension to any bundle

---

## Recommendations

### For Learning/Prototypes
→ **Use Pattern 1** (all-in-one)

### For Production with Multiple Behaviors
→ **Use Pattern 1** (all-in-one) - file size is similar anyway

### For Production with 1-2 Behaviors
→ **Use Pattern 3** (individual + explicit) - smallest size, most predictable

### For Maximum Control
→ **Use Pattern 3** (individual + explicit) - no magic, explicit behavior

---

## Examples

### Example 1: Quick Prototype
```html
<script src="https://unpkg.com/behavior-fn@latest/dist/cdn/behavior-fn.all.js"></script>
<dialog behavior="reveal">Content</dialog>
```

### Example 2: Production (Optimized)
```html
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/request.js"></script>
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/auto-loader.js"></script>

<form behavior="request">...</form>
```

### Example 3: Production (Explicit)
```html
<script src="https://unpkg.com/behavior-fn@0.1.6/dist/cdn/request.js"></script>

<form is="behavioral-request" behavior="request">...</form>
```

---

## Troubleshooting

### "Unknown behavior" error
→ Auto-loader loaded before behavior scripts  
→ **Fix:** Load `auto-loader.js` LAST

### "No loader found" error  
→ Using old version (< 0.1.6) with individual bundles  
→ **Fix:** Upgrade to 0.1.6+ or use all-in-one bundle

### Behaviors not working
→ Missing `is` attribute and no auto-loader  
→ **Fix:** Add `auto-loader.js` OR use explicit `is` attributes

---

**Default recommendation: Use all-in-one bundle unless you have a specific reason not to!**
