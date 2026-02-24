# Task: Implement `content-setter` Behavior

**Created:** 2026-02-24 18:23:06  
**Status:** Planning  
**Type:** New Behavior Implementation  
**Agent:** Architect (Planning Phase)

---

## Goal

Create a new behavior called `content-setter` that allows buttons (using Invoker Commands API) to modify attributes or `textContent` on target elements in a secure, declarative way.

---

## Context

### Problem
Developers need a way to declaratively control element attributes and text content from buttons without writing JavaScript. Common use cases include:
- Theme switching (changing `data-theme` attributes)
- Status updates (changing `data-status`, `aria-*` attributes)
- Dynamic text updates (updating messages, labels)
- State management via data attributes

### Solution
A behavior that responds to Invoker Commands and sets either:
1. **Attributes** on the element (any valid attribute name)
2. **textContent** for safe text updates (no HTML parsing/XSS risk)

### Security Considerations
- **NO `innerHTML` support** - XSS risk, we don't trust developers to sanitize
- **NO `outerHTML` support** - too dangerous
- **Only `textContent`** for content updates - safe by design

---

## Design Specification

### Behavior Name
`content-setter`

### HTML Usage Examples

```html
<!-- Example 1: Set text content -->
<button commandfor="message" command="--set-content">
  Update Message
</button>

<div 
  is="behavioral-content-setter"
  behavior="content-setter"
  id="message"
  content-setter-attribute="textContent"
  content-setter-value="Hello World!">
</div>

<!-- Example 2: Set data attribute -->
<button commandfor="theme-box" command="--set-content">
  Dark Mode
</button>

<div 
  is="behavioral-content-setter"
  behavior="content-setter"
  id="theme-box"
  content-setter-attribute="data-theme"
  content-setter-value="dark"
  class="container">
  Content here
</div>

<!-- Example 3: Toggle attribute -->
<button commandfor="status" command="--set-content">
  Toggle Status
</button>

<div 
  is="behavioral-content-setter"
  behavior="content-setter"
  id="status"
  content-setter-attribute="data-active"
  content-setter-value="true"
  content-setter-mode="toggle">
  Status Box
</div>

<!-- Example 4: Set ARIA attribute -->
<button commandfor="panel" command="--set-content">
  Hide Panel
</button>

<div 
  is="behavioral-content-setter"
  behavior="content-setter"
  id="panel"
  content-setter-attribute="aria-hidden"
  content-setter-value="true">
  Panel Content
</div>
```

### Schema Attributes

#### `content-setter-attribute` (required)
- **Type:** `string`
- **Description:** The attribute to modify. Can be:
  - Any attribute name (e.g., `"data-theme"`, `"aria-hidden"`, `"class"`)
  - The literal string `"textContent"` for text content updates
- **Examples:** `"data-theme"`, `"textContent"`, `"aria-expanded"`

#### `content-setter-value` (required)
- **Type:** `string`
- **Description:** The value to set on the target
- **Examples:** `"dark"`, `"Hello World"`, `"true"`

#### `content-setter-mode` (optional)
- **Type:** `"set" | "toggle" | "remove"`
- **Default:** `"set"`
- **Description:** How to apply the value
  - `"set"`: Set the value (default)
  - `"toggle"`: Toggle between value and empty string (for attributes) or original/new value (for textContent)
  - `"remove"`: Remove the attribute (only valid for attributes, not textContent)

---

## Implementation Plan (PDSRTDD)

### Phase 1: Data & Schema (D + S)
1. Create `registry/behaviors/content-setter/` directory
2. Define constants in `constants.ts`:
   ```typescript
   export const CONTENT_SETTER_ATTRS = {
     ATTRIBUTE: "content-setter-attribute",
     VALUE: "content-setter-value",
     MODE: "content-setter-mode",
   } as const;
   ```
3. Create TypeBox schema in `schema.ts`:
   ```typescript
   import { Type } from "@sinclair/typebox";
   import { type InferSchema } from "../types";
   import { CONTENT_SETTER_ATTRS } from "./constants";

   export const schema = Type.Object({
     [CONTENT_SETTER_ATTRS.ATTRIBUTE]: Type.String(),
     [CONTENT_SETTER_ATTRS.VALUE]: Type.String(),
     [CONTENT_SETTER_ATTRS.MODE]: Type.Optional(
       Type.Union([
         Type.Literal("set"),
         Type.Literal("toggle"),
         Type.Literal("remove"),
       ])
     ),
   });

   export type SchemaType = InferSchema<typeof schema>;
   ```
4. Create behavior definition in `_behavior-definition.ts`:
   ```typescript
   import { schema } from "./schema";
   
   export const behaviorDefinition = {
     name: "content-setter",
     schema,
   } as const;
   ```

### Phase 2: Registry (R)
5. Add to `registry/behaviors-registry.json`:
   ```json
   {
     "behaviors": [
       {
         "name": "content-setter",
         "path": "./behaviors/content-setter"
       }
     ]
   }
   ```

### Phase 3: Test (T)
6. Create `behavior.test.ts` with test cases:
   - Test setting textContent
   - Test setting data attributes
   - Test setting ARIA attributes
   - Test toggle mode
   - Test remove mode (attributes only)
   - Test invoker command integration
   - Test error cases (missing attributes, invalid mode)

### Phase 4: Development (DD)
7. Implement `behavior.ts`:
   - Export factory function
   - Handle `onCommand` event (Invoker Commands API)
   - Implement set/toggle/remove logic
   - Distinguish between attribute and textContent targets
   - Add validation and error handling

---

## Technical Requirements

### Event Handlers
- **`onCommand(event: Event)`**: Handle Invoker Commands (`--set-content`)

### Logic Flow
1. Listen for `command` event
2. Read `content-setter-attribute`, `content-setter-value`, `content-setter-mode`
3. Determine attribute type:
   - If attribute === `"textContent"` → use `element.textContent`
   - Otherwise → treat as attribute name
4. Apply based on mode:
   - **set**: Set value directly
   - **toggle**: Toggle between value and previous/empty
   - **remove**: Remove attribute (error if textContent)

### Validation
- Required: `content-setter-attribute`, `content-setter-value`
- Mode must be one of: `"set"`, `"toggle"`, `"remove"`
- Cannot use `"remove"` mode with `textContent` attribute

### Security
- ✅ `textContent` only (safe, no HTML parsing)
- ❌ No `innerHTML` (XSS risk)
- ❌ No `outerHTML` (too dangerous)
- ❌ No sanitization needed (textContent is safe by design)

---

## File Structure

```
registry/behaviors/content-setter/
├── _behavior-definition.ts  # Name + schema export
├── constants.ts             # CONTENT_SETTER_ATTRS constants
├── schema.ts                # TypeBox schema
├── behavior.ts              # Factory function + logic
└── behavior.test.ts         # Vitest tests
```

---

## Testing Strategy

### Unit Tests (behavior.test.ts)
1. **Set textContent**
   ```typescript
   test("sets textContent when attribute is 'textContent'", () => {
     const el = createTestHost({ 
       "content-setter-attribute": "textContent",
       "content-setter-value": "New Text"
     });
     el.dispatchEvent(new Event("command"));
     expect(el.textContent).toBe("New Text");
   });
   ```

2. **Set attribute**
   ```typescript
   test("sets data attribute when attribute is attribute name", () => {
     const el = createTestHost({ 
       "content-setter-attribute": "data-theme",
       "content-setter-value": "dark"
     });
     el.dispatchEvent(new Event("command"));
     expect(el.getAttribute("data-theme")).toBe("dark");
   });
   ```

3. **Toggle mode**
   ```typescript
   test("toggles attribute value on repeated commands", () => {
     const el = createTestHost({ 
       "content-setter-attribute": "data-active",
       "content-setter-value": "true",
       "content-setter-mode": "toggle"
     });
     el.dispatchEvent(new Event("command"));
     expect(el.getAttribute("data-active")).toBe("true");
     el.dispatchEvent(new Event("command"));
     expect(el.getAttribute("data-active")).toBe("");
   });
   ```

4. **Remove mode**
   ```typescript
   test("removes attribute in remove mode", () => {
     const el = createTestHost({ 
       "content-setter-attribute": "data-temp",
       "content-setter-value": "",
       "content-setter-mode": "remove"
     });
     el.setAttribute("data-temp", "value");
     el.dispatchEvent(new Event("command"));
     expect(el.hasAttribute("data-temp")).toBe(false);
   });
   ```

5. **Error cases**
   ```typescript
   test("throws error when using remove mode with textContent", () => {
     const el = createTestHost({ 
       "content-setter-attribute": "textContent",
       "content-setter-value": "",
       "content-setter-mode": "remove"
     });
     expect(() => el.dispatchEvent(new Event("command"))).toThrow();
   });
   ```

---

## Use Cases

1. **Theme Switcher**
   ```html
   <button commandfor="app" command="--set-content">Dark Mode</button>
   <div is="behavioral-content-setter" behavior="content-setter" 
        id="app" content-setter-attribute="data-theme" 
        content-setter-value="dark">
   ```

2. **Status Messages**
   ```html
   <button commandfor="msg" command="--set-content">Show Success</button>
   <p is="behavioral-content-setter" behavior="content-setter"
      id="msg" content-setter-attribute="textContent" 
      content-setter-value="Operation successful!">
   ```

3. **Accessibility State**
   ```html
   <button commandfor="panel" command="--set-content">Hide Panel</button>
   <div is="behavioral-content-setter" behavior="content-setter"
        id="panel" content-setter-attribute="aria-hidden" 
        content-setter-value="true">
   ```

4. **Filter Controls**
   ```html
   <button commandfor="list" command="--set-content">Show Active</button>
   <ul is="behavioral-content-setter" behavior="content-setter"
       id="list" content-setter-attribute="data-filter" 
       content-setter-value="active">
   ```

---

## Documentation Notes

### Security Warning
Add to behavior documentation:
> **Security Note:** This behavior only supports `textContent` for content updates (not `innerHTML`). This is by design to prevent XSS vulnerabilities. If you need to set HTML content, consider using a template system with proper server-side sanitization.

### Best Practices
- Use `textContent` for user-generated or dynamic text
- Use data attributes for state management
- Use ARIA attributes for accessibility updates
- Avoid setting attributes that trigger layout thrashing

---

## Acceptance Criteria

- [ ] All 5 files created in `registry/behaviors/content-setter/`
- [ ] Constants defined following `BEHAVIOR_ATTRS` pattern
- [ ] TypeBox schema defines all attributes correctly
- [ ] Behavior definition exports name + schema
- [ ] Registered in `behaviors-registry.json`
- [ ] All tests pass (minimum 5 test cases)
- [ ] Tests cover: set, toggle, remove modes
- [ ] Tests cover: textContent and attribute names
- [ ] Tests cover: error cases
- [ ] No `innerHTML` or `outerHTML` support (security)
- [ ] Follows Invoker Commands API pattern
- [ ] Code passes TypeScript strict mode
- [ ] No external dependencies

---

## Notes

- This behavior is **security-first** by design - no HTML parsing at all
- Pairs well with `reveal` behavior for show/hide + content updates
- Could be extended in future for `classList` manipulation if needed
- Toggle mode stores previous value internally for textContent toggling

---

## Next Steps

1. **Execute Phase**: Create worktree/branch for implementation
2. **Implement**: Follow PDSRTDD (Data → Schema → Registry → Test → Develop)
3. **Verify**: Run tests, check type safety
4. **Complete**: Update TASKS.md, report completion

---

**End of Planning Phase**
