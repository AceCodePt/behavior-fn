import { Type, type Static } from "@sinclair/typebox";
import { validators } from "../validators/index";

/**
 * Create a TypeBox union of validator package names from the validators registry.
 * This ensures SSOT - validator options are derived from the actual validator implementations.
 */
const createValidatorUnion = () => {
  const [first, ...rest] = validators.map(v => Type.Literal(v.packageName));
  return Type.Union([first, ...rest]);
};

/**
 * TypeBox schema for behavior.config.json
 * 
 * This is the Single Source of Truth for the config structure.
 * Types are derived from this schema, not manually defined.
 */
export const ConfigSchema = Type.Object({
  /** Selected validator package (derived from validators registry) */
  validator: createValidatorUnion(),
  
  /** File paths configuration */
  paths: Type.Object({
    /** Main behaviors directory */
    behaviors: Type.String(),
    /** Behavior utilities file path */
    utils: Type.String(),
    /** Behavior registry file path */
    registry: Type.String(),
    /** Test utilities file path */
    testUtils: Type.String(),
    /** Behavioral host file path */
    host: Type.String(),
    /** Types file path */
    types: Type.String(),
  }),
  
  /** Import aliases configuration */
  aliases: Type.Object({
    /** Utils import alias */
    utils: Type.String(),
    /** Registry import alias */
    registry: Type.String(),
    /** Test utils import alias */
    testUtils: Type.String(),
    /** Host import alias */
    host: Type.String(),
    /** Types import alias */
    types: Type.String(),
  }),
  
  /** Optional files configuration */
  optionalFiles: Type.Optional(Type.Object({
    /** Include test files (default: false) */
    tests: Type.Optional(Type.Boolean()),
  })),
});

/**
 * Config type derived from schema (SSOT)
 * 
 * DO NOT manually define this interface - it's auto-generated from ConfigSchema
 */
export type Config = Static<typeof ConfigSchema>;
