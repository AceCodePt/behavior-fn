import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

/**
 * Auto-grow behavior schema.
 * Zero-config behavior with no custom attributes.
 */
export const schema = Type.Object({});

export type SchemaType = InferSchema<typeof schema>;
