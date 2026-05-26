import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Space-separated target element IDs */
  "commandfor": Type.String(),

  /** Space-separated command names */
  "command": Type.String(),

  /** Event to trigger on - defaults to "click" for buttons, "submit" for forms */
  "commandby": Type.Optional(Type.String()),

  /** Delay in ms before firing the command */
  "commanddelay": Type.Optional(Type.Number()),

  /** Throttle in ms for command execution */
  "commandthrottle": Type.Optional(Type.Number()),
});

export type SchemaType = InferSchema<typeof schema>;
