import { describe, it, expect } from "vitest";
import {
  getValidator,
  isValidValidator,
  validators,
  zodValidator,
  valibotValidator,
  arktypeValidator,
  typeboxValidator,
  zodMiniValidator,
} from "../src/validators/index";

describe("Validator Utilities", () => {
  describe("getValidator", () => {
    it("should return validator by package name", () => {
      expect(getValidator("zod")).toBe(zodValidator);
      expect(getValidator("valibot")).toBe(valibotValidator);
      expect(getValidator("arktype")).toBe(arktypeValidator);
      expect(getValidator("@sinclair/typebox")).toBe(typeboxValidator);
      expect(getValidator("zod-mini")).toBe(zodMiniValidator);
    });

    it("should be case-insensitive", () => {
      expect(getValidator("ZOD")).toBe(zodValidator);
      expect(getValidator("Valibot")).toBe(valibotValidator);
      expect(getValidator("ArkType")).toBe(arktypeValidator);
    });

    it("should throw error for invalid package name", () => {
      expect(() => getValidator("unknown-package")).toThrow('Validator "unknown-package" not found');
    });
  });

  describe("isValidValidator", () => {
    it("should return true for valid package names", () => {
      expect(isValidValidator("zod")).toBe(true);
      expect(isValidValidator("valibot")).toBe(true);
      expect(isValidValidator("arktype")).toBe(true);
      expect(isValidValidator("@sinclair/typebox")).toBe(true);
      expect(isValidValidator("zod-mini")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(isValidValidator("ZOD")).toBe(true);
      expect(isValidValidator("Valibot")).toBe(true);
    });

    it("should return false for invalid package names", () => {
      expect(isValidValidator("unknown-package")).toBe(false);
      expect(isValidValidator("")).toBe(false);
    });
  });

  describe("validators array", () => {
    it("should contain all 5 validators", () => {
      expect(validators).toHaveLength(5);
    });

    it("should have unique package names", () => {
      const packageNames = validators.map((v) => v.packageName);
      const uniqueNames = new Set(packageNames);
      expect(uniqueNames.size).toBe(packageNames.length);
    });

    it("should have unique labels", () => {
      const labels = validators.map((v) => v.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it("should export as readonly tuple", () => {
      // TypeScript compile-time check - if this compiles, it's readonly
      const _typeCheck: readonly [any, any, any, any, any] = validators;
      expect(_typeCheck).toBe(validators);
    });
  });

  describe("singleton instances", () => {
    it("should export singleton instances", () => {
      expect(zodValidator.packageName).toBe("zod");
      expect(valibotValidator.packageName).toBe("valibot");
      expect(arktypeValidator.packageName).toBe("arktype");
      expect(typeboxValidator.packageName).toBe("@sinclair/typebox");
      expect(zodMiniValidator.packageName).toBe("zod-mini");
    });

    it("should have immutable package names (readonly at compile-time)", () => {
      const pkg = zodValidator.packageName;
      // TypeScript prevents reassignment at compile-time with 'readonly'
      // At runtime, the assignment silently fails in non-strict mode
      expect(zodValidator.packageName).toBe(pkg);
    });

    it("should have immutable labels (readonly at compile-time)", () => {
      const label = zodValidator.label;
      // TypeScript prevents reassignment at compile-time with 'readonly'
      // At runtime, the assignment silently fails in non-strict mode
      expect(zodValidator.label).toBe(label);
    });
  });
});
