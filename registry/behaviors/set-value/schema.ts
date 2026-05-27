import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Fallback value if command doesn't include value (optional) */
  "set-value-fallback": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
