import fs from "node:fs";
import path from "node:path";
import type { PlatformStrategy } from "./platform-strategy";

export class AstroPlatform implements PlatformStrategy {
  readonly name = "astro";
  readonly label = "Astro";

  detect(cwd: string): boolean {
    const files = fs.readdirSync(cwd);
    return files.some((f) => f.startsWith("astro.config."));
  }

  validate(cwd: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // Check for package.json
    const packageJsonPath = path.join(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      errors.push("package.json not found");
      return { valid: false, errors };
    }

    // Check for astro in dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const hasAstro = 
        (packageJson.dependencies && packageJson.dependencies.astro) ||
        (packageJson.devDependencies && packageJson.devDependencies.astro);
      
      if (!hasAstro) {
        errors.push("astro not found in dependencies");
      }
    } catch (e) {
      errors.push("Failed to parse package.json");
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  transformIsServerCheck(): string {
    return "export const isServer = () => import.meta.env.SSR;";
  }
}
