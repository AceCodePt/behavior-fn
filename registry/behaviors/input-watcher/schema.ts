import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { INPUT_WATCHER_ATTRS } from "./constants";

export { INPUT_WATCHER_ATTRS };

export const schema = Type.Object({
  [INPUT_WATCHER_ATTRS.TARGET]: Type.Optional(
    Type.String({ description: "Selector or ID list of input elements to watch" }),
  ),
  [INPUT_WATCHER_ATTRS.FORMAT]: Type.Optional(
    Type.String({ description: "Format string (e.g. 'Value: {value}')" }),
  ),
  [INPUT_WATCHER_ATTRS.EVENTS]: Type.Optional(
    Type.String({
      description:
        "Comma-separated list of events to listen to (default: input, change)",
    }),
  ),
  [INPUT_WATCHER_ATTRS.ATTR]: Type.Optional(
    Type.String({
      description: "Attribute to read from target (default: value property)",
    }),
  ),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
