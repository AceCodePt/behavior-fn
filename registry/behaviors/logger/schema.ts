import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const LOGGER_ATTRS = {
  TRIGGER: "logger-trigger",
} as const;

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
