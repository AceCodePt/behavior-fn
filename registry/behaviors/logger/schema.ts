import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { LOGGER_ATTRS } from "./constants";

export { LOGGER_ATTRS };

export const schema = Type.Object({
  [LOGGER_ATTRS.TRIGGER]: Type.Optional(
    Type.Union([
      Type.Literal("click"),
      Type.Literal("mouseenter"),
      Type.String(), // Fallback for other values
    ]),
  ),
});

export type SchemaType = InferSchema<typeof schema>;
