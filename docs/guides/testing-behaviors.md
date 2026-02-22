# Testing Behaviors

Testing behaviors is crucial to ensure reliability and prevent regressions. `behavior-fn` encourages a testing strategy that focuses on the **Contract** (Definition) and the **Outcome** (DOM changes).

## Testing Philosophy

- **Unit Tests:** Test individual behaviors in isolation.
- **Integration Tests:** Test how behaviors interact with each other (if applicable).
- **Environment:** Use `jsdom` to simulate a browser environment.

## Setting Up Tests

We use `vitest` and `jsdom`.

### The Test Harness

`behavior-fn` provides a test harness to simplify setting up the DOM and registering behaviors.

```typescript
import { dispatchCommand } from "~test-utils";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
```

## Writing a Test

Here is a standard pattern for testing a behavior.

### 1. Setup

Import the necessary utilities and the behavior definition/factory.

```typescript
/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { dispatchCommand } from "~test-utils";
import { registerBehavior } from "~registry";
import { defineBehavioralHost } from "~host";
import MY_BEHAVIOR from "./_behavior-definition";
import { myBehaviorFactory } from "./behavior";
```

### 2. Registration

Register the behavior and host in `beforeEach` (or `beforeAll`).

```typescript
describe("My Behavior", () => {
  beforeAll(() => {
    // Register the host element (e.g., <button is="behavioral-button">)
    defineBehavioralHost("button");
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    // Register the specific behavior under test
    registerBehavior(MY_BEHAVIOR.name, myBehaviorFactory);
  });
```

### 3. Test Case

Create a test component, attach the behavior, and assert the outcome.

```typescript
  it("should respond to command", async () => {
    // 1. Create the element
    const el = document.createElement("button", { is: "behavioral-button" }) as HTMLButtonElement;
    el.setAttribute("behavior", "my-behavior");
    document.body.appendChild(el);

    // 2. Dispatch Command
    // Use vi.waitFor if the behavior involves async updates or animations
    await vi.waitFor(() => {
      dispatchCommand(el, MY_BEHAVIOR.command["--do-something"]);
    });

    // 3. Assert
    expect(el.getAttribute("data-done")).toBe("true");
  });
});
```

## Key Utilities

### `defineBehavioralHost`

Registers a custom element that acts as a host for behaviors.

```typescript
defineBehavioralHost("div"); // Registers <div is="behavioral-div">
```

### `dispatchCommand`

Dispatches a custom `command` event on the target element.

```typescript
dispatchCommand(element, commandName, payload?);
```

## Mocking Dependencies

If your behavior relies on external services or globals, use `vi.spyOn` or dependency injection to mock them.

```typescript
const spy = vi.spyOn(console, "log");
// ... trigger behavior ...
expect(spy).toHaveBeenCalledWith("Something happened");
```
