import { toArkType } from "../transformers/toArkType";
import { type ValidatorStrategy, type PackageName } from "./validator-strategy";
import type { AttributeSchema } from "../types/schema";

export class ArkTypeStrategy implements ValidatorStrategy {
  id = 2;
  label = "ArkType";
  packageName: PackageName = "arktype";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return toArkType(schemaObject);
  }

  getObservedAttributesCode(): string {
    // Current behavior in index.ts: does not replace for ArkType, so it uses the default (TypeBox)
    // We reproduce this by returning the default implementation logic, 
    // or we could return a specific one if we knew how to inspect ArkType.
    // For now, preserving existing behavior (even if potentially incorrect for ArkType).
    return `export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  // TypeBox TObject guarantees 'properties'
  if ("properties" in schema) {
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
import { type Type } from "arktype";

/**
 * Universal schema inference helper.
 */
export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends Type
    ? T["infer"]
    : unknown;

export type BehaviorSchema = StandardSchemaV1 | Type | object;
`;
  }
}
