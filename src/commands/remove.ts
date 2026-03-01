import fs from "node:fs";
import path from "node:path";
import { validateBehaviorName, behaviorExists } from "../utils/validation";
import { validateJsonFile } from "../schemas/validation";
import { BehaviorRegistrySchema } from "../schemas/registry";
import type { BehaviorRegistry } from "../schemas/registry";

export async function removeBehavior(name: string, __dirname: string) {
  // Validate behavior name
  const validation = validateBehaviorName(name);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(1);
  }

  // Determine the registry root
  const registryRoot = fs.existsSync(path.join(__dirname, "index.ts"))
    ? __dirname
    : path.join(__dirname, "..");

  // Reload and validate registry to get latest state
  const registryJsonPath = path.join(
    registryRoot,
    "registry/behaviors-registry.json",
  );
  const currentRegistry = validateJsonFile<BehaviorRegistry>(
    BehaviorRegistrySchema,
    registryJsonPath,
    "behaviors registry"
  );

  // Check if behavior exists
  if (!behaviorExists(name, currentRegistry)) {
    console.error(`Error: Behavior "${name}" does not exist in registry.`);
    process.exit(1);
  }

  // Don't allow removing core
  if (name === "core") {
    console.error(
      `Error: Cannot remove "core" behavior. It is required by the system.`,
    );
    process.exit(1);
  }

  const behaviorDir = path.join(registryRoot, "registry/behaviors", name);

  // Check if directory exists
  if (!fs.existsSync(behaviorDir)) {
    console.error(`Error: Directory "${behaviorDir}" does not exist.`);
    process.exit(1);
  }

  console.log(`Removing behavior: ${name}...`);

  // Remove directory
  fs.rmSync(behaviorDir, { recursive: true, force: true });
  console.log(`  Deleted ${path.relative(registryRoot, behaviorDir)}`);

  // Update registry
  const registryIndex = currentRegistry.findIndex((b: any) => b.name === name);
  if (registryIndex !== -1) {
    currentRegistry.splice(registryIndex, 1);
    fs.writeFileSync(
      registryJsonPath,
      JSON.stringify(currentRegistry, null, 2) + "\n",
    );
    console.log(`  Updated registry`);
  }

  console.log(`\nBehavior "${name}" removed successfully!`);
}
