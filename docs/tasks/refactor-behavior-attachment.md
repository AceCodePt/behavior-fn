# Refactor Behavior Attachment

The current implementation of `behavioral-host.ts` hardcodes a long list of event handler methods (onClick, onDblClick, etc.) to delegate them to behaviors. This is not generic enough and requires manual updates if new events need to be supported.

## Goal

Refactor `registry/behaviors/behavioral-host.ts` to use dynamic discovery of event handler methods on the host element and automatically delegate them to behaviors.

## Implementation Details

Use the following logic to discover methods:

```typescript
const hostMethods = new Set<string>();
let curr = this;

// Walk up prototype chain to find methods
while (curr && curr !== Object.prototype) {
  Object.getOwnPropertyNames(curr).forEach((prop) => {
    if (isEventInterceptorMethod(prop)) hostMethods.add(prop);
  });
  curr = Object.getPrototypeOf(curr);
}
```

### Steps

1.  Define `isEventInterceptorMethod(prop: string): boolean` in `registry/behaviors/event-methods.ts` (or `behavior-utils.ts`). It should return `true` for strings starting with "on" followed by an uppercase letter (e.g., "onClick").
2.  Refactor `registry/behaviors/behavioral-host.ts` to remove the hardcoded methods and implement the dynamic discovery and delegation logic in the constructor or `connectedCallback`.
3.  Ensure `StrictEventMethods` and other types remain correct.
