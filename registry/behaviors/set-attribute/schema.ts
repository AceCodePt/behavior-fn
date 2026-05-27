import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** The attribute name to set */
  "set-attribute-name": Type.String(),
  // Value comes from invoker's command-value
});

export type SchemaType = InferSchema<typeof schema>;
