// src/transformers/toArkType.ts
export function toArkType(schema: any): string {
  function parse(s: any): string {
    if (s.type === 'string') {
      if (s.minLength) return `"string >= ${s.minLength}"`;
      if (s.pattern) return `/${s.pattern}/`;
      return '"string"';
    }
    
    if (s.type === 'number') {
      if (s.minimum !== undefined) return `"number >= ${s.minimum}"`;
      return '"number"';
    }

    if (s.type === 'boolean') return '"boolean"';

    if (s.enum || (s.anyOf && s.anyOf[0].const)) {
      const values = s.enum || s.anyOf.map((x: any) => x.const);
      return values.map((v: string) => `'${v}'`).join(' | ');
    }

    if (s.type === 'object') {
      const props = Object.entries(s.properties || {})
        .map(([key, value]: [string, any]) => {
          const isRequired = s.required?.includes(key);
          const k = isRequired ? key : `${key}?`;
          return `    "${k}": ${parse(value)}`;
        })
        .join(',\n');
      return `type({\n${props}\n  })`;
    }
    
    return '"unknown"';
  }

  const keys = Object.keys(schema.properties || {});

  return `import { type } from "arktype";

export const schema = ${parse(schema)};
export type Schema = typeof schema.infer;
export const validate = (data: unknown) => schema(data).assert();
export const safeValidate = (data: unknown) => {
  const out = schema(data);
  return out instanceof type.errors ? { success: false, error: out } : { success: true, data: out };
};
export const observedAttributes = ${JSON.stringify(keys)} as const;
`;
}
