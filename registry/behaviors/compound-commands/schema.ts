import { Type } from "@sinclair/typebox";
import { type InferSchema } from "~types";

/**
 * Schema for compound-commands behavior.
 * 
 * This behavior adds compound command support to buttons using the Invoker Commands API.
 * 
 * Attributes:
 * - `commandfor`: Target element ID(s), comma-separated for multiple targets
 * - `command`: Command value(s), comma-separated for multiple commands
 * 
 * Valid patterns:
 * 1. Single target + multiple commands: commandfor="modal" command="--show, --focus"
 * 2. Multiple targets + single command: commandfor="modal, panel" command="--hide"
 * 3. Equal counts (N:N): commandfor="modal, form" command="--toggle, --clear"
 * 
 * Invalid pattern:
 * - Mismatched counts (both > 1): commandfor="a, b, c" command="--x, --y" (3 ≠ 2)
 */
export const schema = Type.Object({
  /** Target element IDs (comma-separated for multiple targets) */
  commandfor: Type.Optional(Type.String()),
  
  /** Command values (comma-separated for multiple commands) */
  command: Type.Optional(Type.String()),
});

export type SchemaType = InferSchema<typeof schema>;
