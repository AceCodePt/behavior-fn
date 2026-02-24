/**
 * Validation utilities for CLI operations
 */

/**
 * Validates if a string is in kebab-case format
 * Allows lowercase letters and numbers, separated by hyphens
 */
export function isKebabCase(str: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

/**
 * Validates if a behavior name is valid
 */
export function validateBehaviorName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Behavior name cannot be empty" };
  }

  if (!isKebabCase(name)) {
    return {
      valid: false,
      error:
        "Behavior name must be in kebab-case (lowercase with hyphens, e.g., 'my-behavior')",
    };
  }

  if (name.startsWith("-") || name.endsWith("-")) {
    return {
      valid: false,
      error: "Behavior name cannot start or end with a hyphen",
    };
  }

  return { valid: true };
}

/**
 * Checks if a behavior already exists in the registry
 */
export function behaviorExists(
  name: string,
  registry: Array<{ name: string }>,
): boolean {
  return registry.some((b) => b.name === name);
}
