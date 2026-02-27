import type { PlatformStrategy, ValidationResult } from "./platform-strategy";

export class GenericPlatform implements PlatformStrategy {
  readonly name = "generic";
  readonly label = "Generic";

  detect(_cwd: string): boolean {
    // Generic platform always matches as fallback
    return true;
  }

  validate(_cwd: string): ValidationResult {
    // Generic platform has no specific requirements
    return { valid: true };
  }

  transformIsServerCheck(): string {
    return "export const isServer = () => typeof window === 'undefined';";
  }
}
