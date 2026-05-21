import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** ID of element to watch */
  "condition-watch": Type.String(),
  /** Attribute to watch on target */
  "condition-on": Type.String(),
  /** Operator (==, !=, >, <, >=, <=) */
  "condition-op": Type.Union([
    Type.Literal("=="),
    Type.Literal("!="),
    Type.Literal(">"),
    Type.Literal("<"),
    Type.Literal(">="),
    Type.Literal("<="),
  ]),
  /** Value to compare against */
  "condition-value": Type.String(),
  /** Command to fire when true */
  "condition-command": Type.String(),
  /** Target ID for command */
  "condition-commandfor": Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
