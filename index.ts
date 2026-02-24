#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { createJiti } from "jiti";
import { detectValidatorFromPackageJson } from "./src/utils/detect-validator";
import { getValidator, validators, type ValidatorId } from "./src/validators/index";
import { detectPlatform, type PlatformStrategy } from "./src/platforms/index";
import type { BehaviorRegistry } from "./src/types/registry";
import type { AttributeSchema } from "./src/types/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jiti = createJiti(__filename);

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
  validatorType: ValidatorId = 0,
  platform?: PlatformStrategy,
) {
  const behavior = registry.find((b) => b.name === name);
  if (!behavior) {
    console.error(`Behavior "${name}" not found in registry.`);
    process.exit(1);
  }

  // Get validator
  const validator = getValidator(validatorType);

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
        // Use jiti to import TypeScript schema files at runtime
        // jiti handles both .ts (dev) and .js (built) transparently
        const schemaPath = path.join(__dirname, "registry/behaviors", file.path);
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

const args = process.argv.slice(2);
const command = args[0];
const behaviorName = args[1];

async function getValidatorType(name: string): Promise<ValidatorId> {
  const detectedValidators = detectValidatorFromPackageJson(process.cwd());

  if (detectedValidators.length > 1) {
    const choices = validators
      .filter((v) => detectedValidators.includes(v.id))
      .map((v) => ({ title: v.label, value: v.id }));
      
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
  if (command === "init") {
    const response = await prompts([
      {
        type: "text",
        name: "behaviors",
        message: "Where should behaviors be installed?",
        initial: "src/components/html/behaviors",
      },
      {
        type: "text",
        name: "utils",
        message: "Where should behavior utils be installed?",
        initial: "src/components/html/behavior-utils.ts",
      },
      {
        type: "text",
        name: "registry",
        message: "Where should the behavior registry be installed?",
        initial: "src/components/html/behaviors/behavior-registry.ts",
      },
      {
        type: "text",
        name: "testUtils",
        message: "Where should test utils be installed?",
        initial: "tests/utils/command-test-harness.ts",
      },
      {
        type: "text",
        name: "aliasUtils",
        message: "What is the import alias for behavior utils?",
        initial: "@/components/html/behavior-utils",
      },
      {
        type: "text",
        name: "aliasRegistry",
        message: "What is the import alias for behavior registry?",
        initial: "@/components/html/behaviors/behavior-registry",
      },
      {
        type: "text",
        name: "aliasTestUtils",
        message: "What is the import alias for test utils?",
        initial: "@/tests/utils/command-test-harness",
      },
    ]);

    const config: Config = {
      paths: {
        behaviors: response.behaviors,
        utils: response.utils,
        registry: response.registry,
        testUtils: response.testUtils,
      },
      aliases: {
        utils: response.aliasUtils,
        registry: response.aliasRegistry,
        testUtils: response.aliasTestUtils,
      },
    };

    fs.writeFileSync(
      path.join(process.cwd(), CONFIG_FILE),
      JSON.stringify(config, null, 2),
    );
    console.log(`Configuration saved to ${CONFIG_FILE}`);

    // Detect platform once
    const platform = detectAndValidatePlatform();
    await installBehavior("core", config, 0 as const, platform);
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
        await installBehavior("core", config, 0 as const, platform);
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
    "  init                Initialize the behavior registry (installs core files)",
  );
  console.error("  add <behavior-name> Add a specific behavior");
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
