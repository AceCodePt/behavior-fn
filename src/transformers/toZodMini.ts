import type { AttributeSchema, JSONSchemaObject, JSONSchemaProperty } from "../types/schema";

/**
 * Converts a TypeBox schema (JSON Schema format at runtime) to Zod Mini code.
 */
export function toZodMini(schema: AttributeSchema): string {
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

    // 4. Objects (Nested - recursive)
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
  const keys = Object.keys(runtimeSchema.properties);

  return `import * as z from "zod/mini";

export const schema = ${parseObject(runtimeSchema)};
export type Schema = z.infer<typeof schema>;
export const validate = (data: unknown) => schema.parse(data);
export const safeValidate = (data: unknown) => schema.safeParse(data);
export const observedAttributes = ${JSON.stringify(keys)} as const;
`;
}
