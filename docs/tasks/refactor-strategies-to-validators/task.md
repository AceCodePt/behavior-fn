# Task: Refactor Strategies to Validators with Directory Structure

## Goal

Refactor the "strategy" pattern to "validator" terminology and reorganize each validator into its own directory for better modularity and clarity.

## Context

Currently, the codebase uses "strategy" terminology (from the Strategy pattern) but the actual concept is "validators" (Zod, Valibot, TypeBox, etc.). 

**Current structure:**
```
src/
  strategies/
    validator-strategy.ts      # Interface
    index.ts                   # Registry
    zod-strategy.ts           # Implementation
    typebox-strategy.ts       # Implementation
    valibot-strategy.ts       # Implementation
    arktype-strategy.ts       # Implementation
    zod-mini-strategy.ts      # Implementation
  transformers/
    toZod.ts
    toTypeBox.ts
    toValibot.ts
    toArkType.ts
    toZodMini.ts
```

**Problems:**
1. Terminology mismatch: We call them "strategies" but they're really "validators"
2. Flat structure: All validator files at same level
3. Tight coupling: Validator class and transformer in different directories
4. Not scalable: Adding a new validator touches multiple directories

## Requirements

### 1. Rename "Strategy" → "Validator"

**Terminology changes:**
- `ValidatorStrategy` → `Validator`
- `ZodStrategy` → `ZodValidator`
- `TypeBoxStrategy` → `TypeBoxValidator`
- `getStrategy()` → `getValidator()`
- `strategies` → `validators`

### 2. Reorganize into Directory Structure

**New structure:**
```
src/
  validators/
    validator.ts              # Base interface (was validator-strategy.ts)
    index.ts                  # Registry/exports
    zod/
      index.ts                # ZodValidator class + transformer
    typebox/
      index.ts                # TypeBoxValidator class + transformer
    valibot/
      index.ts                # ValibotValidator class + transformer
    arktype/
      index.ts                # ArkTypeValidator class + transformer
    zod-mini/
      index.ts                # ZodMiniValidator class + transformer
```

**Each validator directory contains:**
- Validator class (implements `Validator` interface)
- Transformer function (schema → code string)
- Any validator-specific types/utilities

### 3. Update Imports Throughout Codebase

**Files to update:**
- `index.ts` (CLI)
- `src/utils/detect-validator.ts`
- All test files that reference strategies

**Import changes:**
```typescript
// Before
import { getStrategy, strategies } from "./src/strategies/index";
import type { ValidatorStrategy } from "./src/strategies/validator-strategy";

// After
import { getValidator, validators } from "./src/validators/index";
import type { Validator } from "./src/validators/validator";
```

## Proposed Implementation

### Step 1: Create Base Interface

**src/validators/validator.ts:**
```typescript
import type { AttributeSchema } from "../types/schema";

export type PackageName = "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini";

/**
 * Validator interface for schema transformation.
 * Each validator (Zod, Valibot, etc.) implements this interface.
 */
export interface Validator {
  /**
   * Unique identifier for the validator (e.g., 0, 1, 2)
   */
  id: number;
  
  /**
   * Display name for CLI prompts
   */
  label: string;

  /**
   * The package name to detect in package.json
   */
  packageName: PackageName;

  /**
   * Transform a TypeBox schema to this validator's code.
   * @param schemaObject The TypeBox schema object
   * @param rawContent The raw file content (for TypeBox passthrough)
   */
  transformSchema(schemaObject: AttributeSchema, rawContent: string): string;

  /**
   * Generate the `getObservedAttributes` function code for `behavior-utils.ts`.
   */
  getObservedAttributesCode(): string;

  /**
   * Generate the import statements needed for `behavior-utils.ts`.
   */
  getUtilsImports(): string;

  /**
   * Generate the full content of `types.ts` for this validator.
   */
  getTypesFileContent(): string;
}
```

### Step 2: Create Validator Implementations

**Example: src/validators/zod/index.ts:**
```typescript
import type { Validator, PackageName } from "../validator";
import type { AttributeSchema, JSONSchemaObject, JSONSchemaProperty } from "../../types/schema";

/**
 * Converts a TypeBox schema to Zod code.
 */
function transformToZod(schema: AttributeSchema): string {
  function parse(s: JSONSchemaProperty): string {
    // ... (current toZod logic)
  }
  
  // ... rest of transformer logic
}

/**
 * Zod validator implementation.
 */
export class ZodValidator implements Validator {
  id = 0;
  label = "Zod";
  packageName: PackageName = "zod";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return transformToZod(schemaObject);
  }

  getObservedAttributesCode(): string {
    return `export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }
  return [];
};`;
  }

  getUtilsImports(): string {
    return `import { z } from "zod";`;
  }

  getTypesFileContent(): string {
    return `import { type StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";

export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends z.ZodType
    ? z.infer<T>
    : unknown;

export type BehaviorSchema = StandardSchemaV1 | z.ZodType | object;
`;
  }
}
```

### Step 3: Update Registry

**src/validators/index.ts:**
```typescript
import { ZodValidator } from "./zod/index";
import { ValibotValidator } from "./valibot/index";
import { ArkTypeValidator } from "./arktype/index";
import { TypeBoxValidator } from "./typebox/index";
import { ZodMiniValidator } from "./zod-mini/index";
import type { Validator } from "./validator";

export const validators: Validator[] = [
  new ZodValidator(),
  new ValibotValidator(),
  new ArkTypeValidator(),
  new TypeBoxValidator(),
  new ZodMiniValidator(),
];

export function getValidator(id: number): Validator | undefined {
  return validators.find((v) => v.id === id);
}

export { Validator, PackageName } from "./validator";
```

### Step 4: Update CLI

**index.ts:**
```typescript
// Before
import { getStrategy, strategies } from "./src/strategies/index";

// After
import { getValidator, validators } from "./src/validators/index";

// Update usage
const validator = getValidator(validatorType);
if (!validator) {
  console.error(`Validator type ${validatorType} not supported.`);
  process.exit(1);
}

// Later...
content = validator.transformSchema(mod.schema, content);
```

### Step 5: Update Validator Detection

**src/utils/detect-validator.ts:**
```typescript
import { validators } from "../validators/index";

// Update to use 'validators' instead of 'strategies'
```

## Migration Checklist

- [ ] Create `src/validators/` directory
- [ ] Create `src/validators/validator.ts` (base interface)
- [ ] Create `src/validators/zod/index.ts`
- [ ] Create `src/validators/typebox/index.ts`
- [ ] Create `src/validators/valibot/index.ts`
- [ ] Create `src/validators/arktype/index.ts`
- [ ] Create `src/validators/zod-mini/index.ts`
- [ ] Create `src/validators/index.ts` (registry)
- [ ] Update `index.ts` (CLI) imports and usage
- [ ] Update `src/utils/detect-validator.ts`
- [ ] Update all test files
- [ ] Remove `src/strategies/` directory
- [ ] Remove `src/transformers/` directory (logic moved into validators)
- [ ] All tests pass
- [ ] TypeScript compilation succeeds

## Definition of Done

- [ ] `src/strategies/` directory removed
- [ ] `src/transformers/` directory removed  
- [ ] `src/validators/` directory structure created
- [ ] Each validator in its own directory with transformer
- [ ] All "strategy" terminology changed to "validator"
- [ ] CLI uses `getValidator()` and `validators`
- [ ] All imports updated throughout codebase
- [ ] All tests pass (101/101)
- [ ] `pnpm check` (TypeScript) passes
- [ ] No breaking changes to external API

## Benefits

1. **Clearer terminology:** "Validator" is more accurate than "Strategy"
2. **Better organization:** Each validator is self-contained in its own directory
3. **Easier to extend:** Adding a new validator means creating one directory
4. **Colocation:** Validator class + transformer logic together
5. **Cleaner imports:** `import { ZodValidator } from "./validators/zod"`

## Out of Scope

- Changing validator functionality (only structure/naming)
- Modifying transformation logic
- Adding new validators
- Changing the registry JSON structure

## Notes

- This is a **refactoring task** - no functional changes
- All existing tests should pass without modification (except imports)
- Users won't notice any difference
- Internal code will be clearer and more maintainable
