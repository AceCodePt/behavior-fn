import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const ELEMENT_COUNTER_ATTRS = {
  ROOT: "element-counter-root",
  SELECTOR: "element-counter-selector",
} as const;

export const schema = Type.Object({
  [ELEMENT_COUNTER_ATTRS.ROOT]: Type.Optional(Type.String()),
  [ELEMENT_COUNTER_ATTRS.SELECTOR]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
