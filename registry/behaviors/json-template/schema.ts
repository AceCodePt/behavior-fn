import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const schema = Type.Object({
  /** ID of the <script type="application/json"> element containing the data (like "for" in label) */
  "json-template-for": Type.String({
    description:
      "ID of the <script type='application/json'> element containing the data (like 'for' in label)",
  }),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
