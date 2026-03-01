import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type { BehaviorRegistry } from "../schemas/registry";
import type { AttributeSchema } from "../types/schema";
import type { Config } from "../schemas/config";
import { getValidator, type PackageName } from "../validators/index";
import type { PlatformStrategy } from "../platforms/index";
import { detectAndValidatePlatform, rewriteImports } from "./shared";

let jiti: {
  import: <T>(id: string) => Promise<T>;
} | null = null;

export async function installBehavior(
  name: string,
  config: Config,
  registry: BehaviorRegistry,
  __dirname: string,
  validatorPackageName: PackageName = "zod",
  platform?: PlatformStrategy,
  includeTests: boolean = true,
) {
  const behavior = registry.find((b) => b.name === name);
  if (!behavior) {
    console.error(`Behavior "${name}" not found in registry.`);
    process.exit(1);
  }

  // Get validator
  const validator = getValidator(validatorPackageName);

  console.log(`Installing behavior: ${name}...`);

  // Install files
  for (const file of behavior.files) {
    // Skip test files if not requested (silent skip - only log installs)
    if (!includeTests && file.path.endsWith(".test.ts")) {
      continue;
    }

    let targetDir = config.paths.behaviors;
    let fileName = file.path;

    // Determine target directory based on file type/path
    if (file.path === "behavior-utils.ts") {
      targetDir = path.dirname(config.paths.utils.path);
      fileName = path.basename(config.paths.utils.path);
    } else if (file.path === "types.ts") {
      targetDir = path.dirname(config.paths.types.path);
      fileName = path.basename(config.paths.types.path);
    } else if (file.path === "behavior-registry.ts") {
      targetDir = path.dirname(config.paths.registry.path);
      fileName = path.basename(config.paths.registry.path);
    } else if (file.path === "behavioral-host.ts") {
      targetDir = path.dirname(config.paths.host.path);
      fileName = path.basename(config.paths.host.path);
    } else if (file.path === "command-test-harness.ts") {
      targetDir = path.dirname(config.paths.testUtils.path);
      fileName = path.basename(config.paths.testUtils.path);
    }

    // Resolve absolute path
    const absoluteTargetDir = path.resolve(process.cwd(), targetDir);
    const filePath = path.join(absoluteTargetDir, fileName);

    if (!fs.existsSync(absoluteTargetDir)) {
      fs.mkdirSync(absoluteTargetDir, { recursive: true });
    }

    const sourcePath = path.join(__dirname, "registry/behaviors", file.path);
    let content = fs.readFileSync(sourcePath, "utf-8");

    // Transform schema files if needed
    if (file.path.endsWith("schema.ts")) {
      try {
        // Lazy load jiti only when needed
        if (!jiti) {
          const { createJiti } = await import("jiti");
          jiti = createJiti(path.join(__dirname, "index.ts"));
        }
        // Use jiti to import TypeScript schema files at runtime
        // jiti handles both .ts (dev) and .js (built) transparently
        const schemaPath = path.join(
          __dirname,
          "registry/behaviors",
          file.path,
        );
        const mod = await jiti.import<{ schema?: AttributeSchema }>(schemaPath);
        if (mod.schema) {
          content = validator.transformSchema(mod.schema, content);
        }
      } catch (e) {
        console.warn(`Failed to transform schema for ${file.path}:`, e);
      }
    }

    // Rewrite imports
    content = rewriteImports(content, config, filePath);

    // Platform specific adjustments
    if (file.path === "behavior-utils.ts") {
      // Detect platform if not provided
      const activePlatform = platform || detectAndValidatePlatform();

      // Transform isServer check
      content = content.replace(
        "export const isServer = () => typeof window === 'undefined';",
        activePlatform.transformIsServerCheck(),
      );

      // Apply platform-specific utils transformations if available
      if (activePlatform.transformBehaviorUtils) {
        content = activePlatform.transformBehaviorUtils(content);
      }

      // Add platform-specific imports if available
      const platformImports = activePlatform.getAdditionalImports?.();
      if (platformImports) {
        content = `${platformImports}\n` + content;
      }

      // Optimize getObservedAttributes for the selected validator
      const imports = validator.getUtilsImports();
      if (imports) {
        content = `${imports}\n` + content;
      }

      const observedAttributesCode = validator.getObservedAttributesCode();
      if (observedAttributesCode) {
        content = content.replace(
          /export const getObservedAttributes = [\s\S]*?^};/m,
          observedAttributesCode,
        );
      }
    }

    // Platform specific registry transformations
    if (file.path === "behavior-registry.ts") {
      const activePlatform = platform || detectAndValidatePlatform();
      if (activePlatform.transformRegistry) {
        content = activePlatform.transformRegistry(content);
      }
    }

    // Transform types.ts based on validator
    if (file.path === "types.ts") {
      content = validator.getTypesFileContent();
    }

    // Ensure all parent directories exist before writing
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(`  Created ${path.relative(process.cwd(), filePath)}`);
  }

  // Install dependencies
  if (behavior.dependencies && behavior.dependencies.length > 0) {
    console.log(
      `Installing dependencies: ${behavior.dependencies.join(", ")}...`,
    );
    try {
      execSync(`pnpm add ${behavior.dependencies.join(" ")}`, {
        stdio: "inherit",
      });
    } catch (e) {
      console.error("Failed to install dependencies.");
    }
  }

  console.log(`Behavior "${name}" installed successfully.`);
}
