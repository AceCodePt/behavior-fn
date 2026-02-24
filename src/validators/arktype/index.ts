import type { Validator } from "../validator";
import type { AttributeSchema, JSONSchemaObject, JSONSchemaProperty } from "../../types/schema";

/**
 * Converts a TypeBox schema (JSON Schema format at runtime) to ArkType code.
 */
function transformToArkType(schema: AttributeSchema): string {
  function parse(s: JSONSchemaProperty): string {
    if ('type' in s && s.type === 'string') {
      if (s.minLength) return `"string >= ${s.minLength}"`;
      if (s.pattern) return `/${s.pattern}/`;
      return '"string"';
    }
    
    if ('type' in s && s.type === 'number') {
      if (s.minimum !== undefined) return `"number >= ${s.minimum}"`;
      return '"number"';
    }

    if ('type' in s && s.type === 'boolean') return '"boolean"';

    // Objects (Nested - recursive)
    if (s.type === 'object' && s.properties) {
      const props = Object.entries(s.properties)
        .map(([key, value]) => {
          const isRequired = s.required?.includes(key);
          const k = isRequired ? key : `${key}?`;
          return `    "${k}": ${parse(value)}`;
        })
        .join(',\n');
      return `type({\n${props}\n  })`;
    }

    if (s.enum || (s.anyOf && s.anyOf[0]?.const)) {
      const values = s.enum || s.anyOf?.map((x) => x.const!);
      return (values || []).map((v) => `'${v}'`).join(' | ');
    }
    
    // Fallback - should not reach here with proper AttributeSchema
    throw new Error(`Unsupported schema type: ${JSON.stringify(s)}`);
  }

  function parseObject(s: JSONSchemaObject): string {
    const props = Object.entries(s.properties)
      .map(([key, value]) => {
        const isRequired = s.required?.includes(key);
        const k = isRequired ? key : `${key}?`;
        return `    "${k}": ${parse(value)}`;
      })
      .join(',\n');
    return `type({\n${props}\n  })`;
  }

  const runtimeSchema = schema as unknown as JSONSchemaObject;
  const keys = Object.keys(runtimeSchema.properties);

  return `import { type } from "arktype";

export const schema = ${parseObject(runtimeSchema)};
export type Schema = typeof schema.infer;
export const validate = (data: unknown) => schema(data).assert();
export const safeValidate = (data: unknown) => {
  const out = schema(data);
  return out instanceof type.errors ? { success: false, error: out } : { success: true, data: out };
};
export const observedAttributes = ${JSON.stringify(keys)} as const;
`;
}

/**
 * ArkType validator implementation.
 */
export class ArkTypeValidator implements Validator {
  readonly label = "ArkType";
  readonly packageName = "arktype";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return transformToArkType(schemaObject);
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
