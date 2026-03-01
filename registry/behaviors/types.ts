import { type Static, type TSchema } from "@sinclair/typebox";

/**
 * Helper to infer the output type of a schema.
 * TypeBox uses the Static helper to extract types from TSchema.
 */
export type InferSchema<T> = T extends TSchema ? Static<T> : unknown;

/**
 * The canonical schema type for TypeBox.
 */
export type BehaviorSchema = TSchema;
