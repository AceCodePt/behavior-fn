export function toZod(schema: any): string {
  function parse(s: any): string {
    // 1. Strings
    if (s.type === 'string') {
      let code = 'z.string()';
      if (s.minLength !== undefined) code += `.min(${s.minLength})`;
      if (s.maxLength !== undefined) code += `.max(${s.maxLength})`;
      if (s.pattern) code += `.regex(/${s.pattern}/)`;
      return code;
    }
    
    // 2. Numbers
    if (s.type === 'number') {
      let code = 'z.number()';
      if (s.minimum !== undefined) code += `.min(${s.minimum})`;
      if (s.maximum !== undefined) code += `.max(${s.maximum})`;
      return code;
    }

    // 3. Booleans
    if (s.type === 'boolean') return 'z.boolean()';

    // 4. Enums
    if (s.enum || (s.anyOf && s.anyOf[0].const)) {
      const values = s.enum || s.anyOf.map((x: any) => x.const);
      const strValues = values.map((v: string) => `'${v}'`).join(', ');
      return `z.enum([${strValues}])`;
    }

    // 5. Objects (Recursive)
    if (s.type === 'object') {
      const props = Object.entries(s.properties || {})
        .map(([key, value]: [string, any]) => {
          let code = parse(value);
          const isRequired = s.required?.includes(key);
          
          // Handle Optional & Defaults
          // Zod handles defaults differently than Valibot (chainable)
          if (!isRequired && value.default === undefined) {
            code += '.optional()';
          }
          if (value.default !== undefined) {
            const def = JSON.stringify(value.default);
            code += `.default(${def})`;
          }
          return `  "${key}": ${code}`;
        })
        .join(',\n');
      return `z.object({\n${props}\n})`;
    }

    return 'z.any()';
  }

  const keys = Object.keys(schema.properties || {});

  return `import { z } from "zod";

export const schema = ${parse(schema)};
export type Schema = z.infer<typeof schema>;
export const validate = (data: unknown) => schema.parse(data);
export const safeValidate = (data: unknown) => schema.safeParse(data);
export const observedAttributes = ${JSON.stringify(keys)} as const;
`;
}
