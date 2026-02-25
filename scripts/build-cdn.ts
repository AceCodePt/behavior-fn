#!/usr/bin/env node
/**
 * Build CDN bundles for BehaviorFN
 * 
 * Core + Behavior Modules Architecture:
 * 1. Core runtime (behavior-fn-core.js) - Standalone, required
 * 2. Individual behavior bundles (reveal.js, request.js, etc.) - Depend on core
 * 3. Optional auto-loader (auto-loader.js) - Depends on core, opt-in convenience
 * 
 * Key Strategies:
 * - Transform TypeBox schemas to JSON Schema to avoid bundling TypeBox (~40KB)
 * - Behaviors check for core at load time and fail gracefully if missing
 * - Eliminates registry isolation by using shared global BehaviorFN
 */

import { build, type Plugin } from "esbuild";
import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(__dirname, "..");
const registryDir = join(rootDir, "registry", "behaviors");
const cdnOutDir = join(rootDir, "dist", "cdn");

// Initialize jiti for runtime TypeScript imports
const jiti = createJiti(__filename);

/**
 * esbuild plugin to stub TypeBox imports for CDN builds.
 * 
 * This plugin intercepts @sinclair/typebox imports and provides a minimal
 * stub that builds plain JSON Schema objects instead of TypeBox schemas.
 * This eliminates the runtime TypeBox dependency (~40KB) from CDN bundles.
 */
const inlineTypeBoxPlugin: Plugin = {
  name: "inline-typebox",
  setup(build) {
    // Intercept TypeBox imports
    build.onResolve({ filter: /@sinclair\/typebox/ }, (args) => {
      return { path: args.path, namespace: "typebox-stub" };
    });

    // Provide stub implementation that builds plain JSON Schema objects
    build.onLoad({ filter: /.*/, namespace: "typebox-stub" }, async () => {
      return {
        contents: `
          // Minimal TypeBox stub for CDN builds
          // Builds plain JSON Schema objects instead of TypeBox schemas
          export const Type = {
            Object: (props, opts = {}) => ({ 
              type: 'object', 
              properties: props,
              ...opts 
            }),
            String: (opts = {}) => ({ type: 'string', ...opts }),
            Number: (opts = {}) => ({ type: 'number', ...opts }),
            Integer: (opts = {}) => ({ type: 'integer', ...opts }),
            Boolean: (opts = {}) => ({ type: 'boolean', ...opts }),
            Null: (opts = {}) => ({ type: 'null', ...opts }),
            Array: (items, opts = {}) => ({ type: 'array', items, ...opts }),
            Tuple: (items, opts = {}) => ({ type: 'array', items, ...opts }),
            Optional: (schema) => schema,
            Literal: (value, opts = {}) => ({ 
              type: typeof value, 
              const: value,
              ...opts 
            }),
            Union: (schemas, opts = {}) => ({ anyOf: schemas, ...opts }),
            Intersect: (schemas, opts = {}) => ({ allOf: schemas, ...opts }),
            Record: (key, value, opts = {}) => ({ 
              type: 'object', 
              additionalProperties: value,
              ...opts 
            }),
            Any: (opts = {}) => ({ ...opts }),
            Unknown: (opts = {}) => ({ ...opts }),
            Never: (opts = {}) => ({ not: {}, ...opts }),
            Enum: (values, opts = {}) => ({ 
              enum: Object.values(values),
              ...opts 
            }),
            Ref: (ref, opts = {}) => ({ $ref: ref, ...opts }),
          };
          
          // Export common type utilities (no-op for stub)
          export const Kind = Symbol.for('TypeBox.Kind');
          export const Hint = Symbol.for('TypeBox.Hint');
        `,
        loader: "js",
      };
    });
  },
};

interface BuildTarget {
  name: string;
  entry: string;
  outfile: string;
  globalName: string;
  exportName?: string;
}

/**
 * Load a TypeBox schema and convert it to plain JSON Schema.
 * Also extracts observed attributes.
 * This avoids bundling TypeBox (~40KB) in CDN builds.
 */
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
    // TypeBox schemas have a 'properties' object
    const observedAttributes = schema.properties 
      ? Object.keys(schema.properties)
      : [];
    
    // Convert TypeBox schema to plain JSON Schema object
    // TypeBox schemas are already JSON Schema compatible
    const jsonSchema = JSON.parse(JSON.stringify(schema));
    
    return { observedAttributes, jsonSchema };
  } catch (error) {
    console.warn(`  ⚠️  Could not extract schema for ${behaviorName}:`, error);
    return null;
  }
}

async function buildCDNBundles() {
  console.log("🏗️  Building CDN bundles (Core + Behavior Modules)...\n");

  await mkdir(cdnOutDir, { recursive: true });

  // Get all behavior directories
  const entries = await readdir(registryDir, { withFileTypes: true });
  const behaviorDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  console.log(`Found ${behaviorDirs.length} behaviors:\n- ${behaviorDirs.join("\n- ")}\n`);

  // Phase 1: Build Core Runtime (Standalone)
  console.log("📦 Phase 1: Building standalone core runtime...");
  await buildCore();

  // Phase 2: Build Individual Behaviors (Depend on Core)
  console.log("\n📦 Phase 2: Building behavior modules (require core)...");
  await buildIndividualBehaviors(behaviorDirs);

  // Phase 3: Build Auto-Loader (Depends on Core)
  console.log("\n📦 Phase 3: Building auto-loader (requires core)...");
  await buildAutoLoader();

  // Phase 4: Generate Examples
  console.log("\n📦 Phase 4: Generating examples...");
  await generateCDNExamples(behaviorDirs);

  console.log("\n✅ All CDN bundles built successfully!");
  console.log(`📂 Output directory: ${cdnOutDir}`);
  console.log("\n📘 Loading Pattern (Core + Behaviors):");
  console.log("  <script src='behavior-fn-core.js'></script>  <!-- Required first! -->");
  console.log("  <script src='reveal.js'></script>");
  console.log("  <script src='request.js'></script>");
  console.log("\n📘 With Auto-Loader:");
  console.log("  <script src='behavior-fn-core.js'></script>  <!-- Required first! -->");
  console.log("  <script src='reveal.js'></script>");
  console.log("  <script src='auto-loader.js'></script>      <!-- Auto-enables -->");
}

/**
 * Build the core runtime bundle.
 * Contains: behavior-registry, behavioral-host, behavior-utils, types, event-methods
 * Size: ~5-8KB minified (~2-3KB gzipped)
 */
async function buildCore() {
  const coreEntry = join(cdnOutDir, "_core-entry.js");
  
  const coreCode = `
// Import core runtime modules
import { registerBehavior, getBehavior } from "${join(registryDir, "behavior-registry.ts")}";
import { defineBehavioralHost } from "${join(registryDir, "behavioral-host.ts")}";
import { parseBehaviorNames, getObservedAttributes } from "${join(registryDir, "behavior-utils.ts")}";

// Setup global namespace
if (typeof window !== 'undefined') {
  window.BehaviorFN = {
    registerBehavior,
    getBehavior,
    defineBehavioralHost,
    parseBehaviorNames,
    getObservedAttributes,
    version: '0.2.0',
  };
  
  // Expose core functions globally for convenience
  window.registerBehavior = registerBehavior;
  window.getBehavior = getBehavior;
  window.defineBehavioralHost = defineBehavioralHost;
  
  console.log('✅ BehaviorFN Core v0.2.0 loaded');
}
`;

  await writeFile(coreEntry, coreCode);

  // Build IIFE version
  await build({
    entryPoints: [coreEntry],
    bundle: true,
    format: "iife",
    globalName: "BehaviorFN",
    outfile: join(cdnOutDir, "behavior-fn-core.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    plugins: [inlineTypeBoxPlugin],
  });

  console.log(`  ✅ behavior-fn-core.js (IIFE)`);

  // Build ESM version
  await build({
    entryPoints: [coreEntry],
    bundle: true,
    format: "esm",
    outfile: join(cdnOutDir, "behavior-fn-core.esm.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    plugins: [inlineTypeBoxPlugin],
  });

  console.log(`  ✅ behavior-fn-core.esm.js (ESM)`);
}

/**
 * Build individual behavior bundles.
 * Each bundle checks for core and auto-registers the behavior.
 */
async function buildIndividualBehaviors(behaviorDirs: string[]) {
  for (const behaviorName of behaviorDirs) {
    const behaviorPath = join(registryDir, behaviorName, "behavior.ts");
    
    let content: string;
    try {
      content = await readFile(behaviorPath, "utf-8");
    } catch (error) {
      console.warn(`  ⚠️  ${behaviorName}/behavior.ts not found, skipping...`);
      continue;
    }
    
    // Discover export name
    const match = content.match(/export\s+const\s+(\w+(?:BehaviorFactory|Behavior))\s*[:=]/);
    const exportName = match ? match[1] : null;
    
    if (!exportName) {
      console.warn(`  ⚠️  Could not find export in ${behaviorName}/behavior.ts, skipping...`);
      continue;
    }

    // Extract schema metadata (converts TypeBox to JSON Schema, extracts observedAttributes)
    const schemaMeta = await extractSchemaMetadata(behaviorName);
    const observedAttributes = schemaMeta?.observedAttributes || [];
    const jsonSchema = schemaMeta?.jsonSchema || {};

    // Create behavior entry that depends on core
    const behaviorEntry = join(cdnOutDir, `_${behaviorName}-entry.js`);
    const behaviorCode = `
// Import behavior (will be bundled)
import { ${exportName} } from "${behaviorPath}";

// Check if BehaviorFN core is loaded
if (typeof window === 'undefined' || !window.BehaviorFN) {
  const error = '[BehaviorFN] Core not loaded! Load behavior-fn-core.js before ${behaviorName}.js';
  console.error(error);
  console.error('[BehaviorFN] Expected: <script src="behavior-fn-core.js"></script>');
  throw new Error(error);
}

// Observed attributes extracted from TypeBox schema (plain array, no TypeBox needed)
const observedAttributes = ${JSON.stringify(observedAttributes)};

// JSON Schema (plain object, converted from TypeBox)
const jsonSchema = ${JSON.stringify(jsonSchema, null, 2)};

// Auto-register this behavior using the global BehaviorFN
window.BehaviorFN.registerBehavior('${behaviorName}', ${exportName});

// Store metadata for this behavior
if (!window.BehaviorFN.behaviorMetadata) {
  window.BehaviorFN.behaviorMetadata = {};
}
window.BehaviorFN.behaviorMetadata['${behaviorName}'] = {
  observedAttributes,
  schema: jsonSchema,
};

console.log('✅ BehaviorFN: Registered "${behaviorName}" behavior');
`;

    await writeFile(behaviorEntry, behaviorCode);

    // Build IIFE version (no core bundled)
    await build({
      entryPoints: [behaviorEntry],
      bundle: true,
      format: "iife",
      globalName: `BehaviorFN_${toPascalCase(behaviorName)}`,
      outfile: join(cdnOutDir, `${behaviorName}.js`),
      platform: "browser",
      target: "es2020",
      minify: true,
      sourcemap: true,
      plugins: [inlineTypeBoxPlugin],
    });

    console.log(`  ✅ ${behaviorName}.js (IIFE, requires core)`);

    // Build ESM version (no core bundled)
    await build({
      entryPoints: [behaviorEntry],
      bundle: true,
      format: "esm",
      outfile: join(cdnOutDir, `${behaviorName}.esm.js`),
      platform: "browser",
      target: "es2020",
      minify: true,
      sourcemap: true,
      plugins: [inlineTypeBoxPlugin],
    });

    console.log(`  ✅ ${behaviorName}.esm.js (ESM, requires core)`);
  }
}

/**
 * Build the optional auto-loader module.
 * Depends on core being loaded first. Auto-enables when loaded via script tag.
 */
async function buildAutoLoader() {
  const autoLoaderEntry = join(cdnOutDir, "_auto-loader-entry.js");
  
  const autoLoaderCode = `
// Import auto-loader (will be bundled)
import { enableAutoLoader } from "${join(registryDir, "auto-loader.ts")}";

// Check if BehaviorFN core is loaded
if (typeof window === 'undefined' || !window.BehaviorFN) {
  const error = '[BehaviorFN] Core not loaded! Load behavior-fn-core.js before auto-loader.js';
  console.error(error);
  console.error('[BehaviorFN] Expected: <script src="behavior-fn-core.js"></script>');
  throw new Error(error);
}

// Expose and enable auto-loader
window.BehaviorFN.enableAutoLoader = enableAutoLoader;
window.enableAutoLoader = enableAutoLoader;

// Automatically enable when loaded via script tag
enableAutoLoader();

console.log('✅ BehaviorFN: Auto-loader enabled');
`;

  await writeFile(autoLoaderEntry, autoLoaderCode);

  // Build IIFE version
  await build({
    entryPoints: [autoLoaderEntry],
    bundle: true,
    format: "iife",
    globalName: "BehaviorFN_AutoLoader",
    outfile: join(cdnOutDir, "auto-loader.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    plugins: [inlineTypeBoxPlugin],
  });

  console.log(`  ✅ auto-loader.js (IIFE, requires core)`);

  // Build ESM version
  await build({
    entryPoints: [autoLoaderEntry],
    bundle: true,
    format: "esm",
    outfile: join(cdnOutDir, "auto-loader.esm.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    plugins: [inlineTypeBoxPlugin],
  });

  console.log(`  ✅ auto-loader.esm.js (ESM, requires core)`);
}

/**
 * Generate CDN usage examples
 */
async function generateCDNExamples(behaviorDirs: string[]) {
  const exampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BehaviorFN v0.2.0 - Opt-In Loading Examples</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #2563eb; }
    h2 { margin-top: 40px; color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    h3 { color: #1e40af; margin-top: 30px; }
    pre {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      border-left: 4px solid #2563eb;
    }
    code { font-family: 'Courier New', monospace; font-size: 14px; }
    .example {
      margin: 30px 0;
      padding: 20px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: #fafafa;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .note strong { color: #92400e; }
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      margin: 5px;
    }
    button:hover {
      background: #1d4ed8;
    }
    dialog {
      padding: 30px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      min-width: 300px;
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .badge.new { background: #dcfce7; color: #166534; }
    .badge.breaking { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>🎯 BehaviorFN v0.2.0 <span class="badge breaking">BREAKING</span></h1>
  <p><strong>Opt-In Loading Architecture</strong> - Load only what you need!</p>

  <div class="note">
    <strong>🔥 Breaking Change from v0.1.x:</strong> The all-in-one bundle (<code>behavior-fn.all.js</code>) has been <strong>completely removed</strong>.
    <br><br>
    <strong>Why?</strong> v0.1.6 forced you to load 72KB (20KB gzipped) to use one behavior. v0.2.0 lets you load only what you need: 1.9KB to 5.5KB gzipped per behavior.
  </div>

  <h2>🚀 Quick Start</h2>
  
  <h3>Option 1: Auto-Loader (Recommended - 2 Script Tags)</h3>
  <pre><code>&lt;!-- 1. Load behavior (includes core runtime) --&gt;
&lt;script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"&gt;&lt;/script&gt;

&lt;!-- 2. Load auto-loader (auto-registers hosts) --&gt;
&lt;script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js"&gt;&lt;/script&gt;

&lt;!-- Clean HTML (auto-loader adds is attribute) --&gt;
&lt;dialog behavior="reveal" id="my-modal"&gt;
  &lt;h2&gt;Hello!&lt;/h2&gt;
  &lt;button commandfor="my-modal" command="--hide"&gt;Close&lt;/button&gt;
&lt;/dialog&gt;

&lt;button commandfor="my-modal" command="--toggle"&gt;Open Modal&lt;/button&gt;</code></pre>
  <p><strong>Total:</strong> 14.4KB minified (5.5KB gzipped) - 73% smaller than v0.1.6!</p>

  <h3>Option 2: Manual Host (Smallest - 1 Tag + 1 Script Block)</h3>
  <pre><code>&lt;!-- 1. Load behavior --&gt;
&lt;script src="https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js"&gt;&lt;/script&gt;

&lt;!-- 2. Define host manually --&gt;
&lt;script&gt;
  const meta = BehaviorFN.behaviorMetadata['reveal'];
  BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', meta.observedAttributes);
&lt;/script&gt;

&lt;!-- Must use explicit is attribute --&gt;
&lt;dialog is="behavioral-reveal" behavior="reveal" id="my-modal"&gt;
  &lt;h2&gt;Hello!&lt;/h2&gt;
  &lt;button commandfor="my-modal" command="--hide"&gt;Close&lt;/button&gt;
&lt;/dialog&gt;

&lt;button commandfor="my-modal" command="--toggle"&gt;Open Modal&lt;/button&gt;</code></pre>
  <p><strong>Total:</strong> 8.7KB minified (3.2KB gzipped) - 84% smaller than v0.1.6!</p>

  <h2>📦 Available Bundles</h2>
  
  <h3>Individual Behaviors (Self-Contained)</h3>
  <p>Each includes: Core runtime + Behavior logic + JSON Schema + observedAttributes</p>

  <h3>Individual Behaviors</h3>
  <ul>
${behaviorDirs.map(name => `    <li><code>${name}.js</code> / <code>${name}.esm.js</code></li>`).join("\n")}
  </ul>

  <h3>Auto-Loader (Optional) <span class="badge new">NEW</span></h3>
  <ul>
    <li><code>auto-loader.js</code> - Opt-in convenience (~5KB)</li>
    <li><code>auto-loader.esm.js</code> - ESM version</li>
  </ul>

  <h2>🎨 Live Example</h2>
  <div class="example">
    <h3>Reveal Behavior Demo</h3>
    <button commandfor="demo-modal" command="--toggle">
      Open Modal
    </button>
    
    <dialog is="behavioral-reveal" id="demo-modal" behavior="reveal">
      <h2>🎉 It Works!</h2>
      <p>This modal uses the <code>reveal</code> behavior loaded from CDN!</p>
      <button commandfor="demo-modal" command="--hide">Close</button>
    </dialog>
  </div>

  <h2>📖 Loading Patterns</h2>

  <h3>Pattern 1: Explicit (Recommended)</h3>
  <p><strong>Best for:</strong> Production apps, maximum control, smallest size</p>
  <pre><code>&lt;!-- 1. Load core --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt;

&lt;!-- 2. Load behaviors --&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;

&lt;!-- 3. Use explicit is attributes --&gt;
&lt;dialog is="behavioral-reveal" behavior="reveal"&gt;...&lt;/dialog&gt;</code></pre>
  <ul>
    <li>✅ Smallest bundle size</li>
    <li>✅ No MutationObserver overhead</li>
    <li>✅ Most explicit and predictable</li>
    <li>✅ Best performance</li>
  </ul>

  <h3>Pattern 2: Auto-Loader (Convenience)</h3>
  <p><strong>Best for:</strong> Prototypes, content-heavy sites, quick demos</p>
  <pre><code>&lt;!-- 1. Load core --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt;

&lt;!-- 2. Load behaviors --&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;
&lt;script src="request.js"&gt;&lt;/script&gt;

&lt;!-- 3. Load and enable auto-loader --&gt;
&lt;script src="auto-loader.js"&gt;&lt;/script&gt;
&lt;script&gt;BehaviorFN.enableAutoLoader();&lt;/script&gt;

&lt;!-- 4. Omit is attributes --&gt;
&lt;dialog behavior="reveal"&gt;...&lt;/dialog&gt;</code></pre>
  <ul>
    <li>✅ Cleaner HTML</li>
    <li>✅ Closer to Alpine.js/HTMX DX</li>
    <li>⚠️ Adds ~5KB + MutationObserver overhead</li>
    <li>⚠️ Requires explicit enablement</li>
  </ul>

  <h2>🔄 Migration from v0.1.x</h2>

  <h3>If you used <code>behavior-fn.all.js</code>:</h3>
  <pre><code>&lt;!-- ❌ OLD (v0.1.x) --&gt;
&lt;script src="behavior-fn.all.js"&gt;&lt;/script&gt;
&lt;dialog behavior="reveal"&gt;...&lt;/dialog&gt;

&lt;!-- ✅ NEW (v0.2.0) - Option 1: Explicit --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;
&lt;dialog is="behavioral-reveal" behavior="reveal"&gt;...&lt;/dialog&gt;

&lt;!-- ✅ NEW (v0.2.0) - Option 2: Auto-loader --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;
&lt;script src="auto-loader.js"&gt;&lt;/script&gt;
&lt;script&gt;BehaviorFN.enableAutoLoader();&lt;/script&gt;
&lt;dialog behavior="reveal"&gt;...&lt;/dialog&gt;</code></pre>

  <h3>If you used individual bundles:</h3>
  <pre><code>&lt;!-- ❌ OLD (v0.1.x) - bundles included core --&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;
&lt;script src="auto-loader.js"&gt;&lt;/script&gt; &lt;!-- auto-enabled --&gt;

&lt;!-- ✅ NEW (v0.2.0) - explicit core, explicit enable --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt; &lt;!-- NEW: explicit core --&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;
&lt;script src="auto-loader.js"&gt;&lt;/script&gt;
&lt;script&gt;BehaviorFN.enableAutoLoader();&lt;/script&gt; &lt;!-- NEW: explicit call --&gt;</code></pre>

  <h2>❓ FAQ</h2>

  <h3>Q: Why was the all-in-one bundle removed?</h3>
  <p><strong>A:</strong> To encourage intentional loading and better performance. Users should only load what they need, not bundle everything by default.</p>

  <h3>Q: Do I need the auto-loader?</h3>
  <p><strong>A:</strong> No! Use explicit <code>is</code> attributes for better performance. Auto-loader is a convenience feature for prototyping.</p>

  <h3>Q: What's the load order?</h3>
  <p><strong>A:</strong> Always load in this order:</p>
  <ol>
    <li>Core (<code>behavior-fn-core.js</code>)</li>
    <li>Behaviors (<code>reveal.js</code>, etc.)</li>
    <li>Auto-loader (optional, <code>auto-loader.js</code>)</li>
    <li>Enable auto-loader (optional, <code>BehaviorFN.enableAutoLoader()</code>)</li>
  </ol>

  <h3>Q: Can I use ESM imports?</h3>
  <p><strong>A:</strong> Yes! All bundles have <code>.esm.js</code> versions:</p>
  <pre><code>import { registerBehavior } from 'behavior-fn/dist/cdn/behavior-fn-core.esm.js';
import { revealBehaviorFactory } from 'behavior-fn/dist/cdn/reveal.esm.js';</code></pre>

  <h2>📚 Resources</h2>
  <ul>
    <li><a href="https://github.com/AceCodePt/behavior-fn">GitHub Repository</a></li>
    <li><a href="https://github.com/AceCodePt/behavior-fn/blob/main/README.md">Documentation</a></li>
    <li><a href="https://github.com/AceCodePt/behavior-fn/issues">Report Issues</a></li>
  </ul>

  <!-- Load BehaviorFN for this demo -->
  <script>
    // Inline implementation for demo purposes
    window.BehaviorFN = {
      behaviorRegistry: new Map(),
      
      registerBehavior(name, factory) {
        this.behaviorRegistry.set(name, factory);
      },
      
      getBehavior(name) {
        return this.behaviorRegistry.get(name);
      },
      
      defineBehavioralHost(tagName, customElementName) {
        if (customElements.get(customElementName)) return;
        
        customElements.define(customElementName, class extends HTMLElement {
          constructor() {
            super();
            this._behaviors = new Map();
            this._cleanupFns = [];
          }
          
          connectedCallback() {
            const behaviorAttr = this.getAttribute("behavior");
            if (!behaviorAttr) return;
            
            const behaviorNames = behaviorAttr.trim().split(/\\s+/);
            
            behaviorNames.forEach(name => {
              const factory = BehaviorFN.getBehavior(name);
              if (!factory) return;
              
              const behavior = factory(this);
              this._behaviors.set(name, behavior);
              behavior.connectedCallback?.();
              
              Object.keys(behavior).forEach(prop => {
                if (/^on[A-Z]/.test(prop) && typeof behavior[prop] === 'function') {
                  const eventName = prop.substring(2).toLowerCase();
                  const handler = behavior[prop].bind(behavior);
                  this.addEventListener(eventName, handler);
                  this._cleanupFns.push(() => {
                    this.removeEventListener(eventName, handler);
                  });
                }
              });
            });
          }
        }, { extends: tagName });
      },
    };
    
    // Register reveal behavior
    BehaviorFN.registerBehavior('reveal', (el) => {
      const isDialog = () => el.tagName === 'DIALOG';
      
      return {
        onCommand(e) {
          const command = e.detail?.command || e.command;
          
          switch (command) {
            case '--show':
              isDialog() ? el.showModal() : (el.hidden = false);
              break;
            case '--hide':
              isDialog() ? el.close() : (el.hidden = true);
              break;
            case '--toggle':
              if (isDialog()) {
                el.open ? el.close() : el.showModal();
              } else {
                el.hidden = !el.hidden;
              }
              break;
          }
        },
      };
    });
    
    // Initialize host
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal');
    
    console.log('✅ BehaviorFN demo loaded');
  </script>
</body>
</html>`;

  await writeFile(join(cdnOutDir, "index.html"), exampleHTML);
  console.log(`  ✅ index.html (examples)`);
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// Run the build
buildCDNBundles().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
