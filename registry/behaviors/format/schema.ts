import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  "format-type": Type.Union([
    Type.Literal("currency"),
    Type.Literal("number"),
    Type.Literal("percent"),
    Type.Literal("date"),
  ]),
  "format-strategy": Type.Optional(
    Type.Union([Type.Literal("blur"), Type.Literal("live")])
  ),
  "format-locale": Type.Optional(Type.String()),
  "format-currency": Type.Optional(Type.String()),
  "format-date-style": Type.Optional(
    Type.Union([
      Type.Literal("full"),
      Type.Literal("long"),
      Type.Literal("medium"),
      Type.Literal("short"),
    ])
  ),
  "format-min-fraction-digits": Type.Optional(Type.Number()),
  "format-max-fraction-digits": Type.Optional(Type.Number()),
  "format-notation": Type.Optional(
    Type.Union([
      Type.Literal("standard"),
      Type.Literal("compact"),
      Type.Literal("scientific"),
      Type.Literal("engineering"),
    ])
  ),
  "value": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
