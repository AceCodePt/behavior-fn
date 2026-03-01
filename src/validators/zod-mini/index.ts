import type { Validator } from "../validator";
import type { AttributeSchema, JSONSchemaObject, JSONSchemaProperty } from "../../types/schema";

/**
 * Converts a TypeBox schema (JSON Schema format at runtime) to Zod Mini code.
 */
function transformToZodMini(schema: AttributeSchema): string {
  function parse(s: JSONSchemaProperty): string {
    // 1. Strings
    if ('type' in s && s.type === 'string') {
      let code = 'z.string()';
      if (s.minLength !== undefined) code = `z.min(${code}, ${s.minLength})`;
      if (s.maxLength !== undefined) code = `z.max(${code}, ${s.maxLength})`;
      if (s.pattern) code = `z.regex(${code}, /${s.pattern}/)`;
      return code;
    }
    
    // 2. Numbers
    if ('type' in s && s.type === 'number') {
      let code = 'z.number()';
      if (s.minimum !== undefined) code = `z.min(${code}, ${s.minimum})`;
      if (s.maximum !== undefined) code = `z.max(${code}, ${s.maximum})`;
      return code;
    }

    // 3. Booleans
    if ('type' in s && s.type === 'boolean') return 'z.boolean()';

    // 4. Arrays
    if (s.type === 'array' && s.items) {
      const itemsCode = parse(s.items);
      return `z.array(${itemsCode})`;
    }

    // 5. Objects (Nested - recursive)
    if (s.type === 'object' && s.properties) {
      const props = Object.entries(s.properties)
        .map(([key, value]) => {
          let code = parse(value);
          const isRequired = s.required?.includes(key);
          
          const hasDefault = 'default' in value && value.default !== undefined;
          if (!isRequired && !hasDefault) {
            code = `z.optional(${code})`;
          }
          if (hasDefault) {
            const def = JSON.stringify(value.default);
            code = `z.default(${code}, ${def})`;
          }
          return `  "${key}": ${code}`;
        })
        .join(',\n');
      return `z.object({\n${props}\n})`;
    }

    // 6. Enums (anyOf with const - MUST come before unions!)
    if (s.enum || (s.anyOf && s.anyOf[0]?.const)) {
      const values = s.enum || s.anyOf?.map((x) => x.const!);
      const strValues = (values || []).map((v) => `'${v}'`).join(', ');
      return `z.enum([${strValues}])`;
    }

    // 7. Unions (anyOf without const)
    if (s.anyOf) {
      const variants = s.anyOf.map(variant => parse(variant));
      return `z.union([${variants.join(', ')}])`;
    }

    // Fallback - should not reach here with proper AttributeSchema
    throw new Error(`Unsupported schema type: ${JSON.stringify(s)}`);
  }

  function parseObject(s: JSONSchemaObject): string {
    const props = Object.entries(s.properties)
      .map(([key, value]) => {
        let code = parse(value);
        const isRequired = s.required?.includes(key);
        
        // Handle Optional & Defaults
        const hasDefault = 'default' in value && value.default !== undefined;
        if (!isRequired && !hasDefault) {
          code = `z.optional(${code})`;
        }
        if (hasDefault) {
          const def = JSON.stringify(value.default);
          code = `z.default(${code}, ${def})`;
        }
        return `  "${key}": ${code}`;
      })
      .join(',\n');
    return `z.object({\n${props}\n})`;
  }

  const runtimeSchema = schema as unknown as JSONSchemaObject;

  return `import * as z from "zod/mini";
import { type InferSchema } from "~types";

export const schema = ${parseObject(runtimeSchema)};
export type Schema = InferSchema<typeof schema>;
`;
}

/**
 * Zod Mini validator implementation.
 */
export class ZodMiniValidator implements Validator {
  readonly label = "Zod Mini";
  readonly packageName = "zod-mini";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return transformToZodMini(schemaObject);
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
