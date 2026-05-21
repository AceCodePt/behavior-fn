import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  value: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
