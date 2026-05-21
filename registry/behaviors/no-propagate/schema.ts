import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Comma-separated list of events to stop propagation */
  "no-propagate-events": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
