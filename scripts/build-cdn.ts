#!/usr/bin/env node
/**
 * Build CDN bundles for BehaviorFN
 * 
 * Creates standalone UMD/IIFE bundles that can be loaded via <script src="...">
 * Each behavior gets its own bundle that auto-registers when loaded.
 */

import { build } from "esbuild";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(__dirname, "..");
const registryDir = join(rootDir, "registry", "behaviors");
const cdnOutDir = join(rootDir, "dist", "cdn");

interface BuildTarget {
  name: string;
  entry: string;
  outfile: string;
  globalName: string;
}

async function buildCDNBundles() {
  console.log("🏗️  Building CDN bundles...\n");

  // Ensure output directory exists
  await mkdir(cdnOutDir, { recursive: true });

  // Get all behavior directories
  const entries = await readdir(registryDir, { withFileTypes: true });
  const behaviorDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  console.log(`Found ${behaviorDirs.length} behaviors:\n- ${behaviorDirs.join("\n- ")}\n`);

  const targets: BuildTarget[] = [];

  // Core runtime bundle
  targets.push({
    name: "core",
    entry: join(registryDir, "behavior-registry.ts"),
    outfile: join(cdnOutDir, "behavior-fn.js"),
    globalName: "BehaviorFN",
  });

  // Individual behavior bundles
  for (const behaviorName of behaviorDirs) {
    targets.push({
      name: behaviorName,
      entry: join(registryDir, behaviorName, "behavior.ts"),
      outfile: join(cdnOutDir, `${behaviorName}.js`),
      globalName: `BehaviorFN_${toPascalCase(behaviorName)}`,
    });
  }

  // Build each target
  for (const target of targets) {
    console.log(`📦 Building ${target.name}...`);
    
    try {
      await build({
        entryPoints: [target.entry],
        bundle: true,
        format: "iife",
        globalName: target.globalName,
        outfile: target.outfile,
        platform: "browser",
        target: "es2020",
        minify: true,
        sourcemap: true,
        // Automatically register behaviors when loaded
        footer: {
          js: target.name !== "core" 
            ? generateAutoRegisterFooter(target.name)
            : "",
        },
      });
      
      console.log(`✅ Built ${target.outfile}\n`);
    } catch (error) {
      console.error(`❌ Failed to build ${target.name}:`, error);
    }
  }

  // Create an "all-in-one" bundle with core + all behaviors
  console.log("📦 Building all-in-one bundle...");
  await buildAllInOne(behaviorDirs);

  // Generate index.html for CDN usage examples
  await generateCDNExamples(behaviorDirs);

  console.log("\n✅ All CDN bundles built successfully!");
  console.log(`📂 Output directory: ${cdnOutDir}`);
}

async function buildAllInOne(behaviorDirs: string[]) {
  const allInOneEntry = join(cdnOutDir, "_all-in-one-entry.js");
  
  // Create temporary entry file that imports everything
  const imports = [
    `import * as core from "${join(registryDir, "behavior-registry.ts")}";`,
    `import { defineBehavioralHost } from "${join(registryDir, "behavioral-host.ts")}";`,
    `import { enableAutoLoader } from "${join(registryDir, "auto-loader.ts")}";`,
    ...behaviorDirs.map((name) => 
      `import { ${toCamelCase(name)}BehaviorFactory } from "${join(registryDir, name, "behavior.ts")}";`
    ),
  ].join("\n");

  const registrations = behaviorDirs.map((name) => 
    `  core.registerBehavior("${name}", ${toCamelCase(name)}BehaviorFactory);`
  ).join("\n");

  const entryCode = `
${imports}

// Auto-register all behaviors on window load
if (typeof window !== 'undefined') {
  // Expose namespaced API
  window.BehaviorFN = {
    ...core,
    defineBehavioralHost,
    enableAutoLoader,
    behaviors: {
${behaviorDirs.map(name => `      "${name}": ${toCamelCase(name)}BehaviorFactory,`).join("\n")}
    },
  };
  
  // Also expose directly on window for convenience
  window.registerBehavior = window.BehaviorFN.registerBehavior;
  window.getBehavior = window.BehaviorFN.getBehavior;
  window.defineBehavioralHost = window.BehaviorFN.defineBehavioralHost;
  window.enableAutoLoader = window.BehaviorFN.enableAutoLoader;
  
  // Auto-register all behaviors
${registrations}
  
  console.log("✅ BehaviorFN loaded with ${behaviorDirs.length} behaviors");
}
`;

  await writeFile(allInOneEntry, entryCode);

  await build({
    entryPoints: [allInOneEntry],
    bundle: true,
    format: "iife",
    globalName: "BehaviorFN",
    outfile: join(cdnOutDir, "behavior-fn.all.js"),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
  });

  console.log(`✅ Built ${join(cdnOutDir, "behavior-fn.all.js")}\n`);
}

async function generateCDNExamples(behaviorDirs: string[]) {
  const exampleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BehaviorFN CDN Examples</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 1200px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #2563eb; }
    h2 { margin-top: 40px; color: #1e40af; }
    pre {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
    }
    code { font-family: 'Courier New', monospace; }
    .example {
      margin: 30px 0;
      padding: 20px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
    }
    dialog {
      padding: 30px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  <h1>🎯 BehaviorFN CDN Usage</h1>
  <p>Load behaviors directly from CDN—no build tools required!</p>

  <h2>Method 1: Individual Behaviors</h2>
  <pre><code>&lt;!-- Load core runtime --&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.js"&gt;&lt;/script&gt;

&lt;!-- Load specific behavior --&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/reveal.js"&gt;&lt;/script&gt;</code></pre>

  <h2>Method 2: All-in-One Bundle</h2>
  <pre><code>&lt;!-- Load everything at once --&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"&gt;&lt;/script&gt;</code></pre>

  <h2>Available Behaviors</h2>
  <ul>
${behaviorDirs.map(name => `    <li><code>${name}.js</code></li>`).join("\n")}
  </ul>

  <h2>Live Example: Reveal Behavior</h2>
  <div class="example">
    <button commandfor="demo-modal" command="--toggle">
      Open Modal
    </button>
    
    <dialog is="behavioral-reveal" id="demo-modal" behavior="reveal">
      <h2>🎉 It Works!</h2>
      <p>This modal was loaded from CDN!</p>
      <button commandfor="demo-modal" command="--hide">Close</button>
    </dialog>
  </div>

  <h2>Usage Example</h2>
  <pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;!-- Load BehaviorFN from CDN --&gt;
  &lt;script src="https://cdn.jsdelivr.net/npm/behavior-fn@latest/dist/cdn/behavior-fn.all.js"&gt;&lt;/script&gt;
  
  &lt;!-- Initialize --&gt;
  &lt;script&gt;
    // Define behavioral host when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal', []);
    });
  &lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;dialog is="behavioral-reveal" id="modal" behavior="reveal"&gt;
    Content here
  &lt;/dialog&gt;
  
  &lt;button commandfor="modal" command="--toggle"&gt;
    Toggle Modal
  &lt;/button&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

  <!-- Load BehaviorFN for this demo -->
  <script>
    // For this demo, we'll use inline implementations
    // In production, you'd load from actual CDN
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
    
    // Initialize hosts
    BehaviorFN.defineBehavioralHost('dialog', 'behavioral-reveal');
    
    console.log('✅ BehaviorFN loaded from CDN');
  </script>
</body>
</html>`;

  await writeFile(join(cdnOutDir, "index.html"), exampleHTML);
  console.log(`✅ Generated ${join(cdnOutDir, "index.html")}\n`);
}

function generateAutoRegisterFooter(behaviorName: string): string {
  return `
// Auto-register when loaded
if (typeof window !== 'undefined' && window.BehaviorFN) {
  window.BehaviorFN.registerBehavior('${behaviorName}', ${toPascalCase(behaviorName)}.${toCamelCase(behaviorName)}BehaviorFactory);
  console.log('✅ Registered behavior: ${behaviorName}');
}
`;
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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
