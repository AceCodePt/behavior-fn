import fs from "node:fs";
import path from "node:path";

export function detectValidatorFromPackageJson(cwd: string = process.cwd()): number {
  try {
    const pkgPath = path.join(cwd, "package.json");
    if (!fs.existsSync(pkgPath)) return 0; // Default to Zod

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps["zod"]) return 0;
    if (allDeps["valibot"]) return 1;
    if (allDeps["arktype"]) return 2;
    if (allDeps["@sinclair/typebox"]) return 3;

    return 0; // Default to Zod
  } catch (e) {
    return 0;
  }
}
