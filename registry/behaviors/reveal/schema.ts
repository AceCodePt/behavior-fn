import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const REVEAL_ATTRS = {
  DELAY: "reveal-delay",
  DURATION: "reveal-duration",
  ANCHOR: "reveal-anchor",
  AUTO: "reveal-auto",
  WHEN_TARGET: "reveal-when-target",
  WHEN_ATTRIBUTE: "reveal-when-attribute",
  WHEN_VALUE: "reveal-when-value",
  HIDDEN: "hidden",
  OPEN: "open",
  POPOVER: "popover",
} as const;

export const schema = Type.Object({
  [REVEAL_ATTRS.DELAY]: Type.Optional(
    Type.String({ description: "CSS time value for delay" }),
  ),
  [REVEAL_ATTRS.DURATION]: Type.Optional(
    Type.String({ description: "CSS time value for duration" }),
  ),
  [REVEAL_ATTRS.ANCHOR]: Type.Optional(
    Type.String({ description: "ID of the anchor element" }),
  ),
  [REVEAL_ATTRS.AUTO]: Type.Optional(
    Type.Boolean({
      description: "Whether to auto-handle popover/dialog states",
    }),
  ),
  [REVEAL_ATTRS.WHEN_TARGET]: Type.Optional(
    Type.String({ description: "Selector for the target element to watch" }),
  ),
  [REVEAL_ATTRS.WHEN_ATTRIBUTE]: Type.Optional(
    Type.String({ description: "Attribute name on the target to watch" }),
  ),
  [REVEAL_ATTRS.WHEN_VALUE]: Type.Optional(
    Type.String({ description: "Value of the attribute that triggers reveal" }),
  ),
  [REVEAL_ATTRS.HIDDEN]: Type.Optional(Type.Boolean({ description: "Whether the element is hidden" })),
  [REVEAL_ATTRS.OPEN]: Type.Optional(Type.Boolean({ description: "Whether the dialog/details is open" })),
  [REVEAL_ATTRS.POPOVER]: Type.Optional(Type.String({ description: "Popover state (auto/manual)" })),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
