import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Comma-separated list of regex patterns */
  "paste-transform-patterns": Type.String(),
  /** Comma-separated list of replacement strings */
  "paste-transform-replaces": Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
