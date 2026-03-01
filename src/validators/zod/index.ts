import type { Validator } from "../validator";
import type { AttributeSchema, JSONSchemaObject, JSONSchemaProperty } from "../../types/schema";

/**
 * Converts a TypeBox schema to Zod code.
 * 
 * TypeBox schemas are TObject at the type level, but at runtime they're
 * plain JSON Schema objects. We work with the runtime structure.
 */
function transformToZod(schema: AttributeSchema): string {
  function parse(s: JSONSchemaProperty): string {
    // 1. Strings
    if ('type' in s && s.type === 'string') {
      let code = 'z.string()';
      if (s.minLength !== undefined) code += `.min(${s.minLength})`;
      if (s.maxLength !== undefined) code += `.max(${s.maxLength})`;
      if (s.pattern) code += `.regex(/${s.pattern}/)`;
      return code;
    }
    
    // 2. Numbers
    if ('type' in s && s.type === 'number') {
      let code = 'z.number()';
      if (s.minimum !== undefined) code += `.min(${s.minimum})`;
      if (s.maximum !== undefined) code += `.max(${s.maximum})`;
      return code;
    }

    // 3. Booleans
    if ('type' in s && s.type === 'boolean') return 'z.boolean()';

    // 4. Objects (Nested - recursive)
    if (s.type === 'object' && s.properties) {
      const props = Object.entries(s.properties)
        .map(([key, value]) => {
          let code = parse(value);
          const isRequired = s.required?.includes(key);
          
          const hasDefault = 'default' in value && value.default !== undefined;
          if (!isRequired && !hasDefault) {
            code += '.optional()';
          }
          if (hasDefault) {
            const def = JSON.stringify(value.default);
            code += `.default(${def})`;
          }
          return `  "${key}": ${code}`;
        })
        .join(',\n');
      return `z.object({\n${props}\n})`;
    }

    // 5. Enums
    if (s.enum || (s.anyOf && s.anyOf[0]?.const)) {
      const values = s.enum || s.anyOf?.map((x) => x.const!);
      const strValues = (values || []).map((v) => `'${v}'`).join(', ');
      return `z.enum([${strValues}])`;
    }

    // Fallback - should not reach here with proper AttributeSchema
    throw new Error(`Unsupported schema type: ${JSON.stringify(s)}`);
  }

  function parseObject(s: JSONSchemaObject): string {
    const props = Object.entries(s.properties)
      .map(([key, value]: [string, JSONSchemaProperty]) => {
        let code = parse(value);
        const isRequired = s.required?.includes(key);
        
        // Handle Optional & Defaults (skip for nested objects)
        // Zod handles defaults differently than Valibot (chainable)
        const hasDefault = 'default' in value && value.default !== undefined;
        if (!isRequired && !hasDefault) {
          code += '.optional()';
        }
        if (hasDefault) {
          const def = JSON.stringify(value.default);
          code += `.default(${def})`;
        }
        return `  "${key}": ${code}`;
      })
      .join(',\n');
    return `z.object({\n${props}\n})`;
  }

  // Cast TObject to runtime JSON Schema structure
  const runtimeSchema = schema as unknown as JSONSchemaObject;
  const keys = Object.keys(runtimeSchema.properties);

  return `import { z } from "zod";
import { type InferSchema } from "~types";

export const schema = ${parseObject(runtimeSchema)};
export type Schema = InferSchema<typeof schema>;
`;
}

/**
 * Zod validator implementation.
 */
export class ZodValidator implements Validator {
  readonly label = "Zod";
  readonly packageName = "zod";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return transformToZod(schemaObject);
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
