#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { detectValidatorFromPackageJson } from "./src/utils/detect-validator";
import { detectEnvironment } from "./src/utils/detect";
import { getStrategy, strategies } from "./src/strategies/index";
import { detectPlatform } from "./src/platforms/index";
import type { PlatformStrategy } from "./src/platforms/platform-strategy";
import type { BehaviorRegistry } from "./src/types/registry";
import type { AttributeSchema } from "./src/types/schema";
import type { InitConfig, Validator } from "./src/types/init";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let jiti: any = null;

// Load registry
const registryPath = path.join(__dirname, "registry/behaviors-registry.json");
const registry: BehaviorRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

interface Config {
  paths: {
    behaviors: string;
    utils: string;
    registry: string;
    testUtils: string;
  };
  aliases: {
    utils: string;
    registry: string;
    testUtils: string;
  };
}

const CONFIG_FILE = "behavior.json";
const NEW_CONFIG_FILE = "behavior.config.json";

function loadConfig(): Config | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  return null;
}

/**
 * Detect the current platform and validate it.
 * Logs warnings if platform validation fails.
 */
function detectAndValidatePlatform(): PlatformStrategy {
  const cwd = process.cwd();
  const platform = detectPlatform(cwd);
  
  console.log(`Detected platform: ${platform.label}`);
  
  // Validate platform
  const validation = platform.validate(cwd);
  if (!validation.valid && validation.errors) {
    console.warn(`Platform validation warnings:`);
    for (const error of validation.errors) {
      console.warn(`  - ${error}`);
    }
  }
  
  return platform;
}

function rewriteImports(content: string, config: Config): string {
  return content
    .replace(/~utils/g, config.aliases.utils)
    .replace(/~registry/g, config.aliases.registry)
    .replace(/~test-utils/g, config.aliases.testUtils);
}

async function installBehavior(
  name: string,
  config: Config,
  validatorType: number = 0,
  platform?: PlatformStrategy,
) {
  const behavior = registry.find((b) => b.name === name);
  if (!behavior) {
    console.error(`Behavior "${name}" not found in registry.`);
    process.exit(1);
  }

  // Get validator strategy
  const strategy = getStrategy(validatorType);
  if (!strategy) {
    console.error(`Validator type ${validatorType} not supported.`);
    process.exit(1);
  }

  console.log(`Installing behavior: ${name}...`);

  // Install files
  for (const file of behavior.files) {
    let targetDir = config.paths.behaviors;
    let fileName = file.path;

    // Determine target directory based on file type/path
    if (file.path === "behavior-utils.ts") {
      targetDir = path.dirname(config.paths.utils);
      fileName = path.basename(config.paths.utils);
    } else if (file.path === "types.ts") {
      targetDir = path.dirname(config.paths.utils);
      fileName = "types.ts";
    } else if (file.path === "behavior-registry.ts") {
      targetDir = path.dirname(config.paths.registry);
      fileName = path.basename(config.paths.registry);
    } else if (file.path === "command-test-harness.ts") {
      targetDir = path.dirname(config.paths.testUtils);
      fileName = path.basename(config.paths.testUtils);
    } else if (file.path === "event-methods.ts") {
      // event-methods.ts should be in the same directory as registry
      targetDir = path.dirname(config.paths.registry);
      fileName = "event-methods.ts";
    }

    // Resolve absolute path
    const absoluteTargetDir = path.resolve(process.cwd(), targetDir);
    const filePath = path.join(absoluteTargetDir, fileName);

    if (!fs.existsSync(absoluteTargetDir)) {
      fs.mkdirSync(absoluteTargetDir, { recursive: true });
    }

    const sourcePath = path.join(__dirname, "registry/behaviors", file.path);
    let content = fs.readFileSync(sourcePath, "utf-8");

    // Transform schema files if needed
    if (file.path.endsWith("schema.ts")) {
      try {
        // Lazy load jiti only when needed
        if (!jiti) {
          const { createJiti } = await import("jiti");
          jiti = createJiti(__filename);
        }
        // Use jiti to import TypeScript schema files at runtime
        // jiti handles both .ts (dev) and .js (built) transparently
        const schemaPath = path.join(__dirname, "registry/behaviors", file.path);
        const mod = await jiti.import<{ schema?: AttributeSchema }>(schemaPath);
        if (mod.schema) {
          content = strategy.transformSchema(mod.schema, content);
        }
      } catch (e) {
        console.warn(`Failed to transform schema for ${file.path}:`, e);
      }
    }

    // Rewrite imports
    content = rewriteImports(content, config);

    // Platform specific adjustments
    if (file.path === "behavior-utils.ts") {
      // Detect platform if not provided
      const activePlatform = platform || detectAndValidatePlatform();
      
      // Transform isServer check
      content = content.replace(
        "export const isServer = () => typeof window === 'undefined';",
        activePlatform.transformIsServerCheck(),
      );

      // Apply platform-specific utils transformations if available
      if (activePlatform.transformBehaviorUtils) {
        content = activePlatform.transformBehaviorUtils(content);
      }

      // Add platform-specific imports if available
      const platformImports = activePlatform.getAdditionalImports?.();
      if (platformImports) {
        content = `${platformImports}\n` + content;
      }

      // Optimize getObservedAttributes for the selected validator
      const imports = strategy.getUtilsImports();
      if (imports) {
        content = `${imports}\n` + content;
      }
      
      const observedAttributesCode = strategy.getObservedAttributesCode();
      if (observedAttributesCode) {
        content = content.replace(
          /export const getObservedAttributes = [\s\S]*?^};/m,
          observedAttributesCode,
        );
      }
    }

    // Platform specific registry transformations
    if (file.path === "behavior-registry.ts") {
      const activePlatform = platform || detectAndValidatePlatform();
      if (activePlatform.transformRegistry) {
        content = activePlatform.transformRegistry(content);
      }
    }

    // Transform types.ts based on validator
    if (file.path === "types.ts") {
      content = strategy.getTypesFileContent();
    }

    fs.writeFileSync(filePath, content);
    console.log(`  Created ${path.relative(process.cwd(), filePath)}`);
  }

  // Install dependencies
  if (behavior.dependencies && behavior.dependencies.length > 0) {
    console.log(
      `Installing dependencies: ${behavior.dependencies.join(", ")}...`,
    );
    try {
      execSync(`pnpm add ${behavior.dependencies.join(" ")}`, {
        stdio: "inherit",
      });
    } catch (e) {
      console.error("Failed to install dependencies.");
    }
  }

  console.log(`Behavior "${name}" installed successfully.`);
}

async function createBehavior(name: string) {
  // Validate behavior name
  const validation = validateBehaviorName(name);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(1);
  }

  // Check if behavior already exists
  if (behaviorExists(name, registry)) {
    console.error(`Error: Behavior "${name}" already exists in registry.`);
    process.exit(1);
  }

  // Determine the registry root (handle both dev and built scenarios)
  // In dev: __dirname is the project root
  // In built: __dirname is dist/, so we need to go up one level
  const registryRoot = fs.existsSync(path.join(__dirname, "index.ts"))
    ? __dirname
    : path.join(__dirname, "..");

  // Create behavior directory
  const behaviorDir = path.join(registryRoot, "registry/behaviors", name);
  if (fs.existsSync(behaviorDir)) {
    console.error(`Error: Directory "${behaviorDir}" already exists.`);
    process.exit(1);
  }

  console.log(`Creating behavior: ${name}...`);
  fs.mkdirSync(behaviorDir, { recursive: true });

  // Generate and write files
  const files = [
    {
      name: "_behavior-definition.ts",
      content: generateBehaviorDefinition(name),
    },
    { name: "schema.ts", content: generateSchema(name) },
    { name: "behavior.ts", content: generateBehavior(name) },
    { name: "behavior.test.ts", content: generateTest(name) },
  ];

  for (const file of files) {
    const filePath = path.join(behaviorDir, file.name);
    fs.writeFileSync(filePath, file.content);
    console.log(`  Created ${path.relative(__dirname, filePath)}`);
  }

  // Update registry
  const newEntry = {
    name,
    dependencies: [],
    files: [
      { path: `${name}/_behavior-definition.ts` },
      { path: `${name}/schema.ts` },
      { path: `${name}/behavior.ts` },
      { path: `${name}/behavior.test.ts` },
    ],
  };

  registry.push(newEntry);
  const registryJsonPath = path.join(registryRoot, "registry/behaviors-registry.json");
  fs.writeFileSync(registryJsonPath, JSON.stringify(registry, null, 2) + "\n");
  console.log(`  Updated registry`);

  console.log(`\nBehavior "${name}" created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit registry/behaviors/${name}/schema.ts to define attributes`);
  console.log(`  2. Implement logic in registry/behaviors/${name}/behavior.ts`);
  console.log(`  3. Write tests in registry/behaviors/${name}/behavior.test.ts`);
  console.log(`  4. Run 'pnpm test' to verify your implementation`);
}

async function removeBehavior(name: string) {
  // Validate behavior name
  const validation = validateBehaviorName(name);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(1);
  }

  // Determine the registry root
  const registryRoot = fs.existsSync(path.join(__dirname, "index.ts"))
    ? __dirname
    : path.join(__dirname, "..");

  // Reload registry to get latest state
  const registryJsonPath = path.join(registryRoot, "registry/behaviors-registry.json");
  const currentRegistry = JSON.parse(fs.readFileSync(registryJsonPath, "utf-8"));

  // Check if behavior exists
  if (!behaviorExists(name, currentRegistry)) {
    console.error(`Error: Behavior "${name}" does not exist in registry.`);
    process.exit(1);
  }

  // Don't allow removing core
  if (name === "core") {
    console.error(`Error: Cannot remove "core" behavior. It is required by the system.`);
    process.exit(1);
  }

  const behaviorDir = path.join(registryRoot, "registry/behaviors", name);

  // Check if directory exists
  if (!fs.existsSync(behaviorDir)) {
    console.error(`Error: Directory "${behaviorDir}" does not exist.`);
    process.exit(1);
  }

  console.log(`Removing behavior: ${name}...`);

  // Remove directory
  fs.rmSync(behaviorDir, { recursive: true, force: true });
  console.log(`  Deleted ${path.relative(registryRoot, behaviorDir)}`);

  // Update registry
  const registryIndex = currentRegistry.findIndex((b: any) => b.name === name);
  if (registryIndex !== -1) {
    currentRegistry.splice(registryIndex, 1);
    fs.writeFileSync(registryJsonPath, JSON.stringify(currentRegistry, null, 2) + "\n");
    console.log(`  Updated registry`);
  }

  console.log(`\nBehavior "${name}" removed successfully!`);
}

const args = process.argv.slice(2);
const command = args[0];
const behaviorName = args[1];

/**
 * Parse CLI flags from process.argv
 */
function parseFlags(): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      flags[key] = value || true;
    } else if (arg === "-d") {
      flags.defaults = true;
    } else if (arg === "-y") {
      flags.yes = true;
    }
  }
  
  return flags;
}

/**
 * Map validator name to strategy ID
 */
function getValidatorId(name: string): number {
  const mapping: Record<string, number> = {
    zod: 0,
    valibot: 1,
    arktype: 2,
    typebox: 3,
    "zod-mini": 4,
  };
  return mapping[name.toLowerCase()] ?? 0;
}

/**
 * Get validator name from strategy ID
 */
function getValidatorName(id: number): Validator {
  const mapping: Record<number, Validator> = {
    0: "zod",
    1: "valibot",
    2: "arktype",
    3: "typebox",
    4: "zod-mini",
  };
  return mapping[id] ?? "zod";
}

async function getValidatorType(name: string): Promise<number> {
  const detectedValidators = detectValidatorFromPackageJson(process.cwd());

  if (detectedValidators.length > 1) {
    const choices = strategies
      .filter((s) => detectedValidators.includes(s.id))
      .map((s) => ({ title: s.label, value: s.id }));
      
    const response = await prompts({
      type: "select",
      name: "validator",
      message: `Multiple validators detected for behavior "${name}". Which one should be used for schemas?`,
      choices,
    });
    return response.validator;
  }
  return detectedValidators[0];
}

export async function main() {
  if (command === "create") {
    if (!behaviorName) {
      console.error("Please specify a behavior name.");
      console.error("Usage: behavior-fn create <behavior-name>");
      process.exit(1);
    }

    await createBehavior(behaviorName);
    process.exit(0);
  }

  if (command === "remove") {
    if (!behaviorName) {
      console.error("Please specify a behavior name.");
      console.error("Usage: behavior-fn remove <behavior-name>");
      process.exit(1);
    }

    await removeBehavior(behaviorName);
    process.exit(0);
  }

  if (command === "init") {
    const flags = parseFlags();
    
    // Detect environment
    const detected = detectEnvironment();
    
    // Log detection results
    console.log("┌─────────────────────────────────────────┐");
    console.log("│  Welcome to BehaviorCN! 🎯              │");
    console.log("└─────────────────────────────────────────┘");
    console.log("");
    console.log(`✓ Detected: ${detected.typescript ? "TypeScript" : "JavaScript"}, ${detected.packageManager}`);
    console.log("");
    
    let validatorChoice: Validator;
    let pathChoice: string;
    
    // Check for --defaults flag
    if (flags.defaults || flags.d) {
      // Use defaults
      validatorChoice = flags.validator ? flags.validator as Validator : "zod";
      pathChoice = flags.path ? flags.path as string : detected.suggestedPath;
      
      console.log(`✓ Using defaults: ${validatorChoice}, ${pathChoice}`);
    } else {
      // Interactive mode - ask 2 questions
      const validatorChoices = [
        { title: "Zod (recommended)", value: "zod" },
        { title: "Valibot (smallest)", value: "valibot" },
        { title: "ArkType (advanced)", value: "arktype" },
        { title: "TypeBox (fastest)", value: "typebox" },
        { title: "Zod Mini (lightweight)", value: "zod-mini" },
      ];
      
      const response = await prompts([
        {
          type: "select",
          name: "validator",
          message: "Which schema validator would you like to use?",
          choices: validatorChoices,
          initial: 0,
        },
        {
          type: "text",
          name: "path",
          message: "Where would you like to install behaviors?",
          initial: detected.suggestedPath,
        },
      ]);
      
      // Handle user cancellation
      if (!response.validator || !response.path) {
        console.log("Init cancelled.");
        process.exit(1);
      }
      
      validatorChoice = flags.validator ? flags.validator as Validator : response.validator;
      pathChoice = flags.path ? flags.path as string : response.path;
    }
    
    // Override TypeScript detection if --no-ts flag is present
    const useTypeScript = flags["no-ts"] ? false : detected.typescript;
    
    // Override package manager if --pm flag is present
    const packageManager = flags.pm ? flags.pm as string : detected.packageManager;
    
    // Create new config format
    const newConfig: InitConfig = {
      validator: validatorChoice,
      typescript: useTypeScript,
      behaviorsPath: pathChoice,
      packageManager: packageManager as "pnpm" | "bun" | "npm" | "yarn",
    };
    
    // Also create old format for backward compatibility
    const legacyConfig: Config = {
      paths: {
        behaviors: pathChoice,
        utils: path.join(pathChoice, "../behavior-utils.ts"),
        registry: path.join(pathChoice, "behavior-registry.ts"),
        testUtils: "tests/utils/command-test-harness.ts",
      },
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behavior-registry",
        testUtils: "@/test-utils",
      },
    };
    
    // Write new config
    fs.writeFileSync(
      path.join(process.cwd(), NEW_CONFIG_FILE),
      JSON.stringify(newConfig, null, 2),
    );
    
    // Write legacy config for backward compatibility
    fs.writeFileSync(
      path.join(process.cwd(), CONFIG_FILE),
      JSON.stringify(legacyConfig, null, 2),
    );
    
    console.log(`✓ Created ${NEW_CONFIG_FILE}`);
    
    // Create behaviors directory
    const behaviorsDir = path.resolve(process.cwd(), pathChoice);
    if (!fs.existsSync(behaviorsDir)) {
      fs.mkdirSync(behaviorsDir, { recursive: true });
      console.log(`✓ Created ${pathChoice}/`);
    }
    
    // Detect platform once
    const platform = detectAndValidatePlatform();
    const validatorId = getValidatorId(validatorChoice);
    await installBehavior("core", legacyConfig, validatorId, platform);
    
    console.log(`✓ Ready! Run \`behavior-fn add reveal\` to add your first behavior.`);
    process.exit(0);
  }

  if (command === "add") {
    if (!behaviorName) {
      console.error("Please specify a behavior name.");
      process.exit(1);
    }

    const config = loadConfig();
    if (!config) {
      console.error(
        `Configuration file ${CONFIG_FILE} not found. Run "init" first.`,
      );
      process.exit(1);
    }

    // Detect platform once
    const platform = detectAndValidatePlatform();

    // Always ensure core is installed (check registry file existence)
    if (behaviorName !== "core") {
      const registryPath = path.resolve(process.cwd(), config.paths.registry);
      if (!fs.existsSync(registryPath)) {
        console.log("Core files not found. Installing core...");
        await installBehavior("core", config, 0, platform);
      }
    }

    await installBehavior(
      behaviorName,
      config,
      await getValidatorType(behaviorName),
      platform,
    );
    process.exit(0);
  }

  console.error("Usage: behavior-fn <command> [args]");
  console.error("Commands:");
  console.error(
    "  init                   Initialize the behavior registry (installs core files)",
  );
  console.error(
    "  create <behavior-name> Create a new behavior (scaffolds files in registry)",
  );
  console.error(
    "  remove <behavior-name> Remove a behavior from the registry",
  );
  console.error(
    "  add <behavior-name>    Add a specific behavior to your project",
  );
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
