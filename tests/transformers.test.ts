// tests/transformers.test.ts
import { describe, it, expect } from 'vitest';
import { Type } from '@sinclair/typebox';
import { ZodValidator } from '../src/validators/zod/index';
import { ValibotValidator } from '../src/validators/valibot/index';
import { ArkTypeValidator } from '../src/validators/arktype/index';
import { TypeBoxValidator } from '../src/validators/typebox/index';
import { ZodMiniValidator } from '../src/validators/zod-mini/index';

const zodValidator = new ZodValidator();
const valibotValidator = new ValibotValidator();
const arktypeValidator = new ArkTypeValidator();
const typeboxValidator = new TypeBoxValidator();
const zodMiniValidator = new ZodMiniValidator();

describe('Schema Transformers', () => {
  const schema = Type.Object({
    required: Type.String({ minLength: 1 }),
    optional: Type.Optional(Type.String()),
    enum: Type.Union([Type.Literal('a'), Type.Literal('b')]),
    number: Type.Number({ minimum: 0, maximum: 10 }),
    boolean: Type.Boolean(),
    nested: Type.Object({
      nestedProp: Type.String()
    })
  });

  describe('toZod', () => {
    it('generates valid Zod code', () => {
      const schemaCode = zodValidator.transformSchema(schema, '');
      const imports = zodValidator.getUtilsImports();
      const code = `${imports}\n${schemaCode}`;
      expect(code).toContain('import { z } from "zod"');
      expect(code).toContain('import { type InferSchema } from "~types"');
      expect(code).toContain('z.string().min(1)');
      expect(code).toContain('z.string().optional()');
      expect(code).toContain('z.enum([\'a\', \'b\'])');
      expect(code).toContain('z.number().min(0).max(10)');
      expect(code).toContain('z.boolean()');
      expect(code).toContain('"nested": z.object({');
      expect(code).toContain('export type Schema = InferSchema<typeof schema>');
      // Should NOT contain validation functions or observedAttributes
      expect(code).not.toContain('observedAttributes');
      expect(code).not.toContain('validate');
      expect(code).not.toContain('safeValidate');
    });

    describe('array support', () => {
      it('transforms simple arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Array(Type.String()),
        });
        const code = zodValidator.transformSchema(arraySchema, '');
        expect(code).toContain('z.array(z.string())');
      });

      it('transforms arrays with complex items', () => {
        const arraySchema = Type.Object({
          items: Type.Array(Type.Object({
            id: Type.String(),
            value: Type.Number(),
          })),
        });
        const code = zodValidator.transformSchema(arraySchema, '');
        expect(code).toContain('z.array(z.object({');
        expect(code).toContain('"id": z.string()');
        expect(code).toContain('"value": z.number()');
      });

      it('transforms optional arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Optional(Type.Array(Type.String())),
        });
        const code = zodValidator.transformSchema(arraySchema, '');
        expect(code).toContain('z.array(z.string()).optional()');
      });
    });

    describe('union support', () => {
      it('transforms simple unions', () => {
        const unionSchema = Type.Object({
          value: Type.Union([Type.String(), Type.Number()]),
        });
        const code = zodValidator.transformSchema(unionSchema, '');
        expect(code).toContain('z.union([z.string(), z.number()])');
      });

      it('transforms unions with objects', () => {
        const unionSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Object({
              id: Type.String(),
            }),
          ]),
        });
        const code = zodValidator.transformSchema(unionSchema, '');
        expect(code).toContain('z.union([z.string(), z.object({');
        expect(code).toContain('"id": z.string()');
      });

      it('transforms optional unions', () => {
        const unionSchema = Type.Object({
          value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        });
        const code = zodValidator.transformSchema(unionSchema, '');
        expect(code).toContain('z.union([z.string(), z.number()]).optional()');
      });

      it('still handles enums correctly (anyOf with const)', () => {
        const enumSchema = Type.Object({
          status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
        });
        const code = zodValidator.transformSchema(enumSchema, '');
        // Should be enum, not union
        expect(code).toContain('z.enum([\'active\', \'inactive\'])');
        expect(code).not.toContain('z.union');
      });
    });

    describe('complex nested patterns', () => {
      it('transforms arrays with union items', () => {
        const complexSchema = Type.Object({
          items: Type.Array(Type.Union([Type.String(), Type.Number()])),
        });
        const code = zodValidator.transformSchema(complexSchema, '');
        expect(code).toContain('z.array(z.union([z.string(), z.number()]))');
      });

      it('transforms unions with arrays', () => {
        const complexSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Array(Type.String()),
          ]),
        });
        const code = zodValidator.transformSchema(complexSchema, '');
        expect(code).toContain('z.union([z.string(), z.array(z.string())])');
      });

      it('transforms the request-trigger pattern', () => {
        const TriggerSchema = Type.Object({
          event: Type.String(),
          from: Type.Optional(Type.String()),
        });

        const requestSchema = Type.Object({
          "request-trigger": Type.Optional(
            Type.Union([
              Type.String(),
              Type.Array(Type.Union([Type.String(), TriggerSchema])),
              TriggerSchema,
            ]),
          ),
        });

        const code = zodValidator.transformSchema(requestSchema, '');
        
        // Should contain nested unions and arrays
        expect(code).toContain('z.union([');
        expect(code).toContain('z.array(z.union([');
        expect(code).toContain('z.object({');
        expect(code).toContain('"event": z.string()');
        expect(code).toContain('"from": z.string().optional()');
      });
    });
  });

  describe('toZodMini', () => {
    it('generates valid Zod Mini code', () => {
      const schemaCode = zodMiniValidator.transformSchema(schema, '');
      const imports = zodMiniValidator.getUtilsImports();
      const code = `${imports}\n${schemaCode}`;
      expect(code).toContain('import { z } from "zod/mini"');
      expect(code).toContain('import { type InferSchema } from "~types"');
      expect(code).toContain('z.min(z.string(), 1)');
      expect(code).toContain('z.optional(z.string())');
      expect(code).toContain('z.enum([\'a\', \'b\'])');
      // For number range, we check if min and max are applied.
      // Assuming implementation wraps recursively: z.max(z.min(z.number(), 0), 10)
      const hasNumber = code.includes('z.max(z.min(z.number(), 0), 10)') || code.includes('z.min(z.max(z.number(), 10), 0)');
      expect(hasNumber).toBe(true);
      expect(code).toContain('z.boolean()');
      expect(code).toContain('"nested": z.object({');
      expect(code).toContain('export type Schema = InferSchema<typeof schema>');
      // Should NOT contain validation functions or observedAttributes
      expect(code).not.toContain('observedAttributes');
      expect(code).not.toContain('validate');
      expect(code).not.toContain('safeValidate');
    });

    describe('array support', () => {
      it('transforms simple arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Array(Type.String()),
        });
        const code = zodMiniValidator.transformSchema(arraySchema, '');
        expect(code).toContain('z.array(z.string())');
      });

      it('transforms arrays with complex items', () => {
        const arraySchema = Type.Object({
          items: Type.Array(Type.Object({
            id: Type.String(),
            value: Type.Number(),
          })),
        });
        const code = zodMiniValidator.transformSchema(arraySchema, '');
        expect(code).toContain('z.array(z.object({');
        expect(code).toContain('"id": z.string()');
        expect(code).toContain('"value": z.number()');
      });

      it('transforms optional arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Optional(Type.Array(Type.String())),
        });
        const code = zodMiniValidator.transformSchema(arraySchema, '');
        expect(code).toContain('z.optional(z.array(z.string()))');
      });
    });

    describe('union support', () => {
      it('transforms simple unions', () => {
        const unionSchema = Type.Object({
          value: Type.Union([Type.String(), Type.Number()]),
        });
        const code = zodMiniValidator.transformSchema(unionSchema, '');
        expect(code).toContain('z.union([z.string(), z.number()])');
      });

      it('transforms unions with objects', () => {
        const unionSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Object({
              id: Type.String(),
            }),
          ]),
        });
        const code = zodMiniValidator.transformSchema(unionSchema, '');
        expect(code).toContain('z.union([z.string(), z.object({');
        expect(code).toContain('"id": z.string()');
      });

      it('transforms optional unions', () => {
        const unionSchema = Type.Object({
          value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        });
        const code = zodMiniValidator.transformSchema(unionSchema, '');
        expect(code).toContain('z.optional(z.union([z.string(), z.number()]))');
      });

      it('still handles enums correctly (anyOf with const)', () => {
        const enumSchema = Type.Object({
          status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
        });
        const code = zodMiniValidator.transformSchema(enumSchema, '');
        // Should be enum, not union
        expect(code).toContain('z.enum([\'active\', \'inactive\'])');
        expect(code).not.toContain('z.union');
      });
    });

    describe('complex nested patterns', () => {
      it('transforms arrays with union items', () => {
        const complexSchema = Type.Object({
          items: Type.Array(Type.Union([Type.String(), Type.Number()])),
        });
        const code = zodMiniValidator.transformSchema(complexSchema, '');
        expect(code).toContain('z.array(z.union([z.string(), z.number()]))');
      });

      it('transforms unions with arrays', () => {
        const complexSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Array(Type.String()),
          ]),
        });
        const code = zodMiniValidator.transformSchema(complexSchema, '');
        expect(code).toContain('z.union([z.string(), z.array(z.string())])');
      });

      it('transforms the request-trigger pattern', () => {
        const TriggerSchema = Type.Object({
          event: Type.String(),
          from: Type.Optional(Type.String()),
        });

        const requestSchema = Type.Object({
          "request-trigger": Type.Optional(
            Type.Union([
              Type.String(),
              Type.Array(Type.Union([Type.String(), TriggerSchema])),
              TriggerSchema,
            ]),
          ),
        });

        const code = zodMiniValidator.transformSchema(requestSchema, '');
        
        // Should contain nested unions and arrays
        expect(code).toContain('z.optional(z.union([');
        expect(code).toContain('z.array(z.union([');
        expect(code).toContain('z.object({');
        expect(code).toContain('"event": z.string()');
        expect(code).toContain('"from": z.optional(z.string())');
      });
    });
  });

  describe('toValibot', () => {
    it('generates valid Valibot code', () => {
      const schemaCode = valibotValidator.transformSchema(schema, '');
      const imports = valibotValidator.getUtilsImports();
      const code = `${imports}\n${schemaCode}`;
      expect(code).toContain('import * as v from "valibot"');
      expect(code).toContain('import { type InferSchema } from "~types"');
      expect(code).toContain('v.pipe(v.string(), v.minLength(1))');
      expect(code).toContain('v.optional(v.string())');
      expect(code).toContain('v.picklist([\'a\', \'b\'])');
      expect(code).toContain('v.pipe(v.number(), v.minValue(0), v.maxValue(10))');
      expect(code).toContain('v.boolean()');
      expect(code).toContain('"nested": v.object({');
      expect(code).toContain('export type Schema = InferSchema<typeof schema>');
      // Should NOT contain validation functions or observedAttributes
      expect(code).not.toContain('observedAttributes');
      expect(code).not.toContain('validate');
      expect(code).not.toContain('safeValidate');
    });

    describe('array support', () => {
      it('transforms simple arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Array(Type.String()),
        });
        const code = valibotValidator.transformSchema(arraySchema, '');
        expect(code).toContain('v.array(v.string())');
      });

      it('transforms arrays with complex items', () => {
        const arraySchema = Type.Object({
          items: Type.Array(Type.Object({
            id: Type.String(),
            value: Type.Number(),
          })),
        });
        const code = valibotValidator.transformSchema(arraySchema, '');
        expect(code).toContain('v.array(v.object({');
        expect(code).toContain('"id": v.string()');
        expect(code).toContain('"value": v.number()');
      });

      it('transforms optional arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Optional(Type.Array(Type.String())),
        });
        const code = valibotValidator.transformSchema(arraySchema, '');
        expect(code).toContain('v.optional(v.array(v.string()))');
      });
    });

    describe('union support', () => {
      it('transforms simple unions', () => {
        const unionSchema = Type.Object({
          value: Type.Union([Type.String(), Type.Number()]),
        });
        const code = valibotValidator.transformSchema(unionSchema, '');
        expect(code).toContain('v.union([v.string(), v.number()])');
      });

      it('transforms unions with objects', () => {
        const unionSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Object({
              id: Type.String(),
            }),
          ]),
        });
        const code = valibotValidator.transformSchema(unionSchema, '');
        expect(code).toContain('v.union([v.string(), v.object({');
        expect(code).toContain('"id": v.string()');
      });

      it('transforms optional unions', () => {
        const unionSchema = Type.Object({
          value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        });
        const code = valibotValidator.transformSchema(unionSchema, '');
        expect(code).toContain('v.optional(v.union([v.string(), v.number()]))');
      });

      it('still handles enums correctly (anyOf with const)', () => {
        const enumSchema = Type.Object({
          status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
        });
        const code = valibotValidator.transformSchema(enumSchema, '');
        // Should be picklist, not union
        expect(code).toContain('v.picklist([\'active\', \'inactive\'])');
        expect(code).not.toContain('v.union');
      });
    });

    describe('complex nested patterns', () => {
      it('transforms arrays with union items', () => {
        const complexSchema = Type.Object({
          items: Type.Array(Type.Union([Type.String(), Type.Number()])),
        });
        const code = valibotValidator.transformSchema(complexSchema, '');
        expect(code).toContain('v.array(v.union([v.string(), v.number()]))');
      });

      it('transforms unions with arrays', () => {
        const complexSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Array(Type.String()),
          ]),
        });
        const code = valibotValidator.transformSchema(complexSchema, '');
        expect(code).toContain('v.union([v.string(), v.array(v.string())])');
      });

      it('transforms the request-trigger pattern', () => {
        const TriggerSchema = Type.Object({
          event: Type.String(),
          from: Type.Optional(Type.String()),
        });

        const requestSchema = Type.Object({
          "request-trigger": Type.Optional(
            Type.Union([
              Type.String(),
              Type.Array(Type.Union([Type.String(), TriggerSchema])),
              TriggerSchema,
            ]),
          ),
        });

        const code = valibotValidator.transformSchema(requestSchema, '');
        
        // Should contain nested unions and arrays
        expect(code).toContain('v.optional(v.union([');
        expect(code).toContain('v.array(v.union([');
        expect(code).toContain('v.object({');
        expect(code).toContain('"event": v.string()');
        expect(code).toContain('"from": v.optional(v.string())');
      });
    });
  });

  describe('toArkType', () => {
    it('generates valid ArkType code', () => {
      const schemaCode = arktypeValidator.transformSchema(schema, '');
      const imports = arktypeValidator.getUtilsImports();
      const code = `${imports}\n${schemaCode}`;
      expect(code).toContain('import { type } from "arktype"');
      expect(code).toContain('import { type InferSchema } from "~types"');
      expect(code).toContain('"required": "string >= 1"');
      expect(code).toContain('"optional?": "string"');
      expect(code).toContain('\'a\' | \'b\'');
      expect(code).toContain('"number": "number >= 0"'); // Note: ArkType max not directly supported in min/max logic yet or implementation check
      expect(code).toContain('"boolean": "boolean"');
      expect(code).toContain('"nested": type({');
      expect(code).toContain('export type Schema = InferSchema<typeof schema>');
      // Should NOT contain validation functions or observedAttributes
      expect(code).not.toContain('observedAttributes');
      expect(code).not.toContain('validate');
      expect(code).not.toContain('safeValidate');
    });

    describe('array support', () => {
      it('transforms simple arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Array(Type.String()),
        });
        const code = arktypeValidator.transformSchema(arraySchema, '');
        expect(code).toContain('"string"[]');
      });

      it('transforms arrays with complex items', () => {
        const arraySchema = Type.Object({
          items: Type.Array(Type.Object({
            id: Type.String(),
            value: Type.Number(),
          })),
        });
        const code = arktypeValidator.transformSchema(arraySchema, '');
        // ArkType arrays of objects use: (type({...}))[]
        expect(code).toContain('(type({');
        expect(code).toContain('"id": "string"');
        expect(code).toContain('"value": "number"');
        expect(code).toContain('}))[]');
      });

      it('transforms optional arrays', () => {
        const arraySchema = Type.Object({
          tags: Type.Optional(Type.Array(Type.String())),
        });
        const code = arktypeValidator.transformSchema(arraySchema, '');
        expect(code).toContain('"tags?": "string"[]');
      });
    });

    describe('union support', () => {
      it('transforms simple unions', () => {
        const unionSchema = Type.Object({
          value: Type.Union([Type.String(), Type.Number()]),
        });
        const code = arktypeValidator.transformSchema(unionSchema, '');
        expect(code).toContain('"string" | "number"');
      });

      it('transforms unions with objects', () => {
        const unionSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Object({
              id: Type.String(),
            }),
          ]),
        });
        const code = arktypeValidator.transformSchema(unionSchema, '');
        expect(code).toContain('"string" | type({');
        expect(code).toContain('"id": "string"');
      });

      it('transforms optional unions', () => {
        const unionSchema = Type.Object({
          value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        });
        const code = arktypeValidator.transformSchema(unionSchema, '');
        expect(code).toContain('"value?": "string" | "number"');
      });

      it('still handles enums correctly (anyOf with const)', () => {
        const enumSchema = Type.Object({
          status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
        });
        const code = arktypeValidator.transformSchema(enumSchema, '');
        // Should be literal union
        expect(code).toContain('\'active\' | \'inactive\'');
      });
    });

    describe('complex nested patterns', () => {
      it('transforms arrays with union items', () => {
        const complexSchema = Type.Object({
          items: Type.Array(Type.Union([Type.String(), Type.Number()])),
        });
        const code = arktypeValidator.transformSchema(complexSchema, '');
        expect(code).toContain('("string" | "number")[]');
      });

      it('transforms unions with arrays', () => {
        const complexSchema = Type.Object({
          data: Type.Union([
            Type.String(),
            Type.Array(Type.String()),
          ]),
        });
        const code = arktypeValidator.transformSchema(complexSchema, '');
        expect(code).toContain('"string" | "string"[]');
      });

      it('transforms the request-trigger pattern', () => {
        const TriggerSchema = Type.Object({
          event: Type.String(),
          from: Type.Optional(Type.String()),
        });

        const requestSchema = Type.Object({
          "request-trigger": Type.Optional(
            Type.Union([
              Type.String(),
              Type.Array(Type.Union([Type.String(), TriggerSchema])),
              TriggerSchema,
            ]),
          ),
        });

        const code = arktypeValidator.transformSchema(requestSchema, '');
        
        // Should contain nested unions and arrays
        expect(code).toContain('"request-trigger?":');
        expect(code).toContain('"string"');
        expect(code).toContain('[]');
        expect(code).toContain('type({');
        expect(code).toContain('"event": "string"');
        expect(code).toContain('"from?": "string"');
      });
    });
  });

  describe('toTypeBox', () => {
    it('generates valid TypeBox code (returns as-is)', () => {
      const rawContent = `import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({...});
export type Schema = InferSchema<typeof schema>;`;
      const code = typeboxValidator.transformSchema(schema, rawContent);
      // TypeBox should return the content as-is (no transformation)
      expect(code).toBe(rawContent);
      expect(code).toContain('import { Type } from "@sinclair/typebox"');
      expect(code).toContain('import { type InferSchema } from "~types"');
      expect(code).toContain('export type Schema = InferSchema<typeof schema>');
      // Should NOT contain validation functions or observedAttributes
      expect(code).not.toContain('observedAttributes');
      expect(code).not.toContain('validate');
      expect(code).not.toContain('safeValidate');
    });
  });
});
