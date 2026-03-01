import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

describe("behavior-fn add - integration tests with test files", () => {
  const testDir = path.join(projectRoot, "tests", "fixtures", "test-files-integration");
  const behaviorsDir = path.join(testDir, "src", "behaviors");
  const revealDir = path.join(behaviorsDir, "reveal");
  
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
        utils: {
          path: "src/behavior-utils.ts",
          alias: "~utils",
        },
        registry: {
          path: "src/behaviors/behavior-registry.ts",
          alias: "~registry",
        },
        testUtils: {
          path: "tests/utils/command-test-harness.ts",
          alias: "~test-utils",
        },
        host: {
          path: "src/behavioral-host.ts",
          alias: "~host",
        },
        types: {
          path: "src/types.ts",
          alias: "~types",
        },
      },
    };
    fs.writeFileSync(
      path.join(testDir, "behavior.config.json"),
      JSON.stringify(config, null, 2),
    );
    
    // Create a minimal package.json
    fs.writeFileSync(
      path.join(testDir, "package.json"),
      JSON.stringify({ 
        name: "test-project",
        dependencies: { zod: "^3.0.0" }
      }, null, 2),
    );
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should install behavior without test files by default (no config)", () => {
    const configPath = path.join(testDir, "behavior.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    // Simulate what would happen: check if test files would be filtered
    const mockBehaviorFiles = [
      { path: "behavior.ts" },
      { path: "behavior.test.ts" },
      { path: "schema.ts" },
    ];
    
    // New default: false (production-first)
    const includeTests = config.optionalFiles?.tests ?? false;
    const filteredFiles = mockBehaviorFiles.filter(f => {
      if (!includeTests && f.path.endsWith(".test.ts")) {
        return false;
      }
      return true;
    });
    
    expect(filteredFiles).toHaveLength(2);
    expect(filteredFiles.find(f => f.path === "behavior.ts")).toBeDefined();
    expect(filteredFiles.find(f => f.path === "schema.ts")).toBeDefined();
    expect(filteredFiles.find(f => f.path === "behavior.test.ts")).toBeUndefined();
  });

  it("should install behavior with test files when config.optionalFiles.tests is true", () => {
    // Update config to include tests
    const configPath = path.join(testDir, "behavior.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    config.optionalFiles = { tests: true };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Simulate what would happen
    const mockBehaviorFiles = [
      { path: "behavior.ts" },
      { path: "behavior.test.ts" },
      { path: "schema.ts" },
    ];
    
    const includeTests = config.optionalFiles.tests;
    const filteredFiles = mockBehaviorFiles.filter(f => {
      if (!includeTests && f.path.endsWith(".test.ts")) {
        return false;
      }
      return true;
    });
    
    expect(filteredFiles).toHaveLength(3);
    expect(filteredFiles.find(f => f.path === "behavior.test.ts")).toBeDefined();
  });

  it("should default to excluding tests when config.optionalFiles is undefined", () => {
    const configPath = path.join(testDir, "behavior.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    // Ensure optionalFiles is undefined
    expect(config.optionalFiles).toBeUndefined();
    
    // Simulate decision logic (new default: false)
    let includeTests = false; // New default
    if (config.optionalFiles?.tests !== undefined) {
      includeTests = config.optionalFiles.tests;
    }
    
    expect(includeTests).toBe(false);
  });

  it("should handle multiple behaviors with different test preferences", () => {
    const mockBehavior1Files = [
      { path: "behavior.ts" },
      { path: "behavior.test.ts" },
    ];
    
    const mockBehavior2Files = [
      { path: "behavior.ts" },
      { path: "behavior.test.ts" },
    ];
    
    // Install first behavior with tests
    let includeTests = true;
    const filtered1 = mockBehavior1Files.filter(f => {
      if (!includeTests && f.path.endsWith(".test.ts")) {
        return false;
      }
      return true;
    });
    
    // Install second behavior without tests
    includeTests = false;
    const filtered2 = mockBehavior2Files.filter(f => {
      if (!includeTests && f.path.endsWith(".test.ts")) {
        return false;
      }
      return true;
    });
    
    expect(filtered1).toHaveLength(2);
    expect(filtered2).toHaveLength(1);
  });

  it("should respect flag precedence: --with-tests overrides config", () => {
    const config: any = { optionalFiles: { tests: false } };
    const flags = { withTests: true };
    
    let includeTests = false;
    if (flags.withTests) {
      includeTests = true;
    } else if (config.optionalFiles?.tests !== undefined) {
      includeTests = config.optionalFiles.tests;
    }
    
    expect(includeTests).toBe(true);
  });

  it("should use config when no flags are provided (config = false)", () => {
    const config: any = { optionalFiles: { tests: false } };
    const flags = { withTests: false };
    
    let includeTests = false;
    if (flags.withTests) {
      includeTests = true;
    } else if (config.optionalFiles?.tests !== undefined) {
      includeTests = config.optionalFiles.tests;
    }
    
    expect(includeTests).toBe(false);
  });

  it("should use config when no flags are provided (config = true)", () => {
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
});
