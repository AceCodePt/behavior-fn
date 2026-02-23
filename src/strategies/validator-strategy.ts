export type PackageName = "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini";

export interface ValidatorStrategy {
  /**
   * Unique identifier for the validator (e.g., 0, 1, 2)
   */
  id: number;
  
  /**
   * Display name for CLI prompts
   */
  label: string;

  /**
   * The package name to detect in package.json
   */
  packageName: PackageName;

  /**
   * Transform a raw schema object (from jiti) into a string representation for the validator.
   * @param schemaObject The actual schema object loaded via jiti
   * @param rawContent The raw file content (sometimes needed for TypeBox)
   */
  transformSchema(schemaObject: any, rawContent: string): string;

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
