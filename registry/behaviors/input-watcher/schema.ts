import { Type, type Static } from "@sinclair/typebox";

export const schema = Type.Object({
  "input-watcher-target": Type.Optional(
    Type.String({ description: "Selector or ID list of input elements to watch" }),
  ),
  "input-watcher-format": Type.Optional(
    Type.String({ description: "Format string (e.g. 'Value: {value}')" }),
  ),
  "input-watcher-events": Type.Optional(
    Type.String({
      description:
        "Comma-separated list of events to listen to (default: input, change)",
    }),
  ),
  "input-watcher-attr": Type.Optional(
    Type.String({
      description: "Attribute to read from target (default: value property)",
    }),
  ),
});

export type Schema = Static<typeof schema>;
export type SchemaType = Schema;
