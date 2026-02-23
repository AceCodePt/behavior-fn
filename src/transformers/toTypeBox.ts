// src/transformers/toTypeBox.ts
import type { AttributeSchema, JSONSchemaObject } from "../types/schema";

export function toTypeBox(schemaFileContent: string, schema: AttributeSchema): string {
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
