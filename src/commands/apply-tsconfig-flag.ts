/**
 * Apply TSConfig Flag Command
 * 
 * Intelligently discovers TypeScript config files, prompts for selection,
 * and applies BehaviorFN-specific compiler options.
 */

import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import { loadConfig } from "./shared";
import {
  findTsConfigFiles,
  validateTsConfig,
  parseTsConfig,
  createBackup,
  mergeTsConfig,
  getBehaviorFNCompilerOptions,
  formatChanges,
  writeTsConfig,
} from "../utils/tsconfig";

/**
 * Parse CLI flags for apply-tsconfig-flag command.
 */
function parseFlags(args: string[]): {
  config?: string;
  yes: boolean;
  noBackup: boolean;
  dryRun: boolean;
} {
  const flags = {
    config: undefined as string | undefined,
    yes: false,
    noBackup: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--config" && i + 1 < args.length) {
      flags.config = args[i + 1];
      i++; // Skip next arg
    } else if (arg.startsWith("--config=")) {
      flags.config = arg.split("=")[1];
    } else if (arg === "--yes" || arg === "-y") {
      flags.yes = true;
    } else if (arg === "--no-backup") {
      flags.noBackup = true;
    } else if (arg === "--dry-run") {
      flags.dryRun = true;
    }
  }

  return flags;
}

/**
 * Select a tsconfig file from discovered configs or manual input.
 * 
 * @param configs - List of discovered tsconfig files
 * @param cwd - Current working directory
 * @returns Path to selected tsconfig file
 */
async function selectTsConfig(
  configs: string[],
  cwd: string
): Promise<string | null> {
  if (configs.length === 0) {
    console.error("❌ No tsconfig files found in project.");
    console.error("   Please create a tsconfig.json file first.");
    return null;
  }

  // Auto-select if only one config
  if (configs.length === 1) {
    console.log(`✓ Found single tsconfig: ${configs[0]}`);
    return path.join(cwd, configs[0]);
  }

  // Multiple configs - prompt for selection
  console.log(`\nFound ${configs.length} TypeScript configuration files:`);
  configs.forEach((config, idx) => {
    console.log(`  ${idx + 1}. ${config}`);
  });
  console.log("");

  const response = await prompts({
    type: "autocomplete",
    name: "config",
    message: "Select tsconfig file to modify (or type custom path):",
    choices: [
      ...configs.map((c) => ({ title: c, value: c })),
      { title: "[Type custom path...]", value: "" },
    ],
    suggest: async (input: string, choices: any[]) => {
      if (!input) return choices;

      // Check if input matches any choice
      const matchedChoice = choices.find((c) => c.value === input);
      if (matchedChoice) return [matchedChoice];

      // Allow custom input
      return [
        { title: `Custom: ${input}`, value: input },
        ...choices.filter((c) => c.title.toLowerCase().includes(input.toLowerCase())),
      ];
    },
  });

  if (!response.config) {
    console.log("Operation cancelled.");
    return null;
  }

  // Resolve path (handle both relative and absolute)
  const selectedPath = path.isAbsolute(response.config)
    ? response.config
    : path.join(cwd, response.config);

  // Validate custom path if not in discovered list
  if (!configs.includes(response.config)) {
    console.log(`\n✓ Validating ${response.config}...`);
    const validation = validateTsConfig(selectedPath);
    if (!validation.valid) {
      console.error(`❌ ${validation.error}`);
      return null;
    }
  }

  return selectedPath;
}

/**
 * Preview changes and get user confirmation.
 * 
 * @param changes - List of changes to display
 * @param skipConfirmation - Skip confirmation prompt
 * @returns True if user confirms (or skip is true)
 */
async function confirmChanges(
  changes: string[],
  skipConfirmation: boolean
): Promise<boolean> {
  if (changes.length === 0) {
    console.log("\n✓ No changes needed - tsconfig already has required settings.");
    return false;
  }

  console.log("\nThe following changes will be applied:");
  for (const change of changes) {
    console.log(`  ${change}`);
  }
  console.log("");

  if (skipConfirmation) {
    return true;
  }

  const response = await prompts({
    type: "confirm",
    name: "confirmed",
    message: "Apply these changes?",
    initial: true,
  });

  return response.confirmed ?? false;
}

/**
 * Main command handler for apply-tsconfig-flag.
 */
export async function applyTsConfigFlag(args: string[]): Promise<void> {
  const cwd = process.cwd();
  const flags = parseFlags(args);

  // Load behavior config
  const config = loadConfig();
  if (!config) {
    console.error("❌ behavior.config.json not found.");
    console.error("   Please run 'behavior-fn init' first.");
    process.exit(1);
  }

  console.log("Scanning for TypeScript configuration files...\n");

  let selectedPath: string | null;

  // If --config flag provided, use it directly
  if (flags.config) {
    selectedPath = path.isAbsolute(flags.config)
      ? flags.config
      : path.join(cwd, flags.config);

    console.log(`Using specified config: ${flags.config}`);

    // Validate
    const validation = validateTsConfig(selectedPath);
    if (!validation.valid) {
      console.error(`❌ ${validation.error}`);
      process.exit(1);
    }
  } else {
    // Discover configs
    const discoveredConfigs = findTsConfigFiles(cwd);
    selectedPath = await selectTsConfig(discoveredConfigs, cwd);

    if (!selectedPath) {
      process.exit(1);
    }
  }

  // Parse existing config
  let existingConfig: any;
  try {
    existingConfig = parseTsConfig(selectedPath);
  } catch (error) {
    console.error(
      `❌ Failed to parse tsconfig: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  // Get BehaviorFN compiler options
  const behaviorFNOptions = getBehaviorFNCompilerOptions(config);

  // Merge configs
  const mergedConfig = mergeTsConfig(existingConfig, behaviorFNOptions);

  // Format changes
  const changes = formatChanges(existingConfig, mergedConfig);

  // Show changes and get confirmation
  const confirmed = await confirmChanges(changes, flags.yes);
  if (!confirmed) {
    if (changes.length > 0) {
      console.log("Operation cancelled.");
    }
    return;
  }

  // Dry-run mode - exit after showing changes
  if (flags.dryRun) {
    console.log("✓ Dry-run mode - no changes written.");
    return;
  }

  // Create backup (unless --no-backup)
  let backupPath: string | undefined;
  if (!flags.noBackup) {
    try {
      backupPath = createBackup(selectedPath);
      console.log(`✓ Backup created: ${path.relative(cwd, backupPath)}`);
    } catch (error) {
      console.error(
        `⚠️  Warning: Failed to create backup: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error("   Proceeding without backup...");
    }
  }

  // Write merged config
  try {
    writeTsConfig(selectedPath, mergedConfig);
    console.log(`\n✅ ${path.relative(cwd, selectedPath)} updated successfully!`);
  } catch (error) {
    console.error(
      `❌ Failed to write config: ${error instanceof Error ? error.message : String(error)}`
    );

    // Attempt rollback if backup exists
    if (backupPath && fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, selectedPath);
        console.log("✓ Rolled back to backup.");
      } catch (rollbackError) {
        console.error(
          `❌ Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`
        );
      }
    }

    process.exit(1);
  }

  // Validate written config
  const validation = validateTsConfig(selectedPath);
  if (!validation.valid) {
    console.error(`⚠️  Warning: Written config appears invalid: ${validation.error}`);
    if (backupPath) {
      console.error(`   You can restore from backup: ${backupPath}`);
    }
  }
}
