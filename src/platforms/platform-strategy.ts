/**
 * Platform validation result
 * Inferred from platform validate methods
 */
export type ValidationResult = {
  valid: boolean;
  errors?: string[];
};

/**
 * Platform Strategy Interface
 * 
 * Defines the contract for platform-specific integrations.
 * Each platform implementation provides detection, validation, and transformation logic.
 */

export interface PlatformStrategy {
  /**
   * Internal name identifier (kebab-case) - unique key for the platform
   * Examples: "next", "astro", "generic"
   */
  readonly name: string;

  /**
   * Display name for CLI output and logging
   */
  readonly label: string;

  /**
   * Detect if this platform is being used in the given directory.
   * 
   * @param cwd - Current working directory to check
   * @returns true if platform is detected, false otherwise
   */
  detect(cwd: string): boolean;

  /**
   * Validate that the platform environment meets requirements.
   * 
   * @param cwd - Current working directory to validate
   * @returns Validation result with optional error messages
   */
  validate(cwd: string): ValidationResult;

  /**
   * Transform the `isServer` check for this platform.
   * 
   * @returns The platform-specific implementation of the isServer check
   */
  transformIsServerCheck(): string;

  /**
   * Get additional imports needed for this platform (optional).
   * These imports are injected at the top of behavior-utils.ts
   * 
   * @returns Import statements string, or undefined if none needed
   */
  getAdditionalImports?(): string;

  /**
   * Apply platform-specific transformations to behavior-utils.ts (optional).
   * 
   * @param content - The current content of behavior-utils.ts
   * @returns Transformed content
   */
  transformBehaviorUtils?(content: string): string;

  /**
   * Apply platform-specific transformations to behavior-registry.ts (optional).
   * 
   * @param content - The current content of behavior-registry.ts
   * @returns Transformed content
   */
  transformRegistry?(content: string): string;
}
