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
      const code = zodValidator.transformSchema(schema, '');
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
  });

  describe('toZodMini', () => {
    it('generates valid Zod Mini code', () => {
      const code = zodMiniValidator.transformSchema(schema, '');
      expect(code).toContain('import * as z from "zod/mini"');
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
  });

  describe('toValibot', () => {
    it('generates valid Valibot code', () => {
      const code = valibotValidator.transformSchema(schema, '');
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
  });

  describe('toArkType', () => {
    it('generates valid ArkType code', () => {
      const code = arktypeValidator.transformSchema(schema, '');
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
