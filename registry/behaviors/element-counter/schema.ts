import { Type, type Static } from "@sinclair/typebox";

export const schema = Type.Object({
  "data-root": Type.Optional(Type.String()),
  "data-selector": Type.Optional(Type.String()),
});

export type SchemaType = Static<typeof schema>;

export const ELEMENT_COUNTER_ATTRS = {
  ROOT: "data-root",
  SELECTOR: "data-selector",
} as const;
