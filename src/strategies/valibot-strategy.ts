import { toValibot } from "../transformers/toValibot";
import { type ValidatorStrategy, type PackageName } from "./validator-strategy";
import type { AttributeSchema } from "../types/schema";

export class ValibotStrategy implements ValidatorStrategy {
  id = 1;
  label = "Valibot";
  packageName: PackageName = "valibot";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return toValibot(schemaObject);
  }

  getObservedAttributesCode(): string {
    return `export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  // Valibot ObjectSchema has 'entries' property
  if ("entries" in schema && typeof schema.entries === "object") {
    return Object.keys(schema.entries);
  }
  return [];
};`;
  }

  getUtilsImports(): string {
    return ``; // Valibot utils don't need imports for getObservedAttributes since we use duck typing
  }

  getTypesFileContent(): string {
    return `import { type StandardSchemaV1 } from "@standard-schema/spec";
import { type BaseSchema, type InferOutput } from "valibot";

/**
 * Universal schema inference helper.
 */
export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends BaseSchema
    ? InferOutput<T>
    : unknown;

export type BehaviorSchema = StandardSchemaV1 | BaseSchema | object;
`;
  }
}
