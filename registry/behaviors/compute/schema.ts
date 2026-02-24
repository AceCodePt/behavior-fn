import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const COMPUTE_ATTRS = {
  FORMULA: "compute-formula",
} as const;

export const schema = Type.Object({
  [COMPUTE_ATTRS.FORMULA]: Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
