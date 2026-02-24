import { ZodValidator } from "./zod/index";
import { ValibotValidator } from "./valibot/index";
import { ArkTypeValidator } from "./arktype/index";
import { TypeBoxValidator } from "./typebox/index";
import { ZodMiniValidator } from "./zod-mini/index";
import type { Validator } from "./validator";

// Export validator instances for direct use
export const zodValidator = new ZodValidator();
export const valibotValidator = new ValibotValidator();
export const arktypeValidator = new ArkTypeValidator();
export const typeboxValidator = new TypeBoxValidator();
export const zodMiniValidator = new ZodMiniValidator();

export const validators = [
  zodValidator,
  valibotValidator,
  arktypeValidator,
  typeboxValidator,
  zodMiniValidator,
] as const;

// Extract the package names from the validators themselves (this IS the unique ID)
export type PackageName = (typeof validators)[number]["packageName"];

/**
 * Get validator by package name (the unique identifier)
 * @param packageName - The npm package name (e.g., "zod", "valibot")
 * @returns The validator instance
 */
export function getValidator(packageName: string): Validator {
  const validator = validators.find(v => v.packageName === packageName.toLowerCase());
  if (!validator) {
    throw new Error(`Validator "${packageName}" not found`);
  }
  return validator;
}

/**
 * Check if a package name is a valid validator
 * @param packageName - The npm package name to check
 * @returns true if validator exists, false otherwise
 */
export function isValidValidator(packageName: string): packageName is PackageName {
  return validators.some(v => v.packageName === packageName.toLowerCase());
}

export type { Validator } from "./validator";
