import fs from "node:fs";
import path from "node:path";
import type { BehaviorRegistry } from "../schemas/registry";

interface BehaviorMetadata {
  name: string;
  description?: string;
  attributes: string[];
  commands: string[];
  dependencies: string[];
}

export async function listBehaviors(
  jsonOutput: boolean,
  registry: BehaviorRegistry,
  __dirname: string,
) {
  const behaviors: BehaviorMetadata[] = [];

  // Process each behavior in the registry
  for (const entry of registry) {
    // Skip core (not a behavior)
    if (entry.name === "core") {
      continue;
    }

    const metadata: BehaviorMetadata = {
      name: entry.name,
      attributes: [],
      commands: [],
      dependencies: entry.dependencies || [],
    };

    try {
      // Extract description from schema file JSDoc
      const schemaPath = path.join(
        __dirname,
        "registry/behaviors",
        entry.name,
        "schema.ts",
      );
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, "utf-8");
        // Extract first JSDoc comment block after export const schema
        const jsdocMatch = schemaContent.match(
          /\/\*\*\s*\n\s*\*\s*([^\n]+)/,
        );
        if (jsdocMatch) {
          metadata.description = jsdocMatch[1].trim();
        }

        // Extract attributes from schema properties (static analysis)
        // Look for all quoted property keys in the schema
        const attrMatches = schemaContent.matchAll(/"([a-z-]+)":\s*Type\./g);
        for (const match of attrMatches) {
          metadata.attributes.push(match[1]);
        }
      }

      // Extract commands from definition file (static analysis)
      const definitionPath = path.join(
        __dirname,
        "registry/behaviors",
        entry.name,
        "_behavior-definition.ts",
      );
      if (fs.existsSync(definitionPath)) {
        const defContent = fs.readFileSync(definitionPath, "utf-8");
        // Look for commands object: commands: { "--cmd": "--cmd", ... }
        const commandsMatch = defContent.match(
          /commands:\s*\{([^}]+)\}/s,
        );
        if (commandsMatch) {
          const commandsContent = commandsMatch[1];
          // Extract quoted command names
          const cmdMatches = commandsContent.matchAll(/"(--[^"]+)":/g);
          for (const match of cmdMatches) {
            metadata.commands.push(match[1]);
          }
        }
      }
    } catch (error) {
      // If loading fails, just skip metadata extraction for this behavior
      console.warn(
        `Warning: Could not load metadata for behavior "${entry.name}": ${error}`,
      );
    }

    behaviors.push(metadata);
  }

  // Output results
  if (jsonOutput) {
    console.log(JSON.stringify(behaviors, null, 2));
  } else {
    console.log("┌─────────────────────────────────────────┐");
    console.log("│  Available Behaviors                    │");
    console.log("└─────────────────────────────────────────┘");
    console.log("");

    if (behaviors.length === 0) {
      console.log("No behaviors found in registry.");
      return;
    }

    for (const behavior of behaviors) {
      console.log(`📦 ${behavior.name}`);
      if (behavior.description) {
        console.log(`   ${behavior.description}`);
      }
      if (behavior.attributes.length > 0) {
        console.log(`   Attributes: ${behavior.attributes.join(", ")}`);
      }
      if (behavior.commands.length > 0) {
        console.log(`   Commands: ${behavior.commands.join(", ")}`);
      }
      if (behavior.dependencies.length > 0) {
        console.log(`   Dependencies: ${behavior.dependencies.join(", ")}`);
      }
      console.log("");
    }

    console.log(`Total: ${behaviors.length} behavior${behaviors.length === 1 ? "" : "s"}`);
  }
}
