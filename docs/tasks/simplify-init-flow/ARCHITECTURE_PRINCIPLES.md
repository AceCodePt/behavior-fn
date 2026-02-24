# Architecture Principles Applied in "Simplify Init Flow"

This document summarizes the key architectural principles that were applied during the "Simplify Init Flow" refactor. These principles are now codified in `AGENTS.md` and should be followed throughout the codebase.

## Summary of Changes to AGENTS.md

### 1. **Use Natural Keys, Not Surrogate Keys** (Previously "Avoid Hardcoded Magic Values")

**What Changed:**
- Renamed and expanded the principle to emphasize using natural identifiers
- Removed all examples showing numeric IDs (`0`, `1`, `2`)
- Added clear guidance: package name IS the unique identifier

**Key Insight:**
When you have a natural unique identifier (like a package name or platform name), use it directly instead of creating arbitrary numeric IDs.

```typescript
// ❌ BAD: Surrogate key
getValidator(0)  // What is 0?

// ✅ GOOD: Natural key
getValidator("zod")  // Self-documenting!
```

### 2. **Updated All Examples to Remove Numeric IDs**

**Principles Updated:**
- Principle #1: Single Source of Truth - Now shows `PackageName` extraction instead of `ValidatorId`
- Principle #2: Readonly Metadata - Removed `id` field from examples
- Principle #4: Use Natural Keys - Complete rewrite with natural key examples
- Principle #5: Type-Safe Registry Pattern - Complete example using package names

**Why This Matters:**
The old examples were teaching the wrong pattern. They showed numeric IDs everywhere, which contradicts best practices and the actual implementation.

### 3. **Added Two New Principles**

#### Principle #6: Data-First Design
Define data structures (like lockfiles array) and derive types from them, rather than defining types separately.

```typescript
// Data defines the source of truth
export const packageManagers = [
  { lockfile: "pnpm-lock.yaml", name: "pnpm" },
  // ...
] as const;

// Type derived from data
export type PackageManager = (typeof packageManagers)[number]["name"];
```

#### Principle #7: Infer Types from Functions
Use `ReturnType<typeof fn>` to derive types from function implementations instead of manually defining interfaces.

```typescript
export function detectEnvironment(cwd: string) {
  return { typescript: true, packageManager: "pnpm", /* ... */ };
}

// Type inferred from implementation
export type DetectionResult = ReturnType<typeof detectEnvironment>;
```

## What We Actually Built

### Validators System
- **No numeric IDs**: Removed `id: number` from `Validator` interface
- **Natural key**: `packageName` is the unique identifier
- **Type-safe**: `PackageName = "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini"`
- **Self-documenting**: `getValidator("zod")` instead of `getValidator(0)`

### Platforms System
- **No numeric IDs**: Removed `id: number` from `PlatformStrategy` interface
- **Natural key**: `name` is the unique identifier ("next", "astro", "generic")
- **Type-safe**: `PlatformName` derived from registry
- **Self-documenting**: `getPlatform("next")` instead of `getPlatform(0)`

### Detection & Utils
- **Package managers as data**: Array with lockfile mappings, type derived
- **DetectionResult inferred**: Type extracted from `detectEnvironment()` return
- **Zero duplication**: All types flow from single sources of truth

## Benefits Achieved

1. **Self-Documenting Code**
   - `getValidator("zod")` vs `getValidator(0)` 
   - No need to look up what numeric IDs mean

2. **Maintainability**
   - Add a validator → just create the class, no ID assignment needed
   - Remove a validator → no gaps in numeric sequences
   - Rename a package → type system catches all usages

3. **Type Safety**
   - Literal union types: `"zod" | "valibot" | ...`
   - Compile-time guarantees
   - Better IDE autocomplete

4. **No Magic Numbers**
   - Config files store `"validator": "zod"` (readable)
   - Error messages: `Validator "unknown" not found` (clear)
   - Code reviews: no guessing what numbers mean

5. **Refactoring-Safe**
   - Change implementation → types update automatically
   - No manual synchronization between data and types
   - Impossible for types to drift

## Implementation Checklist

When creating a new registry (validators, platforms, etc.):

- [ ] Use natural keys (package name, platform name, etc.)
- [ ] No numeric IDs in interfaces
- [ ] Export singleton instances
- [ ] Create `as const` array registry
- [ ] Derive types from the registry
- [ ] Lookup functions use natural keys
- [ ] Add type validation helper (`isValid*`)

## Testing Strategy

All tests updated to use natural keys:
- ✅ 196/196 tests passing
- ✅ Validator tests use package names
- ✅ Platform tests use platform names  
- ✅ No numeric ID assertions
- ✅ Self-documenting test expectations

## References

- `AGENTS.md` - Updated principles (#1-7)
- `src/validators/` - Natural key implementation
- `src/platforms/` - Natural key implementation
- `src/utils/detect.ts` - Data-first design
- `tests/validators.test.ts` - Example test patterns
