# Adding a New Behavior

Contributing a new behavior to `behavior-cn` involves creating the behavior files, registering them in the manifest, and verifying they work.

## Step 1: Create the Behavior Directory

Create a new directory in `registry/behaviors/` with the name of your behavior (kebab-case).

```bash
mkdir registry/behaviors/my-behavior
```

## Step 2: Create the Behavior Files

Every behavior requires three files:

### 1. Definition (`_behavior-definition.ts`)

Defines the contract (props and commands).

```typescript
import { uniqueBehaviorDef } from "~utils";

const MY_BEHAVIOR_DEFINITION = uniqueBehaviorDef({
  name: "my-behavior",
  command: {
    "--do-something": "--do-something",
  },
  // Optional: Define props schema if needed
  // schema: z.object({ ... })
});

export default MY_BEHAVIOR_DEFINITION;
```

### 2. Implementation (`behavior.ts`)

Implements the logic.

```typescript
import { registerBehavior, type CommandEvent } from "~registry";
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
    onCommand(e: CommandEvent<string>) {
      const cmd = MY_BEHAVIOR_DEFINITION.command;

      if (e.command === cmd["--do-something"]) {
        console.log("Doing something!");
        // Dispatch events or modify DOM
      }
    },

    // 3. Lifecycle methods (optional)
    connectedCallback() {
      console.log("Behavior attached");
    },
    disconnectedCallback() {
      console.log("Behavior detached");
    },
  };
};

// 4. Register the factory
registerBehavior(MY_BEHAVIOR_DEFINITION.name, myBehaviorFactory);
```

### 3. Tests (`behavior.test.ts`)

Unit tests for the behavior.

```typescript
/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerTestComponent, dispatchCommand } from "~test-utils";
import MY_BEHAVIOR_DEFINITION from "./_behavior-definition";
import { myBehaviorFactory } from "./behavior";
import { registerBehavior } from "~registry";

describe("My Behavior", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    registerBehavior(MY_BEHAVIOR_DEFINITION.name, myBehaviorFactory);
  });

  it("should handle command", async () => {
    const tag = "button";
    const webcomponentTag = "test-my-behavior";

    // Register a test component that uses the behavior
    registerTestComponent(
      tag,
      { tag: webcomponentTag },
      (Base) => class extends Base {},
      { "my-behavior": MY_BEHAVIOR_DEFINITION },
    );

    const el = document.createElement(tag, {
      is: webcomponentTag,
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

## Step 3: Register in Manifest

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
    node /path/to/behavior-cn/dist/index.js add my-behavior
    ```
