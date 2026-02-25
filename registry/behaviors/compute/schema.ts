import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Attribute name constants for the compute behavior.
 */
export const COMPUTE_ATTRS = {
  /** Formula for computation (e.g., "a + b") */
  FORMULA: "compute-formula",
} as const;

export const schema = Type.Object({
  [COMPUTE_ATTRS.FORMULA]: Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
