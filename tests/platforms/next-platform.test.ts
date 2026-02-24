import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { NextPlatform } from "../../src/platforms/next-platform";

describe("NextPlatform", () => {
  let testDir: string;
  let platform: NextPlatform;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "next-test-"));
    platform = new NextPlatform();
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("identity", () => {

    it("should have correct name", () => {
      expect(platform.name).toBe("next");
    });

    it("should have correct label", () => {
      expect(platform.label).toBe("Next.js");
    });
  });

  describe("detect", () => {
    it("should detect next.config.js", () => {
      fs.writeFileSync(path.join(testDir, "next.config.js"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should detect next.config.mjs", () => {
      fs.writeFileSync(path.join(testDir, "next.config.mjs"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should detect next.config.ts", () => {
      fs.writeFileSync(path.join(testDir, "next.config.ts"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should not detect when no config file present", () => {
      expect(platform.detect(testDir)).toBe(false);
    });

    it("should not detect astro.config.js", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.js"), "");
      expect(platform.detect(testDir)).toBe(false);
    });
  });

  describe("validate", () => {
    it("should fail when package.json is missing", () => {
      const result = platform.validate(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("package.json not found");
    });

    it("should fail when next is not in dependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ dependencies: {} })
      );
      const result = platform.validate(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("next not found in dependencies");
    });

    it("should pass when next is in dependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ dependencies: { next: "^14.0.0" } })
      );
      const result = platform.validate(testDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should pass when next is in devDependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ devDependencies: { next: "^14.0.0" } })
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
    it("should return standard isServer implementation", () => {
      const result = platform.transformIsServerCheck();
      expect(result).toContain("typeof window === 'undefined'");
      expect(result).toContain("export const isServer");
    });
  });
});
