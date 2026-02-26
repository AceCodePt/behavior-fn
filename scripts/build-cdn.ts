#!/usr/bin/env node
/**
 * Build CDN bundles for BehaviorFN (ESM Only)
 * 
 * ESM Module Architecture:
 * 1. Core runtime (behavior-fn-core.js) - Exports core functions (registerBehavior, etc.)
 * 2. Individual behavior bundles (reveal.js, request.js, etc.) - Export factory functions
 * 3. Optional auto-loader (auto-loader.js) - Exports enableAutoLoader function
 * 
 * Key Strategies:
 * - Transform TypeBox schemas to JSON Schema to avoid bundling TypeBox (~40KB)
 * - Use real ESM imports/exports (no IIFE, no window assignments)
 * - Eliminates registry isolation through natural ES module singleton sharing
 * - All bundles are ESM format for modern browsers (ES2020+)
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
  console.log("🏗️  Building CDN bundles (ESM Only - Core + Behavior Modules)...\n");

  await mkdir(cdnOutDir, { recursive: true });

  // Get all behavior directories
  const entries = await readdir(registryDir, { withFileTypes: true });
  const behaviorDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  console.log(`Found ${behaviorDirs.length} behaviors:\n- ${behaviorDirs.join("\n- ")}\n`);

  // Phase 1: Build Core Runtime (ESM)
  console.log("📦 Phase 1: Building core runtime (ESM)...");
  await buildCore();

  // Phase 2: Build Individual Behaviors (ESM)
  console.log("\n📦 Phase 2: Building behavior modules (ESM)...");
  await buildIndividualBehaviors(behaviorDirs);

  // Phase 3: Build Auto-Loader (ESM)
  console.log("\n📦 Phase 3: Building auto-loader (ESM)...");
  await buildAutoLoader();

  // Phase 4: Generate Examples
  console.log("\n📦 Phase 4: Generating examples...");
  await generateCDNExamples(behaviorDirs);

  console.log("\n✅ All CDN bundles built successfully! (ESM Only - Auto-Register)");
  console.log(`📂 Output directory: ${cdnOutDir}`);
  console.log("\n📘 Loading Pattern (Simplest - Auto-Register & Auto-Enable):");
  console.log("  <script type='module'>");
  console.log("    import { defineBehavioralHost } from './behavior-fn-core.js';");
  console.log("    import { metadata } from './reveal.js';  // Auto-registers!");
  console.log("    import './auto-loader.js';  // Auto-enables!");
  console.log("    ");
  console.log("    // Optional: Define hosts manually for best performance");
  console.log("    defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);");
  console.log("  </script>");
  console.log("\n📘 Simplest (Auto-Loader Only):");
  console.log("  <script type='module'>");
  console.log("    import './reveal.js';       // Auto-registers!");
  console.log("    import './auto-loader.js';  // Auto-enables!");
  console.log("  </script>");
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
import { registerBehavior, getBehavior, getBehaviorDef } from "${join(registryDir, "behavior-registry.ts")}";
import { defineBehavioralHost } from "${join(registryDir, "behavioral-host.ts")}";
import { parseBehaviorNames, getObservedAttributes } from "${join(registryDir, "behavior-utils.ts")}";

// Export all core functions as ESM
export { registerBehavior, getBehavior, getBehaviorDef, defineBehavioralHost, parseBehaviorNames, getObservedAttributes };

// Version info
export const version = '0.2.0';

// Log when loaded
console.log('✅ BehaviorFN Core v0.2.0 (ESM) loaded');
`;

  await writeFile(coreEntry, coreCode);

  // Build ESM version only
  await build({
    entryPoints: [coreEntry],
    bundle: true,
    format: "esm",
    outfile: join(cdnOutDir, "behavior-fn-core.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    plugins: [inlineTypeBoxPlugin],
  });

  console.log(`  ✅ behavior-fn-core.js (ESM)`);
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

    // Create behavior entry as ESM module with auto-registration
    const behaviorEntry = join(cdnOutDir, `_${behaviorName}-entry.js`);
    const behaviorCode = `
// Import core from built bundle (external - not bundled)
import { registerBehavior } from "./behavior-fn-core.js";

// Import behavior (will be bundled)
import { ${exportName} } from "${behaviorPath}";

// Export factory function
export { ${exportName} };

// Export metadata (observed attributes and JSON Schema)
export const metadata = {
  observedAttributes: ${JSON.stringify(observedAttributes)},
  schema: ${JSON.stringify(jsonSchema, null, 2)},
};

// Behavior definition for registration
const definition = {
  name: '${behaviorName}',
  schema: ${JSON.stringify(jsonSchema, null, 2)},
};

// Auto-register on import with definition (side-effect)
registerBehavior(definition, ${exportName});

// Log when loaded and registered
console.log('✅ BehaviorFN: Auto-registered "${behaviorName}" behavior');
`;

    await writeFile(behaviorEntry, behaviorCode);

    // Build ESM version only
    await build({
      entryPoints: [behaviorEntry],
      bundle: true,
      format: "esm",
      outfile: join(cdnOutDir, `${behaviorName}.js`),
      platform: "browser",
      target: "es2020",
      minify: true,
      sourcemap: true,
      external: [
        // Don't bundle core - it's imported from behavior-fn-core.js
        "./behavior-fn-core.js",
      ],
      plugins: [inlineTypeBoxPlugin],
    });

    console.log(`  ✅ ${behaviorName}.js (ESM)`);
  }
}

/**
 * Build the optional auto-loader module.
 * Auto-enables when imported (side-effect).
 */
async function buildAutoLoader() {
  const autoLoaderEntry = join(cdnOutDir, "_auto-loader-entry.js");
  
  const autoLoaderCode = `
// Import ALL dependencies from core bundle (external - not bundled)
import { getBehavior, getBehaviorDef, getObservedAttributes, defineBehavioralHost, parseBehaviorNames } from "./behavior-fn-core.js";

// Inline auto-loader logic (don't import auto-loader.ts - it imports registry which gets bundled!)
export function enableAutoLoader() {
  const upgraded = new WeakSet();
  const registeredHosts = new Set();

  function upgradeElement(el) {
    if (upgraded.has(el) || !(el instanceof HTMLElement)) return;
    
    if (el.hasAttribute('is')) {
      upgraded.add(el);
      return;
    }
    
    if (!el.hasAttribute('behavior')) {
      upgraded.add(el);
      return;
    }
    
    const behaviorAttr = el.getAttribute('behavior');
    const behaviorNames = parseBehaviorNames(behaviorAttr);
    
    if (behaviorNames.length === 0) {
      upgraded.add(el);
      return;
    }
    
    const hostName = \`behavioral-\${behaviorNames.join('-')}\`;
    const tagName = el.tagName.toLowerCase();
    
    if (!registeredHosts.has(hostName)) {
      if (customElements.get(hostName)) {
        registeredHosts.add(hostName);
      } else {
        const observedAttrs = [];
        let hasUnknown = false;
        
        for (const name of behaviorNames) {
          if (!getBehavior(name)) {
            console.warn(\`[AutoLoader] Unknown behavior "\${name}" on element:\`, el);
            hasUnknown = true;
            continue;
          }
          
          // Get observed attributes from behavior definition in registry
          const def = getBehaviorDef(name);
          if (def) {
            const attrs = getObservedAttributes(def.schema);
            for (const attr of attrs) {
              if (!observedAttrs.includes(attr)) {
                observedAttrs.push(attr);
              }
            }
          }
        }
        
        try {
          defineBehavioralHost(tagName, hostName, observedAttrs);
          registeredHosts.add(hostName);
        } catch (err) {
          console.error(\`[AutoLoader] Failed to register behavioral host "\${hostName}":\`, err);
          upgraded.add(el);
          return;
        }
      }
    }
    
    try {
      const newEl = document.createElement(tagName, { is: hostName });
      
      if (!newEl.hasAttribute('is')) {
        newEl.setAttribute('is', hostName);
      }
      
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (attr.name !== 'is') {
          newEl.setAttribute(attr.name, attr.value);
        }
      }
      
      while (el.firstChild) {
        newEl.appendChild(el.firstChild);
      }
      
      if (el.parentNode) {
        el.parentNode.replaceChild(newEl, el);
        upgraded.add(newEl);
        console.log(\`[AutoLoader] ✅ Upgraded <\${tagName}#\${newEl.id || '(no id)'}> to \${hostName}\`);
      } else {
        el.setAttribute('is', hostName);
        upgraded.add(el);
        console.warn('[AutoLoader] Element not in DOM, falling back to setAttribute:', el);
      }
    } catch (err) {
      console.error('[AutoLoader] ❌ Failed to upgrade element:', el, err);
      el.setAttribute('is', hostName);
      upgraded.add(el);
    }
  }
  
  function scanSubtree(root) {
    if (!(root instanceof Element)) return;
    
    upgradeElement(root);
    const elements = root.querySelectorAll('[behavior]');
    for (let i = 0; i < elements.length; i++) {
      upgradeElement(elements[i]);
    }
  }
  
  scanSubtree(document.documentElement);
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        scanSubtree(mutation.addedNodes[i]);
      }
    }
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  
  return () => {
    observer.disconnect();
  };
}

// Auto-enable when imported (side-effect)
enableAutoLoader();

// Log when loaded and enabled
console.log('✅ BehaviorFN: Auto-loader enabled automatically');
`;

  await writeFile(autoLoaderEntry, autoLoaderCode);

  // Build ESM version only
  await build({
    entryPoints: [autoLoaderEntry],
    bundle: true,
    format: "esm",
    outfile: join(cdnOutDir, "auto-loader.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    external: [
      // Don't bundle core - it's imported from behavior-fn-core.js
      "./behavior-fn-core.js",
    ],
    plugins: [inlineTypeBoxPlugin],
  });

  console.log(`  ✅ auto-loader.js (ESM)`);
}

/**
 * Generate CDN usage examples (ESM Only)
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

  <h2>🚀 Quick Start (ESM Only - Auto-Register)</h2>
  
  <h3>Option 1: Simplest (Auto-Loader - Recommended)</h3>
  <pre><code>&lt;script type="module"&gt;
  // Import auto-registers the behavior and auto-enables the loader!
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';
  import 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/auto-loader.js';
&lt;/script&gt;

&lt;!-- No is attribute needed with auto-loader --&gt;
&lt;dialog behavior="reveal" id="my-modal"&gt;
  &lt;h2&gt;Hello!&lt;/h2&gt;
  &lt;button commandfor="my-modal" command="--hide"&gt;Close&lt;/button&gt;
&lt;/dialog&gt;

&lt;button commandfor="my-modal" command="--toggle"&gt;Open Modal&lt;/button&gt;</code></pre>
  <p><strong>Total:</strong> ~17KB minified (~6KB gzipped) - Just 2 imports, everything automatic!</p>

  <h3>Option 2: Explicit (Best Performance)</h3>
  <pre><code>&lt;script type="module"&gt;
  import { defineBehavioralHost } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/behavior-fn-core.js';
  import { metadata } from 'https://unpkg.com/behavior-fn@0.2.0/dist/cdn/reveal.js';  // Auto-registers!
  
  // Define host manually for best performance
  defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
&lt;/script&gt;

&lt;!-- Must use explicit is attribute --&gt;
&lt;dialog is="behavioral-reveal" behavior="reveal" id="my-modal"&gt;
  &lt;h2&gt;Hello!&lt;/h2&gt;
  &lt;button commandfor="my-modal" command="--hide"&gt;Close&lt;/button&gt;
&lt;/dialog&gt;

&lt;button commandfor="my-modal" command="--toggle"&gt;Open Modal&lt;/button&gt;</code></pre>
  <p><strong>Total:</strong> ~11KB minified (~4KB gzipped) - No auto-loader overhead!</p>

  <h2>📦 Available Bundles (ESM Only)</h2>
  
  <h3>Core Runtime</h3>
  <ul>
    <li><code>behavior-fn-core.js</code> - Core functions (registerBehavior, etc.) - Required</li>
  </ul>

  <h3>Individual Behaviors</h3>
  <p>Each behavior exports its factory function and metadata:</p>
  <ul>
${behaviorDirs.map(name => `    <li><code>${name}.js</code> - Export: ${name}BehaviorFactory, metadata</li>`).join("\n")}
  </ul>

  <h3>Auto-Loader (Optional)</h3>
  <ul>
    <li><code>auto-loader.js</code> - Export: enableAutoLoader (~5KB)</li>
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

  <h2>📖 Loading Patterns (ESM Only - Auto-Register)</h2>

  <h3>Pattern 1: Auto-Loader (Simplest - Recommended)</h3>
  <p><strong>Best for:</strong> Most use cases, cleanest code, quick setup</p>
  <pre><code>&lt;script type="module"&gt;
  // Just import - behaviors auto-register, loader auto-enables!
  import './reveal.js';
  import './request.js';
  import './auto-loader.js';
&lt;/script&gt;

&lt;dialog behavior="reveal"&gt;...&lt;/dialog&gt;</code></pre>
  <ul>
    <li>✅ Simplest setup (just imports!)</li>
    <li>✅ Cleaner HTML (no is attribute)</li>
    <li>✅ Auto-registration on import</li>
    <li>✅ Works with dynamic content</li>
    <li>✅ Closest to Alpine.js/HTMX DX</li>
    <li>⚠️ Adds ~5KB + MutationObserver overhead</li>
  </ul>

  <h3>Pattern 2: Explicit (Best Performance)</h3>
  <p><strong>Best for:</strong> Production apps, maximum control, smallest size</p>
  <pre><code>&lt;script type="module"&gt;
  import { defineBehavioralHost } from './behavior-fn-core.js';
  import { metadata } from './reveal.js';  // Auto-registers!
  
  // Define host manually for best performance
  defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
&lt;/script&gt;

&lt;dialog is="behavioral-reveal" behavior="reveal"&gt;...&lt;/dialog&gt;</code></pre>
  <ul>
    <li>✅ Smallest bundle size</li>
    <li>✅ No MutationObserver overhead</li>
    <li>✅ Best performance</li>
    <li>✅ Auto-registration on import</li>
    <li>⚠️ Requires explicit is attribute</li>
  </ul>

  <h2>🔄 Migration from v0.1.x to v0.2.0 (ESM Only + Auto-Register)</h2>

  <div class="note">
    <strong>⚠️ BREAKING CHANGE:</strong> v0.2.0 removes IIFE bundles completely. All bundles are now ESM-only with auto-registration.
    <br><br>
    <strong>Why?</strong> ESM eliminates registry isolation issues, auto-registration simplifies usage, and it's the web standard (98%+ browser support in 2026).
  </div>

  <h3>If you used IIFE bundles:</h3>
  <pre><code>&lt;!-- ❌ OLD (v0.1.x) - IIFE format --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;

&lt;!-- ✅ NEW (v0.2.0) - ESM format with auto-registration --&gt;
&lt;script type="module"&gt;
  import { defineBehavioralHost } from './behavior-fn-core.js';
  import { metadata } from './reveal.js';  // Auto-registers!
  
  defineBehavioralHost('dialog', 'behavioral-reveal', metadata.observedAttributes);
&lt;/script&gt;</code></pre>

  <h3>With auto-loader (simplest):</h3>
  <pre><code>&lt;!-- ❌ OLD (v0.1.x) - IIFE with global BehaviorFN --&gt;
&lt;script src="behavior-fn-core.js"&gt;&lt;/script&gt;
&lt;script src="reveal.js"&gt;&lt;/script&gt;
&lt;script src="auto-loader.js"&gt;&lt;/script&gt;
&lt;script&gt;BehaviorFN.enableAutoLoader();&lt;/script&gt;

&lt;!-- ✅ NEW (v0.2.0) - Just imports! --&gt;
&lt;script type="module"&gt;
  import './reveal.js';       // Auto-registers!
  import './auto-loader.js';  // Auto-enables!
&lt;/script&gt;</code></pre>

  <h3>Browser Support:</h3>
  <p>ESM requires modern browsers (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+). For IE11 support, stay on v0.1.x or use a bundler.</p>

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

  <h3>Q: What happened to IIFE bundles?</h3>
  <p><strong>A:</strong> Removed in v0.2.0! All bundles are now ESM-only. This eliminates registry isolation issues and aligns with web standards. ESM has 98%+ browser support in 2026.</p>

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
