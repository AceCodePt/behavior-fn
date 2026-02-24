# Task: Fix Behavior Parsing Inconsistency Between Auto-Loader and Behavioral Host

## Status: PARTIALLY FIXED

✅ **Auto-loader fixed** - Now uses same parsing logic as behavioral-host  
🎯 **Next step** - Extract shared parsing function to `behavior-utils.ts` to avoid duplication

## Goal

Standardize behavior parsing logic across `auto-loader.ts` and `behavioral-host.ts` to ensure consistent behavior name extraction and handle edge cases uniformly.

## Context

There are currently two different implementations for parsing the `behavior` attribute:

### behavioral-host.ts (Lines 73-80)
```typescript
const behaviorNames = behaviorAttr
  ? behaviorAttr
      // Remove all none important characters
      .replace(/[^a-zA-Z- ,]/, "")
      // Split in any fashion that groups characters with -
      .split(/[^a-zA-z-]+/)
      .filter(Boolean)
  : [];
```

**This approach:**
- Removes all non-alphanumeric characters except hyphens, spaces, and commas
- Splits on anything that's NOT letters or hyphens (keeps hyphens in behavior names)
- Allows both spaces AND commas as separators: `behavior="reveal, logger"` works

### auto-loader.ts (Line 81-91)
```typescript
const behaviors = behaviorAttr
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .sort();
```

**This approach:**
- Only splits on whitespace (`/\s+/`)
- Does NOT support commas as separators: `behavior="reveal, logger"` would create a behavior named `"reveal,"`
- Simpler but less flexible

## Problems

### 1. Inconsistent Separator Support

**behavioral-host:** Supports both spaces and commas
```html
<div behavior="reveal, logger">  ✅ Works: ["reveal", "logger"]
<div behavior="reveal logger">   ✅ Works: ["reveal", "logger"]
```

**auto-loader:** Only supports spaces
```html
<div behavior="reveal, logger">  ❌ Broken: ["reveal,", "logger"]
<div behavior="reveal logger">   ✅ Works: ["reveal", "logger"]
```

### 2. Different Character Filtering

**behavioral-host:** Actively removes invalid characters
```html
<div behavior="reveal123">  → ["reveal"]  (numbers removed)
<div behavior="reveal!">    → ["reveal"]  (punctuation removed)
```

**auto-loader:** Keeps everything between whitespace
```html
<div behavior="reveal123">  → ["reveal123"]  (kept as-is)
<div behavior="reveal!">    → ["reveal!"]    (kept as-is)
```

### 3. Hyphenated Behavior Names

Both implementations SHOULD support hyphenated behavior names like `input-watcher`, but they handle edge cases differently.

**Example:**
```html
<div behavior="input-watcher reveal">
```

**behavioral-host:** `["input-watcher", "reveal"]` ✅  
**auto-loader:** `["input-watcher", "reveal"]` ✅

This works in both, but only by coincidence.

### 4. Custom Element Name Collision Risk (Future)

When creating custom element names from multiple hyphenated behaviors, there's a potential collision:

```html
<div behavior="input-watcher reveal">     → "behavioral-input-watcher-reveal"
<div behavior="input watcher-reveal">     → "behavioral-input-watcher-reveal"  (same!)
```

These are different behavior combinations but produce the same `is` attribute.

## Requirements

### 1. Standardize Parsing Logic

Create a **single source of truth** for behavior parsing:

```typescript
// registry/behaviors/behavior-utils.ts (or new file)
export function parseBehaviorAttribute(behaviorAttr: string): string[] {
  if (!behaviorAttr || !behaviorAttr.trim()) {
    return [];
  }

  return behaviorAttr
    .trim()
    // Remove all non-alphanumeric except hyphens, spaces, commas
    .replace(/[^a-zA-Z- ,]/g, "")  // Note: added 'g' flag
    // Split on anything that's NOT letters or hyphens
    .split(/[^a-zA-z-]+/)
    .filter(Boolean);
}
```

**This unified approach:**
- Supports both spaces AND commas as separators
- Removes invalid characters consistently
- Preserves hyphens in behavior names
- Returns empty array for empty input

### 2. Update Both Files

- **behavioral-host.ts:** Replace inline parsing with `parseBehaviorAttribute(behaviorAttr)`
- **auto-loader.ts:** Replace inline parsing with `parseBehaviorAttribute(behaviorAttr)`

### 3. Add Tests

Create `registry/behaviors/behavior-utils.test.ts`:

```typescript
describe("parseBehaviorAttribute", () => {
  it("should parse space-separated behaviors", () => {
    expect(parseBehaviorAttribute("reveal logger")).toEqual(["reveal", "logger"]);
  });

  it("should parse comma-separated behaviors", () => {
    expect(parseBehaviorAttribute("reveal, logger")).toEqual(["reveal", "logger"]);
  });

  it("should parse mixed separators", () => {
    expect(parseBehaviorAttribute("reveal, logger input-watcher")).toEqual([
      "reveal",
      "logger",
      "input-watcher",
    ]);
  });

  it("should handle hyphenated behavior names", () => {
    expect(parseBehaviorAttribute("input-watcher")).toEqual(["input-watcher"]);
  });

  it("should remove invalid characters", () => {
    expect(parseBehaviorAttribute("reveal123!@#")).toEqual(["reveal"]);
  });

  it("should handle empty strings", () => {
    expect(parseBehaviorAttribute("")).toEqual([]);
    expect(parseBehaviorAttribute("   ")).toEqual([]);
  });

  it("should handle multiple spaces", () => {
    expect(parseBehaviorAttribute("reveal    logger")).toEqual(["reveal", "logger"]);
  });

  it("should handle trailing/leading whitespace", () => {
    expect(parseBehaviorAttribute("  reveal logger  ")).toEqual(["reveal", "logger"]);
  });
});
```

### 4. Future-Proof Custom Element Names (Optional)

Consider using a different separator for custom element names to avoid collisions:

```typescript
// Instead of:
const customElementName = `behavioral-${behaviors.join("-")}`;

// Use:
const customElementName = `behavioral--${behaviors.join("--")}`;
```

**Examples:**
- `behavior="input-watcher reveal"` → `is="behavioral--input-watcher--reveal"`
- `behavior="input watcher-reveal"` → `is="behavioral--input--watcher-reveal"` (different!)

This eliminates ambiguity when multiple hyphenated behaviors are combined.

## Definition of Done

### Implementation
- [ ] Create `parseBehaviorAttribute()` in `behavior-utils.ts`
- [ ] Update `behavioral-host.ts` to use `parseBehaviorAttribute()`
- [ ] Update `auto-loader.ts` to use `parseBehaviorAttribute()`
- [ ] Note: g flag not needed - `.split()` handles remaining invalid chars

### Tests
- [ ] Create `behavior-utils.test.ts` with comprehensive parsing tests
- [ ] Test space separators
- [ ] Test comma separators
- [ ] Test mixed separators
- [ ] Test hyphenated names
- [ ] Test invalid characters
- [ ] Test empty/whitespace strings
- [ ] All existing tests still pass

### Documentation
- [ ] Update relevant comments in code
- [ ] Document supported separator formats (spaces and commas)
- [ ] Note any breaking changes (if applicable)

### Quality
- [ ] All tests pass
- [ ] Type safety verified
- [ ] No regressions in existing behaviors
- [ ] User review and approval

## Technical Notes

### Why This Matters

1. **User Expectations:** Users might copy examples from different parts of the docs and expect consistent behavior
2. **Debugging:** Inconsistent parsing makes it harder to debug why a behavior isn't loading
3. **Maintenance:** Having two implementations means bugs need to be fixed in two places

### Potential Breaking Changes

If we decide to strictly enforce character filtering (removing numbers/special chars), some users who accidentally included invalid characters might see their behaviors stop working. We should:

1. Add deprecation warnings in the next release
2. Document the valid format clearly
3. Provide migration guide if needed

### Alternative: Looser Parsing

Instead of removing invalid characters, we could be more permissive and just warn:

```typescript
export function parseBehaviorAttribute(behaviorAttr: string): string[] {
  const behaviors = behaviorAttr.trim().split(/[\s,]+/).filter(Boolean);
  
  // Warn about invalid characters but still allow them
  behaviors.forEach(name => {
    if (!/^[a-z-]+$/.test(name)) {
      console.warn(`[BehaviorFN] Behavior name "${name}" contains invalid characters. Use only lowercase letters and hyphens.`);
    }
  });
  
  return behaviors;
}
```

This is less breaking but potentially allows confusing behavior names.

## Related

- Auto-Loader implementation: `registry/behaviors/auto-loader.ts`
- Behavioral Host implementation: `registry/behaviors/behavioral-host.ts`
- Current utils: `registry/behaviors/behavior-utils.ts`
