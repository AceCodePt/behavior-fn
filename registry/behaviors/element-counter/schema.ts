import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { ELEMENT_COUNTER_ATTRS } from "./constants";

export { ELEMENT_COUNTER_ATTRS };

export const schema = Type.Object({
  [ELEMENT_COUNTER_ATTRS.ROOT]: Type.Optional(Type.String()),
  [ELEMENT_COUNTER_ATTRS.SELECTOR]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
