import fs from "node:fs";
import { Value } from "@sinclair/typebox/value";
import type { TSchema } from "@sinclair/typebox";

/**
 * Validate data against a TypeBox schema
 * 
 * @param schema - TypeBox schema to validate against
 * @param data - Data to validate
 * @param context - Human-readable context for error messages (e.g., "behavior.config.json")
 * @returns Validated data (typed as T)
 * @throws Exits process with error message if validation fails
 */
export function validateJson<T>(
  schema: TSchema,
  data: unknown,
  context: string
): T {
  if (!Value.Check(schema, data)) {
    const errors = [...Value.Errors(schema, data)];
    console.error(`❌ Invalid ${context}:`);
    errors.forEach(e => {
      console.error(`  - ${e.path}: ${e.message}`);
    });
    process.exit(1);
  }
  return data as T;
}

/**
 * Load and validate a JSON file against a TypeBox schema
 * 
 * @param schema - TypeBox schema to validate against
 * @param filePath - Path to JSON file
 * @param context - Human-readable context for error messages
 * @returns Validated data (typed as T)
 * @throws Exits process with error message if file is malformed or validation fails
 */
export function validateJsonFile<T>(
  schema: TSchema,
  filePath: string,
  context: string
): T {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return validateJson<T>(schema, raw, context);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error(`❌ Malformed JSON in ${context}: ${filePath}`);
      console.error(`  ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}
