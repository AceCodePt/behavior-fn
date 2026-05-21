import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

export const schema = Type.Object({
  /** Root element ID to search within */
  "element-counter-root": Type.String(),
  
  /** CSS selector for elements to count */
  "element-counter-selector": Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
