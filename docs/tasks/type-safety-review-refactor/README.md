# Type Safety Review and Refactor

## Overview

This task eliminates all `any` types from production code by implementing a simple, attribute-based type system that reflects the reality of how behaviors work with HTML attributes.

## Key Insight

**Behavior schemas always represent HTML element attributes** - they're always objects with string keys. This means we don't need complex discriminated unions; we need one clear type: `AttributeSchema`.

## Quick Start

1. **Read**: [`task.md`](./task.md) - Goals, context, requirements
2. **Review**: [`analysis.md`](./analysis.md) - Detailed issue breakdown  
3. **Execute**: [`checklist.md`](./checklist.md) - Step-by-step guide
4. **Reference**: [`examples.md`](./examples.md) - Code examples

## The Problem

- **74 occurrences** of `any` keyword
- **16 type assertions** (`as any`)
- **2 TypeScript suppressions** (`@ts-ignore`)
- **2 double assertions** (`as unknown as`)

Located in:
- CLI & Strategy layer (registry lookup, schema transformations)
- Transformer functions (all accept `any` schema parameter)
- Behavior implementations (DOM element access, event targets)
- Core infrastructure (constructor parameters)

## The Solution

### Simple Type System
```typescript
// All behavior schemas are objects with properties
interface AttributeSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}
```

### Type Guards Instead of Assertions
```typescript
// Before: return (el as any).value;
// After:
if (hasValue(el)) {
  return el.value; // TypeScript knows this is safe
}
```

### Proper Interfaces
```typescript
// Before: registry.find((b: any) => ...)
// After:  const registry: BehaviorMetadata[] = ...
```

## Scope

✅ **In Scope**: All production code (src/, registry/)  
❌ **Out of Scope**: Test files (*.test.ts, tests/)

## Target Metrics

| Metric | Before | After |
|--------|--------|-------|
| Production `any` | ~20 | **0** |
| Type assertions | 16 | **0** |
| TS suppressions | 2 | **0** |

## 5-Phase Strategy

1. **Phase 1**: Create type definitions (`schema.ts`, `registry.ts`, `type-guards.ts`)
2. **Phase 2**: Update strategies & transformers (10 files)
3. **Phase 3**: Update CLI layer (1 file)
4. **Phase 4**: Update behavior layer (DOM interactions, 2-3 files)
5. **Phase 5**: Verification (tests pass, `pnpm check` passes)

## Benefits

✅ Compile-time safety - catch errors before runtime  
✅ Better autocomplete - accurate IDE suggestions  
✅ Self-documenting - types show function contracts  
✅ Easier refactoring - TypeScript guides changes  
✅ Fewer bugs - type mismatches caught early  
✅ Team confidence - clear contracts for new developers  

## Documents

### [`task.md`](./task.md)
The official task document following PDSRTDD workflow. Contains:
- High-level goals and context
- Requirements broken down by phase
- Definition of Done checklist
- Proposed type system design
- Scope boundaries

### [`analysis.md`](./analysis.md)
Comprehensive analysis report with:
- Classification of all 74 unsafe type usages
- Priority levels (High/Medium/Low)
- Detailed breakdown by file and line number
- Proposed type system design with rationale
- Risk assessment and success criteria
- Metrics tracking

### [`checklist.md`](./checklist.md)
Step-by-step execution guide with:
- File-by-file breakdown
- Specific line numbers to change
- Clear checkboxes for progress tracking
- Metrics tracking (before/after)
- Verification commands

### [`examples.md`](./examples.md)
Practical code examples showing:
- 7 common refactoring patterns (before/after)
- Complete type definition files ready to copy
- Type guard implementations with JSDoc
- Common pitfalls to avoid
- Testing verification commands

## Execution Notes

1. **Create Worktree**: Must work in isolated environment (not `main`)
2. **Follow PDSRTDD**: Plan → Data → Schema → Registry → Test → Develop
3. **Test Incrementally**: Run tests after each phase
4. **No Runtime Changes**: This is purely a type-level refactor
5. **User Review**: Present changes before committing

## Success Criteria

- [ ] Type definitions created in `src/types/`
- [ ] All transformer functions use `AttributeSchema`
- [ ] All strategy implementations updated
- [ ] CLI layer fully typed
- [ ] Behavior layer uses type guards
- [ ] **0 `any` in production code**
- [ ] **0 `as any` in production code**
- [ ] All tests pass
- [ ] `pnpm check` passes with 0 errors

## Related

- **AGENTS.md**: BehaviorFN development protocol
- **TASKS.md**: Project task backlog
- **Architecture Docs**: `docs/architecture/`

---

**Status**: Ready for execution  
**Priority**: High (code quality, maintainability)  
**Estimated Effort**: Medium (straightforward refactor, ~20 files)  
**Risk**: Low (type-only changes, tests catch regressions)
