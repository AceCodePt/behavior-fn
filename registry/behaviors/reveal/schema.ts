import { Type, type Static } from "@sinclair/typebox";

export const schema = Type.Object({
  "reveal-delay": Type.Optional(
    Type.String({ description: "CSS time value for delay" }),
  ),
  "reveal-duration": Type.Optional(
    Type.String({ description: "CSS time value for duration" }),
  ),
  "reveal-anchor": Type.Optional(
    Type.String({ description: "ID of the anchor element" }),
  ),
  "reveal-auto": Type.Optional(
    Type.Boolean({
      description: "Whether to auto-handle popover/dialog states",
    }),
  ),
  "reveal-when-target": Type.Optional(
    Type.String({ description: "Selector for the target element to watch" }),
  ),
  "reveal-when-attribute": Type.Optional(
    Type.String({ description: "Attribute name on the target to watch" }),
  ),
  "reveal-when-value": Type.Optional(
    Type.String({ description: "Value of the attribute that triggers reveal" }),
  ),
});

export type Schema = Static<typeof schema>;
export type SchemaType = Schema;
