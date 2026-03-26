# The Command Protocol

The Command Protocol is the primary mechanism for interaction in `behavior-fn`. It decouples the **Trigger** (e.g., a button) from the **Action** (e.g., a behavior logic) using a standardized custom event.

## Philosophy

In traditional web development, you might attach an `onclick` handler to a button that calls a specific function. This tightly couples the UI to the logic.

In `behavior-fn`, we use a **Command** pattern:

1.  The UI emits a **Command** (a signal of intent).
2.  The Behavior listens for that Command and executes the logic.

This allows for:

- **Decoupling:** The button doesn't know _what_ will happen, only _that_ something should happen.
- **Many-to-Many:** One button can trigger multiple behaviors, and multiple buttons can trigger the same behavior.
- **Testability:** You can test logic by simply dispatching a command event.

## The Protocol

The protocol is built on top of the native `CustomEvent` API.

### The Event

- **Event Name:** `command`
- **Bubbles:** `true` (It bubbles up the DOM)
- **Cancelable:** `true`
- **Detail:**
  - `command`: The unique string identifier of the command (e.g., `--toggle-sidebar`).
  - `payload`: Optional data associated with the command.
  - `originalEvent`: The native event that triggered the command (e.g., the `click` event).

### The Contract (`_behavior-definition.ts`)

Every behavior defines the commands it listens to in its definition file.

```typescript
export const MY_BEHAVIOR = uniqueBehaviorDef({
  name: "my-behavior",
  command: {
    "--do-something": "--do-something", // The command string
  },
});
```

### The Implementation (`behavior.ts`)

The behavior implements the `onCommand` method to handle these commands.

```typescript
return {
  onCommand(event) {
    const { command, payload } = event;

    if (command === MY_BEHAVIOR.command["--do-something"]) {
      // Execute logic
      console.log("Command received!", payload);
    }
  },
};
```

## Dispatching Commands

You can dispatch commands from any element using the `dispatchCommand` utility (if available) or standard DOM APIs.

### From a Button (Declarative)

Use a behavioral host element (`is="behavioral-..."`) with `commandfor` + `command` to declaratively dispatch commands.

```html
<button is="behavioral-button" command="do-something" commandfor="my-target-id">
  Do Something
</button>
```

### Programmatically

```typescript
const event = new Event("command", {
  bubbles: true,
  cancelable: true,
  composed: true,
});

Object.defineProperty(event, "command", {
  value: "do-something",
  enumerable: true,
});
Object.defineProperty(event, "source", { value: element, enumerable: true });

element.dispatchEvent(event);
```

## Best Practices

1.  **Do not prefix with `--`:** Use plain commands like `show`, `hide`, `toggle`.
2.  **Keep Payloads Simple:** Pass only serializable data in the payload.
3.  **Use `commandfor`:** Target specific elements via `commandfor` to scope dispatch.
4.  **Handle direct targets only in stateful behaviors:** If your behavior changes visibility/state, guard in `onCommand` with `if (event.target !== el) return;` to avoid ancestor side-effects from bubbled command events.
5.  **Always use a behavioral host on command sources:** Elements with `commandfor` / `command` (and optional `commandby`) must provide `is="behavioral-..."`.
