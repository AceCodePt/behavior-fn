import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import type { Config } from "../schemas/config";
import { loadConfig, CONFIG_FILE, detectAndValidatePlatform } from "./shared";
import { installBehavior } from "./install-behavior";
import type { BehaviorRegistry } from "../schemas/registry";

/**
 * Detect installed behaviors by scanning the filesystem.
 * Returns array of behavior names that are currently installed.
 */
function detectInstalledBehaviors(config: Config): string[] {
  const behaviors: string[] = [];
  const behaviorsDir = path.resolve(process.cwd(), config.paths.behaviors);
  
  // Special case: Check if core is installed (different file structure)
  const registryPath = path.resolve(process.cwd(), config.paths.registry.path);
  if (fs.existsSync(registryPath)) {
    behaviors.push("core");
  }
  
  // Scan behaviors directory
  if (!fs.existsSync(behaviorsDir)) return behaviors;
  
  const entries = fs.readdirSync(behaviorsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    // Check for standard 4-file structure
    const behaviorDir = path.join(behaviorsDir, entry.name);
    const hasDefinition = fs.existsSync(path.join(behaviorDir, "_behavior-definition.ts"));
    const hasSchema = fs.existsSync(path.join(behaviorDir, "schema.ts"));
    const hasBehavior = fs.existsSync(path.join(behaviorDir, "behavior.ts"));
    
    if (hasDefinition && hasSchema && hasBehavior) {
      behaviors.push(entry.name);
    }
  }
  
  return behaviors;
}

/**
 * Create a timestamped backup of files before reapplying.
 * Returns the backup directory path.
 */
function createBackup(config: Config, behaviors: string[]): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('-').substring(0, 19);
  const backupDir = path.join(process.cwd(), '.behavior-backup', timestamp);
  
  fs.mkdirSync(backupDir, { recursive: true });
  
  for (const behaviorName of behaviors) {
    if (behaviorName === "core") {
      // Backup core files
      const coreFiles = [
        config.paths.registry.path,
        config.paths.utils.path,
        config.paths.types.path,
        config.paths.testUtils.path,
        config.paths.host.path,
      ];
      
      for (const filePath of coreFiles) {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absolutePath)) {
          const backupPath = path.join(backupDir, filePath);
          fs.mkdirSync(path.dirname(backupPath), { recursive: true });
          fs.copyFileSync(absolutePath, backupPath);
        }
      }
    } else {
      // Backup behavior directory
      const behaviorDir = path.join(config.paths.behaviors, behaviorName);
      const absoluteBehaviorDir = path.resolve(process.cwd(), behaviorDir);
      
      if (fs.existsSync(absoluteBehaviorDir)) {
        const backupPath = path.join(backupDir, behaviorDir);
        fs.mkdirSync(backupPath, { recursive: true });
        
        // Copy all files in the behavior directory
        const files = fs.readdirSync(absoluteBehaviorDir);
        for (const file of files) {
          const srcPath = path.join(absoluteBehaviorDir, file);
          const destPath = path.join(backupPath, file);
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    }
  }
  
  return backupDir;
}

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

/**
 * Reapply all installed behaviors using current configuration.
 */
export async function reapplyBehaviors(
  args: string[],
  registry: BehaviorRegistry,
  __dirname: string,
) {
  const parsedFlags = parseFlags(args);
  
  // Load config
  const config = loadConfig();
  if (!config) {
    console.error(
      `Configuration file ${CONFIG_FILE} not found. Run "behavior-fn init" first.`,
    );
    process.exit(1);
  }
  
  // Detect installed behaviors
  const installedBehaviors = detectInstalledBehaviors(config);
  
  if (installedBehaviors.length === 0) {
    console.log("No behaviors installed. Nothing to reapply.");
    process.exit(0);
  }
  
  // Display summary
  console.log("Detected installed behaviors:");
  for (const name of installedBehaviors) {
    console.log(`  - ${name}`);
  }
  console.log("");
  console.log("Configuration:");
  console.log(`  Validator: ${config.validator}`);
  console.log(`  Behaviors path: ${config.paths.behaviors}`);
  console.log(`  Aliases: ${config.paths.utils.alias ? "enabled" : "disabled"}`);
  console.log("");
  
  // Determine test files preference
  let includeTests = false;
  if (parsedFlags["with-tests"]) {
    includeTests = true;
  } else if (parsedFlags["no-tests"]) {
    includeTests = false;
  } else if (config.optionalFiles?.tests !== undefined) {
    includeTests = config.optionalFiles.tests;
  }
  
  // Prompt for confirmation unless --yes flag
  if (!parsedFlags.yes && !parsedFlags.y) {
    const response = await prompts({
      type: "confirm",
      name: "confirmed",
      message: `This will regenerate ${installedBehaviors.length} behavior(s). Continue?`,
      initial: true,
    });
    
    if (!response.confirmed) {
      console.log("Reapply cancelled.");
      process.exit(0);
    }
  }
  
  // Create backup unless --no-backup flag
  let backupDir: string | null = null;
  if (!parsedFlags["no-backup"]) {
    backupDir = createBackup(config, installedBehaviors);
    console.log(`✓ Backed up to ${path.relative(process.cwd(), backupDir)}/`);
  }
  
  // Detect platform once
  const platform = detectAndValidatePlatform();
  
  // Reapply each behavior
  const results: Array<{ name: string; success: boolean; error?: string }> = [];
  
  for (const behaviorName of installedBehaviors) {
    try {
      await installBehavior(
        behaviorName,
        config,
        registry,
        __dirname,
        config.validator,
        platform,
        includeTests,
      );
      results.push({ name: behaviorName, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to regenerate ${behaviorName}: ${errorMessage}`);
      results.push({ name: behaviorName, success: false, error: errorMessage });
    }
  }
  
  // Report results
  console.log("");
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  if (failureCount === 0) {
    console.log(`✅ Reapply complete! All ${successCount} behavior(s) regenerated successfully.`);
  } else {
    console.log(`⚠️  Reapply completed with errors:`);
    console.log(`  ✓ ${successCount} succeeded`);
    console.log(`  ✗ ${failureCount} failed`);
    console.log("");
    console.log("Failed behaviors:");
    for (const result of results.filter(r => !r.success)) {
      console.log(`  - ${result.name}: ${result.error}`);
    }
    
    if (backupDir) {
      console.log("");
      console.log(`Backup available at: ${path.relative(process.cwd(), backupDir)}/`);
    }
    
    process.exit(1);
  }
}
