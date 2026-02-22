import fs from "node:fs";
import path from "node:path";

export function detectValidatorFromPackageJson(cwd: string = process.cwd()): number[] {
  try {
    const pkgPath = path.join(cwd, "package.json");
    if (!fs.existsSync(pkgPath)) return [0]; // Default to Zod

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const validators: number[] = [];

    if (allDeps["zod"]) validators.push(0);
    if (allDeps["valibot"]) validators.push(1);
    if (allDeps["arktype"]) validators.push(2);
    if (allDeps["@sinclair/typebox"]) validators.push(3);

    return validators.length > 0 ? validators : [0]; // Default to Zod if none found
  } catch (e) {
    return [0];
  }
}
