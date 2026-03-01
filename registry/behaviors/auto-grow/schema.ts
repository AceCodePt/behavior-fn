import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

/**
 * Schema for auto-grow behavior.
 * 
 * This behavior has no configurable attributes - it's a zero-config behavior
 * that automatically adjusts textarea height to fit content.
 * 
 * uniqueBehaviorDef automatically extracts attribute keys (none in this case).
 */
export const schema = Type.Object({});

export type SchemaType = InferSchema<typeof schema>;
