import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

/**
 * Schema for set-value behavior.
 * 
 * This behavior has no configurable attributes - it's a zero-config behavior
 * that sets input values from command sources (typically buttons).
 * 
 * All interaction happens through commands:
 * - `--set-value`: Set value from source innerText
 * - `--set-value-and-submit`: Set value and submit parent form
 * 
 * uniqueBehaviorDef automatically extracts attribute keys (none in this case).
 */
export const schema = Type.Object({});

export type SchemaType = InferSchema<typeof schema>;
