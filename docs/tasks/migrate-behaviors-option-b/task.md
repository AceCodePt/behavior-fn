# Migrate Remaining Behaviors to Option B Pattern

## Goal

Complete the migration of 6 remaining behaviors to the Option B pattern (key-value identity) where `ATTRS = { "attr-name": "attr-name" }` and all metadata is auto-extracted by `uniqueBehaviorDef`.

## Context

The infrastructure is complete and proven:
- ✅ `uniqueBehaviorDef` utility fully implemented in `registry/behaviors/behavior-utils.ts`
- ✅ Complete documentation in `docs/guides/behavior-definition-standard.md`
- ✅ Working reference implementations: `reveal` and `logger` behaviors
- ✅ Pattern documented in `AGENTS.md`

**What's Left:** Migrate 6 behaviors to match the pattern.

## Requirements

For each behavior, perform these steps:

### 1. Update `schema.ts`
- Remove `BEHAVIOR_ATTRS` constant export
- Convert schema to use literal string keys
- Add JSDoc comments above each attribute

**Before:**
```typescript
export const REQUEST_ATTRS = {
  URL: "request-url",
  METHOD: "request-method",
} as const;

export const schema = Type.Object({
  [REQUEST_ATTRS.URL]: Type.Optional(Type.String()),
  [REQUEST_ATTRS.METHOD]: Type.Optional(Type.String()),
});
```

**After:**
```typescript
/**
 * Schema for request behavior.
 * 
 * uniqueBehaviorDef automatically extracts attribute keys to create definition.ATTRS.
 */
export const schema = Type.Object({
  /** URL to send the request to */
  "request-url": Type.Optional(Type.String()),
  
  /** HTTP method (GET, POST, PUT, DELETE, PATCH) */
  "request-method": Type.Optional(Type.String()),
});
```

### 2. Update `_behavior-definition.ts`
- Remove manual ATTRS, COMMANDS, OBSERVED_ATTRIBUTES constants
- Simplify to just call `uniqueBehaviorDef` with schema and optional command
- Let auto-extraction handle metadata

**Before:**
```typescript
import { uniqueBehaviorDef } from "~utils";
import { schema, REQUEST_ATTRS } from "./schema";

const REQUEST_COMMANDS = { ... };
const REQUEST_OBSERVED_ATTRIBUTES = Object.values(REQUEST_ATTRS);

const definition = uniqueBehaviorDef({
  name: "request",
  schema,
  command: REQUEST_COMMANDS,
  ATTRS: REQUEST_ATTRS,
  COMMANDS: REQUEST_COMMANDS,
  OBSERVED_ATTRIBUTES: REQUEST_OBSERVED_ATTRIBUTES,
});

export default definition;
```

**After:**
```typescript
import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

/**
 * Request behavior definition.
 * 
 * uniqueBehaviorDef automatically extracts:
 * - ATTRS: From schema keys (e.g., { "request-url": "request-url", ... })
 * - COMMANDS: From command object (e.g., { "--trigger": "--trigger", ... })
 * - OBSERVED_ATTRIBUTES: Array of schema keys
 */
const definition = uniqueBehaviorDef({
  name: "request",
  schema,
  command: {
    "--trigger": "--trigger",
    "--close-sse": "--close-sse",
  },
});

export default definition;
```

### 3. Update `behavior.ts`
- Change imports to use `definition` only
- Destructure `ATTRS` and `COMMANDS` from `definition`
- Replace all `BEHAVIOR_ATTRS.KEY` with `ATTRS["attr-name"]` bracket notation
- Replace all `BEHAVIOR_COMMANDS.KEY` with `COMMANDS["--cmd"]` bracket notation
- Update `observedAttributes` assignment to use `definition.OBSERVED_ATTRIBUTES`

**Before:**
```typescript
import definition, { REQUEST_ATTRS, REQUEST_COMMANDS } from "./_behavior-definition";

const { name } = definition;

export const requestBehaviorFactory = (el: HTMLElement) => {
  const url = el.getAttribute(REQUEST_ATTRS.URL);
  const method = el.getAttribute(REQUEST_ATTRS.METHOD);
  
  return {
    onCommand(e: CommandEvent) {
      if (e.command === REQUEST_COMMANDS["--trigger"]) {
        // ...
      }
    }
  };
};
```

**After:**
```typescript
import definition from "./_behavior-definition";

const { name, ATTRS, COMMANDS } = definition;

export const requestBehaviorFactory = (el: HTMLElement) => {
  const url = el.getAttribute(ATTRS["request-url"]);
  const method = el.getAttribute(ATTRS["request-method"]);
  
  return {
    onCommand(e: CommandEvent<string>) {
      if (!COMMANDS) return;
      if (e.command === COMMANDS["--trigger"]) {
        // ...
      }
    }
  };
};

// Attach observed attributes from definition
requestBehaviorFactory.observedAttributes = definition.OBSERVED_ATTRIBUTES;
```

### 4. Update `behavior.test.ts` (if needed)
- Update imports to use `definition` instead of separate ATTRS constants
- Replace `BEHAVIOR_ATTRS.KEY` with `definition.ATTRS["attr-name"]`

**Before:**
```typescript
import { REQUEST_ATTRS } from "./constants";

el.setAttribute(REQUEST_ATTRS.URL, "https://api.example.com");
```

**After:**
```typescript
import definition from "./_behavior-definition";

el.setAttribute(definition.ATTRS["request-url"], "https://api.example.com");
```

## Behaviors to Migrate

### 1. ✅ reveal - COMPLETE
Reference implementation. All tests passing.

### 2. ✅ logger - COMPLETE  
Reference implementation. All tests passing.

### 3. ⏳ request (partially done)
- ✅ Schema updated with literal keys
- ✅ Definition updated
- ❌ behavior.ts needs ATTRS bracket notation updates
- ❌ Tests need updating

**Attribute mapping:**
```
REQUEST_ATTRS.URL → ATTRS["request-url"]
REQUEST_ATTRS.METHOD → ATTRS["request-method"]
REQUEST_ATTRS.TRIGGER → ATTRS["request-trigger"]
REQUEST_ATTRS.TARGET → ATTRS["request-target"]
REQUEST_ATTRS.SWAP → ATTRS["request-swap"]
REQUEST_ATTRS.INDICATOR → ATTRS["request-indicator"]
REQUEST_ATTRS.CONFIRM → ATTRS["request-confirm"]
REQUEST_ATTRS.PUSH_URL → ATTRS["request-push-url"]
REQUEST_ATTRS.VALS → ATTRS["request-vals"]
REQUEST_ATTRS.JSON_STRATEGY → ATTRS["request-json-strategy"]
```

### 4. ⏳ element-counter
**Attribute mapping:**
```
ELEMENT_COUNTER_ATTRS.ROOT → ATTRS["element-counter-root"]
ELEMENT_COUNTER_ATTRS.SELECTOR → ATTRS["element-counter-selector"]
```

### 5. ⏳ compute
**Attribute mapping:**
```
COMPUTE_ATTRS.FORMULA → ATTRS["compute-formula"]
```

### 6. ⏳ input-watcher
**Attribute mapping:**
```
INPUT_WATCHER_ATTRS.TARGET → ATTRS["input-watcher-target"]
INPUT_WATCHER_ATTRS.FORMAT → ATTRS["input-watcher-format"]
INPUT_WATCHER_ATTRS.EVENTS → ATTRS["input-watcher-events"]
INPUT_WATCHER_ATTRS.ATTR → ATTRS["input-watcher-attr"]
```

### 7. ⏳ json-template
**Attribute mapping:**
```
JSON_TEMPLATE_ATTRS.FOR → ATTRS["json-template-for"]
```

### 8. ⏳ compound-commands
**Attribute mapping:**
```
COMPOUND_COMMANDS_ATTRS.COMMANDFOR → ATTRS["commandfor"]
COMPOUND_COMMANDS_ATTRS.COMMAND → ATTRS["command"]
```

### 9. ⏳ content-setter
**Attribute mapping:**
```
CONTENT_SETTER_ATTRS.ATTRIBUTE → ATTRS["content-setter-attribute"]
CONTENT_SETTER_ATTRS.VALUE → ATTRS["content-setter-value"]
CONTENT_SETTER_ATTRS.MODE → ATTRS["content-setter-mode"]
```

**Command mapping:**
```
CONTENT_SETTER_COMMANDS["--set-content"] → COMMANDS["--set-content"]
```

## Verification Steps

For each behavior after migration:

1. **Run behavior tests:**
   ```bash
   npm test -- registry/behaviors/{behavior-name}/behavior.test.ts
   ```

2. **Verify file structure:**
   ```bash
   ls registry/behaviors/{behavior-name}/
   # Should show exactly 4 files:
   # _behavior-definition.ts
   # behavior.test.ts
   # behavior.ts
   # schema.ts
   ```

3. **Check for stale imports:**
   ```bash
   grep -r "from \"./constants\"" registry/behaviors/{behavior-name}/
   # Should return nothing
   ```

4. **Verify bracket notation:**
   ```bash
   grep "ATTRS\[\"" registry/behaviors/{behavior-name}/behavior.ts
   # Should show all attribute accesses using bracket notation
   ```

## Success Criteria

- [ ] All 6 remaining behaviors migrated
- [ ] All behavior tests passing
- [ ] No `constants.ts` files remain
- [ ] All behaviors use bracket notation (`ATTRS["attr-name"]`)
- [ ] All behaviors use `definition.OBSERVED_ATTRIBUTES`
- [ ] Full test suite passes (`npm test`)
- [ ] Type checking passes (`npx tsc --noEmit`)

## Reference Files

- **Working examples:** `registry/behaviors/reveal/` and `registry/behaviors/logger/`
- **Documentation:** `docs/guides/behavior-definition-standard.md`
- **Utility:** `registry/behaviors/behavior-utils.ts` (see `uniqueBehaviorDef`)

## Notes

- This is a **mechanical refactoring** - no logic changes
- The pattern is proven and working
- Each behavior takes ~10 minutes to migrate
- Tests will guide you if bracket notation is incorrect
- Use reveal and logger as reference implementations

## Non-Requirements

- Do NOT change behavior logic or functionality
- Do NOT modify test assertions
- Do NOT change the public API
- Do NOT add new features
