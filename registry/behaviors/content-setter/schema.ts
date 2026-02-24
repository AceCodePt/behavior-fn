import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { CONTENT_SETTER_ATTRS } from "./constants";

export { CONTENT_SETTER_ATTRS };

export const schema = Type.Object({
  [CONTENT_SETTER_ATTRS.ATTRIBUTE]: Type.String(),
  [CONTENT_SETTER_ATTRS.VALUE]: Type.String(),
  [CONTENT_SETTER_ATTRS.MODE]: Type.Optional(
    Type.Union([
      Type.Literal("set"),
      Type.Literal("toggle"),
      Type.Literal("remove"),
    ]),
  ),
});

export type SchemaType = InferSchema<typeof schema>;
