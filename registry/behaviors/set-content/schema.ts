import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  // Zero-config: All configuration on invoker (command-value)
});

export type SchemaType = InferSchema<typeof schema>;
