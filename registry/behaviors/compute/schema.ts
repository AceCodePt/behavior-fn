import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Formula for computation (e.g., "a + b") */
  "compute-formula": Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
