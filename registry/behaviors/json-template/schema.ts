import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { JSON_TEMPLATE_ATTRS } from "./constants";

// Re-export constants for convenience
export { JSON_TEMPLATE_ATTRS };

export const schema = Type.Object({
  [JSON_TEMPLATE_ATTRS.SOURCE]: Type.Optional(
    Type.String({ description: "ID of the <script type='application/json'> element containing the data" }),
  ),
  [JSON_TEMPLATE_ATTRS.TARGET]: Type.String({ 
    description: "ID of the element where rendered content will be inserted (required)" 
  }),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
