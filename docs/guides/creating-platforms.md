# Creating Platform Integrations

This guide explains how to add support for a new framework or platform (e.g., Remix, SvelteKit, Nuxt) to the `behavior-fn` CLI.

## Overview

The `behavior-fn` CLI uses a **Strategy Pattern** for platform-specific code transformations. Each platform implements the `PlatformStrategy` interface, which defines detection, validation, and transformation logic.

## Architecture

### Platform Strategy Interface

Every platform must implement the `PlatformStrategy` interface:

```typescript
interface PlatformStrategy {
  // Identity
  id: number;
  name: PlatformName;
  label: string;

  // Detection & Validation
  detect(cwd: string): boolean;
  validate(cwd: string): { valid: boolean; errors?: string[] };

  // Transformations
  transformIsServerCheck(): string;
  getAdditionalImports?(): string;
  transformBehaviorUtils?(content: string): string;
  transformRegistry?(content: string): string;
}
```

### How It Works

1. **Detection:** When the CLI runs, it iterates through registered platforms and calls `detect(cwd)` on each
2. **Validation:** Once detected, `validate(cwd)` checks if requirements are met (warns if not)
3. **Transformation:** During behavior installation, the platform's transformation methods are called to inject platform-specific code

## Step-by-Step: Adding a New Platform

### 1. Create the Platform Implementation

Create a new file in `src/platforms/` named after your platform (e.g., `remix-platform.ts`):

```typescript
import fs from "node:fs";
import path from "node:path";
import type { PlatformStrategy, PlatformName } from "./platform-strategy";

export class RemixPlatform implements PlatformStrategy {
  // Unique ID (use next available number)
  id = 2;
  
  // Internal name (kebab-case)
  name: PlatformName = "remix";
  
  // Display name for CLI output
  label = "Remix";

  /**
   * Detect if Remix is being used.
   * Check for config files or other Remix-specific markers.
   */
  detect(cwd: string): boolean {
    const files = fs.readdirSync(cwd);
    return files.some((f) => f.startsWith("remix.config."));
  }

  /**
   * Validate that Remix is properly installed.
   * Return validation result with any error messages.
   */
  validate(cwd: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    const packageJsonPath = path.join(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      errors.push("package.json not found");
      return { valid: false, errors };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const hasRemix = 
        (packageJson.dependencies && packageJson.dependencies["@remix-run/react"]) ||
        (packageJson.devDependencies && packageJson.devDependencies["@remix-run/react"]);
      
      if (!hasRemix) {
        errors.push("@remix-run/react not found in dependencies");
      }
    } catch (e) {
      errors.push("Failed to parse package.json");
    }

    return { 
      valid: errors.length === 0, 
      errors: errors.length > 0 ? errors : undefined 
    };
  }

  /**
   * Transform the isServer check for Remix.
   * Remix uses standard window check.
   */
  transformIsServerCheck(): string {
    return "export const isServer = () => typeof window === 'undefined';";
  }

  /**
   * Optional: Add Remix-specific imports to behavior-utils.ts
   */
  getAdditionalImports?(): string {
    // Example: return 'import { useLoaderData } from "@remix-run/react";';
    return undefined;
  }

  /**
   * Optional: Transform behavior-utils.ts for Remix
   */
  transformBehaviorUtils?(content: string): string {
    // Example: Inject Remix-specific utilities
    return content;
  }

  /**
   * Optional: Transform behavior-registry.ts for Remix
   */
  transformRegistry?(content: string): string {
    // Example: Add Remix-specific registry features
    return content;
  }
}
```

### 2. Update the PlatformName Type

Add your platform name to the `PlatformName` type in `src/platforms/platform-strategy.ts`:

```typescript
export type PlatformName = 
  | "astro" 
  | "next" 
  | "remix"  // Add your platform here
  | "svelte-kit" 
  | "nuxt" 
  | "generic";
```

### 3. Register the Platform

Add your platform to the registry in `src/platforms/index.ts`:

```typescript
import { AstroPlatform } from "./astro-platform";
import { NextPlatform } from "./next-platform";
import { RemixPlatform } from "./remix-platform"; // Import your platform
import { GenericPlatform } from "./generic-platform";
import type { PlatformStrategy } from "./platform-strategy";

export const platforms: PlatformStrategy[] = [
  new AstroPlatform(),
  new NextPlatform(),
  new RemixPlatform(), // Add your platform
  new GenericPlatform(), // Always last (fallback)
];
```

**Important:** `GenericPlatform` must always be last in the array since it matches everything.

### 4. Export the Platform

Add the export to `src/platforms/index.ts`:

```typescript
export { RemixPlatform } from "./remix-platform";
```

### 5. Write Tests

Create comprehensive tests in `tests/platforms/remix-platform.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { RemixPlatform } from "../../src/platforms/remix-platform";

describe("RemixPlatform", () => {
  let testDir: string;
  let platform: RemixPlatform;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "remix-test-"));
    platform = new RemixPlatform();
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("identity", () => {
    it("should have correct id", () => {
      expect(platform.id).toBe(2);
    });

    it("should have correct name", () => {
      expect(platform.name).toBe("remix");
    });

    it("should have correct label", () => {
      expect(platform.label).toBe("Remix");
    });
  });

  describe("detect", () => {
    it("should detect remix.config.js", () => {
      fs.writeFileSync(path.join(testDir, "remix.config.js"), "");
      expect(platform.detect(testDir)).toBe(true);
    });

    it("should not detect when no config file present", () => {
      expect(platform.detect(testDir)).toBe(false);
    });
  });

  describe("validate", () => {
    it("should fail when package.json is missing", () => {
      const result = platform.validate(testDir);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("package.json not found");
    });

    it("should pass when @remix-run/react is in dependencies", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify({ dependencies: { "@remix-run/react": "^2.0.0" } })
      );
      const result = platform.validate(testDir);
      expect(result.valid).toBe(true);
    });
  });

  describe("transformIsServerCheck", () => {
    it("should return standard isServer implementation", () => {
      const result = platform.transformIsServerCheck();
      expect(result).toContain("typeof window === 'undefined'");
    });
  });
});
```

### 6. Run Tests

```bash
pnpm test tests/platforms/remix-platform.test.ts
```

### 7. Verify Integration

Test the CLI with your platform:

```bash
# In a Remix project
pnpm behavior-fn init
# Should detect "Detected platform: Remix"

pnpm behavior-fn add logger
# Should apply Remix-specific transformations
```

## Platform Transformation Examples

### Example: Custom isServer Check

Astro uses `import.meta.env.SSR` instead of the standard `typeof window === 'undefined'`:

```typescript
transformIsServerCheck(): string {
  return "export const isServer = () => import.meta.env.SSR;";
}
```

### Example: Adding Framework-Specific Imports

You can inject framework-specific imports into `behavior-utils.ts`:

```typescript
getAdditionalImports(): string {
  return 'import { useEffect } from "react";';
}
```

### Example: Transforming Utilities

Transform the utilities file for framework-specific APIs:

```typescript
transformBehaviorUtils(content: string): string {
  // Add a framework-specific helper function
  return content + '\n\nexport const useRemixAction = () => { /* ... */ };';
}
```

## Best Practices

### 1. Unique IDs

Use sequential IDs starting from 0. Check existing platforms to find the next available number.

### 2. Detection Strategy

**Good detection markers:**
- Config files (e.g., `astro.config.js`, `next.config.js`)
- Unique directory structures (e.g., `app/` in Next.js App Router)
- Lock files with specific patterns

**Avoid:**
- Relying solely on `package.json` dependencies (can be unreliable)
- Overly broad detection that might match multiple platforms

### 3. Validation

Always validate:
- ✅ `package.json` exists
- ✅ Framework package is installed
- ✅ (Optional) Minimum version requirements

Return helpful error messages that guide the user.

### 4. Minimal Transformations

Only transform what's necessary for your platform. Keep the behavior logic platform-agnostic whenever possible.

### 5. Testing

Test all aspects:
- ✅ Identity (id, name, label)
- ✅ Detection (positive and negative cases)
- ✅ Validation (success and failure paths)
- ✅ Transformations (verify output)

## Platform Detection Order

Platforms are checked in the order they appear in the registry. Place more specific platforms before generic ones:

1. Astro
2. Next.js
3. Remix
4. SvelteKit
5. ...
6. **Generic (always last)**

If multiple platforms could match (rare), the first match wins.

## Extensibility Hooks

The `PlatformStrategy` interface provides several optional hooks for future extensibility:

### `getAdditionalImports?()`
Inject imports at the top of `behavior-utils.ts`

### `transformBehaviorUtils?(content: string)`
Transform the entire utils file content

### `transformRegistry?(content: string)`
Transform the behavior registry file

These hooks are **optional** and should only be implemented when needed.

## Reference Implementations

- **Astro:** See `src/platforms/astro-platform.ts` - Custom `isServer` check
- **Next.js:** See `src/platforms/next-platform.ts` - Standard implementation with validation
- **Generic:** See `src/platforms/generic-platform.ts` - Fallback with no special logic

## Troubleshooting

### Platform Not Detected

1. Check that your `detect()` method looks for the right files
2. Verify the config file exists in your test project
3. Ensure your platform is registered in `src/platforms/index.ts`

### Validation Errors

1. Check `package.json` parsing logic
2. Verify package names are correct (e.g., `@remix-run/react` not `remix`)
3. Look for both `dependencies` and `devDependencies`

### Transformations Not Applied

1. Verify the file path matches exactly (e.g., `"behavior-utils.ts"`)
2. Check that your transformation returns the modified content
3. Ensure the platform instance is passed to `installBehavior()`

## Need Help?

If you're adding support for a new platform and need guidance:

1. Review existing platform implementations in `src/platforms/`
2. Check the test files in `tests/platforms/` for patterns
3. Open an issue with the `platform-support` label
