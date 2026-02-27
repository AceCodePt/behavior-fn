import { Type, type Static } from "@sinclair/typebox";

/**
 * TypeBox schema for behavior file metadata
 */
export const BehaviorFileMetadataSchema = Type.Object({
  /** Relative path to the file from registry/behaviors/ */
  path: Type.String(),
});

/**
 * TypeBox schema for behavior metadata
 */
export const BehaviorMetadataSchema = Type.Object({
  /** Behavior name (kebab-case) */
  name: Type.String(),
  /** List of files that make up this behavior */
  files: Type.Array(BehaviorFileMetadataSchema),
  /** Optional npm dependencies required by this behavior */
  dependencies: Type.Optional(Type.Array(Type.String())),
});

/**
 * TypeBox schema for the complete behavior registry
 * 
 * This validates registry/behaviors-registry.json
 */
export const BehaviorRegistrySchema = Type.Array(BehaviorMetadataSchema);

/**
 * Types derived from schemas (SSOT)
 * 
 * DO NOT manually define these interfaces - they're auto-generated from schemas
 */
export type BehaviorFileMetadata = Static<typeof BehaviorFileMetadataSchema>;
export type BehaviorMetadata = Static<typeof BehaviorMetadataSchema>;
export type BehaviorRegistry = Static<typeof BehaviorRegistrySchema>;
