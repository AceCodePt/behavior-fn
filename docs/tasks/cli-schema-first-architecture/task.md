# Migrate CLI to Schema-First Architecture (TypeBox)

**Type**: Architecture Improvement  
**Priority**: High  
**Created**: 2026-02-27

## Context

The CLI tool (`index.ts`, `src/*`) currently uses **manual TypeScript interfaces** with **no runtime validation** for its internal data structures (Config, Registry, etc.). This violates our SSOT principle and creates inconsistency:

- ✅ **Generated code** (`registry/behaviors/*`) uses TypeBox schemas → transformed to user's validator
- ❌ **CLI code** (`src/*`) uses manual interfaces → no validation, no SSOT

## Problem

### 1. No Runtime Validation
```typescript
// Current: index.ts line 69
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
// ❌ No validation! Malformed config causes cryptic errors later
```

### 2. Manual Type Definitions (Violates SSOT)
```typescript
// src/types/init.ts
export interface InitConfig {  // ❌ Manually maintained
  validator: PackageName;
  typescript: boolean;
  behaviorsPath: string;
  packageManager: PackageManager;
}

// src/types/registry.ts
export interface BehaviorMetadata {  // ❌ Manually maintained
  name: string;
  files: BehaviorFileMetadata[];
  dependencies?: string[];
}
```

### 3. Not Dogfooding Our Own Pattern
We teach users to use schemas as SSOT but don't follow our own advice in the CLI.

## Architecture Boundary (CRITICAL)

### Two Separate Validation Contexts

```
┌─────────────────────────────────────────────────────────────┐
│ CLI INTERNAL VALIDATION (TypeBox - ALWAYS)                 │
│ - behavior.config.json validated by CLI with TypeBox       │
│ - registry/behaviors-registry.json validated with TypeBox  │
│ - User's validator choice is IRRELEVANT here                │
│ - TypeBox is devDependency - never shipped to users        │
└─────────────────────────────────────────────────────────────┘
                        ▼ (CLI reads user's choice)
┌─────────────────────────────────────────────────────────────┐
│ USER'S VALIDATOR CHOICE (Zod/Valibot/etc)                  │
│ - ONLY used for transforming BEHAVIOR schemas              │
│ - reveal/schema.ts: TypeBox → Zod (if user chose Zod)      │
│ - Copied to user's project                                  │
│ - CLI never uses user's validator for its own data         │
└─────────────────────────────────────────────────────────────┘
```

### Two Separate Codebases

```
┌─────────────────────────────────────────────────────────────┐
│ CLI CODE (Never shipped to users)                          │
│ - index.ts, src/*                                           │
│ - Uses TypeBox as devDependency                             │
│ - TypeBox schemas for config validation                     │
│ - Types derived via Static<typeof Schema>                   │
└─────────────────────────────────────────────────────────────┘
                        ▼ (reads & transforms)
┌─────────────────────────────────────────────────────────────┐
│ GENERATED CODE (Copied to user projects)                   │
│ - registry/behaviors/*                                      │
│ - TypeBox schemas → transformed to user's validator         │
│ - User never sees TypeBox (unless they choose it)           │
└─────────────────────────────────────────────────────────────┘
```

**Key Constraint**: TypeBox in CLI code is **build-time only**. It's a devDependency that helps us validate CLI operations. Users never see it unless they explicitly choose TypeBox as their validator.

### Critical Distinction: What Validates What?

**Example Flow:**
```bash
# User runs init and chooses Zod
$ behavior-fn init
✔ Which schema validator? › Zod

# CLI creates behavior.config.json:
{
  "validator": "zod",  // This is just a STRING value
  "paths": { ... }
}

# User runs add
$ behavior-fn add reveal

# What happens:
# 1. CLI reads behavior.config.json (JSON file)
# 2. CLI validates it with TypeBox (NOT Zod!)
#    - ConfigSchema (TypeBox) validates the structure
#    - The "validator": "zod" field is validated as a string literal
# 3. CLI reads the validator field value: "zod"
# 4. CLI transforms reveal/schema.ts from TypeBox → Zod
# 5. CLI copies Zod version to user's project
```

**The user's validator choice ONLY affects behavior schemas, NOT CLI validation.**

## Goal

Apply **Schema-First Architecture** to CLI internals:
1. All data structures defined as TypeBox schemas (SSOT)
2. Types derived from schemas via `Static<typeof Schema>`
3. Runtime validation via `Value.Check()` on all JSON loading
4. Clear, actionable error messages when validation fails

## Requirements

### 1. Config Schema (`src/schemas/config.ts`)

Create TypeBox schema for `behavior.config.json`:

```typescript
import { Type, Static } from "@sinclair/typebox";

export const ConfigSchema = Type.Object({
  validator: Type.Union([
    Type.Literal("zod"),
    Type.Literal("valibot"),
    Type.Literal("arktype"),
    Type.Literal("@sinclair/typebox"),
    Type.Literal("zod-mini"),
  ]),
  paths: Type.Object({
    behaviors: Type.String(),
    utils: Type.String(),
    registry: Type.String(),
    testUtils: Type.String(),
    host: Type.String(),
    types: Type.String(),
  }),
  aliases: Type.Object({
    utils: Type.String(),
    registry: Type.String(),
    testUtils: Type.String(),
    host: Type.String(),
    types: Type.String(),
  }),
  optionalFiles: Type.Optional(Type.Object({
    tests: Type.Optional(Type.Boolean()),
  })),
});

// Type derived from schema (SSOT)
export type Config = Static<typeof ConfigSchema>;
```

### 2. Registry Schema (`src/schemas/registry.ts`)

Create TypeBox schema for `registry/behaviors-registry.json`:

```typescript
import { Type, Static } from "@sinclair/typebox";

export const BehaviorFileMetadataSchema = Type.Object({
  path: Type.String(),
});

export const BehaviorMetadataSchema = Type.Object({
  name: Type.String(),
  files: Type.Array(BehaviorFileMetadataSchema),
  dependencies: Type.Optional(Type.Array(Type.String())),
});

export const BehaviorRegistrySchema = Type.Array(BehaviorMetadataSchema);

// Types derived from schemas
export type BehaviorFileMetadata = Static<typeof BehaviorFileMetadataSchema>;
export type BehaviorMetadata = Static<typeof BehaviorMetadataSchema>;
export type BehaviorRegistry = Static<typeof BehaviorRegistrySchema>;
```

### 3. Validation Helpers (`src/schemas/validation.ts`)

Create reusable validation utilities:

```typescript
import { Value } from "@sinclair/typebox/value";
import type { TSchema } from "@sinclair/typebox";

export function validateJson<T>(
  schema: TSchema,
  data: unknown,
  context: string
): T {
  if (!Value.Check(schema, data)) {
    const errors = [...Value.Errors(schema, data)];
    console.error(`❌ Invalid ${context}:`);
    errors.forEach(e => {
      console.error(`  - ${e.path}: ${e.message}`);
    });
    process.exit(1);
  }
  return data as T;
}

export function validateJsonFile<T>(
  schema: TSchema,
  filePath: string,
  context: string
): T {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return validateJson<T>(schema, raw, context);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error(`❌ Malformed JSON in ${context}: ${filePath}`);
      console.error(`  ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}
```

### 4. Update All JSON Loading

Replace all `JSON.parse()` calls with validated loading:

**Before:**
```typescript
// index.ts line 35
const registry: BehaviorRegistry = JSON.parse(
  fs.readFileSync(registryPath, "utf-8"),
);
```

**After:**
```typescript
import { BehaviorRegistrySchema, type BehaviorRegistry } from "./src/schemas/registry";
import { validateJsonFile } from "./src/schemas/validation";

const registry = validateJsonFile<BehaviorRegistry>(
  BehaviorRegistrySchema,
  registryPath,
  "behaviors registry"
);
```

### 5. Update loadConfig()

**Before:**
```typescript
function loadConfig(): Config | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
```

**After:**
```typescript
import { ConfigSchema, type Config } from "./src/schemas/config";
import { validateJsonFile } from "./src/schemas/validation";

function loadConfig(): Config | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  
  return validateJsonFile<Config>(
    ConfigSchema,
    configPath,
    "behavior.config.json"
  );
}
```

### 6. Migration Validation

In the migration path, validate both old and new configs:

```typescript
// Migrate from old config
if (fs.existsSync(oldConfigPath)) {
  console.log("📦 Migrating behavior.json to behavior.config.json...");
  
  // Validate old config (may be partial)
  const oldConfig = JSON.parse(fs.readFileSync(oldConfigPath, "utf-8"));
  
  // Create new config with defaults
  const newConfig = {
    ...oldConfig,
    validator: oldConfig.validator || "zod",
  };
  
  // Validate new config before writing
  const validated = validateJson<Config>(
    ConfigSchema,
    newConfig,
    "migrated config"
  );
  
  fs.writeFileSync(newConfigPath, JSON.stringify(validated, null, 2));
  console.log("✓ Migration complete. You can now delete behavior.json");
  
  return validated;
}
```

## Files to Create

1. **`src/schemas/config.ts`** - Config schema + type
2. **`src/schemas/registry.ts`** - Registry schema + type
3. **`src/schemas/validation.ts`** - Validation helpers

## Files to Modify

1. **`index.ts`**:
   - Import schemas and validation helpers
   - Replace `JSON.parse()` with `validateJsonFile()`
   - Update `loadConfig()` with validation
   - Update registry loading with validation
   - Remove manual `Config` interface (use exported type)

2. **`src/types/init.ts`** - DELETE (merged into `src/schemas/config.ts`)
3. **`src/types/registry.ts`** - DELETE (moved to `src/schemas/registry.ts`)
4. **`src/types/schema.ts`** - KEEP (generic JSON Schema types, unrelated)

## Files to Update (Imports)

Any file importing from deleted types must update:

```typescript
// Before
import type { BehaviorRegistry } from "./src/types/registry";

// After
import type { BehaviorRegistry } from "./src/schemas/registry";
```

## Testing Strategy

### 1. Unit Tests for Validation

Create `src/schemas/validation.test.ts`:

```typescript
describe("Config validation", () => {
  it("should accept valid config", () => {
    const valid = {
      validator: "zod",
      paths: { /* ... */ },
      aliases: { /* ... */ },
    };
    
    expect(Value.Check(ConfigSchema, valid)).toBe(true);
  });
  
  it("should reject invalid validator", () => {
    const invalid = {
      validator: "invalid-validator",
      paths: { /* ... */ },
    };
    
    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });
  
  it("should reject missing required fields", () => {
    const invalid = { validator: "zod" };
    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });
});
```

### 2. Integration Tests

Update existing CLI tests to verify validation errors:

```typescript
it("should fail with clear error for malformed config", () => {
  // Create invalid config
  fs.writeFileSync("behavior.config.json", '{"validator": "invalid"}');
  
  expect(() => loadConfig()).toThrow();
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("Invalid behavior.config.json")
  );
});
```

### 3. Manual Testing

1. **Valid config**: Loads successfully
2. **Invalid validator**: Clear error message with path
3. **Missing required field**: Clear error about which field
4. **Malformed JSON**: Clear parse error
5. **Migration**: Old config validated before/after migration

## Error Message Examples

### Before (Cryptic)
```
TypeError: Cannot read property 'behaviors' of undefined
  at installBehavior (index.ts:152)
```

### After (Clear)
```
❌ Invalid behavior.config.json:
  - /paths: Required property
  - /validator: Expected "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini", received "invalid-validator"
```

## Success Criteria

- ✅ All CLI data structures use TypeBox schemas as SSOT
- ✅ Types derived from schemas via `Static<typeof>`
- ✅ All JSON loading validated via `Value.Check()`
- ✅ Clear, actionable error messages on validation failures
- ✅ No manual interface definitions for validated data
- ✅ All existing tests pass
- ✅ New validation tests added and passing

## Dependencies

None. TypeBox is already a devDependency.

## Notes

### Why TypeBox for CLI (not Zod/Valibot)?

TypeBox is already a devDependency and it's the fastest validator. Since the CLI is build-time only, performance matters. Users never see this choice.

### Separation of Concerns

- **CLI schemas** (`src/schemas/*`) - validate CLI operations
- **Behavior schemas** (`registry/behaviors/*/schema.ts`) - define behavior APIs, transformed to user's validator

These are completely separate. CLI schemas are never copied to user projects.

### Breaking Changes

None. This is internal refactoring. External CLI API remains identical.

## FAQ

### Q: Does the user's validator choice affect CLI validation?

**A: No.** The CLI always uses TypeBox for its internal validation, regardless of the user's choice.

```typescript
// User's choice is stored as a string value
const config = {
  validator: "zod",  // Just a string!
  paths: { ... }
};

// CLI validates this config with TypeBox (not Zod)
const validated = validateJson<Config>(ConfigSchema, config);

// User's choice ONLY affects behavior transformation
const userValidator = getValidator(config.validator); // Now we use "zod"
const transformedSchema = userValidator.transformSchema(behaviorSchema);
```

### Q: Why not use the user's validator for CLI validation?

**A: Separation of concerns and practical constraints:**

1. **Build-time vs Runtime**: CLI needs its validator compiled into the tool
2. **User doesn't have it installed yet**: During `init`, user hasn't installed their validator
3. **Performance**: CLI is a build tool, needs fast validation (TypeBox is fastest)
4. **Simplicity**: One validator for CLI internals, cleaner architecture

### Q: Where does user's validator matter?

**A: Only for behavior schemas:**

- `registry/behaviors/reveal/schema.ts` → Transformed to user's choice
- Copied to user's project with user's validator
- User validates behavior attributes with their chosen validator

### Q: Can user choose TypeBox and avoid transformation?

**A: Yes!** If user chooses TypeBox:
- CLI still uses TypeBox for internal validation (same as always)
- Behavior schemas copied as-is (no transformation needed)
- User's project uses TypeBox (same as CLI, but independent)

## Related Tasks

- Blocked by: None
- Blocks: None (standalone improvement)
- Related: [Fix Config File Handling and Add Command Issues](../fix-config-and-add-command/task.md) (uses validated config)
