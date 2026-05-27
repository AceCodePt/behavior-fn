import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

// No attributes - purely command-driven behavior
export const schema = Type.Object({});

export type SchemaType = InferSchema<typeof schema>;
