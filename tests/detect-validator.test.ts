// tests/detect-validator.test.ts
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { detectValidatorFromPackageJson } from '../src/utils/detect-validator';
import fs from 'node:fs';

describe('detectValidatorFromPackageJson', () => {
  const cwd = '/mock/cwd';

  // Spies need to be setup before tests and cleared after
  let existsSyncSpy: any;
  let readFileSyncSpy: any;

  beforeEach(() => {
    // Spy on the actual fs methods
    existsSyncSpy = vi.spyOn(fs, 'existsSync');
    readFileSyncSpy = vi.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to Zod (0) if package.json does not exist', () => {
    existsSyncSpy.mockReturnValue(false);
    expect(detectValidatorFromPackageJson(cwd)).toEqual([0]);
  });

  it('detects Zod in dependencies', () => {
    existsSyncSpy.mockReturnValue(true);
    readFileSyncSpy.mockReturnValue(JSON.stringify({
      dependencies: { zod: '^3.0.0' }
    }));
    expect(detectValidatorFromPackageJson(cwd)).toEqual([0]);
  });

  it('detects Valibot in devDependencies', () => {
    existsSyncSpy.mockReturnValue(true);
    readFileSyncSpy.mockReturnValue(JSON.stringify({
      devDependencies: { valibot: '^1.0.0' }
    }));
    expect(detectValidatorFromPackageJson(cwd)).toEqual([1]);
  });

  it('detects ArkType', () => {
    existsSyncSpy.mockReturnValue(true);
    readFileSyncSpy.mockReturnValue(JSON.stringify({
      dependencies: { arktype: 'latest' }
    }));
    expect(detectValidatorFromPackageJson(cwd)).toEqual([2]);
  });

  it('detects TypeBox', () => {
    existsSyncSpy.mockReturnValue(true);
    readFileSyncSpy.mockReturnValue(JSON.stringify({
      dependencies: { '@sinclair/typebox': 'latest' }
    }));
    expect(detectValidatorFromPackageJson(cwd)).toEqual([3]);
  });

  it('detects multiple validators', () => {
    existsSyncSpy.mockReturnValue(true);
    readFileSyncSpy.mockReturnValue(JSON.stringify({
      dependencies: { zod: 'latest', valibot: 'latest' }
    }));
    expect(detectValidatorFromPackageJson(cwd)).toEqual([0, 1]);
  });
});

