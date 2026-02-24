import fs from "node:fs";
import path from "node:path";
import { 
  validators, 
  zodValidator, 
  zodMiniValidator,
  type PackageName 
} from "../validators/index";

export function detectValidatorFromPackageJson(cwd: string = process.cwd()): PackageName[] {
  try {
    const pkgPath = path.join(cwd, "package.json");
    
    if (!fs.existsSync(pkgPath)) return [zodValidator.packageName];

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const detectedValidators: PackageName[] = [];

    // Special case: Zod and Zod Mini both use "zod" package
    if (allDeps["zod"]) {
      detectedValidators.push(zodValidator.packageName);
      detectedValidators.push(zodMiniValidator.packageName);
    }

    // Check other validators' package names
    for (const validator of validators) {
      // Skip "zod" since we handled it above
      if (validator.packageName === "zod") continue;
      
      if (allDeps[validator.packageName]) {
        detectedValidators.push(validator.packageName);
      }
    }

    return detectedValidators.length > 0 ? detectedValidators : [zodValidator.packageName];
  } catch (e) {
    // Fallback to Zod
    return [zodValidator.packageName];
  }
}
