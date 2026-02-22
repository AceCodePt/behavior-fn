// src/transformers/toTypeBox.ts

export function toTypeBox(schemaFileContent: string, schema: any): string {
  // This function assumes schemaFileContent is the raw TypeBox definition 
  // from registry/behaviors/<name>/schema.ts.
  // We append the validation helpers to make it compatible with the behavioral host.
  
  const keys = Object.keys(schema.properties || {});
  
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
