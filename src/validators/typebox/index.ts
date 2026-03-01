import type { Validator } from "../validator";
import type { AttributeSchema, JSONSchemaObject } from "../../types/schema";

/**
 * Transform TypeBox schema - preserve original content as-is.
 * TypeBox is used as the canonical format, so no transformation is needed.
 * The schema file already has the correct structure.
 */
function transformToTypeBox(schemaFileContent: string, _schema: AttributeSchema): string {
  // TypeBox is the canonical format - return as-is
  return schemaFileContent;
}

/**
 * TypeBox validator implementation.
 */
export class TypeBoxValidator implements Validator {
  readonly label = "TypeBox";
  readonly packageName = "@sinclair/typebox";

  transformSchema(schemaObject: AttributeSchema, rawContent: string): string {
    return transformToTypeBox(rawContent, schemaObject);
  }

  getObservedAttributesCode(): string {
    return `export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  // TypeBox / JSON Schema has 'properties'
  if ("properties" in schema && typeof schema.properties === "object") {
    return Object.keys(schema.properties);
  }
  return [];
};`;
  }

  getUtilsImports(): string {
    return ``;
  }

  getTypesFileContent(): string {
    return `import { type Static, type TSchema } from "@sinclair/typebox";

/**
 * Helper to infer the output type of a schema.
 * TypeBox uses the Static helper to extract types from TSchema.
 */
export type InferSchema<T> = T extends TSchema ? Static<T> : unknown;

/**
 * The canonical schema type for TypeBox.
 */
export type BehaviorSchema = TSchema;
`;
  }
}
