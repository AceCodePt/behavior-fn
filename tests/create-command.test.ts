import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateBehaviorName,
  behaviorExists,
} from "../src/utils/validation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Validation Utils", () => {
  describe("validateBehaviorName", () => {
    it("should accept valid kebab-case names", () => {
      expect(validateBehaviorName("my-behavior").valid).toBe(true);
      expect(validateBehaviorName("simple").valid).toBe(true);
      expect(validateBehaviorName("multi-word-name").valid).toBe(true);
      expect(validateBehaviorName("test-behavior-2").valid).toBe(true);
      expect(validateBehaviorName("input-watcher").valid).toBe(true);
    });

    it("should reject empty names", () => {
      const result = validateBehaviorName("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot be empty");
    });

    it("should reject non-kebab-case names", () => {
      expect(validateBehaviorName("MyBehavior").valid).toBe(false);
      expect(validateBehaviorName("my_behavior").valid).toBe(false);
      expect(validateBehaviorName("my behavior").valid).toBe(false);
    });

    it("should reject names starting or ending with hyphen", () => {
      expect(validateBehaviorName("-my-behavior").valid).toBe(false);
      expect(validateBehaviorName("my-behavior-").valid).toBe(false);
    });
  });

  describe("behaviorExists", () => {
    const mockRegistry = [
      { name: "logger" },
      { name: "request" },
      { name: "reveal" },
    ];

    it("should return true for existing behaviors", () => {
      expect(behaviorExists("logger", mockRegistry)).toBe(true);
      expect(behaviorExists("request", mockRegistry)).toBe(true);
    });

    it("should return false for non-existing behaviors", () => {
      expect(behaviorExists("new-behavior", mockRegistry)).toBe(false);
      expect(behaviorExists("unknown", mockRegistry)).toBe(false);
    });
  });
});

describe("Remove Command Validation", () => {
  it("should reject removing non-existent behavior", () => {
    const mockRegistry = [
      { name: "logger" },
      { name: "request" },
    ];
    expect(behaviorExists("non-existent", mockRegistry)).toBe(false);
  });

  it("should confirm existing behavior before removal", () => {
    const mockRegistry = [
      { name: "logger" },
      { name: "request" },
      { name: "reveal" },
    ];
    expect(behaviorExists("logger", mockRegistry)).toBe(true);
    expect(behaviorExists("request", mockRegistry)).toBe(true);
  });
});

describe("Template Generation", () => {
  it("should generate valid behavior definition", async () => {
    const { generateBehaviorDefinition } = await import(
      "../src/templates/behavior-templates"
    );
    const content = generateBehaviorDefinition("my-test");

    expect(content).toContain('name: "my-test"');
    expect(content).toContain("MY_TEST_DEFINITION");
    expect(content).toContain("uniqueBehaviorDef");
    expect(content).toContain('import { schema } from "./schema"');
  });

  it("should generate valid schema file", async () => {
    const { generateSchema } = await import(
      "../src/templates/behavior-templates"
    );
    const content = generateSchema("my-test");

    expect(content).toContain("Type.Object");
    expect(content).toContain("InferSchema");
    expect(content).toContain("export const schema");
    expect(content).toContain("export type SchemaType");
  });

  it("should generate valid behavior file", async () => {
    const { generateBehavior } = await import(
      "../src/templates/behavior-templates"
    );
    const content = generateBehavior("my-test");

    expect(content).toContain("myTestBehaviorFactory");
    expect(content).toContain("(el: HTMLElement)");
    expect(content).toContain("return {");
  });

  it("should generate valid test file", async () => {
    const { generateTest } = await import(
      "../src/templates/behavior-templates"
    );
    const content = generateTest("my-test");

    expect(content).toContain("@vitest-environment jsdom");
    expect(content).toContain("myTestBehaviorFactory");
    expect(content).toContain('describe("My Test Behavior"');
    expect(content).toContain("registerBehavior");
    expect(content).toContain("getObservedAttributes");
  });
});
