# Task: Opt-In Auto-Loader for Behavioral Hosts

## Goal

Provide an **optional utility** that automatically adds `is="behavioral-*"` attributes to elements with `behavior` attributes, eliminating the need for manual host declaration while maintaining the explicit, predictable core architecture.

## Context

Currently, users must explicitly add both `behavior` and `is` attributes to activate behavioral hosts:

```html
<button is="behavioral-button" behavior="reveal">Click me</button>
```

While this is explicit and predictable, it adds ceremony that some developers may find verbose. The `is` attribute requirement can be confusing for new users who expect behaviors to "just work" after adding the `behavior` attribute.

**Problem:**
- The README could mislead users into thinking behaviors load automatically
- The `is` attribute requirement is not immediately obvious
- Users coming from frameworks like Alpine.js or HTMX expect simpler syntax

**Why NOT make it default:**
- Violates "no magic" principle
- Adds runtime overhead (MutationObserver)
- Goes against explicit opt-in philosophy
- Could cause race conditions in dynamic UIs

**Solution:** Create an opt-in utility that users can import when they prefer DX over explicitness.

## Requirements

### Documentation Requirements
1. **README Clarity**: Update README.md to explicitly state:
   - Behaviors **do not load automatically**
   - The `is` attribute is **required** for behavioral hosts
   - Why this design choice was made (explicitness, predictability, no magic)
   - How to use the opt-in auto-loader if desired

2. **Auto-Loader Documentation**: Document:
   - What the auto-loader does
   - Performance tradeoffs (MutationObserver overhead)
   - When to use it vs. explicit `is` attributes
   - How it works internally

### Implementation Requirements
1. **Opt-In Utility**: Create `registry/behaviors/auto-loader.ts` that:
   - Exports a single function: `enableAutoLoader()`
   - Uses MutationObserver to watch for elements with `behavior` attribute
   - **Behavior-Based Host Pattern:** For each element with a `behavior` attribute:
     1. Parse the `behavior` attribute (space-separated list of behaviors)
     2. Sort behaviors alphabetically for consistency
     3. Create host name: `behavioral-{behavior1}-{behavior2}-...` (e.g., `behavioral-logger-reveal`)
     4. Register the behavioral host if not already registered: `defineBehavioralHost(tagName, customElementName)`
     5. Add `is="behavioral-{behaviors}"` to the element
   - **Rationale:** The `is` attribute should describe the **behaviors**, not the tag type. This makes the contract explicit: `is="behavioral-reveal-logger"` tells you exactly what behaviors are attached. Multiple different tag types (button, div, dialog) can share the same behavioral host if they use the same behavior combination.
   - Handles edge cases (existing `is` attributes, invalid tags)
   - Provides cleanup mechanism (returns a `disconnect()` function)

2. **Performance Considerations**:
   - Minimize observer overhead (batch processing, debouncing if needed)
   - Only observe when actually needed
   - Provide clear documentation about runtime cost

3. **Template Integration**: Update behavior templates to:
   - Include auto-loader import as a commented-out option
   - Show both approaches (explicit vs. auto-loader)

4. **Type Safety**: Ensure auto-loader is fully typed and follows project standards

## Definition of Done

### Documentation
- [ ] README.md explicitly states behaviors don't load automatically
- [ ] README.md explains the `is` attribute requirement clearly
- [ ] README.md documents the opt-in auto-loader with usage example
- [ ] README.md explains tradeoffs (DX vs. explicitness/performance)
- [ ] New guide created: `docs/guides/auto-loader.md`
- [ ] Auto-loader guide explains when to use it vs. explicit approach

### Implementation
- [ ] `registry/behaviors/auto-loader.ts` created with `enableAutoLoader()` function
- [ ] Auto-loader uses MutationObserver to watch for `behavior` attributes
- [ ] Auto-loader handles edge cases:
  - Elements with existing `is` attributes (skip them)
  - Invalid tag names (handle gracefully)
  - Dynamic content (watches continuously)
- [ ] Auto-loader returns cleanup function for disconnecting observer
- [ ] Auto-loader includes TypeScript types
- [ ] Tests created for auto-loader in `registry/behaviors/auto-loader.test.ts`
- [ ] Tests cover:
  - Basic auto-wrapping functionality
  - Edge cases (existing `is`, invalid tags)
  - Cleanup/disconnect behavior
  - Performance characteristics (not triggering infinite loops)

### Templates & Integration
- [ ] Behavior templates include commented auto-loader import example
- [ ] Init command templates show both approaches

### Quality
- [ ] All tests pass
- [ ] Type safety verified (`pnpm check`)
- [ ] Code follows project standards (no `any`, explicit types)
- [ ] Performance tested (no infinite loops, reasonable overhead)
- [ ] **User Review**: Changes verified and commit authorized

## Technical Notes

### File Structure
```
registry/behaviors/
├── auto-loader.ts           # Opt-in utility
├── auto-loader.test.ts      # Tests
└── behavioral-host.ts       # Existing (no changes needed)

docs/guides/
└── auto-loader.md           # Usage guide
```

### Expected API
```typescript
// registry/behaviors/auto-loader.ts
export function enableAutoLoader(): () => void;

// Usage
import { enableAutoLoader } from './behaviors/auto-loader';
const disconnect = enableAutoLoader();

// Later, if needed
disconnect();
```

### Auto-Discovery Algorithm
```typescript
// Pseudocode for auto-loader logic
function processElement(el: HTMLElement) {
  const behaviorAttr = el.getAttribute('behavior');
  if (!behaviorAttr) return;
  
  // Parse and sort behaviors for consistent naming
  const behaviors = behaviorAttr
    .split(/\s+/)
    .filter(Boolean)
    .sort(); // Sort alphabetically: "reveal logger" becomes "logger reveal"
  
  // Create custom element name from behaviors
  const customElementName = `behavioral-${behaviors.join('-')}`;
  // Example: "reveal logger" → "behavioral-logger-reveal"
  
  const tagName = el.tagName.toLowerCase();
  
  // Check if this behavioral host is already registered
  if (!customElements.get(customElementName)) {
    // Collect observed attributes from all behaviors
    const observedAttributes = behaviors.flatMap(behaviorName => {
      const behavior = getBehavior(behaviorName);
      return behavior ? getObservedAttributes(behavior.schema) : [];
    });
    
    // Register the behavioral host with the custom name
    defineBehavioralHost(tagName, customElementName, observedAttributes);
  }
  
  // Add is attribute if missing
  if (!el.hasAttribute('is')) {
    el.setAttribute('is', customElementName);
  }
}
```

### Edge Cases to Handle
1. **Existing `is` attribute**: Don't overwrite, skip element
2. **Invalid tag names**: Only process standard HTML tags
3. **Custom elements**: Skip elements that are already custom elements
4. **Timing**: Handle elements added before AND after enableAutoLoader() call
5. **Cleanup**: Ensure observer can be disconnected without memory leaks
6. **Multiple Behaviors on Same Element**: Handle `behavior="reveal logger"` (space-separated)
7. **Behavior Order Consistency**: Always sort behaviors alphabetically so `"reveal logger"` and `"logger reveal"` produce the same `is="behavioral-logger-reveal"`
8. **Race Conditions**: Ensure behavioral hosts are registered before upgrading elements
9. **Observed Attributes**: Collect all observed attributes from all behaviors in the combination and pass to `defineBehavioralHost()`
10. **Empty Behavior Attribute**: Handle `behavior=""` gracefully (skip element)

### Performance Considerations
- MutationObserver overhead is minimal for most apps
- Consider debouncing if processing many elements
- Document that this is a tradeoff: DX vs. explicit control
- Recommend explicit `is` for high-performance scenarios

### Example Scenario
```html
<!-- Before auto-loader -->
<button behavior="reveal">Toggle A</button>
<dialog behavior="reveal">Content A</dialog>
<div behavior="reveal logger">Content B</div>
<button behavior="logger">Log Me</button>
<input behavior="request">Search</input>

<!-- After enableAutoLoader() processes the DOM -->
<!-- Auto-loader discovers unique behavior combinations: -->
<!-- - "reveal" → registers behavioral-reveal for button, dialog -->
<!-- - "logger reveal" → sorted to "logger reveal" → behavioral-logger-reveal for div -->
<!-- - "logger" → registers behavioral-logger for button -->
<!-- - "request" → registers behavioral-request for input -->

<button is="behavioral-reveal" behavior="reveal">Toggle A</button>
<dialog is="behavioral-reveal" behavior="reveal">Content A</dialog>
<div is="behavioral-logger-reveal" behavior="reveal logger">Content B</div>
<button is="behavioral-logger" behavior="logger">Log Me</button>
<input is="behavioral-request" behavior="request">Search</input>

<!-- Note: Different tags can share the same behavioral host -->
<!-- button and dialog both use behavioral-reveal -->
```

## References

- Current behavioral-host implementation: `registry/behaviors/behavioral-host.ts`
- AGENTS.md philosophy: Explicit > Implicit
- Web Standards: MutationObserver API
