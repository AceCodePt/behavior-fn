# The Reactive Protocol

The Reactive Protocol defines how behaviors respond to state changes. It leverages the native Web Component lifecycle (`attributeChangedCallback`) to provide a declarative, reactive data flow.

## Philosophy

Behaviors should be **Stateless** (in terms of private, hidden state) and **Reactive** (driven by public attributes). This ensures that the DOM remains the single source of truth.

If a behavior needs to store state (e.g., "is the sidebar open?"), it should reflect that state to a DOM attribute (e.g., `data-state="open"`). This allows:

- **Styling:** CSS can target the state (e.g., `[data-state="open"] { display: block; }`).
- **Debuggability:** You can inspect the element in DevTools and see its exact state.
- **Interoperability:** Other scripts can read or modify the attribute to interact with the behavior.

## The Protocol

The protocol relies on `observedAttributes` and `attributeChangedCallback`.

### The Contract (`_behavior-definition.ts`)

You define the attributes (props) your behavior accepts using a schema (conceptually, though we removed Zod for runtime, the types remain).

```typescript
export const MY_BEHAVIOR = uniqueBehaviorDef({
  name: "my-behavior",
  // ...
});
```

### The Implementation (`behavior.ts`)

The behavior factory returns an object that can implement `attributeChangedCallback`.

```typescript
export const myBehaviorFactory = (el: HTMLElement) => {
  return {
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "data-count") {
        updateCount(newValue);
      }
    },
  };
};
```

### Observed Attributes

The `behavior-cn` runtime automatically sets up `observedAttributes` for the host element based on the registered behaviors.

**Note:** Since behaviors are composed on a host element, the host element must observe _all_ attributes required by _all_ attached behaviors. The `defineBehavioralHost` utility handles this.

## State Reflection

When a behavior changes its internal state, it should reflect that change to the DOM.

```typescript
// Inside behavior logic
function toggle() {
  const isOpen = el.getAttribute("data-state") === "open";
  const newState = isOpen ? "closed" : "open";

  el.setAttribute("data-state", newState);
  // The attribute change will trigger attributeChangedCallback,
  // allowing for side effects (like animation) to run.
}
```

## Best Practices

1.  **DOM as Source of Truth:** Don't duplicate state in JavaScript variables if it can be stored in the DOM.
2.  **Unidirectional Flow:** Change the attribute -> React to the change. Don't change the attribute AND run the logic manually.
3.  **Use `data-*` Attributes:** For custom state, use `data-` attributes to avoid collisions with standard HTML attributes.
4.  **String Serialization:** Remember that attributes are always strings. Serialize/deserialize JSON or booleans appropriately.
