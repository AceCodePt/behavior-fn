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

// Extract the valid IDs from the validators themselves
export type ValidatorId = (typeof validators)[number]["id"];

// Extract the package names from the validators themselves
export type PackageName = (typeof validators)[number]["packageName"];

export function getValidator(id: ValidatorId): Validator {
  const validator = validators.find(v => v.id === id);
  if (!validator) {
    throw new Error(`Validator with id ${id} not found`);
  }
  return validator;
}

export type { Validator } from "./validator";
