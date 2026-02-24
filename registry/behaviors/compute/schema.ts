import { Type } from "@sinclair/typebox";
import { type InferSchema } from "../types";
import { COMPUTE_ATTRS } from "./constants";

export { COMPUTE_ATTRS };

export const schema = Type.Object({
  [COMPUTE_ATTRS.FORMULA]: Type.String(),
});

export type SchemaType = InferSchema<typeof schema>;
