import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
    }
  };
});

// Mock dependencies
vi.mock('node:fs', () => {
  return {
    default: mocks.fs,
    ...mocks.fs,
  };
});

vi.mock('node:child_process', () => {
  return {
    default: { execSync: mocks.execSync },
    execSync: mocks.execSync,
  };
});

vi.mock('prompts', () => {
  return {
    default: mocks.prompts,
  };
});

describe('CLI (index.ts)', () => {
  let originalArgv: string[];
  let mockExit: any;
  let mockConsoleLog: any;
  let mockConsoleError: any;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks(); // This clears mocks

    originalArgv = process.argv;
    mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: any) => {
      throw new Error(`Process.exit called with ${code}`);
    });
    
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it('should initialize configuration with "init"', async () => {
    process.argv = ['node', 'behavior-fn', 'init'];
    
    // Mock prompts response
    mocks.prompts.mockResolvedValue({
      behaviors: 'src/behaviors',
      utils: 'src/utils.ts',
      registry: 'src/registry.ts',
      testUtils: 'src/test-utils.ts',
      aliasUtils: '@/utils',
      aliasRegistry: '@/registry',
      aliasTestUtils: '@/test-utils',
    });

    // Setup FS mocks
    mocks.fs.existsSync.mockReturnValue(false);
    mocks.fs.readFileSync.mockImplementation((p: string) => {
        if (p.includes('behaviors-registry.json')) {
            return JSON.stringify([
                {
                    name: 'core',
                    dependencies: [],
                    files: [{ path: 'behavior-registry.ts' }]
                },
                {
                    name: 'test-behavior',
                    dependencies: ['dep-1'],
                    files: [{ path: 'test-behavior/behavior.ts' }]
                }
            ]);
        }
        return '';
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    // Import and run main
    const { main } = await import('../index');
    try {
      await main();
    } catch (e: any) {
        if (!e.message.includes('Process.exit')) throw e;
    }

    // Verify config was written
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('behavior.json'),
      expect.stringContaining('"behaviors": "src/behaviors"')
    );

    // Verify core was installed
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installing behavior: core'));
  });

  it('should add a behavior with "add"', async () => {
    process.argv = ['node', 'behavior-fn', 'add', 'test-behavior'];
    
    // Mock existing config
    mocks.fs.existsSync.mockImplementation((p: string) => {
        if (p.endsWith('behavior.json')) return true;
        if (p.endsWith('behaviors-registry.json')) return true;
        // Pretend core is installed (registry file exists)
        if (p.includes('src/registry.ts')) return true; 
        return false;
    });

    mocks.fs.readFileSync.mockImplementation((p: string) => {
        if (p.endsWith('behavior.json')) {
            return JSON.stringify({
                paths: {
                    behaviors: 'src/behaviors',
                    utils: 'src/utils.ts',
                    registry: 'src/registry.ts',
                    testUtils: 'src/test-utils.ts'
                },
                aliases: {
                    utils: '@/utils',
                    registry: '@/registry',
                    testUtils: '@/test-utils'
                }
            });
        }
        if (p.includes('behaviors-registry.json')) {
             return JSON.stringify([
                {
                    name: 'core',
                    dependencies: [],
                    files: []
                },
                {
                    name: 'test-behavior',
                    dependencies: ['dep-1'],
                    files: [{ path: 'test-behavior/behavior.ts' }]
                }
            ]);
        }
        return 'original content';
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import('../index');
    try {
        await main();
    } catch (e: any) {
        if (!e.message.includes('Process.exit')) throw e;
    }

    // Verify behavior file was written
    expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('behavior.ts'),
        expect.any(String)
    );

    // Verify dependencies were installed
    expect(mocks.execSync).toHaveBeenCalledWith(
        expect.stringContaining('pnpm add dep-1'),
        expect.anything()
    );
  });

  it('should prompt when multiple validators are detected', async () => {
    process.argv = ['node', 'behavior-fn', 'add', 'test-behavior'];
    
    // Mock package.json with multiple validators
    mocks.fs.existsSync.mockImplementation((p: string) => {
        if (p.endsWith('behavior.json')) return true;
        if (p.endsWith('behaviors-registry.json')) return true;
        if (p.endsWith('package.json')) return true;
        if (p.includes('src/registry.ts')) return true; 
        return false;
    });

    mocks.fs.readFileSync.mockImplementation((p: string) => {
        if (p.endsWith('package.json')) {
            return JSON.stringify({
                dependencies: {
                    zod: 'latest',
                    valibot: 'latest'
                }
            });
        }
        if (p.endsWith('behavior.json')) {
             return JSON.stringify({
                paths: { behaviors: 'src/behaviors', utils: 'src/utils', registry: 'src/registry', testUtils: 'src/testUtils' },
                aliases: { utils: '@utils', registry: '@registry', testUtils: '@testUtils' }
            });
        }
        if (p.includes('behaviors-registry.json')) {
             return JSON.stringify([
                { name: 'core', dependencies: [], files: [] },
                { name: 'test-behavior', dependencies: [], files: [] }
            ]);
        }
        return '';
    });
    mocks.fs.readdirSync.mockReturnValue([]);

    // Mock prompt response to choose Valibot (1)
    mocks.prompts.mockResolvedValue({ validator: 1 });

    const { main } = await import('../index');
    try {
        await main();
    } catch (e: any) {
        if (!e.message.includes('Process.exit')) throw e;
    }

    // Verify prompts was called
    expect(mocks.prompts).toHaveBeenCalledWith(expect.objectContaining({
        type: 'select',
        message: expect.stringContaining('Multiple validators detected'),
        choices: expect.arrayContaining([
            expect.objectContaining({ title: 'Zod', value: 0 }),
            expect.objectContaining({ title: 'Valibot', value: 1 })
        ])
    }));
  });

  it('should fail if config is missing for "add"', async () => {
    process.argv = ['node', 'behavior-fn', 'add', 'test-behavior'];
    
    // Mock missing config
    mocks.fs.existsSync.mockReturnValue(false);
    mocks.fs.readdirSync.mockReturnValue([]);

    const { main } = await import('../index');
    try {
        await main();
    } catch (e: any) {
        expect(e.message).toContain('Process.exit called with 1');
    }

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Configuration file behavior.json not found'));
  });
});
