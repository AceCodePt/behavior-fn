/**
 * TypeScript Configuration Utilities
 * 
 * Utilities for discovering, parsing, merging, and validating tsconfig files.
 */

import fs from "node:fs";
import path from "node:path";
import type { Config } from "../schemas/config";

/**
 * Recursively find all tsconfig*.json files in a directory.
 * Excludes node_modules and returns paths relative to baseDir.
 * 
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative paths (defaults to dir)
 * @param results - Accumulator for results (internal use)
 * @returns Array of relative paths to tsconfig files
 */
export function findTsConfigFiles(
  dir: string,
  baseDir: string = dir,
  results: string[] = []
): string[] {
  let entries: fs.Dirent[];
  
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    // Skip directories we can't read (permissions, etc.)
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules
    if (entry.isDirectory() && entry.name === "node_modules") {
      continue;
    }

    // Recurse into directories
    if (entry.isDirectory()) {
      findTsConfigFiles(fullPath, baseDir, results);
      continue;
    }

    // Match tsconfig*.json files
    if (entry.isFile() && /^tsconfig.*\.json$/.test(entry.name)) {
      const relativePath = path.relative(baseDir, fullPath);
      results.push(relativePath);
    }
  }

  return results;
}

/**
 * Validate that a tsconfig file exists and is valid JSON.
 * 
 * @param filePath - Path to tsconfig file
 * @returns Validation result
 */
export function validateTsConfig(filePath: string): {
  valid: boolean;
  error?: string;
} {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: `File not found: ${filePath}` };
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Safely parse a tsconfig file.
 * 
 * @param filePath - Path to tsconfig file
 * @returns Parsed config object
 * @throws Error if file cannot be parsed
 */
export function parseTsConfig(filePath: string): any {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Create a timestamped backup of a tsconfig file.
 * 
 * @param filePath - Path to tsconfig file
 * @returns Path to backup file
 */
export function createBackup(filePath: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .slice(0, 15); // YYYYMMDD-HHMMSS
  
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath, ".json");
  const backupPath = path.join(dir, `.${basename}.backup.${timestamp}.json`);

  const content = fs.readFileSync(filePath, "utf-8");
  fs.writeFileSync(backupPath, content, "utf-8");

  return backupPath;
}

/**
 * Deep merge two objects, with special handling for arrays.
 * Arrays are merged as unique sets (union).
 * 
 * @param target - Target object (user's existing config)
 * @param source - Source object (BehaviorFN additions)
 * @returns Merged object
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = result[key];

    // If target doesn't have this key, just set it
    if (!(key in result)) {
      result[key] = sourceValue;
      continue;
    }

    // If both are arrays, merge as unique set
    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      result[key] = [...new Set([...targetValue, ...sourceValue])];
      continue;
    }

    // If both are objects, recurse
    if (
      typeof targetValue === "object" &&
      targetValue !== null &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(targetValue) &&
      !Array.isArray(sourceValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
      continue;
    }

    // For primitives, only override if target value is undefined/null
    if (targetValue === undefined || targetValue === null) {
      result[key] = sourceValue;
    }
    // Otherwise preserve user's setting
  }

  return result;
}

/**
 * Merge BehaviorFN compiler options into existing tsconfig.
 * Preserves all user settings while adding required BehaviorFN options.
 * 
 * @param existing - Existing tsconfig object
 * @param additions - BehaviorFN compiler options to add
 * @returns Merged tsconfig object
 */
export function mergeTsConfig(existing: any, additions: any): any {
  return deepMerge(existing, additions);
}

/**
 * Extract path aliases from behavior config in tsconfig format.
 * Only includes paths that have an alias defined in the config.
 * 
 * @param config - Behavior config
 * @returns Path aliases object for tsconfig.compilerOptions.paths
 */
export function extractPathAliases(config: Config): Record<string, string[]> {
  const aliases: Record<string, string[]> = {};

  // Helper to add alias if it exists in config
  const addAlias = (fileConfig: { path: string; alias?: string }) => {
    if (fileConfig.alias) {
      // Remove .ts extension for tsconfig paths
      const pathWithoutExt = fileConfig.path.replace(/\.ts$/, "");
      aliases[fileConfig.alias] = [`./${pathWithoutExt}`];
    }
  };

  addAlias(config.paths.registry);
  addAlias(config.paths.host);
  addAlias(config.paths.utils);
  addAlias(config.paths.testUtils);
  addAlias(config.paths.types);

  return aliases;
}

/**
 * Get BehaviorFN-required compiler options.
 * These are the minimal settings needed for BehaviorFN to work correctly.
 * 
 * @param config - Behavior config (for path aliases)
 * @returns Compiler options object
 */
export function getBehaviorFNCompilerOptions(config: Config): any {
  const pathAliases = extractPathAliases(config);
  const hasAliases = Object.keys(pathAliases).length > 0;

  return {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      customElements: "scoped",
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      // Only add baseUrl and paths if user opted into aliases
      ...(hasAliases && {
        baseUrl: ".",
        paths: pathAliases,
      }),
    },
  };
}

/**
 * Format the changes to be applied as a human-readable diff.
 * 
 * @param existing - Existing config
 * @param merged - Merged config
 * @returns Array of change descriptions
 */
export function formatChanges(existing: any, merged: any): string[] {
  const changes: string[] = [];

  function compareObjects(
    existingObj: any,
    mergedObj: any,
    prefix: string = ""
  ): void {
    for (const key of Object.keys(mergedObj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const existingValue = existingObj?.[key];
      const mergedValue = mergedObj[key];

      // Skip if identical
      if (JSON.stringify(existingValue) === JSON.stringify(mergedValue)) {
        continue;
      }

      // Handle arrays
      if (Array.isArray(mergedValue)) {
        const existingArr = Array.isArray(existingValue) ? existingValue : [];
        const added = mergedValue.filter((v: any) => !existingArr.includes(v));
        if (added.length > 0) {
          changes.push(`+ ${path} += ${JSON.stringify(added)}`);
        }
        continue;
      }

      // Handle objects
      if (
        typeof mergedValue === "object" &&
        mergedValue !== null &&
        !Array.isArray(mergedValue)
      ) {
        compareObjects(existingValue, mergedValue, path);
        continue;
      }

      // Handle primitives
      if (existingValue === undefined || existingValue === null) {
        changes.push(`+ ${path} = ${JSON.stringify(mergedValue)}`);
      } else {
        changes.push(
          `~ ${path}: ${JSON.stringify(existingValue)} → ${JSON.stringify(mergedValue)}`
        );
      }
    }
  }

  compareObjects(existing, merged);
  return changes;
}

/**
 * Write tsconfig with preserved formatting (2-space indentation).
 * 
 * @param filePath - Path to write to
 * @param config - Config object to write
 */
export function writeTsConfig(filePath: string, config: any): void {
  const content = JSON.stringify(config, null, 2);
  fs.writeFileSync(filePath, content + "\n", "utf-8");
}
