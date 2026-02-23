import { AstroPlatform } from "./astro-platform";
import { NextPlatform } from "./next-platform";
import { GenericPlatform } from "./generic-platform";
import type { PlatformStrategy } from "./platform-strategy";

/**
 * Registry of all available platform strategies.
 * Platforms are checked in order, with Generic as the fallback.
 */
export const platforms: PlatformStrategy[] = [
  new AstroPlatform(),
  new NextPlatform(),
  new GenericPlatform(), // Always last (fallback)
];

/**
 * Get a platform by its ID.
 * 
 * @param id - The platform ID
 * @returns The platform strategy, or undefined if not found
 */
export function getPlatform(id: number): PlatformStrategy | undefined {
  return platforms.find((p) => p.id === id);
}

/**
 * Detect which platform is being used in the given directory.
 * Iterates through registered platforms and returns the first match.
 * Falls back to Generic platform if no specific platform is detected.
 * 
 * @param cwd - Current working directory to check
 * @returns The detected platform strategy
 */
export function detectPlatform(cwd: string): PlatformStrategy {
  for (const platform of platforms) {
    if (platform.detect(cwd)) {
      return platform;
    }
  }
  
  // Should never reach here since Generic always matches,
  // but return Generic as a safety fallback
  return platforms[platforms.length - 1];
}

export * from "./platform-strategy";
export { AstroPlatform } from "./astro-platform";
export { NextPlatform } from "./next-platform";
export { GenericPlatform } from "./generic-platform";
