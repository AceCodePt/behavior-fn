import type { Validator } from "../validator";
import type { AttributeSchema, JSONSchemaObject, JSONSchemaProperty } from "../../types/schema";

/**
 * Converts a TypeBox schema (JSON Schema format at runtime) to Valibot code.
 */
function transformToValibot(schema: AttributeSchema): string {
  function parse(s: JSONSchemaProperty): string {
    // 1. Strings
    if ('type' in s && s.type === 'string') {
      const pipe = ['v.string()'];
      if (s.minLength) pipe.push(`v.minLength(${s.minLength})`);
      if (s.pattern) pipe.push(`v.regex(/${s.pattern}/)`);
      return pipe.length > 1 ? `v.pipe(${pipe.join(', ')})` : pipe[0];
    }
    
    // 2. Numbers
    if ('type' in s && s.type === 'number') {
      const pipe = ['v.number()'];
      if (s.minimum !== undefined) pipe.push(`v.minValue(${s.minimum})`);
      if (s.maximum !== undefined) pipe.push(`v.maxValue(${s.maximum})`);
      return pipe.length > 1 ? `v.pipe(${pipe.join(', ')})` : pipe[0];
    }

    // 3. Booleans
    if ('type' in s && s.type === 'boolean') return 'v.boolean()';

    // 4. Arrays
    if (s.type === 'array' && s.items) {
      const itemsCode = parse(s.items);
      return `v.array(${itemsCode})`;
    }

    // 5. Objects (Nested - recursive)
    if (s.type === 'object' && s.properties) {
      const props = Object.entries(s.properties)
        .map(([key, value]) => {
          let code = parse(value);
          const isRequired = s.required?.includes(key);
          
          const hasDefault = 'default' in value && value.default !== undefined;
          if (!isRequired && !hasDefault) {
            code = `v.optional(${code})`;
          } else if (hasDefault) {
            const def = JSON.stringify(value.default);
            code = `v.optional(${code}, ${def})`;
          }
          return `  "${key}": ${code}`;
        })
        .join(',\n');
      return `v.object({\n${props}\n})`;
    }

    // 6. Enums (anyOf with const - MUST come before unions!)
    if (s.enum || (s.anyOf && s.anyOf[0]?.const)) {
      const values = s.enum || s.anyOf?.map((x) => x.const!);
      const strValues = (values || []).map((v) => `'${v}'`).join(', ');
      return `v.picklist([${strValues}])`;
    }

    // 7. Unions (anyOf without const)
    if (s.anyOf) {
      const variants = s.anyOf.map(variant => parse(variant));
      return `v.union([${variants.join(', ')}])`;
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
        // In Valibot, default is optional(T, default)
        const hasDefault = 'default' in value && value.default !== undefined;
        if (!isRequired && !hasDefault) {
          code = `v.optional(${code})`;
        } else if (hasDefault) {
          const def = JSON.stringify(value.default);
          code = `v.optional(${code}, ${def})`;
        }
        return `  "${key}": ${code}`;
      })
      .join(',\n');
    return `v.object({\n${props}\n})`;
  }

  const runtimeSchema = schema as unknown as JSONSchemaObject;

  return `import { type InferSchema } from "~types";

export const schema = ${parseObject(runtimeSchema)};
export type Schema = InferSchema<typeof schema>;
`;
}

/**
 * Valibot validator implementation.
 */
export class ValibotValidator implements Validator {
  readonly label = "Valibot";
  readonly packageName = "valibot";

  transformSchema(schemaObject: AttributeSchema, _rawContent: string): string {
    return transformToValibot(schemaObject);
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
    return `import * as v from "valibot";`;
  }

  getTypesFileContent(): string {
    return `import { type BaseSchema, type InferOutput } from "valibot";

/**
 * Helper to infer the output type of a schema.
 * Valibot uses InferOutput<T> to extract types from BaseSchema.
 */
export type InferSchema<T> = T extends BaseSchema<unknown, unknown, any>
  ? InferOutput<T>
  : unknown;

/**
 * The canonical schema type for Valibot.
 */
export type BehaviorSchema = BaseSchema<unknown, unknown, any>;
`;
  }
}
