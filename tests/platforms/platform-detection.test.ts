import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { detectPlatform, getPlatform, platforms } from "../../src/platforms/index";

describe("Platform Detection", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "platform-detect-test-"));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("getPlatform", () => {
    it("should get platform by name", () => {
      const platform = getPlatform("astro");
      expect(platform).toBeDefined();
      expect(platform.name).toBe("astro");
    });

    it("should throw for invalid name", () => {
      expect(() => getPlatform("invalid")).toThrow('Platform "invalid" not found');
    });
  });

  describe("platforms registry", () => {
    it("should contain Astro platform", () => {
      const astro = platforms.find((p) => p.name === "astro");
      expect(astro).toBeDefined();
      expect(astro?.name).toBe("astro");
    });

    it("should contain Next platform", () => {
      const next = platforms.find((p) => p.name === "next");
      expect(next).toBeDefined();
      expect(next?.name).toBe("next");
    });

    it("should contain Generic platform as last entry", () => {
      const generic = platforms[platforms.length - 1];
      expect(generic.name).toBe("generic");
    });

    it("should have Generic as fallback", () => {
      expect(platforms.length).toBeGreaterThan(0);
      const lastPlatform = platforms[platforms.length - 1];
      expect(lastPlatform.detect(testDir)).toBe(true);
    });
  });

  describe("detectPlatform", () => {
    it("should detect Astro when astro.config.js exists", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.js"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("astro");
    });

    it("should detect Astro when astro.config.ts exists", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.ts"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("astro");
    });

    it("should detect Next when next.config.js exists", () => {
      fs.writeFileSync(path.join(testDir, "next.config.js"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("next");
    });

    it("should detect Next when next.config.mjs exists", () => {
      fs.writeFileSync(path.join(testDir, "next.config.mjs"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("next");
    });

    it("should fallback to Generic when no config files exist", () => {
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("generic");
    });

    it("should prioritize Astro over Generic when both match", () => {
      fs.writeFileSync(path.join(testDir, "astro.config.js"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("astro");
    });

    it("should prioritize Next over Generic when both match", () => {
      fs.writeFileSync(path.join(testDir, "next.config.js"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("next");
    });

    it("should detect first match when multiple configs exist", () => {
      // Create both configs - should detect Astro since it's first in registry
      fs.writeFileSync(path.join(testDir, "astro.config.js"), "");
      fs.writeFileSync(path.join(testDir, "next.config.js"), "");
      const platform = detectPlatform(testDir);
      expect(platform.name).toBe("astro");
    });
  });
});
