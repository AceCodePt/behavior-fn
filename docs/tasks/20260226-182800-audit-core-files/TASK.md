# Task: Audit Core Implementation Files

**Status:** Pending  
**Created:** 2026-02-26  
**Priority:** High  
**Complexity:** Medium  

## Context

After recent refactoring to use `BehaviorDef` pattern and remove `window.BehaviorFN`, we need to ensure all core files are consistent, follow best practices, and have proper documentation.

## Goal

Audit all core implementation files to ensure:
1. Consistent coding patterns across files
2. Proper TypeScript types and JSDoc comments
3. No deprecated patterns or unused code
4. Alignment with documented architecture
5. Proper exports and imports

## Core Files to Audit

### Registry System (`registry/behaviors/`)
- [ ] `behavior-registry.ts` - Core behavior registration
  - Verify `BehaviorRegistration` type
  - Check function overloads are documented
  - Ensure exports are correct
  
- [ ] `behavioral-host.ts` - Custom element host
  - Verify it uses `getBehaviorDef` correctly
  - Check lifecycle methods
  - Ensure proper cleanup
  
- [ ] `behavior-utils.ts` - Utility functions
  - Verify `uniqueBehaviorDef` implementation
  - Check `getObservedAttributes` correctness
  - Ensure `parseBehaviorNames` handles edge cases
  
- [ ] `auto-loader.ts` - Auto-loader implementation
  - Verify uses `getBehaviorDef` not `getBehaviorSchema`
  - Check MutationObserver patterns
  - Ensure proper element upgrading

- [ ] `types.ts` - Type definitions
  - Verify `BehaviorSchema` type
  - Check all types are exported
  - Ensure no `any` types

### Build System (`scripts/`)
- [ ] `build-cdn.ts` - CDN build script
  - Verify generates correct `registerBehavior` calls
  - Check metadata export format
  - Ensure no `window.BehaviorFN` code
  - Verify inlined auto-loader code matches source

### CLI (`index.ts`, `src/`)
- [ ] `index.ts` - CLI entry point
- [ ] `src/commands/add.ts` - Add command
- [ ] `src/commands/init.ts` - Init command
- [ ] `src/detect.ts` - Environment detection
- [ ] `src/validators/` - Validator strategy pattern
- [ ] `src/platforms/` - Platform implementations

## Audit Checklist

### Code Quality
- [ ] No `any` types (use `unknown` and narrow)
- [ ] Proper error handling (no silent failures)
- [ ] JSDoc comments for public APIs
- [ ] Consistent naming conventions (camelCase functions, PascalCase types)
- [ ] No unused imports or variables
- [ ] No console.log (use console.warn/error appropriately)

### Architecture Alignment
- [ ] Follows Single Source of Truth (DRY principle)
- [ ] Uses readonly metadata with literal types
- [ ] Exports singleton instances where appropriate
- [ ] Uses natural keys (not surrogate IDs)
- [ ] Type-safe registry pattern
- [ ] Data-first design

### ESM Patterns
- [ ] No `window` globals for shared state
- [ ] Proper ES module imports/exports
- [ ] No IIFE patterns
- [ ] Singleton sharing via module system

### Type Safety
- [ ] All function parameters typed
- [ ] All return types explicit
- [ ] No type assertions unless necessary
- [ ] Proper use of generics
- [ ] Type guards where needed

### Testing
- [ ] All core functions have tests
- [ ] Edge cases covered
- [ ] Error conditions tested
- [ ] Integration tests exist

## Specific Issues to Check

### 1. Behavior Registry
```typescript
// Ensure both signatures work correctly
registerBehavior(definition: BehaviorDef, factory: BehaviorFactory): void
registerBehavior(name: string, factory: BehaviorFactory): void
```

### 2. Definition Access
```typescript
// Verify all uses of getBehaviorDef
const def = getBehaviorDef(name);
if (def) {
  const schema = def.schema;
  const attrs = getObservedAttributes(schema);
}
```

### 3. Auto-Loader
```typescript
// Ensure observedAttributes collection is correct
for (const behaviorName of behaviors) {
  const def = getBehaviorDef(behaviorName);
  if (def) {
    const attrs = getObservedAttributes(def.schema);
    // merge attrs...
  }
}
```

### 4. CDN Build
```typescript
// Verify generated code format
const definition = {
  name: 'behavior-name',
  schema: { /* JSON schema */ },
};
registerBehavior(definition, factoryFunction);
```

## Acceptance Criteria

- [ ] All core files pass TypeScript strict mode
- [ ] All exports are used (no dead code)
- [ ] All imports are necessary
- [ ] JSDoc comments for public APIs
- [ ] Consistent error handling patterns
- [ ] No deprecated patterns found
- [ ] All tests pass (399/399)

## Refactoring Opportunities

Document any:
- Duplicate code that could be DRY'd
- Complex functions that could be simplified
- Missing abstractions
- Type safety improvements
- Performance optimizations

## Notes

- Use `git grep` to find all usages of functions being audited
- Check test files to understand expected behavior
- Look for TODO/FIXME comments
- Verify against AGENTS.md principles
