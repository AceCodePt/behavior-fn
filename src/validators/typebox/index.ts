import type { Validator } from "../validator";
import type { AttributeSchema, JSONSchemaObject } from "../../types/schema";

/**
 * Transform TypeBox schema by appending validation helpers.
 * TypeBox is used as the canonical format, so we preserve the original schema
 * and just add the runtime validation functions.
 */
function transformToTypeBox(schemaFileContent: string, schema: AttributeSchema): string {
  // This function assumes schemaFileContent is the raw TypeBox definition 
  // from registry/behaviors/<name>/schema.ts.
  // We append the validation helpers to make it compatible with the behavioral host.
  
  const runtimeSchema = schema as unknown as JSONSchemaObject;
  const keys = Object.keys(runtimeSchema.properties);
  
  return `${schemaFileContent}

import { Value } from '@sinclair/typebox/value';

export const validate = (data: unknown) => {
  if (Value.Check(schema, data)) {
    return data;
  }
  throw new Error('Validation failed');
};
export const safeValidate = (data: unknown) => {
  if (Value.Check(schema, data)) {
    return { success: true, data };
  }
  return { success: false, error: [...Value.Errors(schema, data)] };
};
export const observedAttributes = ${JSON.stringify(keys)} as const;
`;
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
