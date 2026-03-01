import fs from "node:fs";
import path from "node:path";
import type { Config } from "../schemas/config";
import { ConfigSchema } from "../schemas/config";
import { validateJson, validateJsonFile } from "../schemas/validation";
import type { PackageName } from "../validators/index";
import { detectPlatform, type PlatformStrategy } from "../platforms/index";

export const CONFIG_FILE = "behavior.config.json";

export function loadConfig(): Config | null {
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
export function detectAndValidatePlatform(): PlatformStrategy {
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

/**
 * Rewrite imports based on config.
 * If an alias is provided, use it. Otherwise, calculate relative path.
 */
export function rewriteImports(
  content: string,
  config: Config,
  currentFilePath: string
): string {
  const replacements = [
    { alias: "~utils", fileConfig: config.paths.utils },
    { alias: "~registry", fileConfig: config.paths.registry },
    { alias: "~test-utils", fileConfig: config.paths.testUtils },
    { alias: "~host", fileConfig: config.paths.host },
    { alias: "~types", fileConfig: config.paths.types },
  ];

  let result = content;
  for (const { alias, fileConfig } of replacements) {
    // If alias is defined in config, use it
    if (fileConfig.alias) {
      result = result.replace(new RegExp(alias, "g"), fileConfig.alias);
    } else {
      // Calculate relative path from current file to target file
      const currentDir = path.dirname(currentFilePath);
      const targetPath = path.resolve(process.cwd(), fileConfig.path);
      const relativePath = path
        .relative(currentDir, targetPath)
        .replace(/\.ts$/, "")
        .replace(/\\/g, "/");

      result = result.replace(new RegExp(alias, "g"), relativePath);
    }
  }

  return result;
}
