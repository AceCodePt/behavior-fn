import { type Static, type TObject } from "@sinclair/typebox";

/**
 * Helper to infer the output type of a schema.
 * In the registry (TypeBox), this defaults to TypeBox's Static inference.
 */
export type InferSchema<T extends TObject> = Static<T>;

/**
 * The canonical schema type for the registry is strictly a TypeBox Object.
 */
export type BehaviorSchema = TObject;
