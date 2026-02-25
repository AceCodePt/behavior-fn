# Behavior Migration Guide - Option B Pattern

This guide provides step-by-step instructions for migrating behaviors to the Option B pattern (key-value identity).

## Reference Implementations

**✅ Completed behaviors:**
- `registry/behaviors/reveal/` - Complex behavior with commands
- `registry/behaviors/logger/` - Simple behavior without commands

Use these as your reference when migrating other behaviors.

## Migration Pattern

### Step-by-Step Process

#### 1. Update `schema.ts`

**Remove the ATTRS constant** and use literal string keys:

```diff
- export const COMPUTE_ATTRS = {
-   FORMULA: "compute-formula",
- } as const;

+ /**
+  * Schema for compute behavior.
+  * 
+  * uniqueBehaviorDef automatically extracts attribute keys to create definition.ATTRS.
+  */
  export const schema = Type.Object({
-   [COMPUTE_ATTRS.FORMULA]: Type.String(),
+   /** Formula for computation (e.g., "a + b") */
+   "compute-formula": Type.String(),
  });
```

**Key points:**
- Remove entire ATTRS constant export
- Use literal strings as schema keys
- Move JSDoc comments above each key
- Keep type exports at bottom

#### 2. Update `_behavior-definition.ts`

**Simplify to use auto-extraction:**

```diff
  import { uniqueBehaviorDef } from "~utils";
- import { schema, COMPUTE_ATTRS } from "./schema";
+ import { schema } from "./schema";

- const COMPUTE_OBSERVED_ATTRIBUTES = Object.values(COMPUTE_ATTRS);
-
+ /**
+  * Compute behavior definition.
+  * 
+  * uniqueBehaviorDef automatically extracts:
+  * - ATTRS: From schema keys (e.g., { "compute-formula": "compute-formula" })
+  * - OBSERVED_ATTRIBUTES: Array of schema keys
+  */
  const definition = uniqueBehaviorDef({
    name: "compute",
    schema,
-   ATTRS: COMPUTE_ATTRS,
-   OBSERVED_ATTRIBUTES: COMPUTE_OBSERVED_ATTRIBUTES,
  });

  export default definition;
```

**Key points:**
- Remove all manual constant definitions
- Remove imports of ATTRS from schema
- Let `uniqueBehaviorDef` auto-extract everything
- Add JSDoc explaining auto-extraction

#### 3. Update `behavior.ts`

**Change attribute access from dot notation to bracket notation:**

```diff
  import definition from "./_behavior-definition";

- const { ATTRS: COMPUTE_ATTRS } = definition;
+ const { ATTRS, COMMANDS } = definition;

  export const computeBehaviorFactory = (el: HTMLElement) => {
-   const formula = el.getAttribute(COMPUTE_ATTRS.FORMULA);
+   const formula = el.getAttribute(ATTRS["compute-formula"]);
    
    // ... implementation
  };
```

**For behaviors with commands:**

```diff
  return {
    onCommand(e: CommandEvent<string>) {
+     if (!COMMANDS) return;
      
-     if (e.command === COMMANDS["--show"]) {
+     if (e.command === COMMANDS["--show"]) {
        // ...
      }
    }
  };
```

**Key points:**
- Destructure `ATTRS` and `COMMANDS` from definition
- Use bracket notation: `ATTRS["attr-name"]` instead of `ATTRS.KEY`
- Add null check for COMMANDS if behavior has commands
- Attach `definition.OBSERVED_ATTRIBUTES` at end of file

#### 4. Update `behavior.test.ts` (if needed)

**Update test imports and attribute usage:**

```diff
- import { COMPUTE_ATTRS } from "./constants";
+ import definition from "./_behavior-definition";

  it("should compute formula", () => {
-   el.setAttribute(COMPUTE_ATTRS.FORMULA, "2 + 2");
+   el.setAttribute(definition.ATTRS["compute-formula"], "2 + 2");
  });
```

**Key points:**
- Import `definition` instead of separate ATTRS
- Use `definition.ATTRS["attr-name"]` in tests
- Use `getObservedAttributes(definition.schema)` for behavioral host

#### 5. Verify

Run tests for the behavior:
```bash
npm test -- registry/behaviors/{behavior-name}/behavior.test.ts
```

Check type safety:
```bash
npx tsc --noEmit
```

## Common Patterns

### Behavior Without Commands

```typescript
// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "logger",
  schema,
  // No command property
});

// behavior.ts
const { ATTRS } = definition;  // COMMANDS will be undefined
```

### Behavior With Commands

```typescript
// _behavior-definition.ts
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: {
    "--show": "--show",
    "--hide": "--hide",
  },
});

// behavior.ts
const { ATTRS, COMMANDS } = definition;

return {
  onCommand(e: CommandEvent<string>) {
    if (!COMMANDS) return;  // Type guard
    
    if (e.command === COMMANDS["--show"]) {
      // ...
    }
  }
};
```

### Multiple Attribute Checks

```typescript
// Before
if (
  name === COMPUTE_ATTRS.FORMULA ||
  name === COMPUTE_ATTRS.VARIABLES
) {
  // ...
}

// After
if (
  name === ATTRS["compute-formula"] ||
  name === ATTRS["compute-variables"]
) {
  // ...
}
```

### Attribute Assignment

```typescript
// Before
el.setAttribute(REQUEST_ATTRS.URL, url);

// After
el.setAttribute(ATTRS["request-url"], url);
```

## Troubleshooting

### Issue: Tests failing with "Cannot read properties of undefined"

**Cause:** ATTRS or COMMANDS is undefined

**Solution:** Check that `uniqueBehaviorDef` is properly extracting metadata. Verify schema has properties.

### Issue: TypeScript error "Property does not exist"

**Cause:** Using wrong attribute name in bracket notation

**Solution:** Check schema keys - they must match exactly. Use IDE autocomplete within brackets.

### Issue: "command is possibly undefined"

**Cause:** Accessing COMMANDS without null check

**Solution:** Add guard: `if (!COMMANDS) return;` before accessing

## Quick Migration Checklist

For each behavior:

- [ ] Read reference implementation (reveal or logger)
- [ ] Update `schema.ts` - literal keys, remove ATTRS constant
- [ ] Update `_behavior-definition.ts` - remove manual exports
- [ ] Update `behavior.ts` - bracket notation for ATTRS
- [ ] Update `behavior.ts` - bracket notation for COMMANDS (if applicable)
- [ ] Update `behavior.ts` - use `definition.OBSERVED_ATTRIBUTES`
- [ ] Update `behavior.test.ts` - use `definition.ATTRS["..."]`
- [ ] Run tests - verify passing
- [ ] Check TypeScript - verify no errors
- [ ] Delete backup files if any

## Time Estimate

- Simple behavior (no commands): ~5-10 minutes
- Complex behavior (with commands): ~10-15 minutes

## Support

- **Pattern documentation:** `docs/guides/behavior-definition-standard.md`
- **Working examples:** `registry/behaviors/reveal/` and `registry/behaviors/logger/`
- **Utility source:** `registry/behaviors/behavior-utils.ts`
