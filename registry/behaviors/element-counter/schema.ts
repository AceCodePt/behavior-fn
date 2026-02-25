import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const schema = Type.Object({
  /** Root element to search within (selector or "document") */
  "element-counter-root": Type.Optional(Type.String()),
  
  /** CSS selector for elements to count */
  "element-counter-selector": Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
