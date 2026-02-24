# Update: Create Command for Constants Pattern

**Date:** 2026-02-24  
**Related:** BUGFIX-AUTO-LOADER.md, CONSTANTS-PATTERN.md

---

## Overview

Updated the `behavior-fn create` command to generate behaviors following the new constants pattern, which separates attribute constants from schema validation to keep CDN bundles lightweight.

## Changes Made

### 1. Template Generator Updates

**File:** `src/templates/behavior-templates.ts`

#### Added `generateConstants()` function:
```typescript
export function generateConstants(behaviorName: string): string {
  const constantsName = `${toConstantCase(behaviorName)}_ATTRS`;
  
  return `/**
 * Attribute name constants for the ${behaviorName} behavior.
 * 
 * This file contains ONLY attribute name constants - no schema validation logic.
 * Separated from schema.ts to keep CDN bundles lightweight (~50KB smaller).
 * 
 * The ${behaviorName} behavior [TODO: add description].
 */
export const ${constantsName} = {
  // Add your attribute constants here
  // Example:
  // /** Description of what this attribute does */
  // MY_ATTRIBUTE: "${behaviorName}-my-attribute",
} as const;
`;
}
```

#### Updated `generateSchema()`:
- Now imports constants from `constants.ts`
- Re-exports constants for backward compatibility
- Shows example using constants in schema definition

```typescript
export function generateSchema(behaviorName: string): string {
  const constantsName = `${toConstantCase(behaviorName)}_ATTRS`;
  
  return `import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { ${constantsName} } from "./constants";

// Re-export constants for convenience
export { ${constantsName} };

export const schema = Type.Object({
  // Example:
  // [${constantsName}.MY_ATTRIBUTE]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
`;
}
```

#### Updated `generateBehavior()`:
- Now imports from `constants.ts` instead of `schema.ts`
- Shows example using constants to access attributes

```typescript
export function generateBehavior(behaviorName: string): string {
  const factoryName = toCamelCase(behaviorName) + "BehaviorFactory";
  const constantsName = `${toConstantCase(behaviorName)}_ATTRS`;
  
  return `import { ${constantsName} } from "./constants";

export const ${factoryName} = (el: HTMLElement) => {
  return {
    // Example:
    // onClick(e: MouseEvent) {
    //   const myAttr = el.getAttribute(${constantsName}.MY_ATTRIBUTE);
    //   console.log('Element clicked!', myAttr);
    // },
  };
};
`;
}
```

### 2. CLI Command Updates

**File:** `index.ts`

#### Import the new generator:
```typescript
import {
  generateBehaviorDefinition,
  generateConstants,  // NEW
  generateSchema,
  generateBehavior,
  generateTest,
} from "./src/templates/behavior-templates";
```

#### Generate constants.ts file:
```typescript
const files = [
  {
    name: "_behavior-definition.ts",
    content: generateBehaviorDefinition(name),
  },
  { name: "constants.ts", content: generateConstants(name) },  // NEW
  { name: "schema.ts", content: generateSchema(name) },
  { name: "behavior.ts", content: generateBehavior(name) },
  { name: "behavior.test.ts", content: generateTest(name) },
];
```

#### Update registry entry:
```typescript
const newEntry = {
  name,
  dependencies: [],
  files: [
    { path: `${name}/_behavior-definition.ts` },
    { path: `${name}/constants.ts` },  // NEW
    { path: `${name}/schema.ts` },
    { path: `${name}/behavior.ts` },
    { path: `${name}/behavior.test.ts` },
  ],
};
```

### 3. Registry Updates

**File:** `registry/behaviors-registry.json`

Added `constants.ts` to all existing behavior entries:

- ✅ compute
- ✅ element-counter
- ✅ logger
- ✅ request
- ✅ reveal

Each entry now includes:
```json
{
  "name": "behavior-name",
  "dependencies": [],
  "files": [
    { "path": "behavior-name/_behavior-definition.ts" },
    { "path": "behavior-name/constants.ts" },  // NEW
    { "path": "behavior-name/schema.ts" },
    { "path": "behavior-name/behavior.ts" },
    { "path": "behavior-name/behavior.test.ts" }
  ]
}
```

---

## Usage

### Creating a New Behavior

```bash
behavior-fn create my-custom-behavior
```

This now generates:
```
registry/behaviors/my-custom-behavior/
├── _behavior-definition.ts
├── constants.ts              # NEW - Attribute constants only
├── schema.ts                 # Imports from constants.ts
├── behavior.ts               # Imports from constants.ts
└── behavior.test.ts
```

### Generated Files Structure

**constants.ts:**
```typescript
export const MY_CUSTOM_BEHAVIOR_ATTRS = {
  // Add your attribute constants here
} as const;
```

**schema.ts:**
```typescript
import { Type } from "@sinclair/typebox";
import { MY_CUSTOM_BEHAVIOR_ATTRS } from "./constants";

export { MY_CUSTOM_BEHAVIOR_ATTRS };

export const schema = Type.Object({
  // Use constants here
});
```

**behavior.ts:**
```typescript
import { MY_CUSTOM_BEHAVIOR_ATTRS } from "./constants";

export const myCustomBehaviorBehaviorFactory = (el: HTMLElement) => {
  // Use constants to access attributes
  const value = el.getAttribute(MY_CUSTOM_BEHAVIOR_ATTRS.MY_ATTRIBUTE);
};
```

---

## Benefits

1. **Follows Best Practices**: New behaviors automatically follow the constants pattern
2. **Lightweight CDN Bundles**: TypeBox won't be bundled in CDN builds
3. **Clear Examples**: Generated code shows how to use constants
4. **Consistent Structure**: All behaviors have the same file structure
5. **Documentation**: Templates include comments explaining the pattern

---

## Next Steps for Developers

After running `behavior-fn create my-behavior`:

1. **Edit `constants.ts`:**
   ```typescript
   export const MY_BEHAVIOR_ATTRS = {
     /** Description of attribute */
     MY_ATTRIBUTE: "my-behavior-my-attribute",
   } as const;
   ```

2. **Edit `schema.ts`:**
   ```typescript
   export const schema = Type.Object({
     [MY_BEHAVIOR_ATTRS.MY_ATTRIBUTE]: Type.Optional(Type.String()),
   });
   ```

3. **Edit `behavior.ts`:**
   ```typescript
   export const myBehaviorBehaviorFactory = (el: HTMLElement) => {
     return {
       onClick() {
         const value = el.getAttribute(MY_BEHAVIOR_ATTRS.MY_ATTRIBUTE);
         console.log(value);
       }
     };
   };
   ```

4. **Write tests in `behavior.test.ts`**

5. **Run tests:** `pnpm test`

---

## Backward Compatibility

### Existing Behaviors
✅ All existing behaviors updated in registry  
✅ constants.ts files already created for all behaviors  
✅ CLI `add` command will install constants.ts automatically

### CLI Users
✅ `behavior-fn add reveal` now installs constants.ts along with other files  
✅ No breaking changes to existing behavior installations  
✅ Existing projects continue to work

### CDN Users
✅ Transparent - CDN bundles are automatically smaller  
✅ No API changes  
✅ Same usage patterns

---

## Verification

### Test Create Command:
```bash
# Create a test behavior
behavior-fn create test-constants-pattern

# Verify files created
ls registry/behaviors/test-constants-pattern/
# Should see: _behavior-definition.ts, constants.ts, schema.ts, behavior.ts, behavior.test.ts

# Check constants.ts content
cat registry/behaviors/test-constants-pattern/constants.ts
# Should NOT import TypeBox

# Check schema.ts content
cat registry/behaviors/test-constants-pattern/schema.ts
# Should import from constants.ts

# Check behavior.ts content
cat registry/behaviors/test-constants-pattern/behavior.ts
# Should import from constants.ts

# Cleanup
behavior-fn remove test-constants-pattern
```

### Test Add Command:
```bash
# Init a test project
mkdir test-project && cd test-project
behavior-fn init --defaults

# Add a behavior
behavior-fn add reveal

# Verify constants.ts was installed
ls src/behaviors/reveal/
# Should see constants.ts

# Check imports
grep "from.*constants" src/behaviors/reveal/behavior.ts
# Should show: from "./constants"
```

---

## Summary

✅ **Template generators updated** to create constants.ts  
✅ **CLI create command** generates constants pattern  
✅ **Registry updated** with constants.ts for all behaviors  
✅ **CLI add command** installs constants.ts automatically  
✅ **Backward compatible** - No breaking changes  
✅ **Well documented** - Generated code includes examples  

All new behaviors created with `behavior-fn create` will now follow the lightweight constants pattern, ensuring CDN bundles remain small and maintainable! 🎉
