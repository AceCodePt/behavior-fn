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
   - Automatically adds `is="behavioral-{tagName}"` if missing
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

### Edge Cases to Handle
1. **Existing `is` attribute**: Don't overwrite, skip element
2. **Invalid tag names**: Only process standard HTML tags
3. **Custom elements**: Skip elements that are already custom elements
4. **Timing**: Handle elements added before AND after enableAutoLoader() call
5. **Cleanup**: Ensure observer can be disconnected without memory leaks

### Performance Considerations
- MutationObserver overhead is minimal for most apps
- Consider debouncing if processing many elements
- Document that this is a tradeoff: DX vs. explicit control
- Recommend explicit `is` for high-performance scenarios

## References

- Current behavioral-host implementation: `registry/behaviors/behavioral-host.ts`
- AGENTS.md philosophy: Explicit > Implicit
- Web Standards: MutationObserver API
