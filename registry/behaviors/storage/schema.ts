import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Key to use for storage */
  "storage-key": Type.String(),
  /** Attribute or property to sync (default: "value") */
  "storage-attr": Type.Optional(Type.String()),
  /** Type of storage (default: "local") */
  "storage-type": Type.Optional(Type.Union([Type.Literal("local"), Type.Literal("session")])),
});

export type SchemaType = InferSchema<typeof schema>;
