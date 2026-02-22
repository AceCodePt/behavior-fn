// src/transformers/toValibot.ts
export function toValibot(schema: any): string {
  function parse(s: any): string {
    // 1. Strings
    if (s.type === 'string') {
      const pipe = ['v.string()'];
      if (s.minLength) pipe.push(`v.minLength(${s.minLength})`);
      if (s.pattern) pipe.push(`v.regex(/${s.pattern}/)`);
      return pipe.length > 1 ? `v.pipe(${pipe.join(', ')})` : pipe[0];
    }
    
    // 2. Numbers
    if (s.type === 'number') {
      const pipe = ['v.number()'];
      if (s.minimum !== undefined) pipe.push(`v.minValue(${s.minimum})`);
      if (s.maximum !== undefined) pipe.push(`v.maxValue(${s.maximum})`);
      return pipe.length > 1 ? `v.pipe(${pipe.join(', ')})` : pipe[0];
    }

    // 3. Booleans
    if (s.type === 'boolean') return 'v.boolean()';

    // 4. Enums
    if (s.enum || (s.anyOf && s.anyOf[0].const)) {
      const values = s.enum || s.anyOf.map((x: any) => x.const);
      const strValues = values.map((v: string) => `'${v}'`).join(', ');
      return `v.picklist([${strValues}])`;
    }

    // 5. Objects (Recursive)
    if (s.type === 'object') {
      const props = Object.entries(s.properties || {})
        .map(([key, value]: [string, any]) => {
          let code = parse(value);
          const isRequired = s.required?.includes(key);
          
          // Handle Optional & Defaults
          // In Valibot, default is optional(T, default)
          if (!isRequired && value.default === undefined) {
            code = `v.optional(${code})`;
          } else if (value.default !== undefined) {
            const def = JSON.stringify(value.default);
            code = `v.optional(${code}, ${def})`;
          }
          return `  "${key}": ${code}`;
        })
        .join(',\n');
      return `v.object({\n${props}\n})`;
    }

    return 'v.any()';
  }

  const keys = Object.keys(schema.properties || {});

  return `import * as v from "valibot";

export const schema = ${parse(schema)};
export type Schema = v.InferOutput<typeof schema>;
export const validate = (data: unknown) => v.parse(schema, data);
export const safeValidate = (data: unknown) => v.safeParse(schema, data);
export const observedAttributes = ${JSON.stringify(keys)} as const;
`;
}
