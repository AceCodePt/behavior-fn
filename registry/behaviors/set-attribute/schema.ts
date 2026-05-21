import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** The attribute name to set */
  "set-attribute-name": Type.String(),
  /** The value to set (optional, defaults to source innerText) */
  "set-attribute-value": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
