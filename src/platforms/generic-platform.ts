import type { PlatformStrategy, PlatformName } from "./platform-strategy";

export class GenericPlatform implements PlatformStrategy {
  id = 99;
  name: PlatformName = "generic";
  label = "Generic";

  detect(_cwd: string): boolean {
    // Generic platform always matches as fallback
    return true;
  }

  validate(_cwd: string): { valid: boolean; errors?: string[] } {
    // Generic platform has no specific requirements
    return { valid: true };
  }

  transformIsServerCheck(): string {
    return "export const isServer = () => typeof window === 'undefined';";
  }
}
