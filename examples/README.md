# BehaviorFN Examples

Test pages for all behaviors in BehaviorFN v0.3.0.

## 🚀 Quick Start

### 1. Build CDN files

```bash
npm run build:cdn
```

### 2. Start a local server

**Option A: Python (built-in)**
```bash
python3 -m http.server 8080
```

**Option B: Node.js http-server**
```bash
npx http-server -p 8080
```

**Option C: Node.js serve**
```bash
npx serve -p 8080
```

### 3. Open examples

- **Quick Test:** http://localhost:8080/examples/quick-test.html
- **All Behaviors:** http://localhost:8080/examples/all-behaviors.html

---

## 📄 Available Examples

### `quick-test.html`
**Purpose:** Quick testing of common behaviors  
**Behaviors:** command, reveal, auto-grow, compute  
**Best for:** Rapid manual testing during development

### `all-behaviors.html`
**Purpose:** Comprehensive test suite  
**Behaviors:** All 17 behaviors with interactive demos  
**Best for:** Full regression testing, documentation screenshots

### `auto-grow-example.html`
**Purpose:** Isolated auto-grow behavior demo  
**Best for:** Testing textarea auto-expansion

### `command-dispatcher-basic.html`
**Purpose:** Legacy example (v0.2.x command-dispatcher)  
**Status:** ⚠️ Deprecated - use `quick-test.html` instead

---

## 🧪 What to Test

### Command Behavior
- ✅ Click buttons trigger commands
- ✅ Input events trigger commands (type in inputs)
- ✅ Delay works (300ms debounce)
- ✅ Multiple targets work
- ✅ Multiple commands work

### Reveal Behavior
- ✅ Dialogs open/close
- ✅ Popovers toggle
- ✅ Works with `<dialog>` and `[popover]`

### Auto-Grow
- ✅ Textarea expands when typing multiple lines
- ✅ Shrinks when deleting content

### Compute
- ✅ Formula evaluates on input change
- ✅ References other elements by ID

### All Others
- See `all-behaviors.html` for comprehensive demos

---

## 🐛 Troubleshooting

### "Failed to load module script" MIME type error

**Cause:** Examples try to import `.ts` files directly  
**Fix:** Run `npm run build:cdn` first, examples use `dist/cdn/*.js`

### Behaviors not loading

**Check:**
1. CDN files exist: `ls dist/cdn/*.js`
2. Server is running: `curl http://localhost:8080`
3. No console errors: Open DevTools → Console

### Auto-loader not working

**Verify:**
1. `auto-loader.js` imported after behavior imports
2. No `is` attribute on elements (conflicts with auto-loader)
3. Elements have `behavior` attribute

---

## 📦 CDN Bundle Sizes

After `npm run build:cdn`:

| Behavior | Size (minified) | Size (gzipped) |
|----------|----------------|----------------|
| core | ~7 KB | ~2.5 KB |
| auto-loader | ~2 KB | ~0.8 KB |
| command | ~3.5 KB | ~1.2 KB |
| reveal | ~2.5 KB | ~1 KB |
| auto-grow | ~2 KB | ~0.7 KB |
| compute | ~9.5 KB | ~3 KB |
| json-template | ~8 KB | ~2.8 KB |
| request | ~5 KB | ~1.8 KB |
| (others) | ~1-4 KB each | ~0.5-1.5 KB |

**Total for all 17:** ~85 KB minified (~28 KB gzipped)  
**Typical use case (4-5 behaviors):** ~15-20 KB minified (~5-7 KB gzipped)

---

## 🔄 Development Workflow

1. Make changes to behavior in `registry/behaviors/`
2. Rebuild CDN: `npm run build:cdn`
3. Refresh browser (hard refresh: Ctrl+Shift+R)
4. Check console for errors

**Note:** No bundler or dev server needed! Plain ES modules work in all modern browsers.

---

## 📝 Creating New Examples

Use this template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Example</title>
</head>
<body>
  <h1>Test Title</h1>
  
  <!-- Your demo HTML -->
  <button behavior="command" commandfor="target" command="show">
    Click me
  </button>
  
  <div behavior="reveal" id="target">
    Content
  </div>

  <script type="module">
    // Import behaviors
    import '../dist/cdn/command.js';
    import '../dist/cdn/reveal.js';
    
    // Import auto-loader
    import '../dist/cdn/auto-loader.js';
  </script>
</body>
</html>
```

---

## 🌐 Using Unpkg CDN

For production testing, use unpkg:

```html
<script type="module">
  import 'https://unpkg.com/behavior-fn@0.3.0/dist/cdn/command.js';
  import 'https://unpkg.com/behavior-fn@0.3.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.3.0/dist/cdn/auto-loader.js';
</script>
```

**Note:** Replace version number with actual published version.
