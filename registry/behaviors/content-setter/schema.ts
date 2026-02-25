import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Attribute name constants for the content-setter behavior.
 */
export const CONTENT_SETTER_ATTRS = {
  /** The attribute to modify. Use "textContent" for text content updates. */
  ATTRIBUTE: "content-setter-attribute",
  /** The value to set on the target */
  VALUE: "content-setter-value",
  /** How to apply the value: "set" (default), "toggle", or "remove" */
  MODE: "content-setter-mode",
} as const;

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
