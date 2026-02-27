#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { detectValidatorFromPackageJson } from "./src/utils/detect-validator";
import { detectEnvironment } from "./src/utils/detect";
import { validateBehaviorName, behaviorExists } from "./src/utils/validation";
import {
  generateBehaviorDefinition,
  generateSchema,
  generateBehavior,
  generateTest,
} from "./src/templates/behavior-templates";
import {
  getValidator,
  validators,
  type PackageName,
} from "./src/validators/index";
import { detectPlatform, type PlatformStrategy } from "./src/platforms/index";
import type { BehaviorRegistry } from "./src/schemas/registry";
import { BehaviorRegistrySchema } from "./src/schemas/registry";
import type { AttributeSchema } from "./src/types/schema";
import type { Config } from "./src/schemas/config";
import { ConfigSchema } from "./src/schemas/config";
import { validateJson, validateJsonFile } from "./src/schemas/validation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let jiti: {
  import: <T>(id: string) => Promise<T>;
} | null = null;

// Load and validate registry
const registryPath = path.join(__dirname, "registry/behaviors-registry.json");
const registry: BehaviorRegistry = validateJsonFile<BehaviorRegistry>(
  BehaviorRegistrySchema,
  registryPath,
  "behaviors registry"
);

const CONFIG_FILE = "behavior.config.json";

function loadConfig(): Config | null {
  const newConfigPath = path.join(process.cwd(), CONFIG_FILE);
  const oldConfigPath = path.join(process.cwd(), "behavior.json");

  // Check for new config first
  if (fs.existsSync(newConfigPath)) {
    const config = validateJsonFile<Config>(
      ConfigSchema,
      newConfigPath,
      CONFIG_FILE
    );

    // Warn if old config also exists
    if (fs.existsSync(oldConfigPath)) {
      console.warn(
        "⚠️  Warning: Both behavior.json and behavior.config.json exist.",
      );
      console.warn(
        "   Using behavior.config.json. You can safely delete behavior.json.",
      );
    }

    return config;
  }

  // Migrate from old config
  if (fs.existsSync(oldConfigPath)) {
    console.log("📦 Migrating behavior.json to behavior.config.json...");
    const oldConfig = JSON.parse(fs.readFileSync(oldConfigPath, "utf-8"));

    // Create new config with validator field
    // If old config doesn't have validator, it will be prompted in add command
    const newConfig = {
      ...oldConfig,
      validator: oldConfig.validator || ("zod" as PackageName),
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
    .replace(/~test-utils/g, config.aliases.testUtils)
    .replace(/~host/g, config.aliases.host)
    .replace(/~types/g, config.aliases.types);
}

async function installBehavior(
  name: string,
  config: Config,
  validatorPackageName: PackageName = "zod",
  platform?: PlatformStrategy,
  includeTests: boolean = true,
) {
  const behavior = registry.find((b) => b.name === name);
  if (!behavior) {
    console.error(`Behavior "${name}" not found in registry.`);
    process.exit(1);
  }

  // Get validator
  const validator = getValidator(validatorPackageName);

  console.log(`Installing behavior: ${name}...`);

  // Install files
  for (const file of behavior.files) {
    // Skip test files if not requested (silent skip - only log installs)
    if (!includeTests && file.path.endsWith(".test.ts")) {
      continue;
    }

    let targetDir = config.paths.behaviors;
    let fileName = file.path;

    // Determine target directory based on file type/path
    if (file.path === "behavior-utils.ts") {
      targetDir = path.dirname(config.paths.utils);
      fileName = path.basename(config.paths.utils);
    } else if (file.path === "types.ts") {
      targetDir = path.dirname(config.paths.types);
      fileName = path.basename(config.paths.types);
    } else if (file.path === "behavior-registry.ts") {
      targetDir = path.dirname(config.paths.registry);
      fileName = path.basename(config.paths.registry);
    } else if (file.path === "behavioral-host.ts") {
      targetDir = path.dirname(config.paths.host);
      fileName = path.basename(config.paths.host);
    } else if (file.path === "command-test-harness.ts") {
      targetDir = path.dirname(config.paths.testUtils);
      fileName = path.basename(config.paths.testUtils);
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
        const schemaPath = path.join(
          __dirname,
          "registry/behaviors",
          file.path,
        );
        const mod = await jiti.import<{ schema?: AttributeSchema }>(schemaPath);
        if (mod.schema) {
          content = validator.transformSchema(mod.schema, content);
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
      const imports = validator.getUtilsImports();
      if (imports) {
        content = `${imports}\n` + content;
      }

      const observedAttributesCode = validator.getObservedAttributesCode();
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
      content = validator.getTypesFileContent();
    }

    // Ensure all parent directories exist before writing
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
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

  // Generate and write files (4-file standard structure)
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

  // Update registry (4-file standard structure)
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
  const registryJsonPath = path.join(
    registryRoot,
    "registry/behaviors-registry.json",
  );
  fs.writeFileSync(registryJsonPath, JSON.stringify(registry, null, 2) + "\n");
  console.log(`  Updated registry`);

  console.log(`\nBehavior "${name}" created successfully!`);
  console.log(`\nNext steps:`);
  console.log(
    `  1. Edit registry/behaviors/${name}/schema.ts to define attributes`,
  );
  console.log(`  2. Implement logic in registry/behaviors/${name}/behavior.ts`);
  console.log(
    `  3. Write tests in registry/behaviors/${name}/behavior.test.ts`,
  );
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

  // Reload and validate registry to get latest state
  const registryJsonPath = path.join(
    registryRoot,
    "registry/behaviors-registry.json",
  );
  const currentRegistry = validateJsonFile<BehaviorRegistry>(
    BehaviorRegistrySchema,
    registryJsonPath,
    "behaviors registry"
  );

  // Check if behavior exists
  if (!behaviorExists(name, currentRegistry)) {
    console.error(`Error: Behavior "${name}" does not exist in registry.`);
    process.exit(1);
  }

  // Don't allow removing core
  if (name === "core") {
    console.error(
      `Error: Cannot remove "core" behavior. It is required by the system.`,
    );
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
    fs.writeFileSync(
      registryJsonPath,
      JSON.stringify(currentRegistry, null, 2) + "\n",
    );
    console.log(`  Updated registry`);
  }

  console.log(`\nBehavior "${name}" removed successfully!`);
}

const args = process.argv.slice(2);
const command = args[0];
// Extract behavior name (first non-flag argument after command)
const behaviorName = args.find((arg, idx) => idx > 0 && !arg.startsWith("-"));
// Parse flags (simplified: only --with-tests for opt-in)
const flags = {
  withTests: args.includes("--with-tests") || args.includes("-t"),
};

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

async function getValidatorType(name: string): Promise<PackageName> {
  const detectedValidators = detectValidatorFromPackageJson(process.cwd());

  if (detectedValidators.length > 1) {
    const choices = validators
      .filter((v) => detectedValidators.includes(v.packageName))
      .map((v) => ({ title: v.label, value: v.packageName }));

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
    console.log("│  Welcome to BehaviorFN! 🎯              │");
    console.log("└─────────────────────────────────────────┘");
    console.log("");
    console.log(
      `✓ Detected: ${detected.typescript ? "TypeScript" : "JavaScript"}, ${detected.packageManager}`,
    );
    console.log("");

    let validatorChoice: PackageName;
    let pathChoice: string;

    // Check for --defaults flag
    if (flags.defaults || flags.d) {
      // Use defaults
      validatorChoice = flags.validator
        ? (flags.validator as PackageName)
        : "zod";
      pathChoice = flags.path ? (flags.path as string) : detected.suggestedPath;

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

      validatorChoice = flags.validator
        ? (flags.validator as PackageName)
        : response.validator;
      pathChoice = flags.path ? (flags.path as string) : response.path;
    }

    // Override TypeScript detection if --no-ts flag is present
    const useTypeScript = flags["no-ts"] ? false : detected.typescript;

    // Override package manager if --pm flag is present
    const packageManager = flags.pm
      ? (flags.pm as string)
      : detected.packageManager;

    // Create unified config
    const config: Config = {
      validator: validatorChoice,
      paths: {
        behaviors: pathChoice,
        utils: path.join(pathChoice, "../behavior-utils.ts"),
        registry: path.join(pathChoice, "behavior-registry.ts"),
        testUtils: "tests/utils/command-test-harness.ts",
        host: path.join(pathChoice, "../behavioral-host.ts"),
        types: path.join(pathChoice, "../types.ts"),
      },
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behavior-registry",
        testUtils: "@/test-utils",
        host: "@/behavioral-host",
        types: "@/types",
      },
    };

    // Write config
    fs.writeFileSync(
      path.join(process.cwd(), CONFIG_FILE),
      JSON.stringify(config, null, 2),
    );

    console.log(`✓ Created ${CONFIG_FILE}`);

    // Create behaviors directory
    const behaviorsDir = path.resolve(process.cwd(), pathChoice);
    if (!fs.existsSync(behaviorsDir)) {
      fs.mkdirSync(behaviorsDir, { recursive: true });
      console.log(`✓ Created ${pathChoice}/`);
    }

    // Detect platform once
    const platform = detectAndValidatePlatform();
    await installBehavior("core", config, validatorChoice, platform);
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

    // Get validator from config or prompt if missing
    let validatorChoice: PackageName = config.validator;
    if (!validatorChoice) {
      console.log(
        "⚠️  Config missing validator field. Prompting for validator...",
      );
      validatorChoice = await getValidatorType(behaviorName);

      // Save validator to config
      config.validator = validatorChoice;
      fs.writeFileSync(
        path.join(process.cwd(), CONFIG_FILE),
        JSON.stringify(config, null, 2),
      );
      console.log(`✓ Saved validator choice (${validatorChoice}) to config`);
    }

    // Detect platform once
    const platform = detectAndValidatePlatform();

    // Resolve includeTests decision (flags > config > default)
    // Default: false (production-first, lean installations)
    let includeTests = false;

    if (flags.withTests) {
      // Explicit opt-in via flag
      includeTests = true;
    } else if (config.optionalFiles?.tests !== undefined) {
      // Use config preference if set
      includeTests = config.optionalFiles.tests;
    }
    // No prompt - non-interactive by default (CI/CD friendly)

    // Always ensure core is installed (check registry file existence)
    if (behaviorName !== "core") {
      const registryPath = path.resolve(process.cwd(), config.paths.registry);
      if (!fs.existsSync(registryPath)) {
        console.log("Core files not found. Installing core...");
        await installBehavior("core", config, validatorChoice, platform);
      }
    }

    await installBehavior(
      behaviorName,
      config,
      validatorChoice,
      platform,
      includeTests,
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
  console.error("  remove <behavior-name> Remove a behavior from the registry");
  console.error(
    "  add <behavior-name> [options]",
  );
  console.error(
    "                         Add a specific behavior to your project",
  );
  console.error("");
  console.error("Options for 'add' command:");
  console.error(
    "  -t, --with-tests       Include test files for reference/learning",
  );
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
