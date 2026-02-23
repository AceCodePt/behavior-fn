import { type Static, type TSchema } from "@sinclair/typebox";
import { type StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Helper to infer the output type of a schema.
 * In the registry (TypeBox), this defaults to TypeBox's Static inference
 * or Standard Schema if available.
 */
export type InferSchema<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends TSchema
    ? Static<T>
    : unknown;

/**
 * The canonical schema type for the registry is TypeBox or Standard Schema.
 */
export type BehaviorSchema = StandardSchemaV1 | TSchema | object;
