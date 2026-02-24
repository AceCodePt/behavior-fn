# Fix Auto-Loader Tests After Element Replacement Implementation

## Context

The auto-loader was changed to **replace elements** in the DOM (to properly upgrade customized built-in elements). This breaks 19 tests that capture element references before the auto-loader runs and then check those stale references.

## The Problem

```typescript
// ❌ BROKEN TEST PATTERN
const button = document.createElement("button");
button.setAttribute("behavior", "reveal");
document.body.appendChild(button);

disconnect = enableAutoLoader(); // Replaces `button` with new element

expect(button.getAttribute("is")).toBe("behavioral-reveal"); 
// ❌ FAILS: checking OLD element (not in DOM anymore)
```

##The Solution

```typescript
// ✅ FIXED TEST PATTERN
const button = document.createElement("button");
button.setAttribute("behavior", "reveal");
button.setAttribute("id", "unique-test-id"); // Add ID
document.body.appendChild(button);

disconnect = enableAutoLoader(); // Replaces element

const upgraded = document.getElementById("unique-test-id"); // Re-query
expect(upgraded?.getAttribute("is")).toBe("behavioral-reveal");
// ✅ PASSES: checking NEW upgraded element
```

## Failing Tests (19 total)

All in `registry/behaviors/auto-loader.test.ts`:

1. should add is attribute to elements with behavior attribute
2. should process elements added after enableAutoLoader()
3. should process multiple behaviors and sort them alphabetically
4. should handle behaviors in different order consistently
5. should use same behavioral host for different tag types with same behavior
6. should create different hosts for different behavior combinations
7. should handle unknown behaviors gracefully
8. should handle mixed known and unknown behaviors
9. should handle multiple spaces between behaviors
10. should support comma-separated behaviors
11. should handle hyphenated behavior names correctly
12. should handle mixed comma and space separators
13. should remove invalid characters from behavior names
14. should not process the same element multiple times
15. should not update is attribute when behavior changes
16. should allow re-enabling after disconnect
17. should process nested elements with behavior attributes
18. should process elements added in a subtree
19. should not re-register already registered behavioral hosts

## Fix Steps

For each failing test:

1. **Add unique ID** to each created element:
   ```typescript
   element.setAttribute("id", "unique-test-id-{n}");
   ```

2. **Re-query after auto-loader runs**:
   ```typescript
   const upgraded = document.getElementById("unique-test-id");
   ```

3. **Check upgraded element** instead of original:
   ```typescript
   expect(upgraded?.getAttribute("is")).toBe("behavioral-...");
   ```

4. **Handle multiple elements** in same test:
   ```typescript
   element1.setAttribute("id", "test-el-1");
   element2.setAttribute("id", "test-el-2");
   // ... after auto-loader ...
   const upgraded1 = document.getElementById("test-el-1");
   const upgraded2 = document.getElementById("test-el-2");
   ```

5. **Update child queries** for nested tests:
   ```typescript
   // Before: const div = container.querySelector("div");
   // After: const div = container.querySelector("div[is='behavioral-reveal']");
   // Or better: const div = document.getElementById("nested-div-id");
   ```

## Helper Functions Available

Already added to the test file:

```typescript
function createElementWithBehavior<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  behaviorAttr: string,
  additionalAttrs: Record<string, string> = {}
): HTMLElementTagNameMap[K]

function getUpgradedElement(id: string): HTMLElement | null
```

These can be used to simplify the pattern, but need the ID to be extracted.

## Example Fix

### Before (Failing):

```typescript
it("should process multiple behaviors", () => {
  const div = document.createElement("div");
  div.setAttribute("behavior", "reveal logger");
  document.body.appendChild(div);

  disconnect = enableAutoLoader();

  expect(div.getAttribute("is")).toBe("behavioral-logger-reveal"); // ❌ FAIL
});
```

### After (Fixed):

```typescript
it("should process multiple behaviors", () => {
  const div = document.createElement("div");
  div.setAttribute("behavior", "reveal logger");
  div.setAttribute("id", "test-multi");
  document.body.appendChild(div);

  disconnect = enableAutoLoader();

  const upgraded = document.getElementById("test-multi");
  expect(upgraded?.getAttribute("is")).toBe("behavioral-logger-reveal"); // ✅ PASS
});
```

## Acceptance Criteria

- [ ] All 19 auto-loader tests pass
- [ ] Tests check upgraded elements (not stale references)
- [ ] Test pattern documented for future tests
- [ ] No regression in other test suites

## Priority

**High** - Blocks PR/release

## Estimated Effort

~30-45 minutes (systematic find-replace with verification)

## Related

- Element replacement implementation in `auto-loader.ts`
- CDN usage documentation in `docs/guides/cdn-usage.md`
