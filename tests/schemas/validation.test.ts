import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Value } from "@sinclair/typebox/value";
import { ConfigSchema, type Config } from "../../src/schemas/config";
import { BehaviorRegistrySchema, type BehaviorRegistry } from "../../src/schemas/registry";
import { validateJson, validateJsonFile } from "../../src/schemas/validation";

describe("Config Schema Validation", () => {
  it("should accept valid config", () => {
    const valid: Config = {
      validator: "zod",
      paths: {
        behaviors: "./src/behaviors",
        utils: {
          path: "./src/behavior-utils.ts",
          alias: "@/behavior-utils",
        },
        registry: {
          path: "./src/behaviors/behavior-registry.ts",
          alias: "@/behavior-registry",
        },
        testUtils: {
          path: "./tests/utils/command-test-harness.ts",
          alias: "@/test-utils",
        },
        host: {
          path: "./src/behavioral-host.ts",
          alias: "@/behavioral-host",
        },
        types: {
          path: "./src/types.ts",
          alias: "@/types",
        },
      },
    };

    expect(Value.Check(ConfigSchema, valid)).toBe(true);
  });

  it("should accept config with optional fields", () => {
    const valid: Config = {
      validator: "zod",
      paths: {
        behaviors: "./src/behaviors",
        utils: {
          path: "./src/behavior-utils.ts",
          alias: "@/behavior-utils",
        },
        registry: {
          path: "./src/behaviors/behavior-registry.ts",
          alias: "@/behavior-registry",
        },
        testUtils: {
          path: "./tests/utils/command-test-harness.ts",
          alias: "@/test-utils",
        },
        host: {
          path: "./src/behavioral-host.ts",
          alias: "@/behavioral-host",
        },
        types: {
          path: "./src/types.ts",
          alias: "@/types",
        },
      },
      optionalFiles: {
        tests: true,
      },
    };

    expect(Value.Check(ConfigSchema, valid)).toBe(true);
  });

  it("should accept all validator options", () => {
    const validators = ["zod", "valibot", "arktype", "@sinclair/typebox", "zod-mini"];

    for (const validator of validators) {
      const config = {
        validator,
        paths: {
          behaviors: "./src/behaviors",
          utils: { path: "./src/behavior-utils.ts", alias: "@/behavior-utils" },
          registry: { path: "./src/behaviors/behavior-registry.ts", alias: "@/behavior-registry" },
          testUtils: { path: "./tests/utils/command-test-harness.ts", alias: "@/test-utils" },
          host: { path: "./src/behavioral-host.ts", alias: "@/behavioral-host" },
          types: { path: "./src/types.ts", alias: "@/types" },
        },
      };

      expect(Value.Check(ConfigSchema, config)).toBe(true);
    }
  });

  it("should reject invalid validator", () => {
    const invalid = {
      validator: "invalid-validator",
      paths: {
        behaviors: "./src/behaviors",
        utils: "./src/behavior-utils.ts",
        registry: "./src/behaviors/behavior-registry.ts",
        testUtils: "./tests/utils/command-test-harness.ts",
        host: "./src/behavioral-host.ts",
        types: "./src/types.ts",
      },
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behavior-registry",
        testUtils: "@/test-utils",
        host: "@/behavioral-host",
        types: "@/types",
      },
    };

    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });

  it("should reject missing required paths", () => {
    const invalid = {
      validator: "zod",
      paths: {
        behaviors: "./src/behaviors",
        // Missing other required paths
      },
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behavior-registry",
        testUtils: "@/test-utils",
        host: "@/behavioral-host",
        types: "@/types",
      },
    };

    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });

  it("should reject missing required aliases", () => {
    const invalid = {
      validator: "zod",
      paths: {
        behaviors: "./src/behaviors",
        utils: "./src/behavior-utils.ts",
        registry: "./src/behaviors/behavior-registry.ts",
        testUtils: "./tests/utils/command-test-harness.ts",
        host: "./src/behavioral-host.ts",
        types: "./src/types.ts",
      },
      aliases: {
        utils: "@/behavior-utils",
        // Missing other required aliases
      },
    };

    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });

  it("should reject config with no paths", () => {
    const invalid = {
      validator: "zod",
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behavior-registry",
        testUtils: "@/test-utils",
        host: "@/behavioral-host",
        types: "@/types",
      },
    };

    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });

  it("should reject config with no validator", () => {
    const invalid = {
      paths: {
        behaviors: "./src/behaviors",
        utils: "./src/behavior-utils.ts",
        registry: "./src/behaviors/behavior-registry.ts",
        testUtils: "./tests/utils/command-test-harness.ts",
        host: "./src/behavioral-host.ts",
        types: "./src/types.ts",
      },
      aliases: {
        utils: "@/behavior-utils",
        registry: "@/behavior-registry",
        testUtils: "@/test-utils",
        host: "@/behavioral-host",
        types: "@/types",
      },
    };

    expect(Value.Check(ConfigSchema, invalid)).toBe(false);
  });
});

describe("Registry Schema Validation", () => {
  it("should accept valid registry", () => {
    const valid: BehaviorRegistry = [
      {
        name: "reveal",
        files: [
          { path: "reveal/_behavior-definition.ts" },
          { path: "reveal/schema.ts" },
          { path: "reveal/behavior.ts" },
          { path: "reveal/behavior.test.ts" },
        ],
      },
      {
        name: "request",
        files: [
          { path: "request/_behavior-definition.ts" },
          { path: "request/schema.ts" },
          { path: "request/behavior.ts" },
          { path: "request/behavior.test.ts" },
        ],
        dependencies: ["auto-wc"],
      },
    ];

    expect(Value.Check(BehaviorRegistrySchema, valid)).toBe(true);
  });

  it("should accept empty registry", () => {
    const valid: BehaviorRegistry = [];
    expect(Value.Check(BehaviorRegistrySchema, valid)).toBe(true);
  });

  it("should accept behavior without dependencies", () => {
    const valid: BehaviorRegistry = [
      {
        name: "logger",
        files: [
          { path: "logger/_behavior-definition.ts" },
          { path: "logger/schema.ts" },
          { path: "logger/behavior.ts" },
        ],
      },
    ];

    expect(Value.Check(BehaviorRegistrySchema, valid)).toBe(true);
  });

  it("should reject behavior without name", () => {
    const invalid = [
      {
        files: [{ path: "reveal/schema.ts" }],
      },
    ];

    expect(Value.Check(BehaviorRegistrySchema, invalid)).toBe(false);
  });

  it("should reject behavior without files", () => {
    const invalid = [
      {
        name: "reveal",
      },
    ];

    expect(Value.Check(BehaviorRegistrySchema, invalid)).toBe(false);
  });

  it("should reject file without path", () => {
    const invalid = [
      {
        name: "reveal",
        files: [{}],
      },
    ];

    expect(Value.Check(BehaviorRegistrySchema, invalid)).toBe(false);
  });
});

describe("validateJson", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it("should return data for valid input", () => {
    const data = {
      validator: "zod",
      paths: {
        behaviors: "./src/behaviors",
        utils: {
          path: "./src/behavior-utils.ts",
          alias: "@/behavior-utils",
        },
        registry: {
          path: "./src/behaviors/behavior-registry.ts",
          alias: "@/behavior-registry",
        },
        testUtils: {
          path: "./tests/utils/command-test-harness.ts",
          alias: "@/test-utils",
        },
        host: {
          path: "./src/behavioral-host.ts",
          alias: "@/behavioral-host",
        },
        types: {
          path: "./src/types.ts",
          alias: "@/types",
        },
      },
    };

    const result = validateJson<Config>(ConfigSchema, data, "test config");
    expect(result).toEqual(data);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should exit with error for invalid input", () => {
    const invalid = {
      validator: "invalid",
      paths: {},
      aliases: {},
    };

    expect(() => {
      validateJson<Config>(ConfigSchema, invalid, "test config");
    }).toThrow("process.exit called");

    expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Invalid test config:");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should show detailed error paths", () => {
    const invalid = {
      validator: "zod",
      // Missing paths and aliases
    };

    expect(() => {
      validateJson<Config>(ConfigSchema, invalid, "test config");
    }).toThrow("process.exit called");

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Check that error messages include paths
    const errorCalls = consoleErrorSpy.mock.calls.map(call => call.join(" "));
    const hasPathError = errorCalls.some(msg => msg.includes("/paths"));
    expect(hasPathError).toBe(true);
  });
});

describe("validateJsonFile", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  const testDir = path.join(process.cwd(), "test-temp-validation");

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should load and validate valid JSON file", () => {
    const validConfig: Config = {
      validator: "zod",
      paths: {
        behaviors: "./src/behaviors",
        utils: { path: "./src/behavior-utils.ts", alias: "@/behavior-utils" },
        registry: { path: "./src/behaviors/behavior-registry.ts", alias: "@/behavior-registry" },
        testUtils: { path: "./tests/utils/command-test-harness.ts", alias: "@/test-utils" },
        host: { path: "./src/behavioral-host.ts", alias: "@/behavioral-host" },
        types: { path: "./src/types.ts", alias: "@/types" },
      },
    };

    const filePath = path.join(testDir, "valid.json");
    fs.writeFileSync(filePath, JSON.stringify(validConfig, null, 2));

    const result = validateJsonFile<Config>(ConfigSchema, filePath, "test config");
    expect(result).toEqual(validConfig);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should exit with error for malformed JSON", () => {
    const filePath = path.join(testDir, "malformed.json");
    fs.writeFileSync(filePath, "{ invalid json }");

    expect(() => {
      validateJsonFile<Config>(ConfigSchema, filePath, "test config");
    }).toThrow("process.exit called");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("❌ Malformed JSON in test config:")
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should exit with error for invalid data", () => {
    const invalid = {
      validator: "invalid-validator",
      paths: {},
      aliases: {},
    };

    const filePath = path.join(testDir, "invalid.json");
    fs.writeFileSync(filePath, JSON.stringify(invalid));

    expect(() => {
      validateJsonFile<Config>(ConfigSchema, filePath, "test config");
    }).toThrow("process.exit called");

    expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Invalid test config:");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should throw for non-existent file", () => {
    const filePath = path.join(testDir, "non-existent.json");

    expect(() => {
      validateJsonFile<Config>(ConfigSchema, filePath, "test config");
    }).toThrow(); // Will throw ENOENT, not process.exit
  });
});
