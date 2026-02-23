# Type Safety Refactor - Code Examples

This document provides before/after examples for the most common refactoring patterns.

---

## Pattern 1: Transformer Function Signatures

### Before
```typescript
export function toZod(schema: any): string {
  function parse(s: any): string {
    // ...
  }
}
```

### After
```typescript
import { type AttributeSchema, type PropertySchema } from '../types/schema';

export function toZod(schema: AttributeSchema): string {
  function parse(s: PropertySchema): string {
    // ...
  }
}
```

---

## Pattern 2: Strategy Interface & Implementations

### Before (validator-strategy.ts)
```typescript
export interface ValidatorStrategy {
  transformSchema(schemaObject: any, rawContent: string): string;
}
```

### After (validator-strategy.ts)
```typescript
import { type AttributeSchema } from '../types/schema';

export interface ValidatorStrategy {
  transformSchema(schemaObject: AttributeSchema, rawContent: string): string;
}
```

### Before (typebox-strategy.ts)
```typescript
transformSchema(schemaObject: any, rawContent: string): string {
  return toTypeBox(rawContent, schemaObject);
}

getObservedAttributesCode(): string {
  return `export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  if ("properties" in schema && typeof (schema as any).properties === "object") {
    return Object.keys((schema as any).properties);
  }
  return [];
};`;
}
```

### After (typebox-strategy.ts)
```typescript
import { type AttributeSchema } from '../types/schema';

transformSchema(schemaObject: AttributeSchema, rawContent: string): string {
  return toTypeBox(rawContent, schemaObject);
}

getObservedAttributesCode(): string {
  return `export const getObservedAttributes = (schema: AttributeSchema): string[] => {
  if (!schema) return [];
  return Object.keys(schema.properties);
};`;
}
```

---

## Pattern 3: Object.entries() with Typed Schema

### Before
```typescript
const props = Object.entries(s.properties || {})
  .map(([key, value]: [string, any]) => {
    let code = parse(value);
    const isRequired = s.required?.includes(key);
    // ...
  })
```

### After
```typescript
const props = Object.entries(schema.properties)
  .map(([key, value]: [string, PropertySchema]) => {
    let code = parse(value);
    const isRequired = schema.required?.includes(key);
    // ...
  })
```

---

## Pattern 4: Registry Typing

### Before (index.ts)
```typescript
const registryPath = path.join(__dirname, "registry/behaviors-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

// ...

const behavior = registry.find((b: any) => b.name === name);
```

### After (index.ts)
```typescript
import { type BehaviorMetadata } from './src/types/registry';

const registryPath = path.join(__dirname, "registry/behaviors-registry.json");
const registry: BehaviorMetadata[] = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

// ...

const behavior = registry.find(b => b.name === name);
```

---

## Pattern 5: DOM Element Value Access

### Before (input-watcher/behavior.ts)
```typescript
const readValue = (el: Element) => {
  const attr = host.getAttribute("input-watcher-attr");
  if (attr) {
    return el.getAttribute(attr) ?? "";
  }
  // Try value property
  if ("value" in el) {
    return (el as any).value;
  }
  return el.textContent ?? "";
};
```

### After (input-watcher/behavior.ts)
```typescript
import { hasValue } from '~utils'; // Or appropriate path

const readValue = (el: Element) => {
  const attr = host.getAttribute("input-watcher-attr");
  if (attr) {
    return el.getAttribute(attr) ?? "";
  }
  // Try value property
  if (hasValue(el)) {
    return el.value; // TypeScript knows this is safe!
  }
  return el.textContent ?? "";
};
```

---

## Pattern 6: Event Target Handling

### Before (request/behavior.ts)
```typescript
const listener = (e: Event) => {
  const targetEl = e.target as any;
  if (changed && targetEl && "value" in targetEl) {
    const val = String(targetEl.value);
    if (lastValues.get(targetEl) === val) return;
    lastValues.set(targetEl, val);
  }
  // ...
};
```

### After (request/behavior.ts)
```typescript
import { isFormElement } from '~utils'; // Or appropriate path

const listener = (e: Event) => {
  if (changed && isFormElement(e.target)) {
    const val = String(e.target.value);
    if (lastValues.get(e.target) === val) return;
    lastValues.set(e.target, val);
  }
  // ...
};
```

---

## Pattern 7: Jiti Import Typing (Optional Enhancement)

### Before (index.ts)
```typescript
try {
  const mod = await jiti.import<{ schema?: unknown }>(sourcePath);
  if (mod.schema) {
    content = strategy.transformSchema(mod.schema, content);
  }
}
```

### After (index.ts)
```typescript
import { type AttributeSchema } from './src/types/schema';

try {
  const mod = await jiti.import<{ schema?: AttributeSchema }>(sourcePath);
  if (mod.schema) {
    content = strategy.transformSchema(mod.schema, content);
  }
}
```

---

## Type Definitions Reference

### src/types/schema.ts (Complete File)

```typescript
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

/**
 * Alias for clarity in behavior contexts.
 */
export type BehaviorSchema = AttributeSchema;
```

### src/types/registry.ts (Complete File)

```typescript
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

### src/types/type-guards.ts (Complete File)

```typescript
/**
 * Type guard to check if an element has a value property.
 * Returns true for form elements that have a `value` property.
 */
export function hasValue(
  el: Element
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return 'value' in el;
}

/**
 * Type guard to check if an event target is a form element.
 * Useful for event handlers that need to access the value property.
 */
export function isFormElement(
  target: EventTarget | null
): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Optional: Validate that an unknown value is an AttributeSchema.
 * Useful for dynamic imports or runtime validation.
 */
export function isAttributeSchema(value: unknown): value is AttributeSchema {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const schema = value as Record<string, unknown>;
  return (
    'properties' in schema &&
    typeof schema.properties === 'object' &&
    schema.properties !== null
  );
}
```

---

## Common Pitfalls to Avoid

### ❌ Don't: Keep using `any` with a comment
```typescript
// This is dynamic so we need any
const schema: any = await loadSchema();
```

### ✅ Do: Use proper types
```typescript
const schema: AttributeSchema = await loadSchema();
```

---

### ❌ Don't: Use type assertions
```typescript
const properties = (schema as any).properties;
```

### ✅ Do: Access properties directly (they're typed!)
```typescript
const properties = schema.properties; // TypeScript knows this exists
```

---

### ❌ Don't: Check for properties that are always present
```typescript
if ('properties' in schema) {
  // AttributeSchema always has properties
}
```

### ✅ Do: Access directly
```typescript
const keys = Object.keys(schema.properties);
```

---

### ❌ Don't: Use double assertions
```typescript
const response = mockData as unknown as Response;
```

### ✅ Do: Use proper types (in tests, `Partial<T>` is acceptable)
```typescript
const response: Partial<Response> = mockData;
```

---

## Testing the Changes

### Verify Type Safety
```bash
# Should pass with 0 errors
pnpm check
```

### Verify No Regressions
```bash
# All tests should pass
pnpm test
```

### Search for Remaining Issues
```bash
# Should return 0 results (excluding tests)
rg "\bany\b" --type ts --glob '!*.test.ts' --glob '!tests/' src/ registry/

# Should return 0 results (excluding tests)
rg "as any" --type ts --glob '!*.test.ts' --glob '!tests/' src/ registry/
```

---

## Benefits After Refactoring

✅ **Compile-time safety**: TypeScript catches errors before runtime  
✅ **Better autocomplete**: IDEs provide accurate suggestions  
✅ **Self-documenting**: Types show what functions expect  
✅ **Easier refactoring**: TypeScript guides you through changes  
✅ **Fewer bugs**: Type mismatches caught during development  
✅ **Team confidence**: New developers understand the contracts  

---

## Questions?

Refer back to:
- `task.md` - High-level goals and requirements
- `analysis.md` - Detailed issue breakdown
- `checklist.md` - Step-by-step execution guide
- `examples.md` - This file (code examples)
