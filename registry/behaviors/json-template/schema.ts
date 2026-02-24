import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { JSON_TEMPLATE_ATTRS } from "./constants";

// Re-export constants for convenience
export { JSON_TEMPLATE_ATTRS };

export const schema = Type.Object({
  [JSON_TEMPLATE_ATTRS.FOR]: Type.String({ 
    description: "ID of the <script type='application/json'> element containing the data (like 'for' in label)" 
  }),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
