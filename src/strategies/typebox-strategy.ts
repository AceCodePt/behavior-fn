import { toTypeBox } from "../transformers/toTypeBox";
import { type ValidatorStrategy, type PackageName } from "./validator-strategy";
import type { AttributeSchema } from "../types/schema";

export class TypeBoxStrategy implements ValidatorStrategy {
  id = 3;
  label = "TypeBox";
  packageName: PackageName = "@sinclair/typebox";

  transformSchema(schemaObject: AttributeSchema, rawContent: string): string {
    return toTypeBox(rawContent, schemaObject);
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
    return `import { type StandardSchemaV1 } from "@standard-schema/spec";
import { type Static, type TSchema } from "@sinclair/typebox";

/**
 * Universal schema inference helper.
 */
export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends TSchema
    ? Static<T>
    : unknown;

export type BehaviorSchema = StandardSchemaV1 | TSchema | object;
`;
  }
}
