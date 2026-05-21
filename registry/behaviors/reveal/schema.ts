import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Standard HTML hidden attribute */
  "hidden": Type.Optional(Type.Boolean()),
  /** Standard HTML open attribute (dialog/details) */
  "open": Type.Optional(Type.Boolean()),
  /** Standard HTML popover attribute */
  "popover": Type.Optional(Type.String()),
  /** CSS Anchor Positioning target ID */
  "reveal-anchor": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
