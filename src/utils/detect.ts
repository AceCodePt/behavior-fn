import fs from "node:fs";
import path from "node:path";

/**
 * Package manager lockfile registry (Single Source of Truth)
 * Priority order: pnpm > bun > npm > yarn
 */
export const packageManagers = [
  { lockfile: "pnpm-lock.yaml", name: "pnpm" },
  { lockfile: "bun.lockb", name: "bun" },
  { lockfile: "package-lock.json", name: "npm" },
  { lockfile: "yarn.lock", name: "yarn" },
] as const;

/**
 * Derive PackageManager type from the data (not manually defined)
 */
export type PackageManager = (typeof packageManagers)[number]["name"];

/**
 * Detect if TypeScript is being used in the project.
 * 
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns true if tsconfig.json exists, false otherwise
 */
export function detectTypeScript(cwd: string = process.cwd()): boolean {
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  return fs.existsSync(tsconfigPath);
}

/**
 * Detect which package manager is being used.
 * Checks for lockfiles in priority order defined in packageManagers registry.
 * 
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Detected package manager, defaults to 'npm' if none found
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  for (const { lockfile, name } of packageManagers) {
    if (fs.existsSync(path.join(cwd, lockfile))) {
      return name;
    }
  }

  return "npm"; // Default fallback
}

/**
 * Detect project structure and suggest appropriate behaviors path.
 * 
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Object with structure detection results and suggested path
 */
export function detectProjectStructure(cwd: string = process.cwd()) {
  const hasSrc = fs.existsSync(path.join(cwd, "src"));
  const hasLib = fs.existsSync(path.join(cwd, "lib"));

  let suggestedPath: string;
  
  if (hasSrc) {
    suggestedPath = "./src/behaviors";
  } else if (hasLib) {
    suggestedPath = "./lib/behaviors";
  } else {
    suggestedPath = "./behaviors";
  }

  return {
    hasSrc,
    hasLib,
    suggestedPath,
  };
}

/**
 * Project structure detection result type (inferred from function)
 */
export type ProjectStructure = ReturnType<typeof detectProjectStructure>;

/**
 * Run all detection checks and return combined results.
 * 
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Combined detection results
 */
export function detectEnvironment(cwd: string = process.cwd()) {
  return {
    typescript: detectTypeScript(cwd),
    packageManager: detectPackageManager(cwd),
    ...detectProjectStructure(cwd),
  };
}

/**
 * Environment detection result type (inferred from detectEnvironment return type)
 */
export type DetectionResult = ReturnType<typeof detectEnvironment>;
