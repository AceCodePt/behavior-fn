import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    execSync: vi.fn(),
    prompts: vi.fn(),
    fs: {
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      readdirSync: vi.fn(),
      mkdirSync: vi.fn(),
    },
  };
});

// Mock dependencies
vi.mock("node:fs", () => {
  return {
    default: mocks.fs,
    ...mocks.fs,
  };
});

vi.mock("node:child_process", () => {
  return {
    default: { execSync: mocks.execSync },
    execSync: mocks.execSync,
  };
});

vi.mock("prompts", () => {
  return {
    default: mocks.prompts,
  };
});

describe("CLI (index.ts)", () => {
  let originalArgv: string[];
  let mockExit: any;
  let mockConsoleLog: any;
  let mockConsoleError: any;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks(); // This clears mocks

    originalArgv = process.argv;
    mockExit = vi.spyOn(process, "exit").mockImplementation((code?: any) => {
      throw new Error(`Process.exit called with ${code}`);
    });

    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it('should initialize configuration with "init" in interactive mode', async () => {
    process.argv = ["node", "behavior-fn", "init"];

    // Mock prompts response (includes validator, path, and useAliases)
    mocks.prompts.mockResolvedValue({
      validator: "zod",
      path: "./src/behaviors",
      useAliases: true,
    });

    // Setup FS mocks
    mocks.fs.existsSync.mockImplementation((p: string) => {
      // Simulate TypeScript project with pnpm
      if (p.toString().endsWith("tsconfig.json")) return true;
      if (p.toString().endsWith("pnpm-lock.yaml")) return true;
      if (p.toString().endsWith("/src")) return true;
      return false;
    });
    
    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [{ path: "behavior-registry.ts" }],
          },
          {
            name: "test-behavior",
            dependencies: ["dep-1"],
            files: [{ path: "test-behavior/behavior.ts" }],
          },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    // Import and run main
    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify config was written
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringContaining('"validator": "zod"'),
    );

    // Verify detection message was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Detected: TypeScript, pnpm"),
    );
    
    // Verify core was installed
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Installing behavior: core"),
    );
  });

  it('should initialize with --defaults flag', async () => {
    process.argv = ["node", "behavior-fn", "init", "--defaults"];

    // Setup FS mocks for TypeScript project with src/
    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.toString().endsWith("tsconfig.json")) return true;
      if (p.toString().endsWith("pnpm-lock.yaml")) return true;
      if (p.toString().endsWith("/src")) return true;
      return false;
    });
    
    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [{ path: "behavior-registry.ts" }],
          },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify prompts was NOT called (zero-question mode)
    expect(mocks.prompts).not.toHaveBeenCalled();
    
    // Verify defaults were used
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringMatching(/"validator": "zod"/),
    );
    
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringMatching(/"behaviors": ".\/src\/behaviors"/),
    );
    
    // Verify default message was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Using defaults: zod, ./src/behaviors"),
    );
  });

  it('should support --validator override flag', async () => {
    process.argv = ["node", "behavior-fn", "init", "--defaults", "--validator=@sinclair/typebox"];

    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.toString().endsWith("tsconfig.json")) return true;
      if (p.toString().endsWith("pnpm-lock.yaml")) return true;
      if (p.toString().endsWith("/src")) return true;
      return false;
    });
    
    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [{ path: "behavior-registry.ts" }],
          },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify typebox was used instead of zod
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringMatching(/"validator": "@sinclair\/typebox"/),
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Using defaults: @sinclair/typebox"),
    );
  });

  it('should support --path override flag', async () => {
    process.argv = ["node", "behavior-fn", "init", "--defaults", "--path=./custom/path"];

    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.toString().endsWith("tsconfig.json")) return true;
      if (p.toString().endsWith("pnpm-lock.yaml")) return true;
      return false;
    });
    
    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [{ path: "behavior-registry.ts" }],
          },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify custom path was used
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringMatching(/"behaviors": ".\/custom\/path"/),
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("./custom/path"),
    );
  });

  it('should detect JavaScript project (no tsconfig)', async () => {
    process.argv = ["node", "behavior-fn", "init", "--defaults"];

    // No tsconfig.json
    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.toString().endsWith("package-lock.json")) return true;
      if (p.toString().endsWith("/src")) return true;
      return false;
    });
    
    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [{ path: "behavior-registry.ts" }],
          },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify config was written (unified format doesn't include typescript field)
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringMatching(/"validator": "zod"/),
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Detected: JavaScript, npm"),
    );
  });

  it.each([
    { name: "zod" },
    { name: "valibot" },
    { name: "arktype" },
    { name: "@sinclair/typebox" },
    { name: "zod-mini" },
  ])('should support validator: $name', async ({ name }) => {
    process.argv = ["node", "behavior-fn", "init", "--defaults", `--validator=${name}`];

    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.toString().endsWith("tsconfig.json")) return true;
      if (p.toString().endsWith("pnpm-lock.yaml")) return true;
      if (p.toString().endsWith("/src")) return true;
      return false;
    });
    
    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [{ path: "behavior-registry.ts" }],
          },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify the validator was used
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.config.json"),
      expect.stringMatching(new RegExp(`"validator": "${name}"`)),
    );
  });

  it('should add a behavior with "add"', async () => {
    process.argv = ["node", "behavior-fn", "add", "test-behavior"];

    // Mock existing config
    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.endsWith("behavior.config.json")) return true;
      if (p.endsWith("behaviors-registry.json")) return true;
      // Pretend core is installed (registry file exists)
      if (p.includes("src/registry.ts")) return true;
      return false;
    });

    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.endsWith("behavior.config.json")) {
        return JSON.stringify({
          validator: "zod",
          paths: {
            behaviors: "src/behaviors",
            utils: {
              path: "src/utils.ts",
              alias: "@/utils",
            },
            registry: {
              path: "src/registry.ts",
              alias: "@/registry",
            },
            testUtils: {
              path: "src/test-utils.ts",
              alias: "@/test-utils",
            },
            host: {
              path: "src/host.ts",
              alias: "@/host",
            },
            types: {
              path: "src/types.ts",
              alias: "@/types",
            },
          },
        });
      }
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [],
          },
          {
            name: "test-behavior",
            dependencies: ["dep-1"],
            files: [{ path: "test-behavior/behavior.ts" }],
          },
        ]);
      }
      return "original content";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify behavior file was written
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("behavior.ts"),
      expect.any(String),
    );

    // Verify dependencies were installed
    expect(mocks.execSync).toHaveBeenCalledWith(
      expect.stringContaining("pnpm add dep-1"),
      expect.anything(),
    );
  });

  it("should fail with clear error when config is missing validator field (schema validation)", async () => {
    process.argv = ["node", "behavior-fn", "add", "test-behavior"];

    // Mock invalid config (missing required validator field)
    mocks.fs.existsSync.mockImplementation((p: string) => {
      if (p.endsWith("behavior.config.json")) return true;
      if (p.endsWith("behaviors-registry.json")) return true;
      if (p.endsWith("package.json")) return true;
      return false;
    });

    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.endsWith("package.json")) {
        return JSON.stringify({
          dependencies: {
            zod: "latest",
            valibot: "latest",
          },
        });
      }
      if (p.endsWith("behavior.config.json")) {
        // Config without validator field (invalid - should fail validation)
        return JSON.stringify({
          paths: {
            behaviors: "src/behaviors",
            utils: {
              path: "src/utils",
              alias: "@utils",
            },
            registry: {
              path: "src/registry",
              alias: "@registry",
            },
            testUtils: {
              path: "src/testUtils",
              alias: "@testUtils",
            },
            host: {
              path: "src/host",
              alias: "@host",
            },
            types: {
              path: "src/types",
              alias: "@types",
            },
          },
        });
      }
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          { name: "core", dependencies: [], files: [] },
          { name: "test-behavior", dependencies: [], files: [] },
        ]);
      }
      return "";
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify validation error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("❌ Invalid behavior.config.json")
    );

    // Verify error includes missing validator field
    const errorCalls = consoleErrorSpy.mock.calls.map(call => call.join(" "));
    const hasValidatorError = errorCalls.some(msg => msg.includes("validator"));
    expect(hasValidatorError).toBe(true);

    consoleErrorSpy.mockRestore();
  });

  it('should fail if config is missing for "add"', async () => {
    process.argv = ["node", "behavior-fn", "add", "test-behavior"];

    // Mock missing config
    mocks.fs.existsSync.mockReturnValue(false);
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      expect(e.message).toContain("Process.exit called with 1");
    }

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Configuration file behavior.config.json not found"),
    );
  });

  it("should generate correct TypeBox files when TypeBox is selected", async () => {
    process.argv = ["node", "behavior-fn", "add", "core"];
    
    // Reset mocks for this test
    mocks.fs.existsSync.mockReset();
    mocks.fs.readFileSync.mockReset();
    mocks.execSync.mockReset();
    mocks.fs.writeFileSync.mockReset();

    mocks.fs.existsSync.mockImplementation((p: string) => {
      // Return true for config files
      if (p.endsWith("behavior.config.json") || p.endsWith("behaviors-registry.json")) return true;
      // Return true for package.json to trigger validator detection
      if (p.endsWith("package.json")) return true;
      return false; 
    });

    mocks.fs.readFileSync.mockImplementation((p: string) => {
      if (p.endsWith("package.json")) {
        // Only TypeBox present
        return JSON.stringify({
          dependencies: {
            "@sinclair/typebox": "latest",
          },
        });
      }
      if (p.endsWith("behavior.config.json")) {
        return JSON.stringify({
          validator: "@sinclair/typebox",
          paths: {
            behaviors: "src/behaviors",
            utils: {
              path: "src/utils.ts",
              alias: "@/utils",
            },
            registry: {
              path: "src/registry.ts",
              alias: "@/registry",
            },
            testUtils: {
              path: "src/testUtils.ts",
              alias: "@/testUtils",
            },
            host: {
              path: "src/host.ts",
              alias: "@/host",
            },
            types: {
              path: "src/types.ts",
              alias: "@/types",
            },
          },
        });
      }
      if (p.includes("behaviors-registry.json")) {
        return JSON.stringify([
          {
            name: "core",
            dependencies: [],
            files: [
              { path: "types.ts" },
              { path: "behavior-utils.ts" },
            ],
          },
        ]);
      }
      // Return dummy content for source files to be transformed
      if (p.endsWith("types.ts")) return "original types content";
      if (p.endsWith("behavior-utils.ts")) {
        return `
export const getObservedAttributes = (schema: BehaviorSchema): string[] => {
  return [];
};
`;
      }
      return "";
    });

    // Run main
    const { main } = await import("../index");
    try {
      await main();
    } catch (e: any) {
      if (!e.message.includes("Process.exit")) throw e;
    }

    // Verify types.ts generation for TypeBox
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("types.ts"),
      expect.stringContaining("export type BehaviorSchema = StandardSchemaV1 | TSchema | object;"),
    );

    // Verify behavior-utils.ts generation for TypeBox
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("utils.ts"),
      expect.stringContaining('if ("properties" in schema'),
    );
  });
});
