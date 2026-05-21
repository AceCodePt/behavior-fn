import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** The value to set (optional, defaults to source innerText) */
  "set-content-value": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
