import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  findTsConfigFiles,
  validateTsConfig,
  parseTsConfig,
  createBackup,
  mergeTsConfig,
  extractPathAliases,
  getBehaviorFNCompilerOptions,
  formatChanges,
  writeTsConfig,
} from "../src/utils/tsconfig";
import type { Config } from "../src/schemas/config";

describe("TypeScript Config Utilities", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsconfig-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("findTsConfigFiles", () => {
    it("should find tsconfig.json in root", () => {
      fs.writeFileSync(path.join(tempDir, "tsconfig.json"), "{}");

      const configs = findTsConfigFiles(tempDir);
      expect(configs).toEqual(["tsconfig.json"]);
    });

    it("should find multiple tsconfig files", () => {
      fs.writeFileSync(path.join(tempDir, "tsconfig.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "tsconfig.app.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "tsconfig.node.json"), "{}");

      const configs = findTsConfigFiles(tempDir);
      expect(configs).toHaveLength(3);
      expect(configs).toContain("tsconfig.json");
      expect(configs).toContain("tsconfig.app.json");
      expect(configs).toContain("tsconfig.node.json");
    });

    it("should find tsconfig in nested directories", () => {
      const nestedDir = path.join(tempDir, "packages", "web");
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(path.join(nestedDir, "tsconfig.json"), "{}");

      const configs = findTsConfigFiles(tempDir);
      expect(configs).toContain(path.join("packages", "web", "tsconfig.json"));
    });

    it("should exclude node_modules", () => {
      const nodeModulesDir = path.join(tempDir, "node_modules", "@types");
      fs.mkdirSync(nodeModulesDir, { recursive: true });
      fs.writeFileSync(path.join(nodeModulesDir, "tsconfig.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "tsconfig.json"), "{}");

      const configs = findTsConfigFiles(tempDir);
      expect(configs).toEqual(["tsconfig.json"]);
    });

    it("should only match tsconfig*.json pattern", () => {
      fs.writeFileSync(path.join(tempDir, "tsconfig.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "package.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "config.json"), "{}");

      const configs = findTsConfigFiles(tempDir);
      expect(configs).toEqual(["tsconfig.json"]);
    });
  });

  describe("validateTsConfig", () => {
    it("should validate a valid tsconfig", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      fs.writeFileSync(configPath, JSON.stringify({ compilerOptions: {} }));

      const result = validateTsConfig(configPath);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-existent file", () => {
      const result = validateTsConfig(path.join(tempDir, "nonexistent.json"));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("should reject invalid JSON", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      fs.writeFileSync(configPath, "{ invalid json }");

      const result = validateTsConfig(configPath);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JSON");
    });
  });

  describe("parseTsConfig", () => {
    it("should parse valid tsconfig", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      const config = { compilerOptions: { strict: true } };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const parsed = parseTsConfig(configPath);
      expect(parsed).toEqual(config);
    });

    it("should throw on invalid JSON", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      fs.writeFileSync(configPath, "{ invalid }");

      expect(() => parseTsConfig(configPath)).toThrow();
    });
  });

  describe("createBackup", () => {
    it("should create a timestamped backup", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      const originalContent = JSON.stringify({ test: true });
      fs.writeFileSync(configPath, originalContent);

      const backupPath = createBackup(configPath);

      expect(fs.existsSync(backupPath)).toBe(true);
      expect(backupPath).toMatch(/\.tsconfig\.backup\.\d{4}-\d{2}-\d{2}-\d{2}-\d{1,2}\.json$/);
      expect(fs.readFileSync(backupPath, "utf-8")).toBe(originalContent);
    });

    it("should create backup in same directory as original", () => {
      const nestedDir = path.join(tempDir, "config");
      fs.mkdirSync(nestedDir);
      const configPath = path.join(nestedDir, "tsconfig.json");
      fs.writeFileSync(configPath, "{}");

      const backupPath = createBackup(configPath);

      expect(path.dirname(backupPath)).toBe(nestedDir);
    });
  });

  describe("mergeTsConfig", () => {
    it("should preserve existing compiler options", () => {
      const existing = {
        compilerOptions: {
          outDir: "./dist",
          declaration: true,
        },
      };

      const additions = {
        compilerOptions: {
          strict: true,
        },
      };

      const merged = mergeTsConfig(existing, additions);

      expect(merged.compilerOptions.outDir).toBe("./dist");
      expect(merged.compilerOptions.declaration).toBe(true);
      expect(merged.compilerOptions.strict).toBe(true);
    });

    it("should merge lib arrays as unique set", () => {
      const existing = {
        compilerOptions: {
          lib: ["ES2020", "DOM"],
        },
      };

      const additions = {
        compilerOptions: {
          lib: ["ES2022", "DOM", "DOM.Iterable"],
        },
      };

      const merged = mergeTsConfig(existing, additions);

      expect(merged.compilerOptions.lib).toHaveLength(4);
      expect(merged.compilerOptions.lib).toContain("ES2020");
      expect(merged.compilerOptions.lib).toContain("ES2022");
      expect(merged.compilerOptions.lib).toContain("DOM");
      expect(merged.compilerOptions.lib).toContain("DOM.Iterable");
    });

    it("should merge paths additively", () => {
      const existing = {
        compilerOptions: {
          paths: {
            "@/*": ["./src/*"],
          },
        },
      };

      const additions = {
        compilerOptions: {
          paths: {
            "~utils": ["./src/utils.ts"],
            "~types": ["./src/types.ts"],
          },
        },
      };

      const merged = mergeTsConfig(existing, additions);

      expect(merged.compilerOptions.paths).toEqual({
        "@/*": ["./src/*"],
        "~utils": ["./src/utils.ts"],
        "~types": ["./src/types.ts"],
      });
    });

    it("should not override existing non-null values", () => {
      const existing = {
        compilerOptions: {
          target: "ES2015",
          strict: false,
        },
      };

      const additions = {
        compilerOptions: {
          target: "ES2022",
          strict: true,
          module: "ESNext",
        },
      };

      const merged = mergeTsConfig(existing, additions);

      // Existing non-null values preserved
      expect(merged.compilerOptions.target).toBe("ES2015");
      expect(merged.compilerOptions.strict).toBe(false);
      // New values added
      expect(merged.compilerOptions.module).toBe("ESNext");
    });
  });

  describe("extractPathAliases", () => {
    it("should extract path aliases from config", () => {
      const config: Config = {
        validator: "zod",
        paths: {
          behaviors: "./src/behaviors",
          utils: { path: "src/behavior-utils.ts", alias: "@/behavior-utils" },
          registry: { path: "src/behaviors/behavior-registry.ts", alias: "@/behavior-registry" },
          testUtils: { path: "tests/utils/command-test-harness.ts", alias: "@/test-utils" },
          host: { path: "src/behavioral-host.ts", alias: "@/behavioral-host" },
          types: { path: "src/types.ts", alias: "@/types" },
        },
      };

      const aliases = extractPathAliases(config);

      expect(aliases).toEqual({
        "@/behavior-registry": ["./src/behaviors/behavior-registry"],
        "@/behavioral-host": ["./src/behavioral-host"],
        "@/behavior-utils": ["./src/behavior-utils"],
        "@/test-utils": ["./tests/utils/command-test-harness"],
        "@/types": ["./src/types"],
      });
    });

    it("should only include paths with aliases defined", () => {
      const config: Config = {
        validator: "zod",
        paths: {
          behaviors: "./src/behaviors",
          utils: { path: "src/behavior-utils.ts", alias: "@/behavior-utils" },
          registry: { path: "src/behaviors/behavior-registry.ts" }, // No alias
          testUtils: { path: "tests/utils/command-test-harness.ts" }, // No alias
          host: { path: "src/behavioral-host.ts", alias: "@/behavioral-host" },
          types: { path: "src/types.ts" }, // No alias
        },
      };

      const aliases = extractPathAliases(config);

      expect(aliases).toEqual({
        "@/behavior-utils": ["./src/behavior-utils"],
        "@/behavioral-host": ["./src/behavioral-host"],
      });
    });

    it("should remove .ts extension from paths", () => {
      const config: Config = {
        validator: "zod",
        paths: {
          behaviors: "./src/behaviors",
          utils: { path: "src/utils.ts", alias: "@/utils" },
          registry: { path: "src/registry.ts", alias: "@/registry" },
          testUtils: { path: "tests/test-utils.ts", alias: "@/test-utils" },
          host: { path: "src/host.ts", alias: "@/host" },
          types: { path: "src/types.ts", alias: "@/types" },
        },
      };

      const aliases = extractPathAliases(config);

      // All paths should have .ts removed
      expect(aliases["@/utils"]).toEqual(["./src/utils"]);
      expect(aliases["@/registry"]).toEqual(["./src/registry"]);
      expect(aliases["@/test-utils"]).toEqual(["./tests/test-utils"]);
      expect(aliases["@/host"]).toEqual(["./src/host"]);
      expect(aliases["@/types"]).toEqual(["./src/types"]);
    });
  });

  describe("getBehaviorFNCompilerOptions", () => {
    it("should return all required compiler options with aliases", () => {
      const config: Config = {
        validator: "zod",
        paths: {
          behaviors: "./src/behaviors",
          utils: { path: "src/utils.ts", alias: "@/utils" },
          registry: { path: "src/registry.ts", alias: "@/registry" },
          testUtils: { path: "tests/test-utils.ts", alias: "@/test-utils" },
          host: { path: "src/host.ts", alias: "@/host" },
          types: { path: "src/types.ts", alias: "@/types" },
        },
      };

      const options = getBehaviorFNCompilerOptions(config);

      expect(options.compilerOptions.target).toBe("ES2022");
      expect(options.compilerOptions.module).toBe("ESNext");
      expect(options.compilerOptions.moduleResolution).toBe("bundler");
      expect(options.compilerOptions.customElements).toBe("scoped");
      expect(options.compilerOptions.strict).toBe(true);
      expect(options.compilerOptions.lib).toContain("ES2022");
      expect(options.compilerOptions.lib).toContain("DOM");
      expect(options.compilerOptions.lib).toContain("DOM.Iterable");
      expect(options.compilerOptions.baseUrl).toBe(".");
      expect(options.compilerOptions.paths).toBeDefined();
      expect(Object.keys(options.compilerOptions.paths).length).toBeGreaterThan(0);
    });

    it("should omit baseUrl and paths when no aliases defined", () => {
      const config: Config = {
        validator: "zod",
        paths: {
          behaviors: "./src/behaviors",
          utils: { path: "src/utils.ts" }, // No alias
          registry: { path: "src/registry.ts" }, // No alias
          testUtils: { path: "tests/test-utils.ts" }, // No alias
          host: { path: "src/host.ts" }, // No alias
          types: { path: "src/types.ts" }, // No alias
        },
      };

      const options = getBehaviorFNCompilerOptions(config);

      expect(options.compilerOptions.target).toBe("ES2022");
      expect(options.compilerOptions.module).toBe("ESNext");
      expect(options.compilerOptions.baseUrl).toBeUndefined();
      expect(options.compilerOptions.paths).toBeUndefined();
    });
  });

  describe("formatChanges", () => {
    it("should detect new additions", () => {
      const existing = {
        compilerOptions: {},
      };

      const merged = {
        compilerOptions: {
          strict: true,
          target: "ES2022",
        },
      };

      const changes = formatChanges(existing, merged);

      expect(changes).toContain('+ compilerOptions.strict = true');
      expect(changes).toContain('+ compilerOptions.target = "ES2022"');
    });

    it("should detect array additions", () => {
      const existing = {
        compilerOptions: {
          lib: ["ES2020"],
        },
      };

      const merged = {
        compilerOptions: {
          lib: ["ES2020", "DOM", "DOM.Iterable"],
        },
      };

      const changes = formatChanges(existing, merged);

      expect(changes.some((c) => c.includes("lib") && c.includes("DOM"))).toBe(true);
    });

    it("should not report identical values", () => {
      const existing = {
        compilerOptions: {
          strict: true,
          target: "ES2022",
        },
      };

      const merged = {
        compilerOptions: {
          strict: true,
          target: "ES2022",
        },
      };

      const changes = formatChanges(existing, merged);

      expect(changes).toHaveLength(0);
    });
  });

  describe("writeTsConfig", () => {
    it("should write valid JSON with formatting", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      const config = {
        compilerOptions: {
          strict: true,
          target: "ES2022",
        },
      };

      writeTsConfig(configPath, config);

      const written = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(written);

      expect(parsed).toEqual(config);
      // Should have 2-space indentation
      expect(written).toContain('  "compilerOptions"');
    });

    it("should end with newline", () => {
      const configPath = path.join(tempDir, "tsconfig.json");
      writeTsConfig(configPath, {});

      const written = fs.readFileSync(configPath, "utf-8");
      expect(written.endsWith("\n")).toBe(true);
    });
  });
});
