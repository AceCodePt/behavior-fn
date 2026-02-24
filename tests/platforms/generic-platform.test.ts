import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { GenericPlatform } from "../../src/platforms/generic-platform";

describe("GenericPlatform", () => {
  let testDir: string;
  let platform: GenericPlatform;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "generic-test-"));
    platform = new GenericPlatform();
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("identity", () => {

    it("should have correct name", () => {
      expect(platform.name).toBe("generic");
    });

    it("should have correct label", () => {
      expect(platform.label).toBe("Generic");
    });
  });

  describe("detect", () => {
    it("should always detect (fallback)", () => {
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should detect even with Astro config present", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.js"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should detect even with Next config present", () => {
      fs.writeFileSync(path.join(testDir, "next.config.js"), "");
      expect(platform.detect(testDir)).toBe(true);
    });
  });

  describe("validate", () => {
    it("should always pass validation", () => {
      const result = platform.validate(testDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should pass even without package.json", () => {
      const result = platform.validate(testDir);
      expect(result.valid).toBe(true);
    });
  });

  describe("transformIsServerCheck", () => {
    it("should return standard isServer implementation", () => {
      const result = platform.transformIsServerCheck();
      expect(result).toContain("typeof window === 'undefined'");
      expect(result).toContain("export const isServer");
    });
  });
});
