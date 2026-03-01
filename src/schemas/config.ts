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
 * Schema for a file path with optional alias.
 * 
 * If alias is provided, imports will use the alias.
 * If alias is undefined/not provided, imports will use relative paths.
 */
const FilePathSchema = Type.Object({
  /** File path relative to project root */
  path: Type.String(),
  /** Optional import alias (e.g., "@/types"). If not provided, uses relative imports */
  alias: Type.Optional(Type.String()),
});

/**
 * TypeBox schema for behavior.config.json
 * 
 * This is the Single Source of Truth for the config structure.
 * Types are derived from this schema, not manually defined.
 * 
 * Each file path can have an optional alias. If no alias is provided,
 * the CLI will generate relative imports instead.
 */
export const ConfigSchema = Type.Object({
  /** Selected validator package (derived from validators registry) */
  validator: createValidatorUnion(),
  
  /** File paths configuration with optional aliases */
  paths: Type.Object({
    /** Main behaviors directory */
    behaviors: Type.String(),
    /** Behavior utilities file */
    utils: FilePathSchema,
    /** Behavior registry file */
    registry: FilePathSchema,
    /** Test utilities file */
    testUtils: FilePathSchema,
    /** Behavioral host file */
    host: FilePathSchema,
    /** Types file */
    types: FilePathSchema,
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
