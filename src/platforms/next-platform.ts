import fs from "node:fs";
import path from "node:path";
import type { PlatformStrategy } from "./platform-strategy";

export class NextPlatform implements PlatformStrategy {
  readonly name = "next";
  readonly label = "Next.js";

  detect(cwd: string): boolean {
    const files = fs.readdirSync(cwd);
    return files.some((f) => f.startsWith("next.config."));
  }

  validate(cwd: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // Check for package.json
    const packageJsonPath = path.join(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      errors.push("package.json not found");
      return { valid: false, errors };
    }

    // Check for next in dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const hasNext = 
        (packageJson.dependencies && packageJson.dependencies.next) ||
        (packageJson.devDependencies && packageJson.devDependencies.next);
      
      if (!hasNext) {
        errors.push("next not found in dependencies");
      }
    } catch (e) {
      errors.push("Failed to parse package.json");
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  transformIsServerCheck(): string {
    // Next.js: Use standard check (could be enhanced with Next.js-specific logic in future)
    return "export const isServer = () => typeof window === 'undefined';";
  }
}
