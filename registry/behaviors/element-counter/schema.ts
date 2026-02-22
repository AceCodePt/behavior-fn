import { Type, type Static } from "@sinclair/typebox";

export const ELEMENT_COUNTER_ATTRS = {
  ROOT: "data-root",
  SELECTOR: "data-selector",
} as const;

export const schema = Type.Object({
  [ELEMENT_COUNTER_ATTRS.ROOT]: Type.Optional(Type.String()),
  [ELEMENT_COUNTER_ATTRS.SELECTOR]: Type.Optional(Type.String()),
});

export type SchemaType = Static<typeof schema>;
