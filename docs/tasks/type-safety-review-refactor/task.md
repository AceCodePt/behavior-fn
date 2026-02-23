# Task: Type Safety Review and Refactor

## Goal

Eliminate unsafe type usages (primarily `any` types) from production code and establish a proper type system based on the reality that all behavior schemas represent HTML element attributes (always objects with string keys).

## Context

The codebase currently has TypeScript strict mode enabled (`"strict": true`), but there are multiple instances of `any` types in production code. As a library focused on type-safe behavioral mixins, eliminating these unsafe patterns is crucial for code quality and developer experience.

### Key Insight

**Behavior schemas always represent HTML attributes**, which are key-value pairs. We don't need complex discriminated unions for different schema shapes - we need one clear type: `AttributeSchema`, which is always an object with `properties`.

### Current Issues Identified

Through automated scanning, **74 occurrences** of `any`, **16 type assertions** (`as any`), **2 TypeScript suppressions**, and **2 double assertions** were found:

1. **CLI & Strategy Layer** (index.ts, strategies/*.ts):
   - `any` in registry lookup
   - `any` in schema transformations
   - Untyped transformer function parameters

2. **Transformer Layer** (transformers/*.ts):
   - All transformer functions accept `any` schema parameter
   - Recursive parsing functions use `any`
   - Object iteration with untyped entries

3. **Behavior Implementation**:
   - Type assertions (`as any`) for DOM element access
   - Event target casting without proper type guards

4. **Core Infrastructure** (behavioral-host.ts):
   - Constructor rest parameters typed as `any[]`

**Note**: Test files will be excluded from this refactor - they can maintain flexibility with proper justification.

## Requirements

### Phase 1: Create Type Definitions
- Create `src/types/schema.ts` with:
  - `AttributeSchema` - The main schema type (always an object)
  - `PropertySchema` - Union of string/number/boolean/enum schemas
  - Individual schema types (StringSchema, NumberSchema, etc.)
- Create `src/types/registry.ts` with:
  - `BehaviorMetadata` interface
  - `BehaviorFileMetadata` interface
  - `BehaviorRegistry` type

### Phase 2: Update Strategy Layer
- Update `ValidatorStrategy` interface to use `AttributeSchema`
- Update all strategy implementations (TypeBox, Zod, Valibot, ArkType, ZodMini)
- Remove all `as any` assertions for property access
- Use proper types from `AttributeSchema`

### Phase 3: Update Transformer Layer
- Update all transformer function signatures to accept `AttributeSchema`
- Type internal parse functions to use `PropertySchema`
- Remove `any` from map callbacks and iterations
- Keep transformer implementations simple with proper types

### Phase 4: Update CLI Layer
- Type the registry array as `BehaviorMetadata[]`
- Add proper types to jiti import results
- Remove `any` from registry lookup

### Phase 5: Update Behavior Layer (DOM Interactions)
- Add type guards for DOM element property access (e.g., `hasValue()`)
- Add type guards for event targets
- Replace `as any` assertions with proper type narrowing
- Update behavioral-host constructor parameters if practical

### Phase 6: Verification
- Ensure all existing tests pass
- Run `pnpm check` for project-wide type safety
- Verify no new type errors introduced
- Document any remaining justified `any` usages with explanatory comments

## Specific Areas to Refactor

### High Priority (Production Code Only)
1. **Create type definitions**: `src/types/schema.ts` and `src/types/registry.ts`
2. **index.ts line 68**: Registry behavior lookup → use `BehaviorMetadata[]`
3. **All transformer functions**: Schema parameter types → use `AttributeSchema`
4. **Strategy interfaces**: `transformSchema` method → use `AttributeSchema`
5. **Strategy implementations**: Remove `as any` for property access
6. **input-watcher/behavior.ts line 34**: Element value access → add type guard
7. **request/behavior.ts line 315**: Event target casting → add type guard

### Medium Priority
8. **behavioral-host.ts line 21**: Constructor parameters (assess if practical)

### Out of Scope
- Test files (excluding from this refactor)
- Test mock types (acceptable with current usage)
- Generated code strings like `"z.any()"` (these are strings, not types)

## Proposed Type System

```typescript
// src/types/schema.ts

export interface StringSchema {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: string;
}

export interface NumberSchema {
  type: 'number';
  minimum?: number;
  maximum?: number;
  default?: number;
}

export interface BooleanSchema {
  type: 'boolean';
  default?: boolean;
}

export interface EnumSchema {
  enum?: string[];
  anyOf?: Array<{ const: string }>;
  default?: string;
}

export type PropertySchema = 
  | StringSchema 
  | NumberSchema 
  | BooleanSchema 
  | EnumSchema;

/**
 * Schema representing HTML element attributes.
 * Always an object with string keys (attribute names).
 */
export interface AttributeSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export type BehaviorSchema = AttributeSchema;
```

```typescript
// src/types/registry.ts

export interface BehaviorFileMetadata {
  path: string;
}

export interface BehaviorMetadata {
  name: string;
  files: BehaviorFileMetadata[];
  dependencies?: string[];
}

export type BehaviorRegistry = BehaviorMetadata[];
```

## Definition of Done

-   [ ] Type definitions created in `src/types/` directory
-   [ ] CLI layer fully typed (registry lookup uses `BehaviorMetadata[]`)
-   [ ] Strategy interface updated to use `AttributeSchema`
-   [ ] All strategy implementations updated (5 files)
-   [ ] All transformer functions use `AttributeSchema` (5 files)
-   [ ] Behavior implementations use type guards instead of `as any`
-   [ ] All production code `any` usages eliminated (0 remaining)
-   [ ] All production code `as any` assertions eliminated
-   [ ] No regression in functionality - all tests pass
-   [ ] `pnpm check` passes with no type errors
-   [ ] **User Review**: Changes verified and commit authorized

## Out of Scope

- Test files (explicitly excluded - they can maintain flexibility)
- Adding runtime validation beyond what already exists
- Changing external library type definitions
- Refactoring unrelated to type safety

> **Note:** The detailed implementation plan, specific type definitions, and refactoring strategy will be documented in `LOG.md` during the **Plan** phase of the PDSRTDD workflow.
