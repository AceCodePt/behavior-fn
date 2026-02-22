import { Type, type Static } from "@sinclair/typebox";

export const schema = Type.Object({
  formula: Type.String(),
});

export type SchemaType = Static<typeof schema>;
