# Why We Use Jiti

## TL;DR

We use `jiti` to dynamically import TypeScript schema files at runtime during the CLI installation process. After exploring alternatives, jiti remains the simplest and most reliable solution.

## The Problem

The CLI needs to perform **two different operations** with registry schema files:

1. **Read as Text**: Read the TypeScript source code as a string to copy/transform it for the user's project
2. **Import as Module**: Import the schema object to inspect its runtime structure for transformation

```typescript
// Example: Installing a behavior with Zod
// Step 1: Read source
const tsSource = fs.readFileSync('registry/behaviors/compute/schema.ts', 'utf-8');
// Result: "import { Type } from '@sinclair/typebox';\n..."

// Step 2: Import object
const { schema } = await import('registry/behaviors/compute/schema.ts');
// Result: { type: 'object', properties: { formula: { type: 'string' } } }

// Step 3: Transform
const zodCode = transformToZod(schema, tsSource);
// Result: "import { z } from 'zod';\nexport const schema = z.object({ ... });"
```

The challenge is **Step 2**: Node.js cannot natively import TypeScript files.

## Why Not Remove Jiti?

We explored three alternatives:

### Alternative 1: Node.js Native TypeScript Support (v22+)

**Status:** Available in Node.js 22.6.0+ with `--experimental-strip-types`

**Why It Doesn't Work:**
```typescript
// This fails:
import { type InferSchema } from "../types";
//                                  ^^^^^^^^
// Error: Cannot find module '../types'
// Node requires explicit .ts extensions
```

Node's native TS support has critical limitations:
- ❌ Doesn't resolve extensionless imports (`from "../types"`)
- ❌ Doesn't use `tsconfig.json` path mappings
- ❌ Requires explicit `.ts` extensions in all imports
- ❌ Still experimental (flags required)

**To make it work, we'd need to:**
1. Update all registry imports to use explicit `.ts` extensions
2. Update the shebang: `#!/usr/bin/env node --experimental-strip-types --no-warnings`
3. Accept experimental flag dependency
4. Accept breaking changes in future Node versions

**Trade-off:** More work for uncertain future stability.

### Alternative 2: Dual Build (Source + Compiled)

**Approach:** Keep TypeScript source AND compile to JavaScript

```
dist/
├── index.js                    # Compiled CLI
├── registry-source/            # Raw TypeScript (for reading/copying)
│   └── behaviors/
│       └── compute/
│           └── schema.ts       # Read this as text
└── registry-compiled/          # Compiled JavaScript (for importing)
    └── behaviors/
        └── compute/
            └── schema.js       # Import this as module
```

**Build Script:**
```json
"build": "tsup index.ts --format esm --clean && cp -r registry dist/registry-source && tsup 'registry/**/*.ts' --outDir dist/registry-compiled --format esm && chmod +x dist/index.js"
```

**Why It Doesn't Work Well:**

**Pros:**
- ✅ No runtime dependencies
- ✅ Native ESM imports
- ✅ Faster (no runtime compilation)

**Cons:**
- ❌ **Duplication**: Registry exists in two forms (~2x size)
- ❌ **Complexity**: Two separate build operations
- ❌ **Maintenance**: More paths to manage in code
- ❌ **Size**: ~250KB vs ~100KB with jiti
- ❌ **Build Time**: Longer build process

**Example Code Changes:**
```typescript
// Read source for copying
const sourcePath = path.join(__dirname, "registry-source/behaviors", file.path);
const content = fs.readFileSync(sourcePath, "utf-8");

// Import compiled for transformation
const jsPath = file.path.replace(/\.ts$/, '.js');
const compiledPath = path.join(__dirname, "registry-compiled/behaviors", jsPath);
const mod = await import(compiledPath);
```

**Trade-off:** Significant complexity increase for minimal benefit.

### Alternative 3: Static AST Parsing

**Approach:** Parse TypeScript source with the TypeScript compiler API instead of importing

```typescript
import ts from 'typescript';

// Parse schema.ts and extract structure
const sourceFile = ts.createSourceFile('schema.ts', content, ts.ScriptTarget.Latest);
// Walk AST to find schema definition...
```

**Why It Doesn't Work Well:**

**Pros:**
- ✅ No runtime imports needed
- ✅ No duplication

**Cons:**
- ❌ **Most Complex**: Requires full AST traversal logic
- ❌ **Fragile**: Breaks if schema definition patterns change
- ❌ **Maintenance**: Hard to understand and debug
- ❌ **Limited**: Can't handle dynamic schema construction
- ❌ **Heavy**: TypeScript compiler API is large

**Trade-off:** Extreme complexity for no real benefit.

## Why Jiti Is The Right Choice

**What jiti does:**
```typescript
import { createJiti } from "jiti";

const jiti = createJiti(__filename);

// Import TypeScript files directly - just works!
const mod = await jiti.import('./registry/behaviors/compute/schema.ts');
```

### Advantages

1. **Simple**: One-line solution
2. **Reliable**: Handles all TypeScript features correctly
3. **Maintained**: Active project with good support
4. **Small**: Only ~2.6MB (less than TypeScript compiler)
5. **Fast Enough**: Runtime overhead is minimal for CLI usage
6. **Battle-Tested**: Used by Nuxt, Vite, and many other projects

### Build Configuration

```json
{
  "scripts": {
    "build": "tsup index.ts --format esm --clean --external jiti --onSuccess \"cp -r registry dist/ && chmod +x dist/index.js\""
  },
  "dependencies": {
    "jiti": "^2.6.1"
  }
}
```

**Key Details:**
- `--external jiti`: Don't bundle jiti (reduces dist from 252KB to 27KB)
- `jiti` in dependencies (not devDependencies): It's used at runtime
- Copy raw TypeScript files to dist: Users get TypeScript source

### Performance Impact

**CLI Usage Pattern:**
- User runs: `behavior-fn add compute`
- Imports 1-3 schema files per behavior
- One-time operation per behavior installation
- Total overhead: <100ms

**Trade-off:** 100ms runtime overhead vs significant build/maintenance complexity.

## Decision

**We keep jiti** because:
- ✅ It's the simplest solution that works correctly
- ✅ Runtime overhead is negligible for CLI usage
- ✅ It's a well-maintained, battle-tested library
- ✅ Alternatives add significant complexity without meaningful benefits
- ✅ Users don't care about implementation details - they want a working CLI

## Future Considerations

**If Node.js native TypeScript support improves:**
- When extensionless imports are supported
- When path mapping resolution works
- When it's no longer experimental

**Then we can reconsider**, but as of Node.js v24 (Feb 2025), it's not ready.

## Related

- **Task Discussion**: [docs/tasks/remove-jiti-build-registry/task.md](../tasks/remove-jiti-build-registry/task.md)
- **Jiti Documentation**: https://github.com/unjs/jiti
- **Node.js TypeScript Support**: https://nodejs.org/api/typescript.html
