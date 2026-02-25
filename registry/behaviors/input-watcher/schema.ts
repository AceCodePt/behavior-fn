import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Attribute name constants for the input-watcher behavior.
 */
export const INPUT_WATCHER_ATTRS = {
  /** Selector or ID list of input elements to watch */
  TARGET: "input-watcher-target",
  
  /** Format string with placeholders (e.g., "Value: {value}") */
  FORMAT: "input-watcher-format",
  
  /** Events to listen to (comma-separated, default: "input,change") */
  EVENTS: "input-watcher-events",
  
  /** Attribute to read from target (default: value property) */
  ATTR: "input-watcher-attr",
} as const;

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
