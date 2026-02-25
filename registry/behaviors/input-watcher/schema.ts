import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const schema = Type.Object({
  /** Selector or ID list of input elements to watch */
  "input-watcher-target": Type.Optional(
    Type.String({ description: "Selector or ID list of input elements to watch" }),
  ),
  
  /** Format string with placeholders (e.g., "Value: {value}") */
  "input-watcher-format": Type.Optional(
    Type.String({ description: "Format string (e.g. 'Value: {value}')" }),
  ),
  
  /** Events to listen to (comma-separated, default: "input,change") */
  "input-watcher-events": Type.Optional(
    Type.String({
      description:
        "Comma-separated list of events to listen to (default: input, change)",
    }),
  ),
  
  /** Attribute to read from target (default: value property) */
  "input-watcher-attr": Type.Optional(
    Type.String({
      description: "Attribute to read from target (default: value property)",
    }),
  ),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
