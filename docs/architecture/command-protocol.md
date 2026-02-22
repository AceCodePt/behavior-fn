# The Command Protocol

The Command Protocol is the primary mechanism for interaction in `behavior-cn`. It decouples the **Trigger** (e.g., a button) from the **Action** (e.g., a behavior logic) using a standardized custom event.

## Philosophy

In traditional web development, you might attach an `onclick` handler to a button that calls a specific function. This tightly couples the UI to the logic.

In `behavior-cn`, we use a **Command** pattern:

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

We recommend using a `command-button` or similar abstraction that declaratively dispatches commands on click.

```html
<button is="command-button" command="--do-something" command-for="my-target-id">
  Do Something
</button>
```

### Programmatically

```typescript
const event = new CustomEvent("command", {
  bubbles: true,
  detail: {
    command: "--do-something",
    payload: { foo: "bar" },
  },
});

element.dispatchEvent(event);
```

## Best Practices

1.  **Namespace Commands:** Use a prefix like `--` to distinguish commands from other strings.
2.  **Keep Payloads Simple:** Pass only serializable data in the payload.
3.  **Use `command-for`:** When possible, target specific elements using the `command-for` attribute to scope the command.
