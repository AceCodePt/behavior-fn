import { Type, type Static } from "@sinclair/typebox";

export const schema = Type.Object({
  "log-trigger": Type.Optional(
    Type.Union([
      Type.Literal("click"),
      Type.Literal("mouseenter"),
      Type.String(), // Fallback for other values
    ]),
  ),
});

export type SchemaType = Static<typeof schema>;
