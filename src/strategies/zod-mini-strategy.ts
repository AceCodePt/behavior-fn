import { toZodMini } from "../transformers/toZodMini";
import { type ValidatorStrategy, type PackageName } from "./validator-strategy";

export class ZodMiniStrategy implements ValidatorStrategy {
  id = 4;
  label = "Zod Mini";
  packageName: PackageName = "zod-mini";

  transformSchema(schemaObject: any, _rawContent: string): string {
    return toZodMini(schemaObject);
  }

  getObservedAttributesCode(): string {
    return `export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  if (!schema) return [];
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }
  return [];
};`;
  }

  getUtilsImports(): string {
    return `import { z } from "zod";`;
  }

  getTypesFileContent(): string {
    return `import { type StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";

/**
 * Universal schema inference helper.
 */
export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends z.ZodType
    ? z.infer<T>
    : unknown;

export type BehaviorSchema = StandardSchemaV1 | z.ZodType | object;
`;
  }
}
