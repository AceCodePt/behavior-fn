import fs from "node:fs";
import path from "node:path";
import { validateBehaviorName, behaviorExists } from "../utils/validation";
import {
  generateBehaviorDefinition,
  generateSchema,
  generateBehavior,
  generateTest,
} from "../templates/behavior-templates";
import type { BehaviorRegistry } from "../schemas/registry";

export async function createBehavior(
  name: string,
  registry: BehaviorRegistry,
  __dirname: string,
) {
  // Validate behavior name
  const validation = validateBehaviorName(name);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(1);
  }

  // Check if behavior already exists
  if (behaviorExists(name, registry)) {
    console.error(`Error: Behavior "${name}" already exists in registry.`);
    process.exit(1);
  }

  // Determine the registry root (handle both dev and built scenarios)
  const registryRoot = fs.existsSync(path.join(__dirname, "index.ts"))
    ? __dirname
    : path.join(__dirname, "..");

  // Create behavior directory
  const behaviorDir = path.join(registryRoot, "registry/behaviors", name);
  if (fs.existsSync(behaviorDir)) {
    console.error(`Error: Directory "${behaviorDir}" already exists.`);
    process.exit(1);
  }

  console.log(`Creating behavior: ${name}...`);
  fs.mkdirSync(behaviorDir, { recursive: true });

  // Generate and write files (4-file standard structure)
  const files = [
    {
      name: "_behavior-definition.ts",
      content: generateBehaviorDefinition(name),
    },
    { name: "schema.ts", content: generateSchema(name) },
    { name: "behavior.ts", content: generateBehavior(name) },
    { name: "behavior.test.ts", content: generateTest(name) },
  ];

  for (const file of files) {
    const filePath = path.join(behaviorDir, file.name);
    fs.writeFileSync(filePath, file.content);
    console.log(`  Created ${path.relative(__dirname, filePath)}`);
  }

  // Update registry (4-file standard structure)
  const newEntry = {
    name,
    dependencies: [],
    files: [
      { path: `${name}/_behavior-definition.ts` },
      { path: `${name}/schema.ts` },
      { path: `${name}/behavior.ts` },
      { path: `${name}/behavior.test.ts` },
    ],
  };

  registry.push(newEntry);
  const registryJsonPath = path.join(
    registryRoot,
    "registry/behaviors-registry.json",
  );
  fs.writeFileSync(registryJsonPath, JSON.stringify(registry, null, 2) + "\n");
  console.log(`  Updated registry`);

  console.log(`\nBehavior "${name}" created successfully!`);
  console.log(`\nNext steps:`);
  console.log(
    `  1. Edit registry/behaviors/${name}/schema.ts to define attributes`,
  );
  console.log(`  2. Implement logic in registry/behaviors/${name}/behavior.ts`);
  console.log(
    `  3. Write tests in registry/behaviors/${name}/behavior.test.ts`,
  );
  console.log(`  4. Run 'pnpm test' to verify your implementation`);
}
