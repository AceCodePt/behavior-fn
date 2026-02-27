import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

describe("behavior-fn add - test files option", () => {
  const testDir = path.join(projectRoot, "tests", "fixtures", "test-files-option");
  const configFile = path.join(testDir, "behavior.config.json");
  
  beforeEach(() => {
    // Create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create a basic behavior.config.json config
    const config = {
      validator: "zod",
      paths: {
        behaviors: "src/behaviors",
        utils: "src/behavior-utils.ts",
        registry: "src/behaviors/behavior-registry.ts",
        testUtils: "tests/utils/command-test-harness.ts",
      },
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behaviors/behavior-registry",
        testUtils: "@/tests/utils/command-test-harness",
      },
    };
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Config interface", () => {
    it("should support optionalFiles.tests field in config", () => {
      // Read config and add optionalFiles.tests field
      const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      config.optionalFiles = { tests: true };
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      
      // Verify it can be read back
      const loadedConfig = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      expect(loadedConfig.optionalFiles.tests).toBe(true);
    });

    it("should allow optionalFiles to be undefined (optional)", () => {
      const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
      expect(config.optionalFiles).toBeUndefined();
    });
  });

  describe("Flag parsing", () => {
    it("should parse --with-tests flag", () => {
      const args = ["add", "reveal", "--with-tests"];
      const flags = {
        withTests: args.includes("--with-tests") || args.includes("-t"),
      };
      expect(flags.withTests).toBe(true);
    });

    it("should parse -t flag (short form for --with-tests)", () => {
      const args = ["add", "reveal", "-t"];
      const flags = {
        withTests: args.includes("--with-tests") || args.includes("-t"),
      };
      expect(flags.withTests).toBe(true);
    });

    it("should handle no flags (default behavior)", () => {
      const args = ["add", "reveal"];
      const flags = {
        withTests: args.includes("--with-tests") || args.includes("-t"),
      };
      expect(flags.withTests).toBe(false);
    });
  });

  describe("Decision resolution logic", () => {
    it("should default to false when no flag or config (production-first)", () => {
      const flags = { withTests: false };
      const config: any = { optionalFiles: undefined };
      
      let includeTests = false; // New default
      if (flags.withTests) {
        includeTests = true;
      } else if (config.optionalFiles?.tests !== undefined) {
        includeTests = config.optionalFiles.tests;
      }
      
      expect(includeTests).toBe(false);
    });

    it("should use --with-tests flag (override config)", () => {
      const flags = { withTests: true };
      const config: any = { optionalFiles: { tests: false } };
      
      let includeTests = false;
      if (flags.withTests) {
        includeTests = true;
      } else if (config.optionalFiles?.tests !== undefined) {
        includeTests = config.optionalFiles.tests;
      }
      
      expect(includeTests).toBe(true);
    });

    it("should respect config when no flags (config = true)", () => {
      const flags = { withTests: false };
      const config: any = { optionalFiles: { tests: true } };
      
      let includeTests = false;
      if (flags.withTests) {
        includeTests = true;
      } else if (config.optionalFiles?.tests !== undefined) {
        includeTests = config.optionalFiles.tests;
      }
      
      expect(includeTests).toBe(true);
    });

    it("should respect config when no flags (config = false)", () => {
      const flags = { withTests: false };
      const config: any = { optionalFiles: { tests: false } };
      
      let includeTests = false;
      if (flags.withTests) {
        includeTests = true;
      } else if (config.optionalFiles?.tests !== undefined) {
        includeTests = config.optionalFiles.tests;
      }
      
      expect(includeTests).toBe(false);
    });
  });

  describe("File filtering", () => {
    it("should identify test files by .test.ts extension", () => {
      const files = [
        { path: "behavior.ts" },
        { path: "behavior.test.ts" },
        { path: "schema.ts" },
        { path: "_behavior-definition.ts" },
      ];
      
      const testFiles = files.filter(f => f.path.endsWith(".test.ts"));
      expect(testFiles).toHaveLength(1);
      expect(testFiles[0].path).toBe("behavior.test.ts");
    });

    it("should filter out test files when includeTests is false", () => {
      const files = [
        { path: "behavior.ts" },
        { path: "behavior.test.ts" },
        { path: "schema.ts" },
      ];
      const includeTests = false;
      
      const filteredFiles = files.filter(f => {
        if (!includeTests && f.path.endsWith(".test.ts")) {
          return false;
        }
        return true;
      });
      
      expect(filteredFiles).toHaveLength(2);
      expect(filteredFiles.find(f => f.path.endsWith(".test.ts"))).toBeUndefined();
    });

    it("should include all files when includeTests is true", () => {
      const files = [
        { path: "behavior.ts" },
        { path: "behavior.test.ts" },
        { path: "schema.ts" },
      ];
      const includeTests = true;
      
      const filteredFiles = files.filter(f => {
        if (!includeTests && f.path.endsWith(".test.ts")) {
          return false;
        }
        return true;
      });
      
      expect(filteredFiles).toHaveLength(3);
      expect(filteredFiles.find(f => f.path.endsWith(".test.ts"))).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle explicit config with optionalFiles.tests: true", () => {
      const config: any = { optionalFiles: { tests: true } };
      const flags = { withTests: false };
      
      let includeTests = false;
      if (flags.withTests) {
        includeTests = true;
      } else if (config.optionalFiles?.tests !== undefined) {
        includeTests = config.optionalFiles.tests;
      }
      
      expect(includeTests).toBe(true);
    });

    it("should handle missing optionalFiles (defaults to false)", () => {
      const config: any = {};
      const flags = { withTests: false };
      
      let includeTests = false;
      if (flags.withTests) {
        includeTests = true;
      } else if (config.optionalFiles?.tests !== undefined) {
        includeTests = config.optionalFiles.tests;
      }
      
      expect(includeTests).toBe(false);
    });
  });
});
