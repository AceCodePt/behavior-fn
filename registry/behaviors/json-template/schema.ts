import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

/**
 * Attribute name constants for the json-template behavior.
 */
export const JSON_TEMPLATE_ATTRS = {
  /** ID of the <script type="application/json"> element containing the data (like "for" in label) */
  FOR: "json-template-for",
} as const;

export const schema = Type.Object({
  [JSON_TEMPLATE_ATTRS.FOR]: Type.String({ 
    description: "ID of the <script type='application/json'> element containing the data (like 'for' in label)" 
  }),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
