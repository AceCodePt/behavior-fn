# Task: Remove Jiti Dependency - Build Registry Instead

## Goal

Remove the `jiti` runtime dependency by properly building the registry TypeScript files to JavaScript during the build process, then using native ESM dynamic imports.

## Context

Currently, the CLI build process:
1. Compiles `index.ts` → `dist/index.js` (JavaScript)
2. **Copies** registry → `dist/registry/**/*.ts` (raw TypeScript files)
3. Uses `jiti` at runtime to import TypeScript files

This works but has drawbacks:
- Extra dependency (jiti)
- Runtime compilation overhead
- Complexity of having a TypeScript runtime loader

### The Better Approach

Build the registry files to JavaScript during the build process:
1. Compile ALL TypeScript → JavaScript (including registry)
2. Use native ESM `import()` at runtime
3. Simpler, faster, fewer dependencies

## Current Implementation

**package.json build script:**
```json
"build": "tsup index.ts --format esm --clean --onSuccess \"cp -r registry dist/registry && chmod +x dist/index.js\""
```

**index.ts:**
```typescript
import { createJiti } from "jiti";

const jiti = createJiti(__filename);

// Later...
const mod = await jiti.import<{ schema?: AttributeSchema }>(schemaPath);
```

## Requirements

### 1. Update Build Process
- Configure tsup to build registry files
- Ensure proper output structure in `dist/`
- Maintain directory structure: `dist/registry/behaviors/*/`
- Remove the `cp -r registry` part from build script

### 2. Update index.ts
- Remove `jiti` import and usage
- Use native ESM dynamic import
- Handle both `.ts` (dev) and `.js` (production) extensions
- Use proper TypeScript types (no jiti types needed)

### 3. Update Dependencies
- Remove `jiti` from `devDependencies` in package.json
- Verify no other code uses jiti

### 4. Verify Build Output
- Check `dist/` structure matches expectations
- Ensure all registry `.ts` files are compiled to `.js`
- Verify imports work in built version

## Proposed Solution

### Build Configuration

**Option A: Update tsup config**
```json
"build": "tsup index.ts 'registry/**/*.ts' --format esm --clean --onSuccess \"chmod +x dist/index.js\""
```

**Option B: Create tsup.config.ts**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts', 'registry/**/*.ts'],
  format: 'esm',
  clean: true,
  onSuccess: 'chmod +x dist/index.js'
});
```

### Code Changes

**index.ts:**
```typescript
// Remove jiti
- import { createJiti } from "jiti";
- const jiti = createJiti(__filename);

// Use native import
if (file.path.endsWith("schema.ts")) {
  try {
    // Determine extension based on environment
    const ext = __filename.endsWith('.ts') ? '.ts' : '.js';
    const schemaPath = `./registry/behaviors/${file.path.replace('.ts', ext)}`;
    
    const mod = await import(schemaPath) as { schema?: AttributeSchema };
    if (mod.schema) {
      content = strategy.transformSchema(mod.schema, content);
    }
  } catch (e) {
    console.warn(`Failed to transform schema for ${file.path}:`, e);
  }
}
```

**Alternative (simpler):**
```typescript
// Just use .js in production (since we'll build everything)
const schemaPath = `./registry/behaviors/${file.path.replace('.ts', '.js')}`;
const mod = await import(schemaPath) as { schema?: AttributeSchema };
```

## Definition of Done

- [ ] `jiti` removed from package.json dependencies
- [ ] Build script updated to compile registry files
- [ ] `index.ts` uses native `import()` instead of jiti
- [ ] `pnpm build` produces correct `dist/` structure
- [ ] All registry `.ts` files compiled to `.js` in `dist/`
- [ ] Built CLI works: `node dist/index.js init` succeeds
- [ ] Built CLI can transform schemas correctly
- [ ] All tests pass
- [ ] No references to jiti in codebase (except maybe in git history)

## Testing Checklist

1. **Build succeeds:**
   ```bash
   pnpm build
   ```

2. **Dist structure correct:**
   ```bash
   ls dist/
   # Should show: index.js, registry/
   
   ls dist/registry/behaviors/reveal/
   # Should show: schema.js, behavior.js, etc. (not .ts!)
   ```

3. **CLI works in production:**
   ```bash
   node dist/index.js init
   node dist/index.js add reveal
   ```

4. **Tests pass:**
   ```bash
   pnpm test
   ```

5. **Type checking passes:**
   ```bash
   npx tsc --noEmit
   ```

## Out of Scope

- Changing the registry structure
- Modifying behavior schemas
- Changing the transformation logic (only the import mechanism)

## Notes

- This is a **build process improvement**, not a feature change
- The registry files will still be TypeScript in the source
- Users won't notice any difference
- The CLI will be faster without runtime TypeScript compilation

## Success Metrics

- **Simpler:** One less dependency
- **Faster:** No runtime compilation
- **Cleaner:** Native ESM instead of runtime loader
- **Standard:** Just TypeScript → JavaScript, no magic
