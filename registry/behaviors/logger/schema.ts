import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const schema = Type.Object({
  "log-trigger": Type.Optional(
    Type.Union([
      Type.Literal("click"),
      Type.Literal("mouseenter"),
      Type.String(), // Fallback for other values
    ]),
  ),
});

export type SchemaType = InferSchema<typeof schema>;
