# Type-Safe Registry Pattern

This guide documents the type-safe registry pattern used throughout BehaviorFN for validators, platforms, and other extensible systems.

## Overview

The type-safe registry pattern ensures that:
- All types are derived from data (no manual type definitions)
- Metadata is immutable (readonly fields with literal types)
- Singleton instances are exported and reused
- No magic values or hardcoded IDs
- Complete compile-time type safety

## Core Principles

### 1. Single Source of Truth

**All types must be derived from data, never manually defined.**

```typescript
// ❌ BAD: Manual type definition (duplication)
export type ValidatorId = 0 | 1 | 2 | 3 | 4;
export const validators = { 0: zodValidator, 1: valibotValidator, ... };

// ✅ GOOD: Type derived from data
export const validators = [zodValidator, valibotValidator, ...] as const;
export type ValidatorId = (typeof validators)[number]["id"];  // 0 | 1 | 2 | 3 | 4
```

### 2. Readonly Metadata with Literal Types

**All metadata fields must be readonly to enable literal type inference.**

```typescript
// ❌ BAD: Mutable fields, widened types
export class ZodValidator {
  id: number = 0;              // Type: number (too wide)
  packageName: string = "zod"; // Type: string (too wide)
}

// ✅ GOOD: Readonly fields, literal types
export class ZodValidator {
  readonly id = 0;              // Type: 0 (literal)
  readonly packageName = "zod"; // Type: "zod" (literal)
}
```

### 3. Export Singleton Instances

**Create instances once, export them, and reuse everywhere.**

```typescript
// ❌ BAD: Creating instances in multiple places
const validators = [new ZodValidator(), ...];
const zodValidator = validators.find(v => v.packageName === "zod");

// ✅ GOOD: Export singletons, import where needed
export const zodValidator = new ZodValidator();
export const validators = [zodValidator, ...] as const;

// Other files
import { zodValidator } from "../validators/index";
```

### 4. No Magic Values

**Never hardcode IDs, names, or other values. Always use the data.**

```typescript
// ❌ BAD: Hardcoded magic values
if (allDeps["zod"]) {
  detectedValidators.push(0);  // What is 0?
  detectedValidators.push(4);  // What is 4?
}

// ✅ GOOD: Use values from instances
import { zodValidator, zodMiniValidator } from "../validators/index";

if (allDeps["zod"]) {
  detectedValidators.push(zodValidator.id);
  detectedValidators.push(zodMiniValidator.id);
}
```

## Implementation Pattern

### Step 1: Define Interface

Define the interface with readonly metadata fields:

```typescript
export interface Validator {
  readonly id: number;
  readonly label: string;
  readonly packageName: string;
  
  // Methods
  transformSchema(schema: Schema): string;
  // ...
}
```

### Step 2: Implement Classes

Implement classes with readonly literal values (no type annotations):

```typescript
export class ZodValidator implements Validator {
  readonly id = 0;              // Literal type: 0
  readonly label = "Zod";       // Literal type: "Zod"
  readonly packageName = "zod"; // Literal type: "zod"
  
  transformSchema(schema: Schema): string {
    // Implementation
  }
}
```

**Important:** Don't add type annotations to the fields. Let TypeScript infer the literal types.

```typescript
// ❌ BAD: Type annotation widens to string
readonly packageName: string = "zod";  // Type: string

// ✅ GOOD: TypeScript infers literal type
readonly packageName = "zod";  // Type: "zod"
```

### Step 3: Export Singleton Instances

Create instances once and export them:

```typescript
export const zodValidator = new ZodValidator();
export const valibotValidator = new ValibotValidator();
export const arktypeValidator = new ArkTypeValidator();
export const typeboxValidator = new TypeBoxValidator();
export const zodMiniValidator = new ZodMiniValidator();
```

### Step 4: Create Registry Array

Create an array with `as const` to preserve literal types:

```typescript
export const validators = [
  zodValidator,
  valibotValidator,
  arktypeValidator,
  typeboxValidator,
  zodMiniValidator,
] as const;
```

The `as const` is crucial - it tells TypeScript:
- The array is readonly (can't be modified)
- Element types are literal (not widened)

### Step 5: Derive Types

Extract types from the registry using TypeScript's type operators:

```typescript
// Extract valid IDs from the validators
export type ValidatorId = (typeof validators)[number]["id"];
// Result: 0 | 1 | 2 | 3 | 4

// Extract package names
export type PackageName = (typeof validators)[number]["packageName"];
// Result: "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini"

// Extract labels
export type ValidatorLabel = (typeof validators)[number]["label"];
// Result: "Zod" | "Valibot" | "ArkType" | "TypeBox" | "Zod Mini"
```

### Step 6: Type-Safe Lookup Function

Create a lookup function that accepts only valid IDs:

```typescript
export function getValidator(id: ValidatorId): Validator {
  const validator = validators.find(v => v.id === id);
  if (!validator) {
    throw new Error(`Validator with id ${id} not found`);
  }
  return validator;
}
```

Note: The function accepts `ValidatorId` (not `number`), so you can only pass valid IDs:

```typescript
getValidator(0);  // ✅ OK
getValidator(1);  // ✅ OK
getValidator(99); // ❌ Type error: 99 is not a ValidatorId
```

## Complete Example: Validators

Here's the complete implementation for the validators registry:

```typescript
// src/validators/validator.ts
export interface Validator {
  readonly id: number;
  readonly label: string;
  readonly packageName: string;
  transformSchema(schema: Schema, rawContent: string): string;
  getObservedAttributesCode(): string;
  getUtilsImports(): string;
  getTypesFileContent(): string;
}

// src/validators/zod/index.ts
import type { Validator } from "../validator";

export class ZodValidator implements Validator {
  readonly id = 0;
  readonly label = "Zod";
  readonly packageName = "zod";
  
  transformSchema(schema: Schema, _rawContent: string): string {
    // Implementation
  }
  
  getObservedAttributesCode(): string {
    // Implementation
  }
  
  getUtilsImports(): string {
    return `import { z } from "zod";`;
  }
  
  getTypesFileContent(): string {
    // Implementation
  }
}

// src/validators/index.ts
import { ZodValidator } from "./zod/index";
import { ValibotValidator } from "./valibot/index";
import { ArkTypeValidator } from "./arktype/index";
import { TypeBoxValidator } from "./typebox/index";
import { ZodMiniValidator } from "./zod-mini/index";

// Export singleton instances
export const zodValidator = new ZodValidator();
export const valibotValidator = new ValibotValidator();
export const arktypeValidator = new ArkTypeValidator();
export const typeboxValidator = new TypeBoxValidator();
export const zodMiniValidator = new ZodMiniValidator();

// Registry array
export const validators = [
  zodValidator,
  valibotValidator,
  arktypeValidator,
  typeboxValidator,
  zodMiniValidator,
] as const;

// Derived types
export type ValidatorId = (typeof validators)[number]["id"];
export type PackageName = (typeof validators)[number]["packageName"];

// Type-safe lookup
export function getValidator(id: ValidatorId): Validator {
  const validator = validators.find(v => v.id === id);
  if (!validator) {
    throw new Error(`Validator with id ${id} not found`);
  }
  return validator;
}

export type { Validator } from "./validator";
```

## Benefits

### 1. Type Safety

TypeScript prevents invalid values at compile time:

```typescript
// ❌ Type errors caught at compile time
const id: ValidatorId = 99;  // Error: 99 is not a valid ValidatorId
getValidator(99);             // Error: Argument type 99 not assignable to ValidatorId

// ✅ Only valid values accepted
const id: ValidatorId = 0;   // OK
getValidator(0);              // OK
```

### 2. No Manual Maintenance

Add a new validator, and types update automatically:

```typescript
// Add a new validator
export const effectValidator = new EffectValidator();  // id = 5

export const validators = [
  zodValidator,
  valibotValidator,
  arktypeValidator,
  typeboxValidator,
  zodMiniValidator,
  effectValidator,  // Just add it here
] as const;

// ValidatorId automatically becomes: 0 | 1 | 2 | 3 | 4 | 5
// No manual type updates needed!
```

### 3. Refactoring Safe

Change an ID, and TypeScript catches all affected code:

```typescript
// Change Zod's ID from 0 to 10
export class ZodValidator implements Validator {
  readonly id = 10;  // Changed
  // ...
}

// TypeScript immediately flags all code using the old ID:
if (id === 0) {  // ⚠️ Warning: 0 is no longer a valid ValidatorId
  // ...
}
```

### 4. Better Autocomplete

IDE autocomplete shows only valid values:

```typescript
const id: ValidatorId = // IDE suggests: 0 | 1 | 2 | 3 | 4
const name: PackageName = // IDE suggests: "zod" | "valibot" | "arktype" | ...
```

### 5. Self-Documenting Code

No need to look up magic numbers:

```typescript
// ❌ What does 4 mean?
if (validatorId === 4) {
  // ...
}

// ✅ Clear and explicit
if (validatorId === zodMiniValidator.id) {
  // ...
}
```

## Common Pitfalls

### Pitfall 1: Forgetting `as const`

```typescript
// ❌ Without 'as const', types are widened
export const validators = [zodValidator, valibotValidator];
// Type: Validator[] (not readonly, no literal types)

// ✅ With 'as const', types are preserved
export const validators = [zodValidator, valibotValidator] as const;
// Type: readonly [ZodValidator, ValibotValidator]
```

### Pitfall 2: Type Annotations on Fields

```typescript
// ❌ Type annotation prevents literal type inference
readonly packageName: string = "zod";  // Type: string

// ✅ Let TypeScript infer the literal type
readonly packageName = "zod";  // Type: "zod"
```

### Pitfall 3: Not Using readonly

```typescript
// ❌ Without readonly, types are mutable
export class ZodValidator {
  id = 0;  // Can be changed!
}

// ✅ With readonly, immutability enforced
export class ZodValidator {
  readonly id = 0;  // Cannot be changed
}
```

### Pitfall 4: Creating Multiple Instances

```typescript
// ❌ Creating instances in multiple places
const validators = [new ZodValidator(), ...];
const zod = new ZodValidator();  // Different instance!

// ✅ Single instance, exported and reused
export const zodValidator = new ZodValidator();
export const validators = [zodValidator, ...] as const;
```

## Applying to Other Systems

This pattern works for any extensible system:

### Platforms

```typescript
export const astroPlatform = new AstroPlatform();
export const nextPlatform = new NextPlatform();
export const genericPlatform = new GenericPlatform();

export const platforms = [astroPlatform, nextPlatform, genericPlatform] as const;

export type PlatformId = (typeof platforms)[number]["id"];  // 0 | 1 | 99
export type PlatformName = (typeof platforms)[number]["name"];  // "astro" | "next" | "generic"
```

### Behaviors

```typescript
export const revealBehavior = new RevealBehavior();
export const inputWatcherBehavior = new InputWatcherBehavior();

export const behaviors = [revealBehavior, inputWatcherBehavior] as const;

export type BehaviorName = (typeof behaviors)[number]["name"];
```

## Summary

The type-safe registry pattern provides:

1. **Single Source of Truth**: Types derived from data
2. **Immutability**: Readonly fields prevent accidental changes
3. **Literal Types**: TypeScript knows exact values, not just types
4. **Singleton Pattern**: One instance per registry item
5. **No Magic Values**: All values come from the data itself
6. **Compile-Time Safety**: Invalid values caught before runtime
7. **Easy Maintenance**: Add items, types update automatically

Follow this pattern for all registry-like structures in BehaviorFN.
