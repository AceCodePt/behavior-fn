import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Schema for logger behavior.
 * 
 * uniqueBehaviorDef automatically extracts attribute keys to create definition.attributes.
 */
export const schema = Type.Object({
  /** Event that triggers logging (e.g., "click", "mouseenter") */
  "logger-trigger": Type.Optional(
    Type.Union([
      Type.Literal("click"),
      Type.Literal("mouseenter"),
      Type.String(), // Fallback for other values
    ]),
  ),
});

export type SchemaType = InferSchema<typeof schema>;
