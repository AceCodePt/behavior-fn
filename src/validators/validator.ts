import type { AttributeSchema } from "../types/schema";

/**
 * Validator interface for schema transformation.
 * Each validator (Zod, Valibot, etc.) implements this interface.
 */
export interface Validator {
  /**
   * Unique identifier for the validator (e.g., 0, 1, 2)
   */
  readonly id: number;
  
  /**
   * Display name for CLI prompts
   */
  readonly label: string;

  /**
   * The package name to detect in package.json
   */
  readonly packageName: string;

  /**
   * Transform a TypeBox schema to this validator's code.
   * @param schemaObject The TypeBox schema object
   * @param rawContent The raw file content (for TypeBox passthrough)
   */
  transformSchema(schemaObject: AttributeSchema, rawContent: string): string;

  /**
   * Generate the `getObservedAttributes` function code for `behavior-utils.ts`.
   */
  getObservedAttributesCode(): string;

  /**
   * Generate the import statements needed for `behavior-utils.ts`.
   */
  getUtilsImports(): string;

  /**
   * Generate the full content of `types.ts` for this validator.
   */
  getTypesFileContent(): string;
}
