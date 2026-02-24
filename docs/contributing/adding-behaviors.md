# Adding a New Behavior

Contributing a new behavior to `behavior-fn` involves creating the behavior files, registering them in the manifest, and verifying they work.

## Step 1: Create the Behavior Directory

Create a new directory in `registry/behaviors/` with the name of your behavior (kebab-case).

```bash
mkdir registry/behaviors/my-behavior
```

## Step 2: Create the Behavior Files

Every behavior requires three files:

### 1. Definition (`_behavior-definition.ts`)

Defines the contract (schema and commands). Note that `observedAttributes` are automatically derived from the `schema` by the host.

```typescript
import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const MY_BEHAVIOR_DEFINITION = uniqueBehaviorDef({
  name: "my-behavior",
  command: {
    "--do-something": "--do-something",
  },
  schema, // Pass the schema object (from ./schema.ts)
});

export default MY_BEHAVIOR_DEFINITION;
```

### 3. Schema (`schema.ts`)

Defines the structure of the data associated with the behavior using TypeBox.

> **Important Rules:** 
> 1. All attributes that play a role in the behavior MUST be defined in the schema. This ensures they are observed by the host and prevents surprises where attribute changes are ignored.
> 2. **Define attribute name constants BEFORE the schema definition.** This is the single source of truth for attribute names.
> 3. All behavior-specific attributes MUST follow the naming convention: `{behavior-name}-{attribute-name}`

```typescript
import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

// 1. Define constants first (single source of truth for attribute names)
export const MY_BEHAVIOR_ATTRS = {
  PROP: "my-behavior-prop",
  ENABLED: "my-behavior-enabled",
} as const;

// 2. Use constants in schema definition
export const schema = Type.Object({
  [MY_BEHAVIOR_ATTRS.PROP]: Type.String(),
  [MY_BEHAVIOR_ATTRS.ENABLED]: Type.Optional(Type.Boolean()),
});

// 3. Export types derived from schema
export type SchemaType = InferSchema<typeof schema>;
```

**Naming Convention:**
- Constant object: `{BEHAVIOR_NAME}_ATTRS` (e.g., `MY_BEHAVIOR_ATTRS`)
- Keys: SCREAMING_SNAKE_CASE (e.g., `PROP`, `ENABLED`)
- Values: kebab-case with behavior prefix (e.g., `"my-behavior-prop"`, `"my-behavior-enabled"`)

**Standard HTML Attributes:**
If your behavior uses standard HTML attributes (like `hidden`, `open`, `popover`), include them in the schema but don't add them to the constants:

```typescript
export const MY_BEHAVIOR_ATTRS = {
  CUSTOM_PROP: "my-behavior-custom",
} as const;

export const schema = Type.Object({
  [MY_BEHAVIOR_ATTRS.CUSTOM_PROP]: Type.String(),
  hidden: Type.Optional(Type.Boolean()), // Standard HTML attribute
  open: Type.Optional(Type.Boolean()),   // Standard HTML attribute
});
```

### 4. Implementation (`behavior.ts`)

Implements the logic. **Always import and use the attribute constants from the schema.**

```typescript
import { registerBehavior, type CommandEvent, type BehaviorInstance } from "~registry";
import { type SchemaType, MY_BEHAVIOR_ATTRS } from "./schema";
import MY_BEHAVIOR_DEFINITION from "./_behavior-definition";

export const myBehaviorFactory = (el: HTMLElement) => {
  // 1. Validate element type
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(
      `Behavior ${MY_BEHAVIOR_DEFINITION.name} must be on a button`,
    );
  }

  return {
    // 2. Handle commands
    onCommand(this: BehaviorInstance<SchemaType>, e: CommandEvent<string>) {
      const cmd = MY_BEHAVIOR_DEFINITION.command;

      if (e.command === cmd["--do-something"]) {
        // ✅ GOOD: Use constants for attribute access
        const prop = el.getAttribute(MY_BEHAVIOR_ATTRS.PROP);
        const enabled = el.hasAttribute(MY_BEHAVIOR_ATTRS.ENABLED);
        
        console.log("Doing something with", prop, enabled);
        // Dispatch events or modify DOM
      }
    },

    // 3. Lifecycle methods (optional)
    connectedCallback(this: BehaviorInstance<SchemaType>) {
      console.log("Behavior attached");
    },
    disconnectedCallback(this: BehaviorInstance<SchemaType>) {
      console.log("Behavior detached");
    },
    attributeChangedCallback(
      this: BehaviorInstance<SchemaType>,
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      // Only attributes defined in schema will trigger this
      // ✅ GOOD: Compare with constants
      if (name === MY_BEHAVIOR_ATTRS.PROP && oldValue !== newValue) {
        // Handle prop change
      }
    },
  };
};

// 4. Register the factory
registerBehavior(MY_BEHAVIOR_DEFINITION.name, myBehaviorFactory);
```

**Key Points:**
- ✅ Import `MY_BEHAVIOR_ATTRS` from `./schema`
- ✅ Use constants in `getAttribute()`, `setAttribute()`, `hasAttribute()`
- ✅ Compare with constants in `attributeChangedCallback`
- ❌ Never use string literals for behavior attributes

### 5. Tests (`behavior.test.ts`)

Unit tests for the behavior.

```typescript
/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { dispatchCommand } from "~test-utils";
import { getObservedAttributes } from "~utils";
import { defineBehavioralHost } from "~host";
import MY_BEHAVIOR_DEFINITION from "./_behavior-definition";
import { myBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";

describe("My Behavior", () => {
  beforeAll(() => {
    defineBehavioralHost(
      "button", 
      "behavioral-button", 
      getObservedAttributes(MY_BEHAVIOR_DEFINITION.schema)
    );
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    registerBehavior(MY_BEHAVIOR_DEFINITION.name, myBehaviorFactory);
  });

  it("should handle command", async () => {
    const el = document.createElement("button", {
      is: "behavioral-button",
    }) as HTMLButtonElement;
    el.setAttribute("behavior", "my-behavior");
    document.body.appendChild(el);

    await vi.waitFor(() => {
      dispatchCommand(el, MY_BEHAVIOR_DEFINITION.command["--do-something"]);
      // Assert expected outcome
    });
  });
});
```

### 6. Register in Manifest

Add your behavior to `registry/behaviors-registry.json`. This tells the CLI which files to copy.

```json
{
  "name": "my-behavior",
  "dependencies": [],
  "files": [
    {
      "path": "my-behavior/_behavior-definition.ts"
    },
    {
      "path": "my-behavior/schema.ts"
    },
    {
      "path": "my-behavior/behavior.ts"
    },
    {
      "path": "my-behavior/behavior.test.ts"
    }
  ]
}
```

## Step 4: Build and Verify

1.  **Run Tests:** Ensure your behavior logic is correct.

    ```bash
    pnpm test
    ```

2.  **Build the CLI:** Update the `dist/` folder with your new registry.

    ```bash
    pnpm build
    ```

3.  **Test Installation:** You can test the installation locally by running the built CLI against a test project.
    ```bash
    # In a separate test project
    node /path/to/behavior-fn/dist/index.js add my-behavior
    ```
