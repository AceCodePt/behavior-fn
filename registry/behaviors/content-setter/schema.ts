import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const schema = Type.Object({
  /** The attribute to modify. Use "textContent" for text content updates. */
  "content-setter-attribute": Type.String(),
  
  /** The value to set on the target */
  "content-setter-value": Type.String(),
  
  /** How to apply the value: "set" (default), "toggle", or "remove" */
  "content-setter-mode": Type.Optional(
    Type.Union([
      Type.Literal("set"),
      Type.Literal("toggle"),
      Type.Literal("remove"),
    ]),
  ),
});

export type SchemaType = InferSchema<typeof schema>;
