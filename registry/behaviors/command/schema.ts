import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Event to trigger on (e.g. "change", "input", "mouseenter") */
  "command-by": Type.Optional(Type.String()),
  
  /** Command to fire (defaults to the 'command' attribute) */
  "command-value": Type.Optional(Type.String()),
  
  /** Target element ID (defaults to the 'commandfor' attribute) */
  "command-for": Type.Optional(Type.String()),

  /** Delay in ms before firing the command */
  "command-delay": Type.Optional(Type.Number()),

  /** Throttle in ms for the command execution */
  "command-throttle": Type.Optional(Type.Number()),
});

export type SchemaType = InferSchema<typeof schema>;
