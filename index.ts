#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BehaviorRegistry } from "./src/schemas/registry";
import { BehaviorRegistrySchema } from "./src/schemas/registry";
import { validateJsonFile } from "./src/schemas/validation";
import { createBehavior } from "./src/commands/create";
import { removeBehavior } from "./src/commands/remove";
import { reapplyBehaviors } from "./src/commands/reapply";
import { listBehaviors } from "./src/commands/list";
import { initCommand } from "./src/commands/init";
import { addCommand } from "./src/commands/add";
import { applyTsConfigFlag } from "./src/commands/apply-tsconfig-flag";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and validate registry
const registryPath = path.join(__dirname, "registry/behaviors-registry.json");
const registry: BehaviorRegistry = validateJsonFile<BehaviorRegistry>(
  BehaviorRegistrySchema,
  registryPath,
  "behaviors registry"
);

const args = process.argv.slice(2);
const command = args[0];
// Extract behavior name (first non-flag argument after command)
const behaviorName = args.find((arg, idx) => idx > 0 && !arg.startsWith("-"));

export async function main() {
  if (command === "create") {
    if (!behaviorName) {
      console.error("Please specify a behavior name.");
      console.error("Usage: behavior-fn create <behavior-name>");
      process.exit(1);
    }

    await createBehavior(behaviorName, registry, __dirname);
    process.exit(0);
  }

  if (command === "remove") {
    if (!behaviorName) {
      console.error("Please specify a behavior name.");
      console.error("Usage: behavior-fn remove <behavior-name>");
      process.exit(1);
    }

    await removeBehavior(behaviorName, __dirname);
    process.exit(0);
  }

  if (command === "init") {
    await initCommand(args, registry, __dirname);
    process.exit(0);
  }

  if (command === "add") {
    if (!behaviorName) {
      console.error("Please specify a behavior name.");
      process.exit(1);
    }

    await addCommand(behaviorName, args, registry, __dirname);
    process.exit(0);
  }

  if (command === "reapply") {
    await reapplyBehaviors(args, registry, __dirname);
    process.exit(0);
  }

  if (command === "list") {
    const jsonOutput = args.includes("--json") || args.includes("-j");
    await listBehaviors(jsonOutput, registry, __dirname);
    process.exit(0);
  }

  if (command === "apply-tsconfig-flag") {
    await applyTsConfigFlag(args.slice(1));
    process.exit(0);
  }

  console.error("Usage: behavior-fn <command> [args]");
  console.error("Commands:");
  console.error(
    "  init [options]         Initialize the behavior registry (installs core files)",
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
  console.error(
    "  reapply [options]      Regenerate all installed behaviors with current config",
  );
  console.error(
    "  list [options]         List all available behaviors in the registry",
  );
  console.error(
    "  apply-tsconfig-flag [options]",
  );
  console.error(
    "                         Apply BehaviorFN TypeScript configuration",
  );
  console.error("");
  console.error("Options for 'init' command:");
  console.error(
    "  -d, --defaults         Use default options without prompts",
  );
  console.error(
    "  --no-aliases           Use relative imports instead of path aliases",
  );
  console.error("");
  console.error("Options for 'add' command:");
  console.error(
    "  -t, --with-tests       Include test files for reference/learning",
  );
  console.error("");
  console.error("Options for 'reapply' command:");
  console.error(
    "  -y, --yes              Skip confirmation prompt",
  );
  console.error(
    "  --no-backup            Skip backup creation",
  );
  console.error(
    "  --with-tests           Include test files (override config)",
  );
  console.error(
    "  --no-tests             Exclude test files (override config)",
  );
  console.error("");
  console.error("Options for 'list' command:");
  console.error(
    "  -j, --json             Output as JSON",
  );
  console.error("");
  console.error("Options for 'apply-tsconfig-flag' command:");
  console.error(
    "  --config <path>        Specify tsconfig file (skip discovery)",
  );
  console.error(
    "  -y, --yes              Skip confirmation prompt",
  );
  console.error(
    "  --dry-run              Preview changes without writing",
  );
  console.error(
    "  --no-backup            Skip backup creation",
  );
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
