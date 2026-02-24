import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AstroPlatform } from "../../src/platforms/astro-platform";

describe("AstroPlatform", () => {
  let testDir: string;
  let platform: AstroPlatform;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "astro-test-"));
    platform = new AstroPlatform();
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("identity", () => {

    it("should have correct name", () => {
      expect(platform.name).toBe("astro");
    });

    it("should have correct label", () => {
      expect(platform.label).toBe("Astro");
    });
  });

  describe("detect", () => {
    it("should detect astro.config.js", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.js"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should detect astro.config.mjs", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.mjs"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should detect astro.config.ts", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.ts"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should not detect when no config file present", () => {
      expect(platform.detect(testDir)).toBe(false);
    });

    it("should not detect next.config.js", () => {
      fs.writeFileSync(path.join(testDir, "next.config.js"), "");
      expect(platform.detect(testDir)).toBe(false);
    });
  });

  describe("validate", () => {
    it("should fail when package.json is missing", () => {
      const result = platform.validate(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("package.json not found");
    });

    it("should fail when astro is not in dependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ dependencies: {} })
      );
      const result = platform.validate(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("astro not found in dependencies");
    });

    it("should pass when astro is in dependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ dependencies: { astro: "^4.0.0" } })
      );
      const result = platform.validate(testDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should pass when astro is in devDependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ devDependencies: { astro: "^4.0.0" } })
      );
      const result = platform.validate(testDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should fail when package.json is invalid JSON", () => {
      fs.writeFileSync(path.join(testDir, "package.json"), "invalid json");
      const result = platform.validate(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Failed to parse package.json");
    });
  });

  describe("transformIsServerCheck", () => {
    it("should return Astro-specific isServer implementation", () => {
      const result = platform.transformIsServerCheck();
      expect(result).toContain("import.meta.env.SSR");
      expect(result).toContain("export const isServer");
    });
  });
});
