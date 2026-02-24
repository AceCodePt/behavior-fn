import { AstroPlatform } from "./astro-platform";
import { NextPlatform } from "./next-platform";
import { GenericPlatform } from "./generic-platform";
import type { PlatformStrategy } from "./platform-strategy";

// Export platform instances for direct use
export const astroPlatform = new AstroPlatform();
export const nextPlatform = new NextPlatform();
export const genericPlatform = new GenericPlatform();

/**
 * Registry of all available platform strategies.
 * Platforms are checked in order, with Generic as the fallback.
 */
export const platforms = [
  astroPlatform,
  nextPlatform,
  genericPlatform, // Always last (fallback)
] as const;

// Extract the platform names from the platforms themselves (this IS the unique ID)
export type PlatformName = (typeof platforms)[number]["name"];

/**
 * Get a platform by its name (the unique identifier).
 * 
 * @param name - The platform name (e.g., "next", "astro", "generic")
 * @returns The platform strategy
 */
export function getPlatform(name: string): PlatformStrategy {
  const platform = platforms.find((p) => p.name === name);
  if (!platform) {
    throw new Error(`Platform "${name}" not found`);
  }
  return platform;
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
  return genericPlatform;
}

export type { PlatformStrategy } from "./platform-strategy";
export { AstroPlatform } from "./astro-platform";
export { NextPlatform } from "./next-platform";
export { GenericPlatform } from "./generic-platform";
