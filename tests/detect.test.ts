import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";

// Use vi.hoisted to ensure mocks are properly hoisted
const { mockExistsSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
}));

// Mock fs module before imports
vi.mock("node:fs", () => ({
  default: {
    existsSync: mockExistsSync,
  },
  existsSync: mockExistsSync,
}));

import {
  detectTypeScript,
  detectPackageManager,
  detectProjectStructure,
  detectEnvironment,
} from "../src/utils/detect";

describe("detect utilities", () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  describe("detectTypeScript", () => {
    it("should return true when tsconfig.json exists", () => {
      mockExistsSync.mockReturnValue(true);
      
      const result = detectTypeScript("/test/project");
      
      expect(result).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith("/test/project/tsconfig.json");
    });

    it("should return false when tsconfig.json does not exist", () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = detectTypeScript("/test/project");
      
      expect(result).toBe(false);
    });

    it("should use process.cwd() by default", () => {
      const cwd = process.cwd();
      mockExistsSync.mockReturnValue(true);
      
      detectTypeScript();
      
      expect(mockExistsSync).toHaveBeenCalledWith(path.join(cwd, "tsconfig.json"));
    });
  });

  describe("detectPackageManager", () => {
    it("should detect pnpm from pnpm-lock.yaml", () => {
      mockExistsSync.mockImplementation((p) => {
        return p.toString().endsWith("pnpm-lock.yaml");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("pnpm");
    });

    it("should detect bun from bun.lockb", () => {
      mockExistsSync.mockImplementation((p) => {
        return p.toString().endsWith("bun.lockb");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("bun");
    });

    it("should detect npm from package-lock.json", () => {
      mockExistsSync.mockImplementation((p) => {
        return p.toString().endsWith("package-lock.json");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("npm");
    });

    it("should detect yarn from yarn.lock", () => {
      mockExistsSync.mockImplementation((p) => {
        return p.toString().endsWith("yarn.lock");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("yarn");
    });

    it("should prioritize pnpm over other package managers", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // Multiple lockfiles present
        return pathStr.endsWith("pnpm-lock.yaml") || 
               pathStr.endsWith("package-lock.json") ||
               pathStr.endsWith("yarn.lock");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("pnpm");
    });

    it("should prioritize bun over npm and yarn", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // bun, npm, and yarn lockfiles present (but not pnpm)
        return pathStr.endsWith("bun.lockb") || 
               pathStr.endsWith("package-lock.json") ||
               pathStr.endsWith("yarn.lock");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("bun");
    });

    it("should prioritize npm over yarn", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // npm and yarn lockfiles present
        return pathStr.endsWith("package-lock.json") ||
               pathStr.endsWith("yarn.lock");
      });
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("npm");
    });

    it("should default to npm when no lockfile exists", () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = detectPackageManager("/test/project");
      
      expect(result).toBe("npm");
    });
  });

  describe("detectProjectStructure", () => {
    it("should suggest src/behaviors when src/ exists", () => {
      mockExistsSync.mockImplementation((p) => {
        return p.toString().endsWith("/src");
      });
      
      const result = detectProjectStructure("/test/project");
      
      expect(result).toEqual({
        hasSrc: true,
        hasLib: false,
        suggestedPath: "./src/behaviors",
      });
    });

    it("should suggest lib/behaviors when lib/ exists but not src/", () => {
      mockExistsSync.mockImplementation((p) => {
        return p.toString().endsWith("/lib");
      });
      
      const result = detectProjectStructure("/test/project");
      
      expect(result).toEqual({
        hasSrc: false,
        hasLib: true,
        suggestedPath: "./lib/behaviors",
      });
    });

    it("should suggest ./behaviors when neither src/ nor lib/ exists", () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = detectProjectStructure("/test/project");
      
      expect(result).toEqual({
        hasSrc: false,
        hasLib: false,
        suggestedPath: "./behaviors",
      });
    });

    it("should prefer src/ over lib/ when both exist", () => {
      mockExistsSync.mockReturnValue(true);
      
      const result = detectProjectStructure("/test/project");
      
      expect(result).toEqual({
        hasSrc: true,
        hasLib: true,
        suggestedPath: "./src/behaviors",
      });
    });
  });

  describe("detectEnvironment", () => {
    it("should combine all detection results", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // TypeScript project with pnpm and src/ directory
        return pathStr.endsWith("tsconfig.json") ||
               pathStr.endsWith("pnpm-lock.yaml") ||
               pathStr.endsWith("/src");
      });
      
      const result = detectEnvironment("/test/project");
      
      expect(result).toEqual({
        typescript: true,
        packageManager: "pnpm",
        hasSrc: true,
        hasLib: false,
        suggestedPath: "./src/behaviors",
      });
    });

    it("should handle JavaScript project with npm and no src/", () => {
      mockExistsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // Only package-lock.json exists
        return pathStr.endsWith("package-lock.json");
      });
      
      const result = detectEnvironment("/test/project");
      
      expect(result).toEqual({
        typescript: false,
        packageManager: "npm",
        hasSrc: false,
        hasLib: false,
        suggestedPath: "./behaviors",
      });
    });
  });
});
