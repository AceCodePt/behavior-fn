import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Attribute name constants for the element-counter behavior.
 */
export const ELEMENT_COUNTER_ATTRS = {
  /** Root element to search within (selector or "document") */
  ROOT: "element-counter-root",
  
  /** CSS selector for elements to count */
  SELECTOR: "element-counter-selector",
} as const;

export const schema = Type.Object({
  [ELEMENT_COUNTER_ATTRS.ROOT]: Type.Optional(Type.String()),
  [ELEMENT_COUNTER_ATTRS.SELECTOR]: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
