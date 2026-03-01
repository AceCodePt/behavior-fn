import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import { detectEnvironment } from "../utils/detect";
import type { Config } from "../schemas/config";
import type { PackageName } from "../validators/index";
import { CONFIG_FILE, detectAndValidatePlatform } from "./shared";
import { installBehavior } from "./install-behavior";
import type { BehaviorRegistry } from "../schemas/registry";

/**
 * Parse CLI flags from process.argv
 */
function parseFlags(args: string[]): Record<string, string | boolean> {
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

export async function initCommand(
  args: string[],
  registry: BehaviorRegistry,
  __dirname: string,
) {
  const flags = parseFlags(args);

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
  let useAliases: boolean;

  // Check for --defaults flag
  if (flags.defaults || flags.d) {
    // Use defaults
    validatorChoice = flags.validator
      ? (flags.validator as PackageName)
      : "zod";
    pathChoice = flags.path ? (flags.path as string) : detected.suggestedPath;
    // Default to aliases unless explicitly disabled
    useAliases = !flags["no-aliases"];

    console.log(`✓ Using defaults: ${validatorChoice}, ${pathChoice}, aliases: ${useAliases}`);
  } else {
    // Interactive mode - ask 3 questions
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
      {
        type: "confirm",
        name: "useAliases",
        message: "Use path aliases (e.g., ~types) for cleaner imports?",
        initial: true,
      },
    ]);

    // Handle user cancellation
    if (!response.validator || !response.path || response.useAliases === undefined) {
      console.log("Init cancelled.");
      process.exit(1);
    }

    validatorChoice = flags.validator
      ? (flags.validator as PackageName)
      : response.validator;
    pathChoice = flags.path ? (flags.path as string) : response.path;
    useAliases = flags["no-aliases"] ? false : response.useAliases;
  }

  // Override TypeScript detection if --no-ts flag is present
  const useTypeScript = flags["no-ts"] ? false : detected.typescript;

  // Override package manager if --pm flag is present
  const packageManager = flags.pm
    ? (flags.pm as string)
    : detected.packageManager;

  // Create unified config with paths and optional aliases
  const config: Config = {
    validator: validatorChoice,
    paths: {
      behaviors: pathChoice,
      utils: {
        path: path.join(pathChoice, "../behavior-utils.ts"),
        ...(useAliases && { alias: "~utils" }),
      },
      registry: {
        path: path.join(pathChoice, "behavior-registry.ts"),
        ...(useAliases && { alias: "~registry" }),
      },
      testUtils: {
        path: "tests/utils/command-test-harness.ts",
        ...(useAliases && { alias: "~test-utils" }),
      },
      host: {
        path: path.join(pathChoice, "../behavioral-host.ts"),
        ...(useAliases && { alias: "~host" }),
      },
      types: {
        path: path.join(pathChoice, "../types.ts"),
        ...(useAliases && { alias: "~types" }),
      },
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
  await installBehavior("core", config, registry, __dirname, validatorChoice, platform);
  
  // Show next steps
  console.log("");
  console.log("✅ Initialization complete!");
  if (useAliases) {
    console.log("");
    console.log("⚠️  Next step: Configure path aliases in tsconfig.json:");
    console.log("");
    console.log('  "compilerOptions": {');
    console.log('    "baseUrl": ".",');
    console.log('    "paths": {');
    
    // Generate paths dynamically from config
    const pathEntries = [
      { alias: config.paths.types.alias, path: config.paths.types.path },
      { alias: config.paths.utils.alias, path: config.paths.utils.path },
      { alias: config.paths.registry.alias, path: config.paths.registry.path },
      { alias: config.paths.host.alias, path: config.paths.host.path },
      { alias: config.paths.testUtils.alias, path: config.paths.testUtils.path },
    ];
    
    pathEntries.forEach(({ alias, path: filePath }, index) => {
      if (alias) {
        const comma = index < pathEntries.length - 1 ? ',' : '';
        // Remove .ts extension for tsconfig paths
        const pathWithoutExt = filePath.replace(/\.ts$/, '');
        console.log(`      "${alias}": ["./${pathWithoutExt}"]${comma}`);
      }
    });
    
    console.log('    }');
    console.log('  }');
    console.log("");
    console.log("📖 See: https://www.typescriptlang.org/tsconfig#paths");
  }
}
