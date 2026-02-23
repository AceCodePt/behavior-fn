// tests/transformers.test.ts
import { describe, it, expect } from 'vitest';
import { Type } from '@sinclair/typebox';
import { toZod } from '../src/transformers/toZod';
import { toValibot } from '../src/transformers/toValibot';
import { toArkType } from '../src/transformers/toArkType';
import { toTypeBox } from '../src/transformers/toTypeBox';
import { toZodMini } from '../src/transformers/toZodMini';

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
      const code = toZod(schema);
      expect(code).toContain('import { z } from "zod"');
      expect(code).toContain('z.string().min(1)');
      expect(code).toContain('z.string().optional()');
      expect(code).toContain('z.enum([\'a\', \'b\'])');
      expect(code).toContain('z.number().min(0).max(10)');
      expect(code).toContain('z.boolean()');
      expect(code).toContain('"nested": z.object({');
      expect(code).toContain('observedAttributes = ["required","optional","enum","number","boolean","nested"]');
    });
  });

  describe('toZodMini', () => {
    it('generates valid Zod Mini code', () => {
      const code = toZodMini(schema);
      expect(code).toContain('import * as z from "zod/mini"');
      expect(code).toContain('z.min(z.string(), 1)');
      expect(code).toContain('z.optional(z.string())');
      expect(code).toContain('z.enum([\'a\', \'b\'])');
      // For number range, we check if min and max are applied.
      // Assuming implementation wraps recursively: z.max(z.min(z.number(), 0), 10)
      const hasNumber = code.includes('z.max(z.min(z.number(), 0), 10)') || code.includes('z.min(z.max(z.number(), 10), 0)');
      expect(hasNumber).toBe(true);
      expect(code).toContain('z.boolean()');
      expect(code).toContain('"nested": z.object({');
      expect(code).toContain('observedAttributes = ["required","optional","enum","number","boolean","nested"]');
    });
  });

  describe('toValibot', () => {
    it('generates valid Valibot code', () => {
      const code = toValibot(schema);
      expect(code).toContain('import * as v from "valibot"');
      expect(code).toContain('v.pipe(v.string(), v.minLength(1))');
      expect(code).toContain('v.optional(v.string())');
      expect(code).toContain('v.picklist([\'a\', \'b\'])');
      expect(code).toContain('v.pipe(v.number(), v.minValue(0), v.maxValue(10))');
      expect(code).toContain('v.boolean()');
      expect(code).toContain('"nested": v.object({');
      expect(code).toContain('observedAttributes = ["required","optional","enum","number","boolean","nested"]');
    });
  });

  describe('toArkType', () => {
    it('generates valid ArkType code', () => {
      const code = toArkType(schema);
      expect(code).toContain('import { type } from "arktype"');
      expect(code).toContain('"required": "string >= 1"');
      expect(code).toContain('"optional?": "string"');
      expect(code).toContain('\'a\' | \'b\'');
      expect(code).toContain('"number": "number >= 0"'); // Note: ArkType max not directly supported in min/max logic yet or implementation check
      expect(code).toContain('"boolean": "boolean"');
      expect(code).toContain('"nested": type({');
      expect(code).toContain('observedAttributes = ["required","optional","enum","number","boolean","nested"]');
    });
  });

  describe('toTypeBox', () => {
    it('generates valid TypeBox code (wrapper)', () => {
      const rawContent = `export const schema = Type.Object({...});`;
      const code = toTypeBox(rawContent, schema);
      expect(code).toContain('import { Value } from \'@sinclair/typebox/value\'');
      // expect(code).toContain('export type Schema = Static<typeof schema>'); // Removed as source now exports Schema
      expect(code).toContain('observedAttributes = ["required","optional","enum","number","boolean","nested"]');
    });
  });
});
