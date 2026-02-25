# Task: Fix CDN Build to Inline TypeBox Schemas

## Goal

Fix the CDN build script to properly inline TypeBox schemas as JSON Schema objects, eliminating the runtime dependency on TypeBox and making CDN bundles work in browsers.

## Context

**Current Problem:**

The CDN bundles (`dist/cdn/*.js`) contain dynamic require statements for TypeBox:

```javascript
var k=O("@sinclair/typebox")  // ❌ Tries to require at runtime
```

This causes browser errors:
```
Uncaught Error: Dynamic require of "@sinclair/typebox" is not supported
```

**What Should Happen:**

The build script (`scripts/build-cdn.ts`) should:
1. Import TypeBox schemas at build time
2. Convert them to plain JSON Schema objects
3. Inline them as literals in the bundle
4. Mark TypeBox as external in esbuild config

**Expected Bundle Output:**

```javascript
// ✅ Schema inlined as literal object
var schema = {
  type: "object",
  properties: {
    "json-template-for": {
      type: "string",
      description: "..."
    }
  }
};
```

### Why This Matters

**Blocks:**
- Chat demo from running
- Any CDN usage of behaviors
- Real-world testing of implemented features

**Impact:**
- Array swap strategies work (377 tests pass) but can't be used via CDN
- Fallback operators work (tests pass) but can't be used via CDN
- Pattern is sound but can't be demonstrated

## Requirements

1. **Remove runtime TypeBox dependency from CDN bundles**
   - No `require("@sinclair/typebox")` in output
   - Schemas inlined as plain objects

2. **Preserve schema functionality**
   - Observed attributes still extracted correctly
   - Validation still works (if used)
   - Metadata available via `window.BehaviorFN.behaviorMetadata`

3. **Maintain build script functionality**
   - IIFE bundles for each behavior
   - ESM bundles for each behavior
   - Auto-loader bundle
   - All existing outputs preserved

4. **No breaking changes**
   - Existing behavior APIs unchanged
   - Registration still works
   - Behavioral hosts still work

## Current Implementation

### Build Script Location
`scripts/build-cdn.ts`

### Key Functions

**`extractSchemaMetadata(behaviorName: string)` (lines 40-67):**
```typescript
async function extractSchemaMetadata(behaviorName: string): Promise<{
  observedAttributes: string[];
  jsonSchema: any;
} | null> {
  try {
    const schemaPath = join(registryDir, behaviorName, "schema.ts");
    const mod = await jiti.import(schemaPath) as { schema?: any };
    
    if (!mod.schema) return null;
    
    const schema = mod.schema;
    
    // Extract observed attributes from TypeBox schema
    const observedAttributes = schema.properties 
      ? Object.keys(schema.properties)
      : [];
    
    // Convert TypeBox schema to plain JSON Schema object
    const jsonSchema = JSON.parse(JSON.stringify(schema));
    
    return { observedAttributes, jsonSchema };
  } catch (error) {
    console.warn(`  ⚠️  Could not extract schema for ${behaviorName}:`, error);
    return null;
  }
}
```

**Problem:** This extracts the schema correctly, but the bundle still imports TypeBox.

### Build Targets

**`buildIndividualBehaviors()` (lines 166-285):**
- Builds IIFE and ESM bundles for each behavior
- Uses esbuild
- Should inject extracted schemas

**Key esbuild config:**
```typescript
await build({
  entryPoints: [entryFile],
  bundle: true,
  format: "iife",
  globalName: `BehaviorFN_${behaviorNamePascal}`,
  outfile: outfile,
  platform: "browser",
  target: "es2020",
  minify: false,
  sourcemap: true,
  external: [], // ❌ TypeBox should be here or handled differently
});
```

## Proposed Solution

### Option A: esbuild Plugin (Recommended)

Create an esbuild plugin that intercepts TypeBox imports and replaces them with inlined schemas:

```typescript
const inlineTypeBoxPlugin: esbuild.Plugin = {
  name: 'inline-typebox',
  setup(build) {
    // Intercept @sinclair/typebox imports
    build.onResolve({ filter: /@sinclair\/typebox/ }, args => {
      return { path: args.path, namespace: 'typebox-stub' };
    });

    build.onLoad({ filter: /.*/, namespace: 'typebox-stub' }, async () => {
      // Return a stub that provides Type.Object, Type.String, etc.
      // But doesn't do runtime validation - just for building schemas
      return {
        contents: `
          export const Type = {
            Object: (props) => ({ type: 'object', properties: props }),
            String: (opts) => ({ type: 'string', ...opts }),
            Number: (opts) => ({ type: 'number', ...opts }),
            Boolean: (opts) => ({ type: 'boolean', ...opts }),
            Optional: (schema) => schema,
            Literal: (value) => ({ type: 'string', const: value }),
            Union: (schemas) => ({ anyOf: schemas }),
            Array: (schema) => ({ type: 'array', items: schema }),
          };
        `,
        loader: 'js'
      };
    });
  }
};
```

Then use in build:
```typescript
await build({
  // ... existing config
  plugins: [inlineTypeBoxPlugin],
});
```

### Option B: Pre-process Schema Files

Transform schema files before building:
1. Import schema.ts with jiti
2. Serialize schema to JSON
3. Write temporary `schema.json.ts` file with inlined object
4. Point build to use `schema.json.ts` instead of `schema.ts`
5. Clean up temp files after build

### Option C: Mark TypeBox as External + Provide Global

```typescript
await build({
  // ... existing config
  external: ['@sinclair/typebox'],
  inject: ['./scripts/typebox-shim.js'], // Provides window.TypeBox stub
});
```

Create `typebox-shim.js` that provides minimal Type builder for browsers.

## Recommended Approach

**Use Option A (esbuild Plugin)** because:
- ✅ Clean - no temp files
- ✅ Integrated - part of build process
- ✅ Maintainable - centralized logic
- ✅ Tested - esbuild plugins are well-documented

## Implementation Steps

1. **Create the plugin** in `scripts/build-cdn.ts`
   - Intercept TypeBox imports
   - Provide stub that builds plain objects
   - Test with one behavior first

2. **Add plugin to build configs**
   - IIFE builds
   - ESM builds
   - Test outputs

3. **Verify bundles**
   - Check for `require("@sinclair/typebox")` (should be gone)
   - Test in browser
   - Verify schemas still work

4. **Update metadata injection**
   - `extractSchemaMetadata` output should still work
   - Metadata in `window.BehaviorFN.behaviorMetadata`

5. **Test all behaviors**
   - Build all CDN bundles
   - Test each in browser
   - Verify auto-loader works

## Definition of Done

- [ ] CDN bundles contain no `require("@sinclair/typebox")`
- [ ] Schemas inlined as plain JSON Schema objects
- [ ] All behavior bundles load in browser without errors
- [ ] Observed attributes still extracted correctly
- [ ] `window.BehaviorFN.behaviorMetadata` populated
- [ ] Chat demo works with real CDN bundles
- [ ] All existing CDN examples still work
- [ ] Build script tests added/updated
- [ ] Documentation updated if needed
- [ ] **User Review**: Changes verified and commit authorized

## Testing Plan

### Manual Test
```bash
# Build CDN bundles
pnpm build:cdn

# Check for TypeBox requires
grep -r "require.*typebox" dist/cdn/

# Should return nothing! ✅

# Test in browser
cd examples/chat-demo
node server.js
# Open http://localhost:3000
# Should work without TypeBox errors ✅
```

### Automated Test
Add test in `scripts/build-cdn.test.ts` (if doesn't exist, create):
```typescript
test('CDN bundles do not contain TypeBox requires', async () => {
  const files = await glob('dist/cdn/*.js');
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    expect(content).not.toMatch(/require.*typebox/);
  }
});
```

## Dependencies

None - this is a build/infrastructure task.

## Related Issues

- Blocks: Chat demo functionality
- Enables: Real-world testing of array swap strategies
- Enables: Real-world testing of fallback operators

## Notes

The code already TRIES to do this (see `extractSchemaMetadata`), but the esbuild configuration doesn't prevent TypeBox from being bundled. The plugin approach will intercept imports at build time and replace them.

**Alternative considered:** Just bundle TypeBox (~40KB). But this defeats the purpose of the lightweight CDN approach and is unnecessary since schemas can be inlined.
