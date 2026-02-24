import fs from "node:fs";
import path from "node:path";
import { 
  validators, 
  zodValidator, 
  zodMiniValidator,
  type ValidatorId 
} from "../validators/index";

// Build a map from package name to validator ID
const packageToValidatorId = validators.reduce((map, validator) => {
  map[validator.packageName] = validator.id;
  return map;
}, {} as Record<string, ValidatorId>);

export function detectValidatorFromPackageJson(cwd: string = process.cwd()): ValidatorId[] {
  try {
    const pkgPath = path.join(cwd, "package.json");
    
    if (!fs.existsSync(pkgPath)) return [zodValidator.id];

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const detectedValidators: ValidatorId[] = [];

    // Special case: Zod and Zod Mini both use "zod" package
    if (allDeps["zod"]) {
      detectedValidators.push(zodValidator.id);
      detectedValidators.push(zodMiniValidator.id);
    }

    // Check other validators' package names
    for (const [packageName, validatorId] of Object.entries(packageToValidatorId)) {
      // Skip "zod" since we handled it above
      if (packageName === "zod") continue;
      
      if (allDeps[packageName]) {
        detectedValidators.push(validatorId);
      }
    }

    return detectedValidators.length > 0 ? detectedValidators : [zodValidator.id];
  } catch (e) {
    // Fallback to Zod
    return [zodValidator.id];
  }
}
