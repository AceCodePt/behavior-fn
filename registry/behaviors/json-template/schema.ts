import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";

export const schema = Type.Object({
  /** ID of the <script type="application/json"> element containing the data (like "for" in label) */
  "json-template-for": Type.String({
    description:
      "ID of the <script type='application/json'> element containing the data (like 'for' in label)",
  }),

  /** Array slice syntax (e.g., '0:1', '-5:', '10:20') to render subset of items */
  "json-template-slice": Type.Optional(
    Type.String({
      description:
        "Array slice syntax (e.g., '0:1', '-5:', '10:20') to render subset of items",
    }),
  ),
});

export type Schema = InferSchema<typeof schema>;
export type SchemaType = Schema;
