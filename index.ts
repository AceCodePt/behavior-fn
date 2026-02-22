#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { createJiti } from "jiti";
import { toZod } from "./src/transformers/toZod";
import { toValibot } from "./src/transformers/toValibot";
import { toArkType } from "./src/transformers/toArkType";
import { toTypeBox } from "./src/transformers/toTypeBox";
import { detectValidatorFromPackageJson } from "./src/utils/detect-validator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jiti = createJiti(__filename);

// Load registry
const registryPath = path.join(__dirname, "registry/behaviors-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

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

function detectPlatform(): "astro" | "next" | "generic" {
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd);

  if (files.some((f) => f.startsWith("astro.config."))) {
    return "astro";
  }
  if (files.some((f) => f.startsWith("next.config."))) {
    return "next";
  }
  return "generic";
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
) {
  const behavior = registry.find((b: any) => b.name === name);
  if (!behavior) {
    console.error(`Behavior "${name}" not found in registry.`);
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
        const mod = await jiti.import<{ schema?: unknown }>(sourcePath);
        if (mod.schema) {
          if (validatorType === 0) {
            content = toZod(mod.schema);
          } else if (validatorType === 1) {
            content = toValibot(mod.schema);
          } else if (validatorType === 2) {
            content = toArkType(mod.schema);
          } else if (validatorType === 3) {
            // Check if toTypeBox function signature matches
            // toTypeBox(content, schema)
            content = toTypeBox(content, mod.schema);
          }
        }
      } catch (e) {
        console.warn(`Failed to transform schema for ${file.path}:`, e);
      }
    }

    // Rewrite imports
    content = rewriteImports(content, config);

    // Platform specific adjustments
    if (file.path === "behavior-utils.ts") {
      const platform = detectPlatform();
      if (platform === "astro") {
        content = content.replace(
          "export const isServer = () => typeof window === 'undefined';",
          "export const isServer = () => import.meta.env.SSR;",
        );
      }
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

async function getValidatorType(name: string): Promise<number> {
  const detectedValidators = detectValidatorFromPackageJson(process.cwd());

  if (detectedValidators.length > 1) {
    const response = await prompts({
      type: "select",
      name: "validator",
      message: `Multiple validators detected for behavior "${name}". Which one should be used for schemas?`,
      choices: [
        { title: "Zod", value: 0 },
        { title: "Valibot", value: 1 },
        { title: "ArkType", value: 2 },
        { title: "TypeBox", value: 3 },
      ].filter((c) => detectedValidators.includes(c.value)),
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

    await installBehavior("core", config);
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

    // Always ensure core is installed (check registry file existence)
    if (behaviorName !== "core") {
      const registryPath = path.resolve(process.cwd(), config.paths.registry);
      if (!fs.existsSync(registryPath)) {
        console.log("Core files not found. Installing core...");
        await installBehavior("core", config);
      }
    }

    await installBehavior(
      behaviorName,
      config,
      await getValidatorType(behaviorName),
    );
    process.exit(0);
  }

  console.error("Usage: behavior-cn <command> [args]");
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
