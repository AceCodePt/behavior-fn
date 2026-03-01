import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import { detectValidatorFromPackageJson } from "../utils/detect-validator";
import { validators, type PackageName } from "../validators/index";
import { loadConfig, CONFIG_FILE, detectAndValidatePlatform } from "./shared";
import { installBehavior } from "./install-behavior";
import type { BehaviorRegistry } from "../schemas/registry";

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

export async function addCommand(
  behaviorName: string,
  args: string[],
  registry: BehaviorRegistry,
  __dirname: string,
) {
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

  // Parse flags for includeTests
  const flags = {
    withTests: args.includes("--with-tests") || args.includes("-t"),
  };

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
    const registryPath = path.resolve(process.cwd(), config.paths.registry.path);
    if (!fs.existsSync(registryPath)) {
      console.log("Core files not found. Installing core...");
      await installBehavior("core", config, registry, __dirname, validatorChoice, platform);
    }
  }

  await installBehavior(
    behaviorName,
    config,
    registry,
    __dirname,
    validatorChoice,
    platform,
    includeTests,
  );
}
